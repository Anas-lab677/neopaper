import { Article, Topic, UserProfile } from '../shared/types.ts';

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
    const combinedText = `${article.headline} ${article.excerpt}`.toLowerCase();

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

    // 2. Specific followed interests match (+30 points)
    const matchedInterests: string[] = [];
    for (const kw of profile.specificInterests || []) {
      if (kw.trim() && combinedText.includes(kw.trim().toLowerCase())) {
        matchedInterests.push(kw.trim());
      }
    }
    if (matchedInterests.length > 0) {
      score += 30 * Math.min(matchedInterests.length, 2);
      signals.push(`matched your followed interest in "${matchedInterests.join(', ')}"`);
    }

    // 3. Search Signals boost (+15 points for repeated searches)
    if (profile.searchSignals) {
      for (const [query, data] of Object.entries(profile.searchSignals)) {
        if (data.count > 1 && combinedText.includes(query.toLowerCase())) {
          score += 15;
          signals.push(`frequently searched "${query}"`);
          break;
        }
      }
    }

    // 4. Geographic relevance (+25 points if genuinely reporting on user's region/city)
    if (profile.city && profile.city.trim() && new RegExp(`\\b${profile.city.trim()}\\b`, 'i').test(combinedText)) {
      score += 25;
      signals.push(`reporting relevant to ${profile.city}`);
    } else if (profile.region && profile.region !== 'Global' && profile.region.trim()) {
      if (new RegExp(`\\b${profile.region.trim()}\\b`, 'i').test(combinedText)) {
        score += 20;
        signals.push(`reporting from ${profile.region}`);
      }
    }

    // 5. Recency / Freshness (+20 points max, decays over 48 hours)
    const pubTime = new Date(article.publishedAt).getTime();
    const hoursOld = Math.max(0, (now - pubTime) / (1000 * 60 * 60));
    const recencyScore = Math.max(0, 20 * (1 - hoursOld / 48));
    score += recencyScore;

    // 6. Learned preference adjustments from feedback (+25 max, -30 min)
    const learned = profile.learnedPreferences ? profile.learnedPreferences[article.topic] : null;
    if (learned) {
      const delta = learned.weight * 25;
      score += delta;
      if (learned.weight > 0.2) {
        signals.push(`growing interest in ${article.topic} based on your feedback`);
      } else if (learned.weight < -0.2) {
        signals.push(`reduced frequency for ${article.topic}`);
      }
    }

    // 7. Likes & Dislikes / Skips
    if (profile.likes && profile.likes.includes(article.id)) {
      score += 15;
    }
    if (profile.dislikes && profile.dislikes.includes(article.id)) {
      score -= 40; // Strongly downranked
    }
    if (profile.skipped && profile.skipped.includes(article.id)) {
      score -= 20; // Soft skip penalty
    }

    scored.push({
      article,
      score,
      signals,
      isDiscovery: !isExplicit && matchedInterests.length === 0,
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Apply publisher diversity cap: max 35% from any single publisher
  const selected: ScoredArticle[] = [];
  const publisherCounts: Record<string, number> = {};
  const maxPerPublisher = Math.max(2, Math.ceil(targetCount * 0.35));

  // Determine if discovery is enabled and pick top discovery story
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
    if (!profile.discoveryEnabled && item.isDiscovery && profile.explicitTopics.length > 0) {
      continue;
    }
    const pubCount = publisherCounts[item.article.publisher] || 0;
    if (pubCount >= maxPerPublisher && selected.length >= 3) {
      continue;
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
