import { Edition, EditionItem, RecapTakeaway, UserProfile } from '../shared/types.ts';
import { fetchAllActiveFeeds } from './feeds.ts';
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

  const revision = existingToday ? (options?.isRegeneration ? existingToday.revision + 1 : existingToday.revision) : 1;

  if (existingToday && !options?.isRegeneration) {
    return existingToday;
  }

  // Target count derived from reading budget
  let targetCount = 8; // 10 min default
  if (profile.readingMinutes === 5) targetCount = 5;
  if (profile.readingMinutes === 20) targetCount = 12;

  // 1. Fetch recent articles from allowlist feeds
  const { articles, publisherStatus } = await fetchAllActiveFeeds();

  // 2. Rank articles using reader preferences
  const ranked = rankArticlesForProfile(articles, profile, targetCount);

  // 3. Process briefs and takeaways via Gemini in a single batched call
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
      id: `item-${Date.now()}-${i}`,
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
      isAiBrief: grounded.isAiGrounded,
    });
  }

  // 4. Derive "Three things to take into today" from actual story content
  const recapTakeaways: RecapTakeaway[] = [];
  const candidateItems = editionItems.slice(0, 3);
  candidateItems.forEach((item, idx) => {
    recapTakeaways.push({
      id: `rt-${item.id}`,
      title: item.headline.split(':').pop()?.trim().slice(0, 45) || item.headline.slice(0, 40),
      takeaway: item.takeaways?.[0] || item.briefSummary.slice(0, 120),
      articleId: item.articleId,
      publisher: item.publisher,
    });
  });

  const readingTimeMinutes = Math.max(3, Math.round(totalWordCount / 180));
  const dateObj = new Date(targetDate + 'T12:00:00Z');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const leadHeadline = editionItems[0]?.headline || 'Your Morning Perspectives';

  const edition: Edition = {
    id: `ed-${profile.id}-${targetDate}-r${revision}`,
    userId: profile.id,
    editionDate: targetDate,
    formattedDate,
    greeting: `Good morning, ${profile.name || 'Reader'}.`,
    headline: leadHeadline,
    revision,
    storyCount: editionItems.length,
    readingTimeMinutes,
    status: 'published',
    items: editionItems,
    recapTakeaways,
    publisherStatus,
    createdAt: new Date().toISOString(),
  };

  // 5. Freeze and save snapshot
  dbStore.saveEdition(edition);

  // 6. Pre-generate and cache PDF
  try {
    const pdfBuffer = generateNewspaperPdf(edition, profile.name || 'Reader');
    pdfCache.set(edition.id, pdfBuffer);
  } catch (pdfErr) {
    console.error('Failed to pre-cache PDF:', pdfErr);
  }

  return edition;
}
