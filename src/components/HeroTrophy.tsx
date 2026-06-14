import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official FIFA World Cup 2026 logo (checkerboard background removed →
 * transparent PNG via scripts/convert-trophy.mjs, at public/wc2026-logo.png).
 * Idle animation: a light glint sweeps across the logo silhouette every ~7s
 * (clipped by mask-image); no floating/wobble.
 */
export function HeroTrophy({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div
        className="absolute inset-0 blur-3xl"
        style={{ background: "radial-gradient(circle at 55% 42%, rgba(224,152,15,0.28), transparent 60%)" }}
      />
      <Image
        src="/wc2026-logo.png"
        alt="Кубок мира FIFA 2026"
        width={735}
        height={1417}
        priority
        className="relative size-full object-contain drop-shadow-[0_18px_40px_rgba(12,26,20,0.18)]"
      />
      <div className="trophy-glint" />
    </div>
  );
}
