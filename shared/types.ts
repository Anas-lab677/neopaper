export type Topic =
  | 'World'
  | 'Business'
  | 'Technology'
  | 'Science'
  | 'Climate & Environment'
  | 'Arts & Culture'
  | 'Sports'
  | 'Good News'
  | 'Climate'
  | 'Culture';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  readingMinutes: 5 | 10 | 20;
  timezone: string;
  deliveryTime: string; // e.g. '07:00'
  discoveryEnabled: boolean;
  explicitTopics: Topic[];
  specificInterests: string[];
  learnedPreferences: Record<string, { weight: number; count: number; note: string }>;
  isGuest?: boolean;
}

export interface Article {
  id: string;
  canonicalUrl: string;
  publisher: string;
  headline: string;
  publishedAt: string; // ISO string
  excerpt: string;
  briefSummary?: string;
  takeaways?: string[];
  topic: Topic;
  imageUrl?: string;
  attribution?: string;
  isAiBrief?: boolean;
}

export interface EditionItem {
  id: string;
  articleId: string;
  sortOrder: number;
  section: Topic | 'Discovery';
  headline: string;
  briefSummary: string;
  takeaways: string[];
  selectionReason: string;
  publisher: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  isRead?: boolean;
  isSaved?: boolean;
  isSkipped?: boolean;
  feedback?: 'more' | 'less' | null;
  isAiBrief?: boolean;
}

export interface RecapTakeaway {
  id: string;
  title: string;
  takeaway: string;
  articleId: string;
  publisher: string;
}

export interface Edition {
  id: string;
  userId: string;
  editionDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. Saturday, October 17, 2026
  greeting: string;
  headline: string;
  revision: number;
  storyCount: number;
  readingTimeMinutes: number;
  status: 'published' | 'generating' | 'partial' | 'failed';
  items: EditionItem[];
  recapTakeaways: RecapTakeaway[];
  reflectionNote?: string;
  publisherStatus: Record<string, { ok: boolean; count: number; error?: string }>;
  createdAt: string;
}

export interface FeedSource {
  id: string;
  name: string;
  category: Topic;
  url: string;
  active: boolean;
  lastFetchedAt?: string;
  lastStatus: 'ok' | 'error' | 'pending';
  articlesCount?: number;
  errorMessage?: string;
}

export interface SavedArticleRecord {
  id: string;
  userId: string;
  articleId: string;
  item: EditionItem;
  savedAt: string;
}

export interface InteractionRecord {
  id: string;
  userId: string;
  articleId: string;
  topic: Topic;
  action: 'more_like_this' | 'less_like_this' | 'save' | 'skip' | 'read';
  timestamp: string;
}
