import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { watchlistItem } from "@/db/schema/watchlist";
import { auth } from "@/lib/auth";

const UNIQUE_VIOLATION = "23505";

function getPgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  if ("cause" in error) {
    return getPgErrorCode(error.cause);
  }

  return undefined;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(watchlistItem)
    .where(eq(watchlistItem.userId, session.user.id))
    .orderBy(desc(watchlistItem.createdAt));

  return NextResponse.json(items);
}

interface CreateWatchlistItemBody {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
}

function parseBody(body: unknown): CreateWatchlistItemBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { tmdbId, mediaType, title, posterPath } = body as Record<
    string,
    unknown
  >;

  if (typeof tmdbId !== "number" || !Number.isInteger(tmdbId)) {
    return null;
  }

  if (mediaType !== "movie" && mediaType !== "tv") {
    return null;
  }

  if (typeof title !== "string" || title.length === 0) {
    return null;
  }

  if (posterPath !== null && typeof posterPath !== "string") {
    return null;
  }

  return { tmdbId, mediaType, title, posterPath };
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseBody(json);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const [item] = await db
      .insert(watchlistItem)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        tmdbId: body.tmdbId,
        mediaType: body.mediaType,
        title: body.title,
        posterPath: body.posterPath,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (getPgErrorCode(error) === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Item already in watchlist" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 },
    );
  }
}
