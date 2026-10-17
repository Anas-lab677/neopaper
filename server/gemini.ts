import { GoogleGenAI, Type } from '@google/genai';
import { Article, QueryInterpretation, Topic } from '../shared/types.ts';

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
 * Strictly grounds summaries in the provided excerpts.
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
Source Excerpt: ${s.excerpt.slice(0, 1000)}`
      )
      .join('\n\n');

    const prompt = `You are an editorial broadsheet editor for Daybreak, a calm and finite daily morning newspaper.
For each of the verified news stories below, write:
1) A concise 2-sentence grounded brief.
2) Exactly 2-3 factual key takeaways.
3) Primary category among: World, Business, Technology, Science, Climate & Environment, Arts & Culture, Sports, Good News.

CRITICAL ANTI-HALLUCINATION RULE:
Use ONLY facts explicitly mentioned in the source excerpt. If details are sparse, keep the brief minimal and truthful. Do not extrapolate, invent sources, or speculate.

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
        'Climate & Environment',
        'Business',
        'World',
        'Arts & Culture',
        'Sports',
        'Good News',
        'Climate',
        'Culture',
      ];

      for (const item of parsed.stories || []) {
        const matchingStory = toProcess.find(s => s.id === item.id);
        const resolvedTopic = validTopics.includes(item.primaryCategory as Topic)
          ? (item.primaryCategory as Topic)
          : matchingStory?.fallbackTopic || 'World';

        const briefObj = {
          briefSummary: item.brief || matchingStory?.excerpt.slice(0, 200) || '',
          takeaways: item.takeaways && item.takeaways.length > 0 ? item.takeaways : [item.brief],
          topic: resolvedTopic,
          isAiGrounded: true,
        };

        if (matchingStory) {
          const cacheKey = `${matchingStory.headline}|${matchingStory.publisher}`;
          briefCache.set(cacheKey, {
            briefSummary: briefObj.briefSummary,
            takeaways: briefObj.takeaways,
            topic: resolvedTopic,
          });
        }

        results.set(item.id, briefObj);
      }
    }
  } catch (err: any) {
    console.warn('[Gemini] Batch brief generation error:', err?.message || err);
    if (String(err?.message || '').includes('429')) {
      rateLimitCooldownUntil = Date.now() + 60000;
    }
  }

  // Ensure every story has at least a fallback
  for (const story of toProcess) {
    if (!results.has(story.id)) {
      results.set(story.id, buildFallbackBrief(story.excerpt, story.headline, story.fallbackTopic));
    }
  }

  return results;
}

/**
 * Rule-based fallback summary when offline or rate-limited.
 */
function buildFallbackBrief(excerpt: string, headline: string, fallbackTopic: Topic): GroundedBriefResult {
  const cleaned = (excerpt || headline).replace(/\s+/g, ' ').trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
  const briefSummary = sentences.slice(0, 2).join(' ') || cleaned.slice(0, 220);
  const takeaways = sentences.length >= 2 ? sentences.slice(0, 2) : [briefSummary];

  return {
    briefSummary,
    takeaways,
    topic: fallbackTopic,
    isAiGrounded: false,
  };
}

const queryInterpretationCache = new Map<string, { result: QueryInterpretation; timestamp: number }>();

/**
 * Parses user input to interpret topics, entities, geographic locations, and ambiguities.
 */
export async function interpretSearchQuery(rawQuery: string): Promise<QueryInterpretation> {
  const trimmed = (rawQuery || '').trim();
  if (!trimmed) {
    return {
      rawQuery: '',
      parsedTopics: [],
      parsedEntities: [],
      parsedPlaces: [],
      searchClauses: [],
      summary: 'Please enter what news you would like to follow.',
      isAmbiguous: false,
    };
  }

  // Check cache first
  const cacheKey = trimmed.toLowerCase();
  const cached = queryInterpretationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.result;
  }

  // Rule-based quick extraction fallback
  const fallbackInterpretation: QueryInterpretation = {
    rawQuery: trimmed,
    parsedTopics: extractTopicsFromText(trimmed),
    parsedEntities: [],
    parsedPlaces: extractPlacesFromText(trimmed),
    searchClauses: splitIntoSearchClauses(trimmed),
    summary: `Searching for reporting on: ${trimmed}`,
    isAmbiguous: trimmed.split(/\s+/).length <= 1 && trimmed.length < 5,
    clarificationNote: trimmed.length < 5 ? 'Very short search terms may return broad or varied results.' : undefined,
    suggestedQueries: [
      `${trimmed} news`,
      `${trimmed} latest reporting`,
    ],
  };

  const ai = getAiClient();
  if (!ai || Date.now() < rateLimitCooldownUntil) {
    return fallbackInterpretation;
  }

  try {
    const prompt = `Analyze this news search interest request typed by a reader: "${trimmed}"
Understand flexible requests, including multiple topics, places, entities, and common spelling variations.
If the request is ambiguous (e.g. single polysemous word like "Apple", "Mercury", or "Jordan"), flag isAmbiguous: true and explain the interpretation so the user can correct it.
Extract:
1. parsedTopics: broad news categories (e.g. Technology, Sports, Climate & Environment, Business, World).
2. parsedEntities: specific organizations, people, or teams (e.g. "OpenAI", "Pakistan national cricket team").
3. parsedPlaces: countries, cities, or regions (e.g. "Karachi", "Pakistan").
4. searchClauses: 1 to 4 clean query phrases to search real news RSS feeds (e.g. ["AI startups", "Pakistan cricket", "Karachi flooding"]).
5. summary: 1 clear sentence explaining what Daybreak will gather.
6. isAmbiguous: boolean.
7. clarificationNote: brief sentence explaining the interpretation or offering clarification if ambiguous.
8. suggestedQueries: 2-3 refined queries.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawQuery: { type: Type.STRING },
            parsedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            parsedEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
            parsedPlaces: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            isAmbiguous: { type: Type.BOOLEAN },
            clarificationNote: { type: Type.STRING },
            suggestedQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'rawQuery',
            'parsedTopics',
            'parsedEntities',
            'parsedPlaces',
            'searchClauses',
            'summary',
            'isAmbiguous',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const finalResult: QueryInterpretation = {
      rawQuery: trimmed,
      parsedTopics: parsed.parsedTopics || fallbackInterpretation.parsedTopics,
      parsedEntities: parsed.parsedEntities || fallbackInterpretation.parsedEntities,
      parsedPlaces: parsed.parsedPlaces || fallbackInterpretation.parsedPlaces,
      searchClauses: parsed.searchClauses && parsed.searchClauses.length > 0 ? parsed.searchClauses : fallbackInterpretation.searchClauses,
      summary: parsed.summary || fallbackInterpretation.summary,
      isAmbiguous: Boolean(parsed.isAmbiguous),
      clarificationNote: parsed.clarificationNote || undefined,
      suggestedQueries: parsed.suggestedQueries || fallbackInterpretation.suggestedQueries,
    };
    queryInterpretationCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
    return finalResult;
  } catch (err: any) {
    console.warn('[Gemini] Query interpretation error:', err?.message || err);
    queryInterpretationCache.set(cacheKey, { result: fallbackInterpretation, timestamp: Date.now() });
    return fallbackInterpretation;
  }
}

function splitIntoSearchClauses(text: string): string[] {
  const parts = text
    .split(/[,;\n]|\band\b|\bwith\b/i)
    .map(p => p.trim())
    .filter(p => p.length > 2);
  return parts.length > 0 ? parts : [text.trim()];
}

function extractTopicsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  if (/tech|ai|software|startup|app|cyber|robot/.test(lower)) topics.push('Technology');
  if (/cricket|football|soccer|tennis|sport|match|nba|olympic/.test(lower)) topics.push('Sports');
  if (/climate|flood|warming|environment|solar|weather|storm/.test(lower)) topics.push('Climate & Environment');
  if (/business|market|stock|invest|economy|trade|bank/.test(lower)) topics.push('Business');
  if (/space|nasa|science|physics|biology|planet/.test(lower)) topics.push('Science');
  if (/art|culture|film|book|music|museum/.test(lower)) topics.push('Arts & Culture');
  return topics.length > 0 ? topics : ['World'];
}

function extractPlacesFromText(text: string): string[] {
  const places: string[] = [];
  const known = ['Karachi', 'Pakistan', 'London', 'UK', 'New York', 'US', 'India', 'Europe', 'Paris', 'Tokyo'];
  for (const p of known) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(text)) {
      places.push(p);
    }
  }
  return places;
}
