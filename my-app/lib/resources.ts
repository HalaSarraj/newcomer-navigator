import data from "@/data/resources.json";
import { query } from "@/lib/snowflake";

export const CATEGORIES = [
  "first-week",
  "daily-life",
  "transport",
  "social",
  "health-insurance",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Resource = {
  id: string;
  name: string;
  category: Category;
  // Slug such as "taxis-and-cabs"; "" when a row has none.
  subcategory: string;
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

// Older copies of resources.json have no subcategory; default it to "".
const resources: Resource[] = (data as Partial<Resource>[]).map((r) => ({
  ...(r as Resource),
  subcategory: r.subcategory ?? "",
}));

// Subcategory slugs are lower-case words joined by hyphens.
export function isSubcategory(value: string | null): value is string {
  return value !== null && /^[a-z0-9-]{1,60}$/.test(value);
}

export function isCategory(value: string | null): value is Category {
  return CATEGORIES.includes(value as Category);
}

export function getAllFromFile(): Resource[] {
  return resources;
}

export function getByCategoryFromFile(category: Category, subcategory?: string): Resource[] {
  return resources.filter(
    (r) => r.category === category && (!subcategory || r.subcategory === subcategory),
  );
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

// Fields searched and how much a keyword match in each is worth. Shared by the
// Snowflake query and the file fallback so both modes rank the same way.
const SEARCH_FIELDS: [keyof Resource, number][] = [
  ["name", 3],
  ["description", 1],
  ["good_to_know", 1],
  ["subcategory", 1],
];

// Crude keyword fallback for when Snowflake is unavailable. Scores each resource
// by how many query words appear in its fields, weighting the name highest.
// Returns nothing rather than a weak match.
export function keywordSearchFromFile(query: string, limit = 3): Resource[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  return resources
    .map((r) => {
      let score = 0;
      for (const [field, weight] of SEARCH_FIELDS) {
        const words = new Set(tokenize(r[field] ?? ""));
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

// ---- Snowflake-first, file fallback --------------------------------------
// Every public function below tries Snowflake and, on any error or timeout,
// answers from resources.json instead with source "fallback".

const TABLE = "NEWCOMER_NAVIGATOR.PUBLIC.RESOURCES";

// Caps the number of keywords (and so bound parameters) per search.
const MAX_TERMS = 8;

const COLUMNS = `id, name, category, subcategory, description, address, hours,
  link, good_to_know, TO_VARCHAR(last_verified) AS last_verified`;

// Snowflake returns column names in upper case.
type Row = Record<string, unknown>;

function fromRow(row: Row): Resource {
  const get = (key: string) => String(row[key.toUpperCase()] ?? "");
  return {
    id: get("id"),
    name: get("name"),
    category: get("category") as Category,
    subcategory: get("subcategory"),
    description: get("description"),
    address: get("address"),
    hours: get("hours"),
    link: get("link"),
    good_to_know: get("good_to_know"),
    last_verified: get("last_verified"),
  };
}

async function withFallback(
  fromSnowflake: () => Promise<Resource[]>,
  fromFile: () => Resource[],
): Promise<ResourcesResponse> {
  try {
    return { resources: await fromSnowflake(), source: "snowflake" };
  } catch (err) {
    // Log the failure only — never the user's question.
    console.error("Snowflake unavailable, using resources.json:", (err as Error).message);
    return { resources: fromFile(), source: "fallback" };
  }
}

export function getResources(
  category?: Category,
  subcategory?: string,
): Promise<ResourcesResponse> {
  return withFallback(
    async () => {
      const rows = category
        ? await query<Row>(
            `SELECT ${COLUMNS} FROM ${TABLE}
             WHERE category = ? AND (? IS NULL OR subcategory = ?)
             ORDER BY subcategory, name`,
            [category, subcategory ?? null, subcategory ?? null],
          )
        : await query<Row>(`SELECT ${COLUMNS} FROM ${TABLE} ORDER BY category, subcategory, name`);
      return rows.map(fromRow);
    },
    () => (category ? getByCategoryFromFile(category, subcategory) : getAllFromFile()),
  );
}

export function searchResources(question: string): Promise<ResourcesResponse> {
  return withFallback(
    async () => {
      const terms = tokenize(question).slice(0, MAX_TERMS);
      if (terms.length === 0) return [];

      // One score term per keyword and field; every keyword is a bound
      // parameter. tokenize() keeps only [a-z0-9], so no % or _ wildcards
      // can come from the user.
      const scoreSql = terms
        .map(() =>
          SEARCH_FIELDS.map(
            ([field, weight]) => `IFF(${field} ILIKE ?, ${weight}, 0)`,
          ).join(" + "),
        )
        .join(" + ");
      const binds = terms.flatMap((t) => SEARCH_FIELDS.map(() => `%${t}%`));

      const rows = await query<Row>(
        `SELECT * FROM (
           SELECT ${COLUMNS}, ${scoreSql} AS score FROM ${TABLE}
         )
         WHERE score > 0
         ORDER BY score DESC, name
         LIMIT 3`,
        binds,
      );
      return rows.map(fromRow);
    },
    () => keywordSearchFromFile(question),
  );
}
