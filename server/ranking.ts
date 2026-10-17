import { Article, EditionItem, Topic, UserProfile } from '../shared/types.ts';

export interface ScoredArticle {
  article: Article;
  score: number;
  signals: string[];
  isDiscovery?: boolean;
}

export function rankArticlesForProfile(
  articles: Article[],
  profile: UserProfile,
  targetCount: number
): ScoredArticle[] {
  const scored: ScoredArticle[] = [];
  const now = Date.now();

  for (const article of articles) {
    let score = 0;
    const signals: string[] = [];

    // 1. Explicit topic match (+35 points)
    const isExplicit = profile.explicitTopics.some(t => {
      if (t === article.topic) return true;
      if (
        (t === 'Climate & Environment' || t === 'Climate') &&
        (article.topic === 'Climate & Environment' || article.topic === 'Climate')
      ) return true;
      if (
        (t === 'Arts & Culture' || t === 'Culture') &&
        (article.topic === 'Arts & Culture' || article.topic === 'Culture')
      ) return true;
      return false;
    });
    if (isExplicit) {
      score += 35;
      signals.push(`you follow ${article.topic}`);
    }

    // 2. Specific keyword match (+25 points)
    const combinedText = `${article.headline} ${article.excerpt}`.toLowerCase();
    const matchedKeywords: string[] = [];
    for (const kw of profile.specificInterests) {
      if (kw.trim() && combinedText.includes(kw.trim().toLowerCase())) {
        matchedKeywords.push(kw.trim());
      }
    }
    if (matchedKeywords.length > 0) {
      score += 25 * Math.min(matchedKeywords.length, 2);
      signals.push(`matched your interest in "${matchedKeywords.join(', ')}"`);
    }

    // 3. Recency / Freshness (+20 points max, decays over 48 hours)
    const pubTime = new Date(article.publishedAt).getTime();
    const hoursOld = Math.max(0, (now - pubTime) / (1000 * 60 * 60));
    const recencyScore = Math.max(0, 20 * (1 - hoursOld / 48));
    score += recencyScore;

    // 4. Learned preference adjustments (+20 max, -30 min)
    const learned = profile.learnedPreferences[article.topic];
    if (learned) {
      const delta = learned.weight * 20;
      score += delta;
      if (learned.weight > 0.2) {
        signals.push(`growing interest in ${article.topic} based on your feedback`);
      } else if (learned.weight < -0.2) {
        signals.push(`reduced frequency for ${article.topic}`);
      }
    }

    scored.push({
      article,
      score,
      signals,
      isDiscovery: !isExplicit,
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Apply publisher diversity cap: max 35% from any single publisher
  const selected: ScoredArticle[] = [];
  const publisherCounts: Record<string, number> = {};
  const maxPerPublisher = Math.max(2, Math.ceil(targetCount * 0.35));

  // Determine if discovery is enabled and we need a discovery story
  let discoveryStory: ScoredArticle | null = null;
  if (profile.discoveryEnabled) {
    const discoveryCandidates = scored.filter(s => s.isDiscovery && s.score > 10);
    if (discoveryCandidates.length > 0) {
      discoveryStory = discoveryCandidates[0];
    }
  }

  // Select core stories
  for (const item of scored) {
    if (discoveryStory && item.article.id === discoveryStory.article.id) {
      continue;
    }

    // If discovery is disabled, strictly skip non-explicit topics unless no other articles exist
    if (!profile.discoveryEnabled && item.isDiscovery && profile.explicitTopics.length > 0) {
      continue;
    }

    const pubCount = publisherCounts[item.article.publisher] || 0;
    if (pubCount >= maxPerPublisher && selected.length >= 3) {
      continue; // Skip to enforce publisher variety
    }

    selected.push(item);
    publisherCounts[item.article.publisher] = pubCount + 1;

    if (selected.length >= (discoveryStory ? targetCount - 1 : targetCount)) {
      break;
    }
  }

  // Add the discovery story if configured
  if (discoveryStory && selected.length < targetCount) {
    discoveryStory.signals = ['included as a fresh perspective outside your usual topics'];
    selected.push(discoveryStory);
  }

  return selected;
}

export function formatSelectionReason(signals: string[], isDiscovery?: boolean): string {
  if (isDiscovery) {
    return 'Selected as a discovery story outside your usual topics.';
  }
  if (signals.length === 0) {
    return 'Selected for today’s morning edition.';
  }
  return `Selected because ${signals.join(' and ')}.`;
}
