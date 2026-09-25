import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { classificationResultSchema, type ClassificationResult } from "@/lib/validations";

// Server-side only. Never import this file from a client component —
// the API key must never reach the browser bundle.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// Gemini's JSON mode schema for the classification response — this
// constrains the model's output shape server-side, in addition to the
// Zod validation applied after parsing.
const classificationGeminiSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sentiment: { type: SchemaType.STRING, enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
    sentimentScore: { type: SchemaType.NUMBER },
    themes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    featureArea: { type: SchemaType.STRING },
    rationale: { type: SchemaType.STRING },
  },
  required: ["sentiment", "sentimentScore", "themes", "featureArea", "rationale"],
};

/**
 * AI1 — Auto-classification.
 * Sends one feedback item plus the workspace's existing theme names so
 * the model reuses themes instead of inventing near-duplicates. Uses
 * Gemini's JSON mode (responseMimeType + responseSchema) so the model
 * is constrained to valid JSON, then still runs it through Zod — never
 * raw model text — before it touches the database.
 */
export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<ClassificationResult> {
  const system = `You are LOOP's feedback classification engine. You read a single piece of customer feedback and return a JSON object matching the provided schema.

Field guidance:
- sentiment: POSITIVE, NEUTRAL, or NEGATIVE
- sentimentScore: a number between -1 and 1 (negative = bad, positive = good)
- themes: 1-3 short theme names (2-4 words each, Title Case)
- featureArea: a short product/feature area label (2-4 words, Title Case)
- rationale: one sentence explaining the classification

Existing themes in this workspace (reuse one of these by exact name whenever the feedback genuinely fits it, instead of creating a near-duplicate):
${existingThemes.length ? existingThemes.map((t) => `- ${t}`).join("\n") : "(none yet — first item, create sensible new themes)"}

Only invent a new theme name when nothing existing fits.`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: classificationGeminiSchema as any,
      maxOutputTokens: 500,
    },
  });

  const attempt = async (): Promise<ClassificationResult> => {
    const result = await model.generateContent(`Feedback:\n"""${content}"""`);
    const raw = result.response.text();
    const cleaned = stripJsonFences(raw);
    const parsed = JSON.parse(cleaned);
    return classificationResultSchema.parse(parsed);
  };

  try {
    return await attempt();
  } catch (firstError) {
    // Retry once, then fall back to a safe manual-review default rather
    // than throwing and losing the ingested item.
    try {
      return await attempt();
    } catch (secondError) {
      return {
        sentiment: "NEUTRAL",
        sentimentScore: 0,
        themes: ["Needs Manual Review"],
        featureArea: "Unclassified",
        rationale: "Automatic classification failed after one retry; flagged for manual review.",
      };
    }
  }
}

export type GroundedAnswer = {
  answer: string;
  usedFeedbackIds: string[];
};

/**
 * AI3 — Ask LOOP (retrieval-grounded Q&A).
 * Receives feedback items already retrieved by semantic search (see
 * lib/search.ts) and is instructed to answer ONLY from that context —
 * never invent feedback that wasn't provided.
 */
export async function answerGrounded(
  question: string,
  retrieved: Array<{ id: string; content: string; channel: string; sentiment: string | null }>
): Promise<GroundedAnswer> {
  if (retrieved.length === 0) {
    return {
      answer:
        "I couldn't find any feedback related to that question in this workspace yet. Try rephrasing, or add more feedback first.",
      usedFeedbackIds: [],
    };
  }

  const context = retrieved
    .map((f, i) => `[${i + 1}] (id: ${f.id}, channel: ${f.channel}, sentiment: ${f.sentiment ?? "unclassified"}) ${f.content}`)
    .join("\n");

  const system = `You are Ask LOOP, a grounded Q&A assistant over a company's customer feedback. You MUST answer using ONLY the numbered feedback excerpts provided below. Do not invent, assume, or generalize beyond what is written.

Rules:
- If the excerpts answer the question, synthesize a clear, concise answer (2-5 sentences) and reference which excerpt numbers [1], [2], etc. support each claim.
- If the excerpts do NOT contain enough information to answer, say so plainly instead of guessing.
- Never fabricate a statistic, quote, or customer that isn't in the excerpts.

Feedback excerpts:
${context}`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: 700 },
  });

  const result = await model.generateContent(question);
  const answer = result.response.text().trim() || "No answer generated.";

  return { answer, usedFeedbackIds: retrieved.map((f) => f.id) };
}

export type VoCStats = {
  totalItems: number;
  periodLabel: string;
  topThemes: Array<{ name: string; count: number; deltaPct: number | null }>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  sentimentDeltaPct: number | null;
  representativeQuotes: Array<{ content: string; channel: string; sentiment: string | null }>;
};

export type VoCNarrative = {
  summary: string;
  themeHighlights: string;
  recommendedActions: string[];
};

const vocGeminiSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    themeHighlights: { type: SchemaType.STRING },
    recommendedActions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["summary", "themeHighlights", "recommendedActions"],
};

/**
 * AI4 — Voice-of-Customer report narrative.
 * Stats (counts, deltas, quotes) are pre-computed in code from real data
 * (see app/api/reports/route.ts) so figures can never be hallucinated;
 * Gemini only writes the narrative language around fixed numbers.
 */
export async function generateVoCNarrative(stats: VoCStats): Promise<VoCNarrative> {
  const system = `You are writing a Voice-of-Customer report for a product leadership team. You are given exact, pre-computed statistics — you must not alter, invent, or round them differently than given. Your job is ONLY to write the narrative around them, as JSON matching the provided schema:
- summary: 2-3 sentence executive summary of the period
- themeHighlights: 1 short paragraph (3-5 sentences) discussing the top themes and what changed
- recommendedActions: 3 to 5 short, concrete, prioritized recommended actions

Statistics for the period (use these exact numbers, do not invent others):
${JSON.stringify(stats, null, 2)}`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: vocGeminiSchema as any,
      maxOutputTokens: 800,
    },
  });

  try {
    const result = await model.generateContent("Write the report narrative now, as JSON only.");
    const raw = result.response.text();
    const parsed = JSON.parse(stripJsonFences(raw));
    return {
      summary: String(parsed.summary ?? ""),
      themeHighlights: String(parsed.themeHighlights ?? ""),
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions.map(String)
        : [],
    };
  } catch {
    return {
      summary: `In this period LOOP logged ${stats.totalItems} feedback items across ${stats.topThemes.length} major themes.`,
      themeHighlights: "Narrative generation failed to parse; see the raw statistics above for the underlying data.",
      recommendedActions: ["Review the underlying statistics manually for this period."],
    };
  }
}
