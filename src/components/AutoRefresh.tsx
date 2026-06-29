"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the page LIVE without a manual reload: re-fetches the server components
 * on an interval (default 60s, matching ISR `revalidate`). Client state — like an
 * open "кто угадал" sheet — is preserved across the soft refresh, so scores tick
 * over inside an already-open card. Skips hidden tabs to avoid pointless work.
 */
export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
