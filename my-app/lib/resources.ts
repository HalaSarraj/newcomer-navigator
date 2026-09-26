import data from "@/data/resources.json";

export const CATEGORIES = [
  "first-week",
  "daily-life",
  "transport",
  "social",
  "health",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Resource = {
  id: string;
  name: string;
  category: Category;
  description: string;
  address: string;
  hours: string;
  link: string;
  good_to_know: string;
  last_verified: string;
};

// "snowflake" when the answer came from Snowflake, "fallback" when it came from
// the bundled resources.json. The frontend shows the offline-mode note on "fallback".
export type Source = "snowflake" | "fallback";

export type ResourcesResponse = {
  resources: Resource[];
  source: Source;
};

const resources = data as Resource[];

export function isCategory(value: string | null): value is Category {
  return CATEGORIES.includes(value as Category);
}

export function getAllFromFile(): Resource[] {
  return resources;
}

export function getByCategoryFromFile(category: Category): Resource[] {
  return resources.filter((r) => r.category === category);
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "can", "do", "does", "for", "from", "get", "how",
  "i", "in", "is", "it", "me", "my", "need", "of", "on", "or", "the", "to",
  "want", "what", "where", "which", "who", "with", "you",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Crude keyword fallback for when Snowflake is unavailable. Scores each resource
// by how many query words appear in its fields, weighting the name highest.
// Returns nothing rather than a weak match.
export function keywordSearchFromFile(query: string, limit = 3): Resource[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const fields: [keyof Resource, number][] = [
    ["name", 3],
    ["category", 2],
    ["description", 1],
    ["good_to_know", 1],
  ];

  return resources
    .map((r) => {
      let score = 0;
      for (const [field, weight] of fields) {
        const words = new Set(tokenize(r[field]));
        for (const term of terms) {
          if (words.has(term)) score += weight;
        }
      }
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}
