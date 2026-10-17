import { Edition, EditionItem, RecapTakeaway, UserProfile } from '../shared/types.ts';
import { fetchAllActiveFeeds, searchGoogleNewsRSS } from './feeds.ts';
import { batchGenerateGroundedBriefs } from './gemini.ts';
import { generateNewspaperPdf } from './pdf.ts';
import { formatSelectionReason, rankArticlesForProfile } from './ranking.ts';
import { dbStore } from './store.ts';

// Pre-cached PDF buffers by edition ID
export const pdfCache = new Map<string, Buffer>();

export async function buildDailyEdition(
  profile: UserProfile,
  options?: { isRegeneration?: boolean; forcedDate?: string }
): Promise<Edition> {
  const targetDate = options?.forcedDate || new Date().toISOString().split('T')[0];
  const existingToday = dbStore.getTodayEdition(profile.id, targetDate);

  // If already generated for today and not an explicit regeneration, preserve it strictly!
  if (existingToday && !options?.isRegeneration) {
    return existingToday;
  }

  const revision = existingToday ? existingToday.revision + 1 : 1;

  // Target count derived from reading depth: aim for 10-15 for standard
  let targetCount = 12; // 10 min Standard default
  if (profile.readingMinutes === 5 || profile.readingDepth === 'Quick') targetCount = 7;
  if (profile.readingMinutes === 20 || profile.readingDepth === 'Deep') targetCount = 18;

  // 1. Fetch base articles from allowlist feeds
  const { articles: feedArticles, publisherStatus } = await fetchAllActiveFeeds();
  const allArticles = [...feedArticles];

  // 2. Fetch live articles for followed user interests and regional requests
  const extraQueries: string[] = [];
  if (profile.specificInterests && profile.specificInterests.length > 0) {
    extraQueries.push(...profile.specificInterests.slice(0, 3));
  }
  if (profile.city && profile.city.trim()) {
    extraQueries.push(`${profile.city.trim()} news`);
  } else if (profile.region && profile.region !== 'Global' && profile.region.trim()) {
    extraQueries.push(`${profile.region.trim()} news`);
  }

  if (extraQueries.length > 0) {
    const extraResults = await Promise.allSettled(
      extraQueries.map(q => searchGoogleNewsRSS(q, 8))
    );
    for (const r of extraResults) {
      if (r.status === 'fulfilled') {
        allArticles.push(...r.value);
      }
    }
  }

  // Deduplicate pooled articles
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();
  const uniqueArticles = allArticles.filter(art => {
    const normUrl = art.canonicalUrl.toLowerCase();
    const normTitle = art.headline.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenUrls.has(normUrl) || seenHeadlines.has(normTitle)) return false;
    seenUrls.add(normUrl);
    seenHeadlines.add(normTitle);
    return true;
  });

  // 3. Rank articles using reader preferences & feedback
  const ranked = rankArticlesForProfile(uniqueArticles, profile, targetCount);

  // 4. Process briefs and takeaways via Gemini in a single batched call
  const storiesToGround = ranked.map(r => ({
    id: r.article.id,
    headline: r.article.headline,
    publisher: r.article.publisher,
    excerpt: r.article.excerpt,
    fallbackTopic: r.article.topic,
  }));

  const groundedMap = await batchGenerateGroundedBriefs(storiesToGround);

  const editionItems: EditionItem[] = [];
  let totalWordCount = 0;

  for (let i = 0; i < ranked.length; i++) {
    const { article, signals, isDiscovery } = ranked[i];
    const grounded = groundedMap.get(article.id) || {
      briefSummary: article.excerpt,
      takeaways: [article.excerpt],
      topic: article.topic,
      isAiGrounded: false,
    };

    const selectionReason = formatSelectionReason(signals, isDiscovery);
    totalWordCount += (article.headline.split(' ').length + grounded.briefSummary.split(' ').length);

    editionItems.push({
      id: `item-${targetDate}-${i + 1}`,
      articleId: article.id,
      sortOrder: i + 1,
      section: isDiscovery ? 'Discovery' : grounded.topic,
      headline: article.headline,
      briefSummary: grounded.briefSummary,
      takeaways: grounded.takeaways,
      selectionReason,
      publisher: article.publisher,
      sourceUrl: article.canonicalUrl,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      isRead: false,
      isSaved: false,
      isSkipped: false,
      feedback: null,
      isAiBrief: grounded.isAiGrounded,
    });
  }

  // 5. Construct "Your Morning in 3" takeaways from the top stories
  const recapTakeaways: RecapTakeaway[] = [];
  for (let i = 0; i < Math.min(3, editionItems.length); i++) {
    const item = editionItems[i];
    const takeawayText = item.takeaways && item.takeaways.length > 0
      ? item.takeaways[0]
      : item.briefSummary.slice(0, 150);

    recapTakeaways.push({
      id: `rt-${targetDate}-${i + 1}`,
      title: item.headline,
      takeaway: takeawayText,
      articleId: item.articleId,
      publisher: item.publisher,
    });
  }

  // 6. Masthead & Greeting
  const dateObj = new Date(targetDate + 'T07:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? `Good morning, ${profile.name}.` : `Good day, ${profile.name}.`;
  const estimatedReadingMinutes = Math.max(4, Math.round(totalWordCount / 180));

  const edition: Edition = {
    id: `ed-${profile.id}-${targetDate}-rev${revision}`,
    userId: profile.id,
    editionDate: targetDate,
    formattedDate,
    greeting,
    headline: editionItems[0]?.headline || 'Your Morning Briefing',
    revision,
    storyCount: editionItems.length,
    readingTimeMinutes: estimatedReadingMinutes,
    status: 'published',
    items: editionItems,
    recapTakeaways,
    publisherStatus,
    createdAt: new Date().toISOString(),
  };

  // 7. Save edition permanently
  dbStore.saveEdition(edition);

  // 8. Pre-generate and cache the matching PDF binary buffer
  try {
    const pdfBuffer = generateNewspaperPdf(edition, profile.name);
    pdfCache.set(edition.id, pdfBuffer);
  } catch (pdfErr) {
    console.warn('[EditionBuilder] PDF generation warning:', pdfErr);
  }

  return edition;
}
