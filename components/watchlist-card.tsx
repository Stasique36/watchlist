"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w200";

interface WatchlistCardItem {
  id: string;
  title: string;
  mediaType: "movie" | "tv";
  posterPath: string | null;
  watched: boolean;
}

export function WatchlistCard({ item }: { item: WatchlistCardItem }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleWatched() {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched: !item.watched }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      router.refresh();
    } catch {
      setError("Не удалось обновить статус");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlist/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      router.refresh();
    } catch {
      setError("Не удалось удалить запись");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900 sm:w-64">
      {item.posterPath ? (
        <Image
          src={`${POSTER_BASE_URL}${item.posterPath}`}
          alt={item.title}
          width={200}
          height={300}
          className="h-72 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-72 w-full items-center justify-center rounded-lg bg-zinc-100 text-center text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          Нет постера
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-black dark:text-zinc-50">
          {item.title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {item.mediaType === "movie" ? "Фильм" : "Сериал"}
          {item.watched ? " · Просмотрено" : ""}
        </p>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleToggleWatched}
          disabled={isUpdating || isDeleting}
          className="flex-1 rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          {item.watched ? "Не просмотрено" : "Просмотрено"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isUpdating || isDeleting}
          className="flex-1 rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
