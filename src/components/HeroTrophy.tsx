import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official FIFA World Cup 2026 logo (white background removed → transparent PNG
 * at public/wc2026-logo.png). Used as the hero's right-side visual.
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
        width={261}
        height={550}
        priority
        className="relative size-full object-contain float-slow drop-shadow-[0_18px_40px_rgba(12,26,20,0.18)]"
      />
    </div>
  );
}
