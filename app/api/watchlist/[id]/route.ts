import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { watchlistItem } from "@/db/schema/watchlist";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PatchWatchlistItemBody {
  watched: boolean;
}

function parsePatchBody(body: unknown): PatchWatchlistItemBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { watched } = body as Record<string, unknown>;

  if (typeof watched !== "boolean") {
    return null;
  }

  return { watched };
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

  const body = parsePatchBody(json);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id } = await params;

  const [item] = await db
    .update(watchlistItem)
    .set({ watched: body.watched })
    .where(
      and(
        eq(watchlistItem.id, id),
        eq(watchlistItem.userId, session.user.id),
      ),
    )
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [item] = await db
    .delete(watchlistItem)
    .where(
      and(
        eq(watchlistItem.id, id),
        eq(watchlistItem.userId, session.user.id),
      ),
    )
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
