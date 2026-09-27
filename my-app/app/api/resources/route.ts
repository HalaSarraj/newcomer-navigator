import type { NextRequest } from "next/server";
import { CATEGORIES, getResources, isCategory, isSubcategory } from "@/lib/resources";

// GET /api/resources?category=transport                         → that category's resources
// GET /api/resources?category=transport&subcategory=ride-apps   → one subcategory
// GET /api/resources                                            → every resource (used by the saved view)
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const subcategory = params.get("subcategory");

  if (category !== null && !isCategory(category)) {
    return Response.json(
      { error: `Unknown category. Use one of: ${CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  if (subcategory !== null && (category === null || !isSubcategory(subcategory))) {
    return Response.json(
      { error: "subcategory needs a category and must be a lower-case slug" },
      { status: 400 },
    );
  }

  return Response.json(await getResources(category ?? undefined, subcategory ?? undefined));
}
