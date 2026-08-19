import { type NextRequest, NextResponse } from "next/server";

import { searchMulti } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchMulti(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Failed to search TMDB" },
      { status: 502 },
    );
  }
}
