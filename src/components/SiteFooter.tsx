import Link from "next/link";
import Image from "next/image";
import { Send, MessageCircle, Globe } from "lucide-react";

const NAV = [
  { href: "/", label: "Сегодня" },
  { href: "/rating", label: "Рейтинг" },
  { href: "/playoff", label: "Плей-офф" },
  { href: "/groups", label: "Группы" },
  { href: "/rules", label: "Правила" },
];

const USEFUL = [
  { href: "/rules", label: "Как начисляются очки" },
  { href: "/rules#faq", label: "Вопросы и ответы" },
  { href: "/groups", label: "Групповой этап" },
  { href: "/playoff", label: "Сетка плей-офф" },
];

export function SiteFooter() {
  return (
    <footer className="glass mt-10 px-6 py-8 sm:px-8">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {/* brand */}
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0e9f6e] to-[#0a7d55] text-white shadow-sm">
              <Image src="/player-icon.png" alt="" width={22} height={22} className="size-[22px] object-contain" unoptimized />
            </span>
            <span className="font-display text-[15px] font-extrabold leading-tight">I&rsquo;m in the game</span>
          </div>
          <p className="mt-3 max-w-[220px] text-[12.5px] leading-snug text-muted">
            Дружеская лига прогнозов на Чемпионат мира 2026. Играем для удовольствия, болеем за футбол.
          </p>
        </div>

        <nav>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Навигация</div>
          <ul className="mt-3 space-y-2">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] font-medium text-ink-soft transition-colors hover:text-green-deep">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Полезное</div>
          <ul className="mt-3 space-y-2">
            {USEFUL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-[13px] font-medium text-ink-soft transition-colors hover:text-green-deep">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Следите за нами</div>
          <div className="mt-3 flex gap-2">
            {[Send, MessageCircle, Globe].map((Icon, i) => (
              <span
                key={i}
                aria-hidden
                className="grid size-9 place-items-center rounded-xl bg-white/60 text-ink-soft ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10"
              >
                <Icon className="size-4" strokeWidth={2.2} />
              </span>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-snug text-muted">
            Время матчей — московское (МСК). Результаты обновляются автоматически.
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-black/5 pt-5 text-[12px] text-muted dark:border-white/10">
        © 2026 I&rsquo;m in the Game · Чемпионат мира 2026
      </div>
    </footer>
  );
}
