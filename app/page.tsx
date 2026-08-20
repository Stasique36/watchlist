import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { watchlistItem } from "@/db/schema/watchlist";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { MovieSearch } from "@/components/movie-search";
import { WatchlistCard } from "@/components/watchlist-card";

const PAGE_SIZE = 10;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { status, sort, type, page } = await searchParams;

  const requestedPage =
    typeof page === "string" &&
    /^\d+$/.test(page) &&
    Number.isSafeInteger(Number(page)) &&
    Number(page) >= 1
      ? Number(page)
      : 1;

  const conditions = [eq(watchlistItem.userId, session.user.id)];

  if (status === "unwatched") {
    conditions.push(eq(watchlistItem.watched, false));
  } else if (status === "watched") {
    conditions.push(eq(watchlistItem.watched, true));
  }

  if (type === "movie") {
    conditions.push(eq(watchlistItem.mediaType, "movie"));
  } else if (type === "tv") {
    conditions.push(eq(watchlistItem.mediaType, "tv"));
  }

  const [{ value: totalItems }] = await db
    .select({ value: count() })
    .from(watchlistItem)
    .where(and(...conditions));

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const currentPage = Math.min(requestedPage, totalPages);

  const sortOrder = sort === "oldest" ? asc : desc;

  const items = await db
    .select()
    .from(watchlistItem)
    .where(and(...conditions))
    .orderBy(sortOrder(watchlistItem.createdAt), asc(watchlistItem.id))
    .limit(PAGE_SIZE)
    .offset((currentPage - 1) * PAGE_SIZE);

  const activeFilter =
    status === "unwatched" || status === "watched" ? status : "all";

  const activeSort = sort === "oldest" ? "oldest" : "newest";

  const activeType = type === "movie" || type === "tv" ? type : "all";

  const buildHref = (
    targetStatus: "all" | "unwatched" | "watched",
    targetSort: "newest" | "oldest",
    targetType: "all" | "movie" | "tv",
  ) => {
    const params = new URLSearchParams();

    if (targetStatus !== "all") {
      params.set("status", targetStatus);
    }

    if (targetSort !== "newest") {
      params.set("sort", targetSort);
    }

    if (targetType !== "all") {
      params.set("type", targetType);
    }

    const query = params.toString();

    return query ? `/?${query}` : "/";
  };

  const filters = [
    { key: "all", label: "Все" },
    { key: "unwatched", label: "Не просмотрено" },
    { key: "watched", label: "Просмотрено" },
  ] as const;

  const sorts = [
    { key: "newest", label: "Сначала новые" },
    { key: "oldest", label: "Сначала старые" },
  ] as const;

  const types = [
    { key: "all", label: "Все типы" },
    { key: "movie", label: "Фильмы" },
    { key: "tv", label: "Сериалы" },
  ] as const;

  const emptyStateText = {
    all: {
      all: "Ваш список пока пуст",
      unwatched: "Нет непросмотренных фильмов и сериалов",
      watched: "Нет просмотренных фильмов и сериалов",
    },
    movie: {
      all: "В списке пока нет фильмов",
      unwatched: "Нет непросмотренных фильмов",
      watched: "Нет просмотренных фильмов",
    },
    tv: {
      all: "В списке пока нет сериалов",
      unwatched: "Нет непросмотренных сериалов",
      watched: "Нет просмотренных сериалов",
    },
  }[activeType][activeFilter];

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
                href={buildHref(filter.key, activeSort, activeType)}
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

        <nav aria-label="Тип контента" className="flex gap-2">
          {types.map((typeOption) => {
            const isActive = typeOption.key === activeType;

            return (
              <Link
                key={typeOption.key}
                href={buildHref(activeFilter, activeSort, typeOption.key)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-zinc-50 dark:text-black"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {typeOption.label}
              </Link>
            );
          })}
        </nav>

        <nav aria-label="Сортировка списка" className="flex gap-2">
          {sorts.map((sortOption) => {
            const isActive = sortOption.key === activeSort;

            return (
              <Link
                key={sortOption.key}
                href={buildHref(activeFilter, sortOption.key, activeType)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-zinc-50 dark:text-black"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {sortOption.label}
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
