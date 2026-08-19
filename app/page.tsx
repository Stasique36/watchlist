import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const items = [
  { title: "Interstellar", type: "Фильм" },
  { title: "The Bear", type: "Сериал" },
  { title: "Dune", type: "Фильм" },
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

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

        <input
          type="text"
          placeholder="Поиск..."
          className="w-full max-w-md rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex w-full flex-col gap-3 rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900 sm:w-64"
            >
              <div>
                <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                  {item.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.type}
                </p>
              </div>
              <button className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]">
                Просмотрено
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
