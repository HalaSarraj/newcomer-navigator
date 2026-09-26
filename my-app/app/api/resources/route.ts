import type { NextRequest } from "next/server";
import { CATEGORIES, getResources, isCategory } from "@/lib/resources";

// GET /api/resources?category=transport  → that category's resources
// GET /api/resources                     → every resource (used by the saved view)
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (category !== null && !isCategory(category)) {
    return Response.json(
      { error: `Unknown category. Use one of: ${CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  return Response.json(await getResources(category ?? undefined));
}
