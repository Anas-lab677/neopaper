import { Router } from 'express';
import { buildDailyEdition, pdfCache } from './editionBuilder.ts';
import { addFeedSource, getFeedSources, toggleFeedSource } from './feeds.ts';
import { generateNewspaperPdf } from './pdf.ts';
import { dbStore } from './store.ts';

export const apiRouter = Router();

// --- FEED MANAGEMENT ROUTES ---

apiRouter.get('/feeds', (req, res) => {
  const feeds = getFeedSources();
  res.json({
    feeds,
    total: feeds.length,
    activeCount: feeds.filter(f => f.active).length,
  });
});

apiRouter.post('/feeds/toggle', (req, res) => {
  const { id, active } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Feed id is required' });
  }
  const updated = toggleFeedSource(id, active);
  if (!updated) {
    return res.status(404).json({ error: 'Feed source not found' });
  }
  res.json({ success: true, feed: updated });
});

apiRouter.post('/feeds/add', (req, res) => {
  const { name, url, category } = req.body;
  if (!name || !url || !category) {
    return res.status(400).json({ error: 'name, url, and category are required' });
  }
  const created = addFeedSource({
    name,
    url,
    category,
    active: true,
  });
  res.json({ success: true, feed: created });
});

// --- PROFILE & PERSONALIZATION ROUTES ---

const getUserId = (req: any): string => {
  return (req.headers['x-user-id'] as string) || (req.query.userId as string) || dbStore.getActiveUserId();
};

apiRouter.get('/profile', (req, res) => {
  const userId = getUserId(req);
  const profile = dbStore.getProfile(userId);
  res.json({ profile });
});

apiRouter.put('/profile', (req, res) => {
  const userId = getUserId(req);
  const updates = req.body;
  const profile = dbStore.updateProfile(userId, updates);
  res.json({ success: true, profile });
});

apiRouter.post('/profile/reset-learning', (req, res) => {
  const userId = getUserId(req);
  const profile = dbStore.resetLearnedPreferences(userId);
  res.json({ success: true, profile });
});

apiRouter.post('/profile/switch-demo', (req, res) => {
  const { profileId } = req.body;
  if (profileId === 'reader-a' || profileId === 'reader-b') {
    dbStore.setActiveUserId(profileId);
    const profile = dbStore.getProfile(profileId);
    return res.json({ success: true, profile });
  }
  res.status(400).json({ error: 'Invalid demo profile ID' });
});

// --- EDITION ROUTES ---

apiRouter.get('/editions/today', async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = dbStore.getProfile(userId);
    let edition = dbStore.getTodayEdition(profile.id);

    if (!edition) {
      edition = await buildDailyEdition(profile);
    }

    res.json({ edition });
  } catch (err: any) {
    console.error('Error fetching today edition:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve today’s edition' });
  }
});

apiRouter.post('/editions/generate', async (req, res) => {
  try {
    const userId = getUserId(req);
    const profile = req.body.profile || dbStore.getProfile(userId);
    const isRegeneration = Boolean(req.body.isRegeneration);
    const edition = await buildDailyEdition(profile, { isRegeneration });
    res.json({ success: true, edition });
  } catch (err: any) {
    console.error('Error generating edition:', err);
    res.status(500).json({ error: err.message || 'Failed to generate edition' });
  }
});

apiRouter.get('/editions/archive', (req, res) => {
  const userId = getUserId(req);
  const archive = dbStore.getEditionArchive(userId);
  res.json({ archive });
});

apiRouter.get('/editions/:id', (req, res) => {
  const edition = dbStore.getEdition(req.params.id);
  if (!edition) {
    return res.status(404).json({ error: 'Edition snapshot not found' });
  }
  res.json({ edition });
});

// --- PDF DOWNLOAD & PREVIEW ROUTE ---

apiRouter.get('/editions/:id/pdf', (req, res) => {
  const edition = dbStore.getEdition(req.params.id);
  if (!edition) {
    return res.status(404).json({ error: 'Edition not found' });
  }

  let pdfBuffer = pdfCache.get(edition.id);
  if (!pdfBuffer) {
    const profile = dbStore.getProfile(edition.userId);
    pdfBuffer = generateNewspaperPdf(edition, profile.name || 'Reader');
    pdfCache.set(edition.id, pdfBuffer);
  }

  const filename = `daybreak-${edition.editionDate}-rev${edition.revision}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(pdfBuffer);
});

// --- SAVED & INTERACTIONS ROUTES ---

apiRouter.get('/saved', (req, res) => {
  const userId = getUserId(req);
  const saved = dbStore.getSavedArticles(userId);
  res.json({ saved });
});

apiRouter.post('/saved/:id/toggle', (req, res) => {
  const userId = getUserId(req);
  const { item } = req.body;
  if (!item) {
    return res.status(400).json({ error: 'Edition item is required' });
  }
  const result = dbStore.toggleSavedArticle(userId, item);
  res.json({ success: true, isSaved: result.isSaved });
});

apiRouter.post('/interactions', (req, res) => {
  const userId = getUserId(req);
  const { articleId, topic, action } = req.body;
  if (!articleId || !topic || !action) {
    return res.status(400).json({ error: 'articleId, topic, and action are required' });
  }
  dbStore.recordInteraction(userId, articleId, topic, action);
  res.json({ success: true });
});

apiRouter.post('/reflections', (req, res) => {
  const userId = getUserId(req);
  const { editionId, note } = req.body;
  if (!editionId || typeof note !== 'string') {
    return res.status(400).json({ error: 'editionId and note are required' });
  }
  dbStore.saveReflection(userId, editionId, note);
  res.json({ success: true });
});

// --- HEALTH & STATUS ---

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.SUPABASE_URL ? 'live-supabase' : 'embedded-store',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: 'gemini-3.8-flash',
    feedsCount: getFeedSources().length,
    activeFeedsCount: getFeedSources().filter(f => f.active).length,
    timestamp: new Date().toISOString(),
  });
});
