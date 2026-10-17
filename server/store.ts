import fs from 'fs';
import path from 'path';
import {
  Edition,
  EditionItem,
  InteractionRecord,
  SavedArticleRecord,
  Topic,
  UserProfile,
} from '../shared/types.ts';
import {
  isSupabaseConfigured,
  dbGetProfile,
  dbUpsertProfile,
  dbGetSavedStories,
  dbSaveStory,
  dbRemoveStory,
  dbGetEditions,
  dbSaveEdition,
  dbRecordInteraction,
} from './supabase.ts';

// File-based durable persistence store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'daybreak_store.json');

interface PersistedState {
  profiles: Record<string, UserProfile>;
  editions: Record<string, Edition>;
  savedArticles: Record<string, SavedArticleRecord[]>;
  interactions: Record<string, InteractionRecord[]>;
}

class StoreManager {
  private profiles: Map<string, UserProfile> = new Map();
  private editions: Map<string, Edition> = new Map();
  private savedArticles: Map<string, SavedArticleRecord[]> = new Map();
  private interactions: Map<string, InteractionRecord[]> = new Map();

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[StoreManager] Failed to create data directory, using memory:', e);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data: PersistedState = JSON.parse(raw);
        if (data.profiles) {
          Object.entries(data.profiles).forEach(([k, v]) => this.profiles.set(k, v));
        }
        if (data.editions) {
          Object.entries(data.editions).forEach(([k, v]) => this.editions.set(k, v));
        }
        if (data.savedArticles) {
          Object.entries(data.savedArticles).forEach(([k, v]) => this.savedArticles.set(k, v));
        }
        if (data.interactions) {
          Object.entries(data.interactions).forEach(([k, v]) => this.interactions.set(k, v));
        }
        console.log(`[StoreManager] Loaded ${this.profiles.size} profiles and ${this.editions.size} editions from disk.`);
      }
    } catch (err) {
      console.warn('[StoreManager] Error reading disk state:', err);
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      const state: PersistedState = {
        profiles: Object.fromEntries(this.profiles),
        editions: Object.fromEntries(this.editions),
        savedArticles: Object.fromEntries(this.savedArticles),
        interactions: Object.fromEntries(this.interactions),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[StoreManager] Failed to save state to disk:', err);
    }
  }

  // --- PROFILES ---
  public getProfile(userId: string): UserProfile {
    const cleanId = (userId || 'guest').trim();
    if (this.profiles.has(cleanId)) {
      return this.profiles.get(cleanId)!;
    }

    // Default fresh profile for real user
    const isGuest = cleanId === 'guest';
    const newProfile: UserProfile = {
      id: cleanId,
      name: isGuest ? 'Guest Reader' : 'Reader',
      readingMinutes: 10,
      readingDepth: 'Standard',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      deliveryTime: '07:00',
      discoveryEnabled: true,
      explicitTopics: ['Technology', 'Science', 'World', 'Climate & Environment'],
      specificInterests: [],
      region: 'Global',
      learnedPreferences: {},
      searchSignals: {},
      likes: [],
      dislikes: [],
      skipped: [],
      onboardingCompleted: false,
      isGuest,
      createdAt: new Date().toISOString(),
    };

    this.profiles.set(cleanId, newProfile);
    this.saveToDisk();
    return newProfile;
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const profile = this.getProfile(userId);
    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    this.saveToDisk();

    if (isSupabaseConfigured()) {
      dbUpsertProfile(updated).catch(e => console.warn('[Supabase] profile sync error:', e));
    }

    return updated;
  }

  public resetLearnedPreferences(userId: string): UserProfile {
    const profile = this.getProfile(userId);
    profile.learnedPreferences = {};
    profile.searchSignals = {};
    profile.likes = [];
    profile.dislikes = [];
    profile.skipped = [];
    this.profiles.set(userId, profile);
    this.saveToDisk();

    if (isSupabaseConfigured()) {
      dbUpsertProfile(profile).catch(e => console.warn('[Supabase] profile sync error:', e));
    }

    return profile;
  }

  public followInterest(userId: string, interest: string): UserProfile {
    const profile = this.getProfile(userId);
    const clean = interest.trim();
    if (clean && !profile.specificInterests.includes(clean)) {
      profile.specificInterests.push(clean);
      this.profiles.set(userId, profile);
      this.saveToDisk();
    }
    return profile;
  }

  public unfollowInterest(userId: string, interest: string): UserProfile {
    const profile = this.getProfile(userId);
    profile.specificInterests = profile.specificInterests.filter(i => i.toLowerCase() !== interest.toLowerCase().trim());
    this.profiles.set(userId, profile);
    this.saveToDisk();
    return profile;
  }

  public recordSearchSignal(userId: string, rawQuery: string) {
    const profile = this.getProfile(userId);
    const clean = rawQuery.trim();
    if (!clean) return;

    if (!profile.searchSignals) profile.searchSignals = {};
    const existing = profile.searchSignals[clean] || { query: clean, count: 0, lastSearchedAt: '' };
    existing.count += 1;
    existing.lastSearchedAt = new Date().toISOString();
    profile.searchSignals[clean] = existing;

    // Also nudge learned topic weights based on words in search query
    const lower = clean.toLowerCase();
    const topicCandidates: Topic[] = [
      'Technology',
      'Science',
      'Climate & Environment',
      'Business',
      'World',
      'Arts & Culture',
      'Sports',
      'Good News',
    ];

    for (const top of topicCandidates) {
      if (lower.includes(top.toLowerCase()) || (top === 'Technology' && /ai|startup|tech|software/.test(lower))) {
        this.adjustLearnedWeight(profile, top, 0.05, `Learned from frequent search interest: "${clean}"`);
      }
    }

    this.profiles.set(userId, profile);
    this.saveToDisk();
  }

  public recordInteraction(
    userId: string,
    articleId: string,
    topic: Topic,
    action: 'more_like_this' | 'less_like_this' | 'save' | 'unsave' | 'skip' | 'read' | 'open'
  ): void {
    const profile = this.getProfile(userId);
    if (!profile.likes) profile.likes = [];
    if (!profile.dislikes) profile.dislikes = [];
    if (!profile.skipped) profile.skipped = [];

    if (action === 'more_like_this') {
      if (!profile.likes.includes(articleId)) profile.likes.push(articleId);
      profile.dislikes = profile.dislikes.filter(id => id !== articleId);
      this.adjustLearnedWeight(profile, topic, 0.15, 'Marked "More like this"');
    } else if (action === 'less_like_this') {
      if (!profile.dislikes.includes(articleId)) profile.dislikes.push(articleId);
      profile.likes = profile.likes.filter(id => id !== articleId);
      this.adjustLearnedWeight(profile, topic, -0.15, 'Marked "Less like this"');
    } else if (action === 'skip') {
      if (!profile.skipped.includes(articleId)) profile.skipped.push(articleId);
      this.adjustLearnedWeight(profile, topic, -0.05, 'Skipped in edition');
    } else if (action === 'save') {
      this.adjustLearnedWeight(profile, topic, 0.10, 'Saved to personal bookmarks');
    } else if (action === 'read' || action === 'open') {
      this.adjustLearnedWeight(profile, topic, 0.03, 'Opened and read story summary');
    }

    // Save interaction log
    const userInteractions = this.interactions.get(userId) || [];
    const interactionRecord: InteractionRecord = {
      id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      articleId,
      topic,
      action,
      timestamp: new Date().toISOString(),
    };
    userInteractions.push(interactionRecord);
    this.interactions.set(userId, userInteractions);

    this.profiles.set(userId, profile);
    this.saveToDisk();

    if (isSupabaseConfigured()) {
      dbUpsertProfile(profile).catch(e => console.warn('[Supabase] interaction profile sync error:', e));
      dbRecordInteraction(interactionRecord).catch(e => console.warn('[Supabase] interaction log sync error:', e));
    }
  }

  private adjustLearnedWeight(profile: UserProfile, topic: string, delta: number, note: string) {
    if (!profile.learnedPreferences) {
      profile.learnedPreferences = {};
    }
    const current = profile.learnedPreferences[topic] || { weight: 0, count: 0, note: '' };
    const newWeight = Math.min(1.0, Math.max(-0.5, current.weight + delta));
    profile.learnedPreferences[topic] = {
      weight: parseFloat(newWeight.toFixed(2)),
      count: current.count + 1,
      note,
    };
  }

  // --- EDITIONS (Immutable Daily Snapshots) ---
  public getTodayEdition(userId: string, targetDate?: string): Edition | null {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    for (const edition of this.editions.values()) {
      if (edition.userId === userId && edition.editionDate === dateStr) {
        return edition;
      }
    }
    return null;
  }

  public getEdition(editionId: string): Edition | null {
    return this.editions.get(editionId) || null;
  }

  public getEditionArchive(userId: string): Edition[] {
    const list: Edition[] = [];
    for (const edition of this.editions.values()) {
      if (edition.userId === userId) {
        list.push(edition);
      }
    }
    return list.sort((a, b) => new Date(b.editionDate).getTime() - new Date(a.editionDate).getTime());
  }

  public saveEdition(edition: Edition): void {
    this.editions.set(edition.id, edition);
    this.saveToDisk();

    if (isSupabaseConfigured()) {
      dbSaveEdition(edition).catch(e => console.warn('[Supabase] saveEdition error:', e));
    }
  }

  // --- SAVED STORIES ---
  public getSavedArticles(userId: string): SavedArticleRecord[] {
    const list = this.savedArticles.get(userId) || [];
    return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  public toggleSavedArticle(userId: string, item: EditionItem): { isSaved: boolean } {
    let list = this.savedArticles.get(userId) || [];
    const existingIndex = list.findIndex(r => r.articleId === item.articleId || r.item.id === item.id);

    if (existingIndex >= 0) {
      const removed = list.splice(existingIndex, 1)[0];
      this.savedArticles.set(userId, list);
      this.saveToDisk();

      if (isSupabaseConfigured() && removed) {
        dbRemoveStory(userId, removed.id).catch(e => console.warn('[Supabase] removeStory error:', e));
      }

      return { isSaved: false };
    } else {
      const record: SavedArticleRecord = {
        id: `sav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        articleId: item.articleId,
        item: { ...item, isSaved: true },
        savedAt: new Date().toISOString(),
      };
      list.unshift(record);
      this.savedArticles.set(userId, list);
      this.recordInteraction(userId, item.articleId, item.section as Topic, 'save');
      this.saveToDisk();

      if (isSupabaseConfigured()) {
        dbSaveStory(record).catch(e => console.warn('[Supabase] saveStory error:', e));
      }

      return { isSaved: true };
    }
  }

  public saveReflection(userId: string, editionId: string, note: string): boolean {
    const edition = this.editions.get(editionId);
    if (!edition || edition.userId !== userId) return false;
    edition.reflectionNote = note;
    this.editions.set(editionId, edition);
    this.saveToDisk();

    if (isSupabaseConfigured()) {
      dbSaveEdition(edition).catch(e => console.warn('[Supabase] saveReflection error:', e));
    }

    return true;
  }
}

export const dbStore = new StoreManager();
