import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { watchlistItem } from "@/db/schema/watchlist";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { MovieSearch } from "@/components/movie-search";
import { WatchlistCard } from "@/components/watchlist-card";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { status } = await searchParams;

  const conditions = [eq(watchlistItem.userId, session.user.id)];

  if (status === "unwatched") {
    conditions.push(eq(watchlistItem.watched, false));
  } else if (status === "watched") {
    conditions.push(eq(watchlistItem.watched, true));
  }

  const items = await db
    .select()
    .from(watchlistItem)
    .where(and(...conditions))
    .orderBy(desc(watchlistItem.createdAt));

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-16 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Watchlist
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Фильмы и сериалы, которые я хочу посмотреть
          </p>
          <LogoutButton />
        </div>

        <MovieSearch />

        {items.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Ваш список пока пуст
          </p>
        ) : (
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            {items.map((item) => (
              <WatchlistCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
