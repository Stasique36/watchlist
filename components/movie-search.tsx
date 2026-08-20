"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useState } from "react";

import type { SearchResult } from "@/lib/tmdb";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w200";
const DEBOUNCE_MS = 350;

type AddStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "added" }
  | { state: "exists" }
  | { state: "error"; message: string };

function resultKey(result: SearchResult) {
  return `${result.mediaType}-${result.id}`;
}

export function MovieSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addStatuses, setAddStatuses] = useState<Record<string, AddStatus>>(
    {},
  );

  async function handleAdd(result: SearchResult) {
    const key = resultKey(result);
    setAddStatuses((prev) => ({ ...prev, [key]: { state: "loading" } }));

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: result.id,
          mediaType: result.mediaType,
          title: result.title,
          posterPath: result.posterPath,
        }),
      });

      if (response.status === 201) {
        setAddStatuses((prev) => ({ ...prev, [key]: { state: "added" } }));
        router.refresh();
        return;
      }

      if (response.status === 409) {
        setAddStatuses((prev) => ({ ...prev, [key]: { state: "exists" } }));
        return;
      }

      setAddStatuses((prev) => ({
        ...prev,
        [key]: { state: "error", message: "Не удалось добавить" },
      }));
    } catch {
      setAddStatuses((prev) => ({
        ...prev,
        [key]: { state: "error", message: "Не удалось добавить" },
      }));
    }
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    setResults([]);
    setError(null);
    setLoading(value.trim().length > 0);
  }

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = (await response.json()) as SearchResult[];
        setResults(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError("Не удалось выполнить поиск");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-1">
        <label
          htmlFor="tmdb-search-input"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Поиск в TMDB
        </label>

        <input
          id="tmdb-search-input"
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Название фильма или сериала"
          className="w-full rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Поиск...</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && !error && results.length > 0 && (
        <ul className="flex w-full flex-col gap-3">
          {results.map((result) => {
            const status = addStatuses[resultKey(result)] ?? {
              state: "idle",
            };

            return (
              <li
                key={resultKey(result)}
                className="flex items-center gap-4 rounded-2xl border border-black/[.08] bg-white p-3 dark:border-white/[.145] dark:bg-zinc-900"
              >
                {result.posterPath ? (
                  <Image
                    src={`${POSTER_BASE_URL}${result.posterPath}`}
                    alt={result.title}
                    width={56}
                    height={80}
                    className="h-20 w-14 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-center text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                    Нет постера
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-1 text-left">
                  <span className="text-sm font-medium text-black dark:text-zinc-50">
                    {result.title}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {result.mediaType === "movie" ? "Фильм" : "Сериал"}
                    {result.year ? ` · ${result.year}` : ""}
                  </span>
                  {status.state === "error" && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {status.message}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(result)}
                  disabled={
                    status.state === "loading" ||
                    status.state === "added" ||
                    status.state === "exists"
                  }
                  className="flex-shrink-0 rounded-full border border-black/[.08] bg-zinc-50 px-3 py-1.5 text-xs font-medium text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-800 dark:text-zinc-50"
                >
                  {status.state === "loading" && "Добавление..."}
                  {status.state === "added" && "Добавлено"}
                  {status.state === "exists" && "Уже в списке"}
                  {(status.state === "idle" || status.state === "error") &&
                    "Добавить"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
