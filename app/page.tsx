import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  const activeFilter =
    status === "unwatched" || status === "watched" ? status : "all";

  const filters = [
    { key: "all", label: "Все", href: "/" },
    { key: "unwatched", label: "Не просмотрено", href: "/?status=unwatched" },
    { key: "watched", label: "Просмотрено", href: "/?status=watched" },
  ] as const;

  const emptyStateText = {
    all: "Ваш список пока пуст",
    unwatched: "Нет непросмотренных фильмов и сериалов",
    watched: "Нет просмотренных фильмов и сериалов",
  }[activeFilter];

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

        <nav aria-label="Фильтр списка" className="flex gap-2">
          {filters.map((filter) => {
            const isActive = filter.key === activeFilter;

            return (
              <Link
                key={filter.key}
                href={filter.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-zinc-50 dark:text-black"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {items.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            {emptyStateText}
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
