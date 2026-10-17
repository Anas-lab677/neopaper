import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Edition, InteractionRecord, SavedArticleRecord, UserProfile } from '../shared/types.ts';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Connected to Supabase at:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConfigured = (): boolean => client !== null;
export const getSupabase = (): SupabaseClient | null => client;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function dbGetProfile(userId: string): Promise<UserProfile | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name || 'Reader',
      email: data.email,
      photoURL: data.photo_url,
      readingMinutes: data.reading_minutes || 10,
      readingDepth: data.reading_depth || 'Standard',
      timezone: data.timezone || 'UTC',
      deliveryTime: data.delivery_time || '07:00',
      discoveryEnabled: data.discovery_enabled ?? true,
      explicitTopics: data.explicit_topics || ['Technology', 'Science', 'World', 'Climate & Environment'],
      specificInterests: data.specific_interests || [],
      region: data.region || 'Global',
      city: data.city || '',
      learnedPreferences: data.learned_preferences || {},
      searchSignals: data.search_signals || {},
      likes: data.likes || [],
      dislikes: data.dislikes || [],
      skipped: data.skipped || [],
      onboardingCompleted: data.onboarding_completed ?? false,
      isGuest: data.is_guest ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.warn('[Supabase] dbGetProfile error:', e);
    return null;
  }
}

export async function dbUpsertProfile(profile: UserProfile): Promise<boolean> {
  if (!client) return false;
  try {
    const row = {
      id: profile.id,
      name: profile.name,
      email: profile.email || null,
      photo_url: profile.photoURL || null,
      reading_minutes: profile.readingMinutes,
      reading_depth: profile.readingDepth,
      timezone: profile.timezone,
      delivery_time: profile.deliveryTime,
      discovery_enabled: profile.discoveryEnabled,
      explicit_topics: profile.explicitTopics,
      specific_interests: profile.specificInterests,
      region: profile.region,
      city: profile.city || '',
      learned_preferences: profile.learnedPreferences || {},
      search_signals: profile.searchSignals || {},
      likes: profile.likes || [],
      dislikes: profile.dislikes || [],
      skipped: profile.skipped || [],
      onboarding_completed: profile.onboardingCompleted ?? false,
      is_guest: profile.isGuest ?? false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('profiles').upsert(row);
    if (error) {
      console.warn('[Supabase] dbUpsertProfile error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] dbUpsertProfile error:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Saved Stories
// ---------------------------------------------------------------------------
export async function dbGetSavedStories(userId: string): Promise<SavedArticleRecord[]> {
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('saved_stories')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      articleId: d.article_id,
      item: d.item,
      savedAt: d.saved_at,
    }));
  } catch (e) {
    console.warn('[Supabase] dbGetSavedStories error:', e);
    return [];
  }
}

export async function dbSaveStory(record: SavedArticleRecord): Promise<boolean> {
  if (!client) return false;
  try {
    const { error } = await client.from('saved_stories').upsert({
      id: record.id,
      user_id: record.userId,
      article_id: record.articleId,
      item: record.item,
      saved_at: record.savedAt || new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.warn('[Supabase] dbSaveStory error:', e);
    return false;
  }
}

export async function dbRemoveStory(userId: string, storyId: string): Promise<boolean> {
  if (!client) return false;
  try {
    const { error } = await client
      .from('saved_stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId);
    return !error;
  } catch (e) {
    console.warn('[Supabase] dbRemoveStory error:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Editions Archive
// ---------------------------------------------------------------------------
export async function dbGetEditions(userId: string): Promise<Edition[]> {
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('editions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      editionDate: d.edition_date,
      formattedDate: d.formatted_date,
      greeting: d.greeting || '',
      headline: d.headline || '',
      revision: d.revision || 1,
      storyCount: d.story_count || 0,
      readingTimeMinutes: d.reading_time_minutes || 10,
      status: d.status || 'published',
      items: d.items || [],
      recapTakeaways: d.recap_takeaways || [],
      reflectionNote: d.reflection_note,
      publisherStatus: d.publisher_status || {},
      createdAt: d.created_at,
    }));
  } catch (e) {
    console.warn('[Supabase] dbGetEditions error:', e);
    return [];
  }
}

export async function dbSaveEdition(edition: Edition): Promise<boolean> {
  if (!client) return false;
  try {
    const { error } = await client.from('editions').upsert({
      id: edition.id,
      user_id: edition.userId,
      edition_date: edition.editionDate,
      formatted_date: edition.formattedDate,
      greeting: edition.greeting,
      headline: edition.headline,
      revision: edition.revision,
      story_count: edition.storyCount,
      reading_time_minutes: edition.readingTimeMinutes,
      status: edition.status,
      items: edition.items,
      recap_takeaways: edition.recapTakeaways,
      reflection_note: edition.reflectionNote || null,
      publisher_status: edition.publisherStatus || {},
      created_at: edition.createdAt || new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.warn('[Supabase] dbSaveEdition error:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Interactions (Likes, Dislikes, Skips)
// ---------------------------------------------------------------------------
export async function dbRecordInteraction(interaction: InteractionRecord): Promise<boolean> {
  if (!client) return false;
  try {
    const { error } = await client.from('interactions').insert({
      id: interaction.id,
      user_id: interaction.userId,
      article_id: interaction.articleId,
      topic: interaction.topic,
      action: interaction.action,
      created_at: interaction.timestamp || new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.warn('[Supabase] dbRecordInteraction error:', e);
    return false;
  }
}
