import { Router } from 'express';
import { buildDailyEdition, pdfCache } from './editionBuilder.ts';
import { addFeedSource, fetchAllActiveFeeds, getFeedSources, searchNews, toggleFeedSource } from './feeds.ts';
import { generateNewspaperPdf } from './pdf.ts';
import { interpretSearchQuery } from './gemini.ts';
import { dbStore } from './store.ts';
import {
  isSupabaseConfigured,
  dbGetProfile,
  dbGetSavedStories,
  dbGetEditions,
} from './supabase.ts';

export const apiRouter = Router();

// In-memory rate limiting map (IP -> count)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 150, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Global API rate limiting middleware
apiRouter.use((req, res, next) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 200, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
});

// Health check endpoint for Cloud Run and orchestrators
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: '1.0.0',
  });
});

import { getVerifiedUserId } from './auth.ts';

// Helper to extract verified user ID or return 401 if a provided token is invalid
async function requireAuthOrGuest(req: any, res: any): Promise<string | null> {
  const auth = await getVerifiedUserId(req);
  if (req.headers.authorization && !auth.isAuthenticated) {
    res.status(401).json({ error: 'Invalid or expired Firebase ID token', details: auth.error });
    return null;
  }
  return auth.userId;
}

// --- SEARCH & INTERPRETATION ROUTES ---

apiRouter.post('/search/interpret', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const interpretation = await interpretSearchQuery(query);
    res.json({ interpretation });
  } catch (err: any) {
    console.error('Error interpreting query:', err);
    res.status(500).json({ error: err.message || 'Interpretation failed' });
  }
});

apiRouter.post('/search', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query, interpretation } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const userId = await requireAuthOrGuest(req, res);
    if (!userId) return;

    // Learn from the search if user is logged in
    if (userId !== 'guest') {
      dbStore.recordSearchSignal(userId, query);
    }

    // Use or build query interpretation
    const interp = interpretation || (await interpretSearchQuery(query));
    const articles = await searchNews(query, interp);

    res.json({
      query,
      interpretation: interp,
      articles,
      totalFound: articles.length,
      searchTimeMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// --- TRENDING REAL NEWS ROUTE ---

apiRouter.get('/trending', async (req, res) => {
  try {
    const { articles, publisherStatus } = await fetchAllActiveFeeds();
    res.json({
      articles: articles.slice(0, 50),
      total: articles.length,
      publisherStatus,
    });
  } catch (err: any) {
    console.error('Trending fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch trending stories' });
  }
});

// --- FEED MANAGEMENT ROUTES ---

apiRouter.get('/feeds', (req, res) => {
  const feeds = getFeedSources();
  res.json({
    feeds,
    total: feeds.length,
    activeCount: feeds.filter(f => f.active).length,
  });
});

apiRouter.post('/feeds/toggle', async (req, res) => {
  const auth = await getVerifiedUserId(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required to manage publisher feeds' });
  }
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

apiRouter.post('/feeds/add', async (req, res) => {
  const auth = await getVerifiedUserId(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required to add publisher feed' });
  }
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

apiRouter.get('/profile', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  let profile = dbStore.getProfile(userId);
  if (isSupabaseConfigured()) {
    const remote = await dbGetProfile(userId);
    if (remote) {
      profile = remote;
      dbStore.updateProfile(userId, remote);
    }
  }
  res.json({ profile });
});

apiRouter.put('/profile', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const updates = req.body;
  const profile = dbStore.updateProfile(userId, updates);
  res.json({ success: true, profile });
});

apiRouter.post('/profile/follow-interest', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const { interest } = req.body;
  if (!interest || typeof interest !== 'string') {
    return res.status(400).json({ error: 'Interest string is required' });
  }
  const profile = dbStore.followInterest(userId, interest);
  res.json({ success: true, profile });
});

apiRouter.post('/profile/unfollow-interest', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const { interest } = req.body;
  if (!interest || typeof interest !== 'string') {
    return res.status(400).json({ error: 'Interest string is required' });
  }
  const profile = dbStore.unfollowInterest(userId, interest);
  res.json({ success: true, profile });
});

apiRouter.post('/profile/reset-learning', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const profile = dbStore.resetLearnedPreferences(userId);
  res.json({ success: true, profile });
});

// --- EDITION ROUTES ---

apiRouter.get('/editions/today', async (req, res) => {
  try {
    const userId = await requireAuthOrGuest(req, res);
    if (!userId) return;

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
    const userId = await requireAuthOrGuest(req, res);
    if (!userId) return;

    const profile = req.body.profile || dbStore.getProfile(userId);
    const isRegeneration = Boolean(req.body.isRegeneration);
    const edition = await buildDailyEdition(profile, { isRegeneration });
    res.json({ success: true, edition });
  } catch (err: any) {
    console.error('Error generating edition:', err);
    res.status(500).json({ error: err.message || 'Failed to generate edition' });
  }
});

apiRouter.get('/editions/archive', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const archive = dbStore.getEditionArchive(userId);
  res.json({ archive });
});

apiRouter.get('/editions/:id', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const edition = dbStore.getEdition(req.params.id);
  if (!edition) {
    return res.status(404).json({ error: 'Edition snapshot not found' });
  }

  // Strict ownership verification: private editions can only be accessed by their owner
  if (edition.userId && edition.userId !== 'guest' && edition.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this edition snapshot' });
  }

  res.json({ edition });
});

// --- PDF DOWNLOAD & PREVIEW ROUTE ---

apiRouter.get('/editions/:id/pdf', async (req, res) => {
  try {
    const rawId = req.params.id;
    const userId = await requireAuthOrGuest(req, res);
    if (!userId) return;

    const profile = dbStore.getProfile(userId);
    let edition = dbStore.getEdition(rawId);

    // If ID is 'today' or 'current', fetch today's edition
    if (!edition && (rawId === 'today' || rawId === 'current')) {
      edition = dbStore.getTodayEdition(profile.id);
      if (!edition) {
        edition = await buildDailyEdition(profile);
      }
    }

    // If ID is formatted as date YYYY-MM-DD
    if (!edition && /^\d{4}-\d{2}-\d{2}$/.test(rawId)) {
      edition = dbStore.getTodayEdition(profile.id, rawId);
    }

    // Check remote Supabase editions if configured
    if (!edition && isSupabaseConfigured()) {
      try {
        const remoteEditions = await dbGetEditions(userId);
        edition = remoteEditions.find(e => e.id === rawId || e.editionDate === rawId) || null;
        if (edition) {
          dbStore.saveEdition(edition);
        }
      } catch (dbErr) {
        console.warn('[PDF Endpoint] Supabase lookup error:', dbErr);
      }
    }

    // Fallback: If still not found, resolve or create today's edition
    if (!edition) {
      edition = dbStore.getTodayEdition(profile.id) || await buildDailyEdition(profile);
    }

    if (!edition) {
      return res.status(404).json({ error: 'Edition could not be resolved' });
    }

    // Strict ownership verification: private editions can only be downloaded by their owner
    if (edition.userId && edition.userId !== 'guest' && edition.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to download this edition PDF' });
    }

    let pdfBuffer = pdfCache.get(edition.id);
    if (!pdfBuffer || pdfBuffer.length < 2000) {
      const readerName = profile.name || 'Reader';
      pdfBuffer = generateNewspaperPdf(edition, readerName);
      pdfCache.set(edition.id, pdfBuffer);
    }

    const filename = `daybreak-${edition.editionDate}-rev${edition.revision || 1}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('[PDF Endpoint] Error generating/streaming PDF:', err);
    return res.status(500).json({ error: 'Failed to generate PDF broadsheet' });
  }
});

// --- SAVED & INTERACTIONS ROUTES ---

apiRouter.get('/saved', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  let saved = dbStore.getSavedArticles(userId);
  if (saved.length === 0 && isSupabaseConfigured()) {
    const remote = await dbGetSavedStories(userId);
    if (remote.length > 0) {
      saved = remote;
    }
  }
  res.json({ saved });
});

apiRouter.post('/saved/:id/toggle', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const { item } = req.body;
  if (!item) {
    return res.status(400).json({ error: 'Edition item is required' });
  }
  const result = dbStore.toggleSavedArticle(userId, item);
  res.json({ success: true, isSaved: result.isSaved });
});

apiRouter.post('/interactions', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const { articleId, topic, action } = req.body;
  if (!articleId || !topic || !action) {
    return res.status(400).json({ error: 'articleId, topic, and action are required' });
  }
  if (userId !== 'guest') {
    dbStore.recordInteraction(userId, articleId, topic, action);
  }
  res.json({ success: true });
});

apiRouter.post('/reflections', async (req, res) => {
  const userId = await requireAuthOrGuest(req, res);
  if (!userId) return;

  const { editionId, note } = req.body;
  if (!editionId || typeof note !== 'string') {
    return res.status(400).json({ error: 'editionId and note are required' });
  }
  const ok = dbStore.saveReflection(userId, editionId, note);
  res.json({ success: ok });
});
