"use client";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "today", label: "Матчи сегодня" },
  { id: "intrigue", label: "С интригой" },
  { id: "decided", label: "Почти решено" },
  { id: "thirds", label: "Гонка третьих" },
  { id: "all", label: "Все группы" },
];

export function GroupStageNav({ groups, sections = SECTIONS }: { groups: string[]; sections?: { id: string; label: string }[] }) {
  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="sticky top-[68px] z-40 -mx-4 mb-5 px-4 sm:-mx-6 sm:px-6">
      <div className="glass flex items-center gap-1.5 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <Chip key={s.id} onClick={() => go(s.id)}>
            {s.label}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-black/10 dark:bg-white/15" />
        {groups.map((g) => (
          <Chip key={g} onClick={() => go(`group-${g}`)} square>
            {g}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  children,
  onClick,
  square,
}: {
  children: React.ReactNode;
  onClick: () => void;
  square?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer whitespace-nowrap rounded-full text-[12.5px] font-semibold text-ink-soft transition-[color,background-color,transform] hover:bg-green/10 hover:text-green-deep active:scale-95",
        square ? "grid size-7 place-items-center px-0 font-bold" : "px-3 py-1.5"
      )}
    >
      {children}
    </button>
  );
}
