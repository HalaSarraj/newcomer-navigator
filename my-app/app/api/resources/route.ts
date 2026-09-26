import type { NextRequest } from "next/server";
import {
  CATEGORIES,
  getAllFromFile,
  getByCategoryFromFile,
  isCategory,
  type ResourcesResponse,
} from "@/lib/resources";

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

  const body: ResourcesResponse = {
    resources: category ? getByCategoryFromFile(category) : getAllFromFile(),
    source: "fallback",
  };
  return Response.json(body);
}
