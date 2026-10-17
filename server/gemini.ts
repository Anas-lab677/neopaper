import { GoogleGenAI, Type } from '@google/genai';
import { Article, Topic } from '../shared/types.ts';

// In-memory cache for processed article briefs to save latency and token usage
const briefCache = new Map<string, { briefSummary: string; takeaways: string[]; topic: Topic }>();

let aiClient: GoogleGenAI | null = null;
let rateLimitCooldownUntil = 0;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GroundedBriefResult {
  briefSummary: string;
  takeaways: string[];
  topic: Topic;
  isAiGrounded: boolean;
}

export interface StoryToGround {
  id: string;
  headline: string;
  publisher: string;
  excerpt: string;
  fallbackTopic: Topic;
}

/**
 * Batches multiple story briefs into a single structured Gemini call.
 * This ensures the entire daily edition consumes only 1 API request,
 * avoiding the 5 requests/minute Free Tier rate limit.
 */
export async function batchGenerateGroundedBriefs(
  stories: StoryToGround[]
): Promise<Map<string, GroundedBriefResult>> {
  const results = new Map<string, GroundedBriefResult>();
  const toProcess: StoryToGround[] = [];

  // Check cache first
  for (const story of stories) {
    const cacheKey = `${story.headline}|${story.publisher}`;
    if (briefCache.has(cacheKey)) {
      const cached = briefCache.get(cacheKey)!;
      results.set(story.id, {
        briefSummary: cached.briefSummary,
        takeaways: cached.takeaways,
        topic: cached.topic,
        isAiGrounded: true,
      });
    } else {
      toProcess.push(story);
    }
  }

  if (toProcess.length === 0) {
    return results;
  }

  // Check rate limit cooldown or missing client
  const now = Date.now();
  const ai = getAiClient();
  if (!ai || now < rateLimitCooldownUntil) {
    for (const story of toProcess) {
      results.set(story.id, buildFallbackBrief(story.excerpt, story.headline, story.fallbackTopic));
    }
    return results;
  }

  try {
    const formattedStories = toProcess
      .map(
        (s, idx) =>
          `--- STORY ${idx + 1} (ID: ${s.id}) ---
Publisher: ${s.publisher}
Headline: ${s.headline}
Source Excerpt:
${s.excerpt.slice(0, 1000)}`
      )
      .join('\n\n');

    const prompt = `You are a calm, objective news editor for Daybreak, an editorial morning newspaper.
For each of the following verified news stories, write a concise 2-3 sentence grounded brief and extract exactly 2 factual key takeaways.
CRITICAL GROUNDING RULE: Use ONLY facts explicitly present in each story's source excerpt. Never extrapolate or add external claims.

${formattedStories}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  brief: { type: Type.STRING },
                  takeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  primaryCategory: { type: Type.STRING },
                },
                required: ['id', 'brief', 'takeaways', 'primaryCategory'],
              },
            },
          },
          required: ['stories'],
        },
        systemInstruction:
          'You are an editorial assistant writing grounded briefs for a broadsheet newspaper. Ground every claim strictly in the text provided.',
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      const validTopics: Topic[] = [
        'Technology',
        'Science',
        'Climate',
        'Business',
        'World',
        'Culture',
        'Sports',
      ];

      if (Array.isArray(parsed.stories)) {
        for (const item of parsed.stories) {
          const original = toProcess.find(s => s.id === item.id);
          const fallbackTopic = original ? original.fallbackTopic : 'World';
          const matchedTopic: Topic = validTopics.includes(item.primaryCategory)
            ? item.primaryCategory
            : fallbackTopic;

          const res: GroundedBriefResult = {
            briefSummary: item.brief || original?.excerpt || '',
            takeaways:
              Array.isArray(item.takeaways) && item.takeaways.length > 0
                ? item.takeaways.slice(0, 2)
                : [original?.excerpt || ''],
            topic: matchedTopic,
            isAiGrounded: true,
          };

          results.set(item.id, res);

          if (original) {
            briefCache.set(`${original.headline}|${original.publisher}`, {
              briefSummary: res.briefSummary,
              takeaways: res.takeaways,
              topic: res.topic,
            });
          }
        }
      }
    }
  } catch (err: any) {
    // Check if error is 429 quota exhausted
    if (err?.message?.includes('429') || err?.status === 429) {
      rateLimitCooldownUntil = Date.now() + 30000; // 30-second cooldown
    }
  }

  // For any story that wasn't processed or if AI failed, supply fallback
  for (const story of toProcess) {
    if (!results.has(story.id)) {
      results.set(story.id, buildFallbackBrief(story.excerpt, story.headline, story.fallbackTopic));
    }
  }

  return results;
}

export async function generateGroundedBrief(
  headline: string,
  publisher: string,
  excerpt: string,
  fallbackTopic: Topic
): Promise<GroundedBriefResult> {
  const cacheKey = `${headline}|${publisher}`;
  if (briefCache.has(cacheKey)) {
    const cached = briefCache.get(cacheKey)!;
    return {
      briefSummary: cached.briefSummary,
      takeaways: cached.takeaways,
      topic: cached.topic,
      isAiGrounded: true,
    };
  }

  const map = await batchGenerateGroundedBriefs([
    {
      id: 'single',
      headline,
      publisher,
      excerpt,
      fallbackTopic,
    },
  ]);

  return map.get('single') || buildFallbackBrief(excerpt, headline, fallbackTopic);
}

function buildFallbackBrief(excerpt: string, headline: string, topic: Topic): GroundedBriefResult {
  const cleanExcerpt = excerpt || headline;
  const sentences = cleanExcerpt
    .split(/\.\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const takeaways =
    sentences.length >= 2
      ? [
          sentences[0] + (sentences[0].endsWith('.') ? '' : '.'),
          sentences[1] + (sentences[1].endsWith('.') ? '' : '.'),
        ]
      : [cleanExcerpt];

  return {
    briefSummary: cleanExcerpt,
    takeaways,
    topic,
    isAiGrounded: false,
  };
}
