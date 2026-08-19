"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Неверный email или пароль.");
        return;
      }

      router.push("/");
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-8 py-16 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Вход
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Войдите в свой аккаунт
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-black dark:text-zinc-50"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-black dark:text-zinc-50"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-full border border-black/[.08] bg-white px-5 py-3 text-black outline-none dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full border border-black/[.08] bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/[.85] disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-black underline dark:text-zinc-50"
          >
            Зарегистрироваться
          </Link>
        </p>
      </main>
    </div>
  );
}
