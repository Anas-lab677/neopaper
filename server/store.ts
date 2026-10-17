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

// Deterministic judging fixtures
export const DEMO_PROFILES: Record<string, UserProfile> = {
  'reader-a': {
    id: 'reader-a',
    name: 'Sara',
    readingMinutes: 10,
    timezone: 'America/New_York',
    deliveryTime: '07:00',
    discoveryEnabled: true,
    explicitTopics: ['Technology', 'Science', 'Climate'],
    specificInterests: ['AI tools', 'Space exploration'],
    learnedPreferences: {
      Technology: { weight: 0.25, count: 4, note: "You read a steady mix of technology stories." },
      Science: { weight: 0.15, count: 3, note: "Following scientific discoveries." },
      Climate: { weight: 0.40, count: 6, note: "Growing interest: you've read and saved more climate stories lately." },
    },
    isGuest: false,
  },
  'reader-b': {
    id: 'reader-b',
    name: 'David',
    readingMinutes: 10,
    timezone: 'Europe/London',
    deliveryTime: '07:30',
    discoveryEnabled: false,
    explicitTopics: ['Business', 'Sports', 'World'],
    specificInterests: ['Global markets', 'Clean energy investing', 'Football'],
    learnedPreferences: {
      Business: { weight: 0.35, count: 5, note: "You follow global market and commerce reporting." },
      Sports: { weight: 0.30, count: 4, note: "Frequent engagement with sports developments." },
      World: { weight: 0.20, count: 3, note: "Following diplomatic and international affairs." },
    },
    isGuest: false,
  },
};

// Seed archive editions so that Archive and Saved are immediately inspectable
export const SEED_EDITIONS: Edition[] = [
  {
    id: 'ed-archive-1',
    userId: 'reader-a',
    editionDate: '2026-10-16',
    formattedDate: 'Friday, October 16, 2026',
    greeting: 'Good morning, Sara.',
    headline: 'A fresh perspective on everyday life',
    revision: 1,
    storyCount: 6,
    readingTimeMinutes: 8,
    status: 'published',
    createdAt: '2026-10-16T07:00:00.000Z',
    publisherStatus: {
      'BBC Technology': { ok: true, count: 2 },
      'NASA Science & Space': { ok: true, count: 2 },
      'Le Monde in English': { ok: true, count: 2 },
    },
    recapTakeaways: [
      {
        id: 'rt-1',
        title: 'Calmer software adoption',
        takeaway: 'Asynchronous communication tools are gaining ground over real-time chat in distributed engineering teams.',
        articleId: 'fb-tech-1',
        publisher: 'BBC Technology',
      },
      {
        id: 'rt-2',
        title: 'Atmospheric exoplanet science',
        takeaway: 'Novel spectrographic instruments allow atmospheric mapping of gas giants with high chemical precision.',
        articleId: 'fb-science-1',
        publisher: 'NASA Science & Space',
      },
      {
        id: 'rt-3',
        title: 'Urban tree canopy investments',
        takeaway: 'City green corridors reduce pavement surface temperatures by up to 5 degrees Celsius.',
        articleId: 'fb-climate-1',
        publisher: 'Le Monde in English',
      },
    ],
    items: [
      {
        id: 'item-101',
        articleId: 'fb-climate-1',
        sortOrder: 1,
        section: 'Climate',
        headline: 'What a greener city could feel like',
        briefSummary: 'Cities around the world are reimagining streets for people, with more trees, cleaner air, and quieter neighborhoods. New research confirms that urban forestry investments significantly buffer climate extremes while improving mental wellbeing.',
        takeaways: [
          'Urban tree canopy expansion reduces localized summer heat islands by up to 5°C.',
          'Permeable green corridors absorb excess storm runoff while dampening traffic acoustics.',
        ],
        selectionReason: 'Selected because you follow Climate and saved a clean-energy story.',
        publisher: 'Le Monde in English',
        sourceUrl: 'https://www.lemonde.fr/en/environment/article/2026/10/16/urban-canopy-cooling-cities_6482109_114.html',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-16T04:00:00.000Z',
        isAiBrief: true,
      },
      {
        id: 'item-102',
        articleId: 'fb-tech-1',
        sortOrder: 2,
        section: 'Technology',
        headline: 'Tools that give us time back',
        briefSummary: 'A growing community of developers is designing intentional software with finite boundaries, replacing endless notification loops with scheduled daily summaries.',
        takeaways: [
          'Calm technology models intentionally limit notification frequency to respect human focus.',
          'Early adopters report measurable reductions in cognitive fatigue.',
        ],
        selectionReason: 'Selected because you follow Technology and specific interest "AI tools".',
        publisher: 'BBC Technology',
        sourceUrl: 'https://feeds.bbci.co.uk/news/technology/article-689123',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-16T02:00:00.000Z',
        isAiBrief: true,
      },
      {
        id: 'item-103',
        articleId: 'fb-science-1',
        sortOrder: 3,
        section: 'Science',
        headline: 'A new perspective on space: Webb maps alien weather systems',
        briefSummary: 'Deep-space infrared sensors have mapped high-altitude cloud structures and winds on distant exoplanets, expanding our understanding of planetary formation.',
        takeaways: [
          'New instruments measure wind speed and atmospheric composition across planetary hemispheres.',
          'Observations uncover complex weather patterns on planets outside our solar system.',
        ],
        selectionReason: 'Selected because you follow Science and specific interest "Space exploration".',
        publisher: 'NASA Science & Space',
        sourceUrl: 'https://www.nasa.gov/news-release/astronomers-reveal-new-exoplanet-atmosphere-details/',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-16T01:00:00.000Z',
        isAiBrief: true,
      },
      {
        id: 'item-104',
        articleId: 'fb-culture-1',
        sortOrder: 4,
        section: 'Discovery',
        headline: 'The resurgence of communal reading rooms and print archives',
        briefSummary: 'Quiet reading sanctuaries are drawing cross-generational crowds seeking focused, analog reading experiences away from algorithmic feeds.',
        takeaways: [
          'Public reading rooms are reporting record attendance across metropolitan libraries.',
          'Analog reading habits promote deeper text retention and sustained concentration.',
        ],
        selectionReason: 'Included as a discovery story outside your usual topics.',
        publisher: 'Le Monde Culture',
        sourceUrl: 'https://www.lemonde.fr/en/culture/article/2026/10/15/art-of-slow-reading-libraries_6481901_117.html',
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-15T18:00:00.000Z',
        isAiBrief: true,
      },
    ],
  },
  {
    id: 'ed-archive-2',
    userId: 'reader-a',
    editionDate: '2026-10-15',
    formattedDate: 'Thursday, October 15, 2026',
    greeting: 'Good morning, Sara.',
    headline: 'Small ideas, wider horizons',
    revision: 1,
    storyCount: 5,
    readingTimeMinutes: 7,
    status: 'published',
    createdAt: '2026-10-15T07:00:00.000Z',
    publisherStatus: {
      'BBC News': { ok: true, count: 2 },
      'Le Monde in English': { ok: true, count: 3 },
    },
    recapTakeaways: [
      {
        id: 'rt-21',
        title: 'Global ocean accord ratified',
        takeaway: 'High seas protection pact reaches required sixty signatures for international implementation.',
        articleId: 'fb-world-1',
        publisher: 'BBC News',
      },
      {
        id: 'rt-22',
        title: 'Renewable grid parity',
        takeaway: 'Clean energy capital commitments surpassed fossil fuel capital spend globally.',
        articleId: 'fb-business-1',
        publisher: 'BBC Business',
      },
    ],
    items: [
      {
        id: 'item-201',
        articleId: 'fb-world-1',
        sortOrder: 1,
        section: 'World',
        headline: 'Renewed diplomatic accord signed to protect high seas biodiversity',
        briefSummary: 'A landmark treaty establishing international marine sanctuaries in international waters has crossed the threshold for formal implementation.',
        takeaways: [
          'Sanctuaries protect deep-sea migratory routes from commercial exploitation.',
          'Nations agree to shared scientific monitoring protocols.',
        ],
        selectionReason: 'Selected for international significance and global cooperation.',
        publisher: 'BBC News',
        sourceUrl: 'https://feeds.bbci.co.uk/news/world/article-712891',
        imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-15T05:00:00.000Z',
        isAiBrief: true,
      },
      {
        id: 'item-202',
        articleId: 'fb-business-1',
        sortOrder: 2,
        section: 'Business',
        headline: 'Clean energy investments reach milestone in global transition',
        briefSummary: 'Private capital flows into solar, offshore wind, and long-duration battery storage set consecutive quarterly records.',
        takeaways: [
          'Battery storage capacity installations doubled year-over-year.',
          'Renewable generation costs dropped another 8% across prime solar corridors.',
        ],
        selectionReason: 'Selected for market relevance to sustainability.',
        publisher: 'BBC Business',
        sourceUrl: 'https://feeds.bbci.co.uk/news/business/article-982142',
        imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
        publishedAt: '2026-10-15T03:00:00.000Z',
        isAiBrief: true,
      },
    ],
  },
];

class MemoryStore {
  private profiles: Map<string, UserProfile> = new Map();
  private editions: Map<string, Edition> = new Map();
  private savedArticles: Map<string, SavedArticleRecord> = new Map();
  private interactions: InteractionRecord[] = [];
  private activeUserId: string = 'reader-a';

  constructor() {
    // Populate demo profiles
    for (const [id, prof] of Object.entries(DEMO_PROFILES)) {
      this.profiles.set(id, { ...prof });
    }

    // Populate seed editions
    for (const ed of SEED_EDITIONS) {
      this.editions.set(ed.id, { ...ed });
    }

    // Seed initial saved article for reader-a
    const firstSeedItem = SEED_EDITIONS[0].items[0];
    this.savedArticles.set(`saved-${firstSeedItem.id}`, {
      id: `saved-${firstSeedItem.id}`,
      userId: 'reader-a',
      articleId: firstSeedItem.articleId,
      item: firstSeedItem,
      savedAt: '2026-10-16T08:30:00.000Z',
    });
  }

  getActiveUserId(): string {
    return this.activeUserId;
  }

  setActiveUserId(id: string) {
    if (this.profiles.has(id)) {
      this.activeUserId = id;
    }
  }

  getProfile(id: string = this.activeUserId): UserProfile {
    let prof = this.profiles.get(id);
    if (!prof) {
      prof = {
        id,
        name: 'Reader',
        readingMinutes: 10,
        timezone: 'America/New_York',
        deliveryTime: '07:00',
        discoveryEnabled: true,
        explicitTopics: ['Technology', 'Science', 'World'],
        specificInterests: [],
        learnedPreferences: {
          Technology: { weight: 0.1, count: 1, note: 'Initial topic preference' },
          Science: { weight: 0.1, count: 1, note: 'Initial topic preference' },
          World: { weight: 0.1, count: 1, note: 'Initial topic preference' },
        },
      };
      this.profiles.set(id, prof);
    }
    return prof;
  }

  updateProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const existing = this.getProfile(id);
    const updated: UserProfile = {
      ...existing,
      ...updates,
      id,
    };
    this.profiles.set(id, updated);
    return updated;
  }

  resetLearnedPreferences(id: string): UserProfile {
    const profile = this.getProfile(id);
    profile.learnedPreferences = {};
    for (const topic of profile.explicitTopics) {
      profile.learnedPreferences[topic] = {
        weight: 0,
        count: 0,
        note: `Subscribed to ${topic}`,
      };
    }
    this.profiles.set(id, profile);
    return profile;
  }

  getEdition(id: string): Edition | undefined {
    return this.editions.get(id);
  }

  getTodayEdition(userId: string = this.activeUserId, dateString?: string): Edition | undefined {
    const today = dateString || new Date().toISOString().split('T')[0];
    const userEditions = Array.from(this.editions.values())
      .filter(e => e.userId === userId && e.editionDate === today)
      .sort((a, b) => b.revision - a.revision);

    return userEditions[0];
  }

  getEditionArchive(userId: string = this.activeUserId): Edition[] {
    return Array.from(this.editions.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  saveEdition(edition: Edition): Edition {
    this.editions.set(edition.id, edition);
    return edition;
  }

  recordInteraction(userId: string, articleId: string, topic: Topic, action: InteractionRecord['action']) {
    this.interactions.push({
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      articleId,
      topic,
      action,
      timestamp: new Date().toISOString(),
    });

    // Update profile learned weights safely without exponential inflation
    const profile = this.getProfile(userId);
    if (!profile.learnedPreferences[topic]) {
      profile.learnedPreferences[topic] = { weight: 0, count: 0, note: `Interactions with ${topic}` };
    }

    const current = profile.learnedPreferences[topic];
    current.count += 1;

    let delta = 0;
    if (action === 'more_like_this') {
      delta = 0.3;
      current.note = `Growing interest: requested more stories like this.`;
    } else if (action === 'less_like_this') {
      delta = -0.3;
      current.note = `Reduced priority: marked less like this.`;
    } else if (action === 'save') {
      delta = 0.15;
      current.note = `Saved stories in ${topic}.`;
    } else if (action === 'read') {
      delta = 0.05;
    }

    current.weight = Math.max(-1.0, Math.min(1.0, current.weight + delta));
    this.profiles.set(userId, profile);
  }

  getSavedArticles(userId: string = this.activeUserId): SavedArticleRecord[] {
    return Array.from(this.savedArticles.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  toggleSavedArticle(userId: string, item: EditionItem): { isSaved: boolean } {
    const key = `saved-${userId}-${item.id}`;
    if (this.savedArticles.has(key)) {
      this.savedArticles.delete(key);
      return { isSaved: false };
    } else {
      this.savedArticles.set(key, {
        id: key,
        userId,
        articleId: item.articleId,
        item: { ...item, isSaved: true },
        savedAt: new Date().toISOString(),
      });
      this.recordInteraction(userId, item.articleId, item.section as Topic, 'save');
      return { isSaved: true };
    }
  }

  saveReflection(userId: string, editionId: string, note: string) {
    const edition = this.editions.get(editionId);
    if (edition) {
      edition.reflectionNote = note;
      this.editions.set(editionId, edition);
    }
  }
}

export const dbStore = new MemoryStore();
