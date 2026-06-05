/**
 * Lightweight NLP pipeline utilities for customer feedback analysis.
 */

// Contraction mapping for normalization
const CONTRACTIONS: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "won't": "will not",
  "can't": "can not",
  "cannot": "can not",
  "shouldn't": "should not",
  "wouldn't": "would not",
  "couldn't": "could not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "i'm": "i am",
  "you're": "you are",
  "he's": "he is",
  "she's": "she is",
  "we're": "we are",
  "they're": "they are",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will"
};

const CONTRACTION_REGEXES = Object.entries(CONTRACTIONS).map(([contraction, expansion]) => ({
  regex: new RegExp(`\\b${contraction.replace(/'/g, "'?")}\\b`, "g"),
  expansion
}));

// Stopwords set (Standard English stopwords)
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "by",
  "can", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
  "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
  "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my", "myself",
  "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
  "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
  "until", "up", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
  "why", "with", "you", "your", "yours", "yourself", "yourselves"
]);

// Explicitly preserved sentiment words
const PRESERVED_WORDS = new Set([
  "not", "never", "no", "very", "too", "but", "however", "extremely", "really", "bad", "good"
]);

/**
 * Normalizes/lemmatizes a single token to its base/root form.
 * Handles plurals and common verb forms.
 */
function lemmatizeToken(token: string): string {
  // Specific required mappings:
  if (token === "services") return "service";
  if (token === "employees") return "employee";
  if (token === "delayed") return "delay";
  if (token === "waiting") return "wait";

  // General rules:
  // Plural nouns ending in 'ies' -> 'y' (e.g. ladies -> lady)
  if (token.endsWith("ies")) {
    return token.slice(0, -3) + "y";
  }
  // Plural nouns ending in 'sses', 'shes', 'ches', 'xes' -> remove 'es'
  if (token.endsWith("sses") || token.endsWith("shes") || token.endsWith("ches") || token.endsWith("xes")) {
    return token.slice(0, -2);
  }
  // Standard plural ending in 's' -> remove 's' (excluding double-s, -us, -as, -is words)
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("as") && !token.endsWith("is")) {
    return token.slice(0, -1);
  }
  // Verb ending in 'ing'
  if (token.endsWith("ing")) {
    const base = token.slice(0, -3);
    if (base.length > 2) {
      // Simplify doubled consonants (e.g. running -> runn -> run)
      if (base[base.length - 1] === base[base.length - 2]) {
        return base.slice(0, -1);
      }
      return base;
    }
  }
  // Verb ending in 'ed'
  if (token.endsWith("ed")) {
    const base = token.slice(0, -2);
    if (base.length > 2) {
      // Simplify doubled consonants (e.g. tapped -> tap)
      if (base[base.length - 1] === base[base.length - 2]) {
        return base.slice(0, -1);
      }
      return base;
    }
  }

  return token;
}

/**
 * Preprocesses a string of text:
 * - lowercase conversion
 * - punctuation removal
 * - contraction normalization (don't -> do not)
 * - tokenization
 * - stopword removal (preserving sentiment modifiers)
 * - normalization/lemmatization
 */
export function preprocessText(text: string): { cleanedText: string; tokens: string[] } {
  if (!text) {
    return { cleanedText: "", tokens: [] };
  }

  // 1. Lowercase conversion
  let processed = text.toLowerCase();

  // 2. Contraction normalization
  for (let i = 0; i < CONTRACTION_REGEXES.length; i++) {
    const item = CONTRACTION_REGEXES[i];
    processed = processed.replace(item.regex, item.expansion);
  }

  // 3. Punctuation removal
  processed = processed.replace(/[^\w\s]/g, " ");

  // 4. Tokenization
  const rawTokens = processed.split(/\s+/).filter(t => t.length > 0);

  // 5. Stopword removal (preserving PRESERVED_WORDS)
  const filteredTokens = rawTokens.filter(t => !STOPWORDS.has(t) || PRESERVED_WORDS.has(t));

  // 6. Normalization/lemmatization
  const tokens = filteredTokens.map(lemmatizeToken);

  return {
    cleanedText: tokens.join(" "),
    tokens
  };
}

const ASPECT_KEYWORDS: Record<string, Set<string>> = {
  food: new Set([
    "food", "taste", "dish", "meal", "flavour", "flavor", "cook", "cold", "delicious", "fresh", "tasty",
    "yummy", "menu", "dessert", "appetizer", "salad", "pizza", "burger", "pasta", "drink", "beverage",
    "sweet", "spicy", "salt", "sauce", "soup", "entree", "chicken", "meat", "fish", "ingredient",
    "portion", "serving", "hot", "tasteless", "overcooked", "undercooked", "appetizing"
  ]),
  "staff behaviour": new Set([
    "staff", "behaviour", "behavior", "employee", "waiter", "waitress", "manager", "server", "rude",
    "polite", "friendly", "helpful", "attitude", "unfriendly", "arrogant", "nice", "kind", "welcome",
    "host", "hostess", "cashier", "professional", "unprofessional", "greet", "greeting", "courteous", "respect"
  ]),
  "service quality": new Set([
    "service", "quality", "experience", "order", "delivery", "incorrect", "wrong", "mistake", "forgot",
    "quick", "fast", "excellent", "poor", "perfect", "serve", "attention", "care", "accuracy", "accurate",
    "mess", "disaster", "expectation"
  ]),
  pricing: new Set([
    "pricing", "price", "cost", "expensive", "bill", "billing", "receipt", "cheap", "value", "money",
    "worth", "charge", "overcharged", "card", "cash", "payment", "affordable", "tax", "fee", "pricey",
    "costly", "amount", "discount"
  ]),
  cleanliness: new Set([
    "cleanliness", "clean", "dirty", "hygiene", "messy", "dust", "washroom", "toilet", "table", "floor",
    "smell", "neat", "spotless", "garbage", "trash", "sticky", "stain", "fly", "flies", "bug", "insect",
    "unhygienic", "bathroom"
  ]),
  "waiting time": new Set([
    "wait", "waiting", "time", "slow", "delay", "delaying", "minute", "hour", "late", "queue", "line",
    "duration", "speed", "long", "forever"
  ])
};

const ASPECT_KEYWORDS_ENTRIES = Object.entries(ASPECT_KEYWORDS);

/**
 * Detects the business aspect of a comment using weighted keyword matching.
 * Supported aspects:
 * - food
 * - staff behaviour
 * - service quality
 * - pricing
 * - cleanliness
 * - waiting time
 * - general (fallback)
 */
export function classifyAspect(tokens: string[], rawText: string): string {
  const text = rawText.toLowerCase();

  const scores: Record<string, number> = {
    food: 0,
    "staff behaviour": 0,
    "service quality": 0,
    pricing: 0,
    cleanliness: 0,
    "waiting time": 0
  };

  // 1. Score based on token matches (lemmatized tokens)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    for (let j = 0; j < ASPECT_KEYWORDS_ENTRIES.length; j++) {
      const [aspect, keywordsSet] = ASPECT_KEYWORDS_ENTRIES[j];
      if (keywordsSet.has(token)) {
        scores[aspect] += 1;
      }
    }
  }

  // 2. Extra weight for explicit multi-word phrase matching on raw text
  if (text.includes("waiting time") || text.includes("long wait") || text.includes("took a long time") || text.includes("took so long")) {
    scores["waiting time"] += 2.5;
  }
  if (text.includes("customer service") || text.includes("staff member") || text.includes("front desk") || text.includes("customer care")) {
    scores["staff behaviour"] += 2.5;
  }
  if (text.includes("service quality") || text.includes("poor service") || text.includes("bad service") || text.includes("slow service")) {
    scores["service quality"] += 2.5;
  }
  if (text.includes("food quality") || text.includes("cold food") || text.includes("bad food")) {
    scores["food"] += 2.5;
  }
  if (text.includes("not clean") || text.includes("very dirty") || text.includes("dirty table") || text.includes("dirty floor") || text.includes("dirty washroom")) {
    scores["cleanliness"] += 2.5;
  }
  if (text.includes("value for money") || text.includes("too expensive") || text.includes("price was") || text.includes("charged me")) {
    scores["pricing"] += 2.5;
  }

  // Find aspect with the highest score
  let bestAspect = "general";
  let maxScore = 0;

  for (const [aspect, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestAspect = aspect;
    }
  }

  return bestAspect;
}

const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive indicators
  good: 2,
  excellent: 4,
  amazing: 4,
  amaz: 4,
  nice: 2,
  delicious: 3,
  clean: 2,
  fast: 2,
  friendly: 3,
  helpful: 3,
  great: 3,
  satisfied: 3,
  satisfy: 3,
  tasty: 3,
  fresh: 2,
  love: 3,
  like: 2,
  awesome: 4,
  fantastic: 4,
  pleasant: 2,
  perfect: 4,
  polite: 2,
  happy: 3,
  recommend: 3,
  enjoy: 2,
  welcoming: 2,
  professional: 2,

  // Negative indicators
  bad: -2,
  rude: -3,
  dirty: -2,
  terrible: -4,
  slow: -2,
  expensive: -2,
  poor: -3,
  disappointing: -3,
  disappoint: -3,
  horrible: -4,
  waiting: -1,
  wait: -1,
  delay: -2,
  tasteless: -2,
  cold: -1,
  unfriendly: -3,
  arrogant: -3,
  unprofessional: -3,
  wrong: -2,
  mistake: -2,
  forgot: -2,
  mess: -2,
  disaster: -4,
  late: -2,
  disappointed: -3,
  hate: -3,
  worst: -4,
  pricey: -2,
  costly: -2,
  unhygienic: -3
};

const NEGATIONS = new Set(["not", "never", "no"]);
const INTENSIFIERS = new Set(["very", "extremely", "really", "too", "highly", "super"]);

/**
 * Local high-fidelity lexicon sentiment classifier.
 */
export function analyzeSentimentLocal(tokens: string[]): {
  sentiment: "Favourable" | "Unfavourable" | "Neutral";
  confidence: number;
  score: number;
  reason: string;
} {
  let totalScore = 0;
  let matchesCount = 0;
  let positiveMatches: string[] = [];
  let negativeMatches: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token in SENTIMENT_LEXICON) {
      let polarity = SENTIMENT_LEXICON[token];
      let multiplier = 1.0;
      let isNegated = false;

      // Check preceding tokens for intensifiers and negations
      // Preceding 1 token
      if (i > 0) {
        const prev1 = tokens[i - 1];
        if (INTENSIFIERS.has(prev1)) {
          multiplier += 0.5;
        } else if (NEGATIONS.has(prev1)) {
          isNegated = true;
        }
      }
      // Preceding 2 tokens (if not already handled)
      if (i > 1 && !isNegated) {
        const prev2 = tokens[i - 2];
        if (INTENSIFIERS.has(prev2)) {
          multiplier += 0.5;
        } else if (NEGATIONS.has(prev2)) {
          isNegated = true;
        }
      }

      if (isNegated) {
        multiplier *= -0.8; // negation flips and slightly dampens intensity
      }

      const termScore = polarity * multiplier;
      totalScore += termScore;
      matchesCount++;

      if (termScore > 0) {
        positiveMatches.push(`${token} (val: ${termScore.toFixed(1)})`);
      } else if (termScore < 0) {
        negativeMatches.push(`${token} (val: ${termScore.toFixed(1)})`);
      }
    }
  }

  let sentiment: "Favourable" | "Unfavourable" | "Neutral" = "Neutral";
  let confidence = 0.5;
  let reason = "";

  const posCount = positiveMatches.length;
  const negCount = negativeMatches.length;

  if (posCount > negCount) {
    sentiment = "Favourable";
    confidence = Number(Math.min(0.95, 0.70 + 0.05 * totalScore).toFixed(2));
    reason = `Local NLP Scorer classified as Favourable (net score: ${totalScore.toFixed(1)}). Positive indicators: ${positiveMatches.join(", ")}.`;
  } else if (negCount > posCount) {
    sentiment = "Unfavourable";
    confidence = Number(Math.min(0.95, 0.70 + 0.05 * Math.abs(totalScore)).toFixed(2));
    reason = `Local NLP Scorer classified as Unfavourable (net score: ${totalScore.toFixed(1)}). Negative indicators: ${negativeMatches.join(", ")}.`;
  } else {
    sentiment = "Neutral";
    confidence = 0.5;
    if (posCount > 0) {
      reason = `Local NLP Scorer classified as Neutral due to mixed indicators. Positive: ${positiveMatches.join(", ")}; Negative: ${negativeMatches.join(", ")}.`;
    } else {
      reason = "Local NLP Scorer classified as Neutral due to absence of polarity indicators.";
    }
  }

  return {
    sentiment,
    confidence,
    score: totalScore,
    reason
  };
}

/**
 * Fallback sentiment classifier using local indicators if HuggingFace API fails.
 */
export function fallbackSentiment(tokens: string[]): {
  sentiment: "Favourable" | "Unfavourable" | "Neutral";
  confidence: number;
  reason: string;
} {
  const localRes = analyzeSentimentLocal(tokens);
  return {
    sentiment: localRes.sentiment,
    confidence: localRes.confidence,
    reason: localRes.reason
  };
}

export interface AspectResult {
  aspect: string;
  sentiment: "Favourable" | "Unfavourable" | "Neutral";
  confidence: number;
}

/**
 * Aspect-Based Sentiment Analysis (ABSA):
 * Splits a comment into clauses and evaluates the aspect and sentiment of each clause.
 */
export function analyzeAspects(rawText: string): AspectResult[] {
  if (!rawText) return [];

  // Split text by punctuation and coordination conjunctions (but, and, yet, although, though, while, whereas)
  const clauses = rawText
    .split(/[.,;!\?]+|\b(?:but|and|yet|although|though|while|whereas)\b/gi)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const results: AspectResult[] = [];

  for (const clause of clauses) {
    const { cleanedText, tokens } = preprocessText(clause);
    if (tokens.length === 0) continue;

    // Detect the specific aspect for this clause
    const aspect = classifyAspect(tokens, clause);

    // Evaluate local negation-aware sentiment for this specific clause
    const sentimentEval = fallbackSentiment(tokens);

    // Avoid duplicate aspect entries: keep the one with higher confidence/matches
    const existing = results.find(r => r.aspect === aspect);
    if (existing) {
      if (sentimentEval.confidence > existing.confidence) {
        existing.sentiment = sentimentEval.sentiment;
        existing.confidence = sentimentEval.confidence;
      }
    } else {
      results.push({
        aspect,
        sentiment: sentimentEval.sentiment,
        confidence: sentimentEval.confidence
      });
    }
  }

  // Fallback: If no clauses yielded results, evaluate the whole comment as one aspect
  if (results.length === 0) {
    const { tokens } = preprocessText(rawText);
    const aspect = classifyAspect(tokens, rawText);
    const sentimentEval = fallbackSentiment(tokens);
    results.push({
      aspect,
      sentiment: sentimentEval.sentiment,
      confidence: sentimentEval.confidence
    });
  }

  return results;
}

/**
 * Identifies the strongest aspect from ABSA results to preserve database compatibility.
 */
export function getMainAspect(aspects: AspectResult[]): string {
  if (!aspects || aspects.length === 0) return "general";

  // Sort by confidence (descending) and prioritize specific aspects over 'general'
  const sorted = [...aspects].sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    if (a.aspect === "general" && b.aspect !== "general") return 1;
    if (a.aspect !== "general" && b.aspect === "general") return -1;
    return 0;
  });

  return sorted[0].aspect;
}
