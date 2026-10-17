import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { Article, FeedSource, QueryInterpretation, Topic } from '../shared/types.ts';

export function generateArticleId(prefix: string, url: string, headline?: string): string {
  const hash = crypto.createHash('sha256').update(`${url}|${headline || ''}`).digest('hex').slice(0, 16);
  return `${prefix}-${hash}`;
}

// Server-side source allowlist of verified news publishers
export const DEFAULT_FEEDS: FeedSource[] = [
  {
    id: 'bbc-world',
    name: 'BBC News',
    category: 'World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'lemonde-world',
    name: 'Le Monde in English',
    category: 'World',
    url: 'https://www.lemonde.fr/en/international/rss_full.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'bbc-business',
    name: 'BBC Business',
    category: 'Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'bbc-tech',
    name: 'BBC Technology',
    category: 'Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'arstechnica-tech',
    name: 'Ars Technica',
    category: 'Technology',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'bbc-science',
    name: 'BBC Science & Environment',
    category: 'Science',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'nasa-breaking',
    name: 'NASA Science & Space',
    category: 'Science',
    url: 'https://www.nasa.gov/feed/',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'lemonde-climate',
    name: 'Le Monde Environment',
    category: 'Climate & Environment',
    url: 'https://www.lemonde.fr/en/environment/rss_full.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'theguardian-climate',
    name: 'The Guardian Environment',
    category: 'Climate & Environment',
    url: 'https://www.theguardian.com/environment/rss',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'bbc-entertainment',
    name: 'BBC Arts & Culture',
    category: 'Arts & Culture',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'lemonde-culture',
    name: 'Le Monde Culture',
    category: 'Arts & Culture',
    url: 'https://www.lemonde.fr/en/culture/rss_full.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'lemonde-sports',
    name: 'Le Monde Sports',
    category: 'Sports',
    url: 'https://www.lemonde.fr/en/sports/rss_full.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'bbc-sports',
    name: 'BBC Sport',
    category: 'Sports',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'goodnewsnetwork',
    name: 'Good News Network',
    category: 'Good News',
    url: 'https://www.goodnewsnetwork.org/feed/',
    active: true,
    lastStatus: 'pending',
  },
  {
    id: 'positive-news',
    name: 'Positive News',
    category: 'Good News',
    url: 'https://www.positive.news/feed/',
    active: true,
    lastStatus: 'pending',
  },
];

let feedsRegistry: FeedSource[] = [...DEFAULT_FEEDS];

// In-memory cache for recent feed fetches to avoid rate limits
let cachedArticles: Article[] = [];
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes feed caching
const searchResultsCache = new Map<string, { articles: Article[]; timestamp: number }>();

export function sanitizeExcerpt(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageUrl(item: any): string | undefined {
  if (item.enclosure && item.enclosure['@_type']?.startsWith('image/')) {
    return item.enclosure['@_url'];
  }
  if (item['media:content'] && item['media:content']['@_url']) {
    return item['media:content']['@_url'];
  }
  if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
    return item['media:thumbnail']['@_url'];
  }
  if (Array.isArray(item['media:content']) && item['media:content'][0]?.['@_url']) {
    return item['media:content'][0]['@_url'];
  }
  const desc = item.description || item['content:encoded'] || '';
  const match = typeof desc === 'string' ? desc.match(/<img[^>]+src=["']([^"']+)["']/i) : null;
  if (match && match[1] && (match[1].startsWith('http://') || match[1].startsWith('https://'))) {
    return match[1];
  }
  return undefined;
}

export function getFeedSources(): FeedSource[] {
  return feedsRegistry;
}

export function toggleFeedSource(id: string, active?: boolean): FeedSource | null {
  const feed = feedsRegistry.find(f => f.id === id);
  if (!feed) return null;
  feed.active = active !== undefined ? active : !feed.active;
  return feed;
}

export function addFeedSource(newFeed: Omit<FeedSource, 'id' | 'lastStatus'>): FeedSource {
  const id = `custom-${Date.now()}`;
  const feed: FeedSource = {
    ...newFeed,
    id,
    lastStatus: 'pending',
  };
  feedsRegistry.push(feed);
  return feed;
}

export function detectTopicCategory(headline: string, excerpt: string, fallbackCategory: string): Topic {
  const text = `${headline} ${excerpt}`.toLowerCase();
  if (/\b(climate|global warming|emissions|renewable|biodiversity|carbon|green energy|conservation|flood|floods|monsoon)\b/.test(text)) {
    return 'Climate & Environment';
  }
  if (/\b(space|nasa|astronomy|physics|biology|quantum|telescope|scientific|exoplanet)\b/.test(text)) {
    return 'Science';
  }
  if (/\b(tech|ai|software|silicon|cyber|semiconductor|algorithm|gadget|app|startup|startups)\b/.test(text)) {
    return 'Technology';
  }
  if (/\b(business|economy|market|stock|inflation|trade|finance|bank|investment|venture)\b/.test(text)) {
    return 'Business';
  }
  if (/\b(art|culture|film|movie|museum|music|theatre|novel|literature|library)\b/.test(text)) {
    return 'Arts & Culture';
  }
  if (/\b(sport|sports|cricket|olympic|football|soccer|championship|cup|match|tournament)\b/.test(text)) {
    return 'Sports';
  }
  return (fallbackCategory as Topic) || 'World';
}

export async function fetchSingleFeed(source: FeedSource): Promise<{ articles: Article[]; error?: string }> {
  let timeoutId: any = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Daybreak/1.0 (Morning Paper Reader; contact@daybreak.news)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    const parsed = parser.parse(xmlText);
    const channel = parsed.rss?.channel || parsed.feed;
    if (!channel) {
      throw new Error('Unsupported or empty feed XML structure');
    }

    const rawItems = channel.item || channel.entry || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];
    const articles: Article[] = [];

    for (const item of itemsArray) {
      const headline = sanitizeExcerpt(item.title || '');
      const rawUrl = item.link?.['@_href'] || item.link || item.guid?.['#text'] || item.guid || '';
      const canonicalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
      const rawDesc = item.description || item.summary || item['content:encoded'] || '';
      const excerpt = sanitizeExcerpt(typeof rawDesc === 'string' ? rawDesc : '');
      const pubDateRaw = item.pubDate || item.published || item.updated || new Date().toISOString();
      const publishedAt = new Date(pubDateRaw).toISOString();
      const imageUrl = extractImageUrl(item);

      if (headline && canonicalUrl && canonicalUrl.startsWith('http')) {
        const detectedTopic = detectTopicCategory(headline, excerpt, source.category);
        articles.push({
          id: generateArticleId('art', canonicalUrl, headline),
          canonicalUrl,
          publisher: source.name,
          headline,
          publishedAt,
          excerpt: excerpt || headline,
          topic: detectedTopic,
          imageUrl,
          attribution: `Original reporting by ${source.name}`,
        });
      }
    }

    source.lastStatus = 'ok';
    source.lastFetchedAt = new Date().toISOString();
    source.articlesCount = articles.length;
    source.errorMessage = undefined;
    return { articles };
  } catch (err: any) {
    source.lastStatus = 'error';
    source.errorMessage = err.message || 'Fetch failed';
    return { articles: [], error: err.message };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Searches Google News RSS for real reporting matching specific keywords or phrases.
 */
export async function searchGoogleNewsRSS(query: string, maxItems = 15): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(trimmed)}&hl=en-US&gl=US&ceid=US:en`;
  let timeoutId: any = null;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DaybreakNewsBot/1.0; +https://daybreak.news)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[GoogleNewsRSS] Failed: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    const parsed = parser.parse(xml);
    const items = parsed.rss?.channel?.item || [];
    const list = Array.isArray(items) ? items : [items];
    const articles: Article[] = [];

    for (const item of list.slice(0, maxItems)) {
      let rawTitle = sanitizeExcerpt(item.title || '');
      let publisher = 'Verified Publisher';

      // Google News title typically has format: "Headline text - Publisher Name"
      const dashIndex = rawTitle.lastIndexOf(' - ');
      if (dashIndex > 10) {
        publisher = rawTitle.slice(dashIndex + 3).trim();
        rawTitle = rawTitle.slice(0, dashIndex).trim();
      } else if (item.source?.['#text']) {
        publisher = item.source['#text'];
      }

      const canonicalUrl = typeof item.link === 'string' ? item.link.trim() : '';
      const rawDesc = item.description || '';
      const excerpt = sanitizeExcerpt(rawDesc);
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

      if (rawTitle && canonicalUrl) {
        const detectedTopic = detectTopicCategory(rawTitle, excerpt, 'World');
        articles.push({
          id: generateArticleId('gn', canonicalUrl, rawTitle),
          canonicalUrl,
          publisher,
          headline: rawTitle,
          publishedAt: pubDate,
          excerpt: excerpt || rawTitle,
          topic: detectedTopic,
          attribution: `Original reporting by ${publisher}`,
          matchedEntity: trimmed,
        });
      }
    }

    return articles;
  } catch (err: any) {
    console.warn(`[GoogleNewsRSS] Error searching "${trimmed}":`, err?.message || err);
    return [];
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Searches real reporting across both allowlist feeds and Google News search feeds.
 * Deduplicates, scores relevance, and returns ranked real articles.
 */
export async function searchNews(
  query: string,
  interpretation?: QueryInterpretation
): Promise<Article[]> {
  const normKey = query.trim().toLowerCase();
  const cached = searchResultsCache.get(normKey);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.articles;
  }

  const clauses = interpretation?.searchClauses && interpretation.searchClauses.length > 0
    ? interpretation.searchClauses
    : [query];

  // 1. Fetch live search feeds for all clauses in parallel
  const searchPromises = clauses.map(clause => searchGoogleNewsRSS(clause, 15));
  const clauseResults = await Promise.allSettled(searchPromises);

  const collected: Article[] = [];
  for (const r of clauseResults) {
    if (r.status === 'fulfilled') {
      collected.push(...r.value);
    }
  }

  // 2. Also search our standard active publisher feeds
  const { articles: feedArticles } = await fetchAllActiveFeeds();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/[\s,]+/).filter(w => w.length > 2);

  for (const art of feedArticles) {
    const text = `${art.headline} ${art.excerpt}`.toLowerCase();
    let matchScore = 0;
    for (const w of queryWords) {
      if (text.includes(w)) matchScore += 1;
    }
    if (matchScore > 0) {
      collected.push({
        ...art,
        relevanceScore: matchScore * 2,
        relevanceReason: `Matches topic keyword from ${art.publisher}`,
      });
    }
  }

  // 3. Deduplicate by canonical URL and normalized headline
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();
  const deduped: Article[] = [];

  for (const art of collected) {
    const normUrl = art.canonicalUrl.toLowerCase();
    const normTitle = art.headline.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenUrls.has(normUrl) || seenHeadlines.has(normTitle)) {
      continue;
    }
    seenUrls.add(normUrl);
    seenHeadlines.add(normTitle);

    // Compute detailed relevance score
    let score = art.relevanceScore || 0;
    const artText = `${art.headline} ${art.excerpt}`.toLowerCase();

    // Exact query matches
    if (artText.includes(queryLower)) {
      score += 15;
    }

    // Individual words match in headline (heavy boost) vs excerpt
    for (const w of queryWords) {
      if (art.headline.toLowerCase().includes(w)) score += 5;
      else if (art.excerpt.toLowerCase().includes(w)) score += 2;
    }

    // Entity and place matches from interpretation
    if (interpretation) {
      for (const ent of interpretation.parsedEntities) {
        if (artText.includes(ent.toLowerCase())) score += 8;
      }
      for (const place of interpretation.parsedPlaces) {
        if (artText.includes(place.toLowerCase())) score += 7;
      }
    }

    // Freshness boost: within 24h +4, within 48h +2
    const ageHours = (Date.now() - new Date(art.publishedAt).getTime()) / 3600000;
    if (ageHours <= 24) score += 4;
    else if (ageHours <= 48) score += 2;

    art.relevanceScore = score;
    art.relevanceReason = art.relevanceReason || formatRelevanceReason(art, query, interpretation);

    deduped.push(art);
  }

  // Sort descending by relevance score
  const sorted = deduped.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  searchResultsCache.set(normKey, { articles: sorted, timestamp: Date.now() });
  return sorted;
}

function formatRelevanceReason(
  art: Article,
  rawQuery: string,
  interp?: QueryInterpretation
): string {
  if (interp?.parsedPlaces && interp.parsedPlaces.some(p => art.headline.toLowerCase().includes(p.toLowerCase()))) {
    const matchedPlace = interp.parsedPlaces.find(p => art.headline.toLowerCase().includes(p.toLowerCase()));
    return `Regional reporting on ${matchedPlace}`;
  }
  if (interp?.parsedEntities && interp.parsedEntities.some(e => art.headline.toLowerCase().includes(e.toLowerCase()))) {
    const matchedEntity = interp.parsedEntities.find(e => art.headline.toLowerCase().includes(e.toLowerCase()));
    return `Covers developments for ${matchedEntity}`;
  }
  if (art.matchedEntity) {
    return `Matches your search for "${art.matchedEntity}"`;
  }
  return `Relevant to ${art.topic} coverage`;
}

export async function fetchAllActiveFeeds(): Promise<{
  articles: Article[];
  publisherStatus: Record<string, { ok: boolean; count: number; error?: string }>;
}> {
  // Check in-memory cache
  if (cachedArticles.length > 0 && Date.now() - lastFetchTimestamp < CACHE_TTL_MS) {
    const publisherStatus: Record<string, { ok: boolean; count: number; error?: string }> = {};
    for (const f of feedsRegistry.filter(f => f.active)) {
      publisherStatus[f.name] = {
        ok: f.lastStatus === 'ok',
        count: f.articlesCount || 0,
        error: f.errorMessage,
      };
    }
    return { articles: cachedArticles, publisherStatus };
  }

  const activeFeeds = feedsRegistry.filter(f => f.active);
  const publisherStatus: Record<string, { ok: boolean; count: number; error?: string }> = {};

  const results = await Promise.allSettled(
    activeFeeds.map(async feed => {
      const res = await fetchSingleFeed(feed);
      publisherStatus[feed.name] = {
        ok: !res.error && res.articles.length > 0,
        count: res.articles.length,
        error: res.error,
      };
      return res.articles;
    })
  );

  const collected: Article[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      collected.push(...r.value);
    }
  }

  // Deduplicate by canonical URL and normalized headline
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();
  const deduped: Article[] = [];

  for (const art of collected) {
    const normUrl = art.canonicalUrl.toLowerCase();
    const normTitle = art.headline.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenUrls.has(normUrl) || seenHeadlines.has(normTitle)) {
      continue;
    }
    seenUrls.add(normUrl);
    seenHeadlines.add(normTitle);
    deduped.push(art);
  }

  if (deduped.length > 0) {
    cachedArticles = deduped;
    lastFetchTimestamp = Date.now();
  }

  return { articles: deduped.length > 0 ? deduped : cachedArticles, publisherStatus };
}
