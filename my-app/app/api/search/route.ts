import type { NextRequest } from "next/server";
import { keywordSearchFromFile, type ResourcesResponse } from "@/lib/resources";

const MAX_QUERY_LENGTH = 200;

// GET /api/search?q=I+need+a+phone+number → up to 3 best matches, or [] if nothing fits.
// Never log the query: the app promises not to record what people search for.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (q.length === 0) {
    return Response.json({ error: "Missing q" }, { status: 400 });
  }

  const body: ResourcesResponse = {
    resources: keywordSearchFromFile(q.slice(0, MAX_QUERY_LENGTH)),
    source: "fallback",
  };
  return Response.json(body);
}
