"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function onSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={isSigningOut}
      className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
    >
      {isSigningOut ? "Выходим..." : "Выйти"}
    </button>
  );
}
