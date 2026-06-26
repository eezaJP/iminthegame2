import { SiteFooter } from "@/components/SiteFooter";
import { Target, Trophy, GitFork, Coins, Scale, ListChecks, HelpCircle } from "lucide-react";

export const metadata = { title: "Правила · I'm in the game" };

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
          <Icon className="size-4.5" strokeWidth={2.3} />
        </span>
        <h2 className="font-display text-[18px] font-extrabold leading-tight sm:text-[20px]">{title}</h2>
      </div>
      <div className="mt-3.5 text-[13.5px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function Pts({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-green/12 px-1.5 py-0.5 font-mono text-[12px] font-bold text-green-deep">
      {children}
    </span>
  );
}

function PointRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 py-2 last:border-0 dark:border-white/10">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <Pts>{value}</Pts>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="mt-3">
      <div className="glass px-5 py-5 sm:px-7 sm:py-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-deep">Как мы играем</div>
        <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Правила игры</h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-snug text-ink-soft">
          Все прогнозы зафиксированы до старта турнира. Очки начисляются автоматически по ходу матчей —
          за точность счёта, исходы, состав групп и сетку плей-офф.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card icon={Target} title="Групповой этап">
          <p className="mb-3">За каждый из 72 матчей группового этапа:</p>
          <PointRow label="Угаданный исход (П1 / Х / П2)" value="2" />
          <PointRow label="Точный счёт" value="5" />
          <p className="mt-4 mb-3 font-semibold text-ink">За итоговые места в группе:</p>
          <PointRow label="Угаданный победитель группы (1-е место)" value="4" />
          <PointRow label="Обе вышедшие команды (1-е + 2-е, без порядка)" value="6" />
          <PointRow label="Угаданная 3-я команда, прошедшая дальше" value="+4" />
        </Card>

        <Card icon={GitFork} title="Плей-офф · за матч">
          <p className="mb-3">
            Очки за <span className="font-semibold text-ink">исход / точный счёт</span> на каждой стадии:
          </p>
          <PointRow label="1/16 финала" value="3 / 8" />
          <PointRow label="1/8 финала" value="5 / 12" />
          <PointRow label="1/4 финала" value="8 / 18" />
          <PointRow label="1/2 финала" value="15 / 35" />
          <PointRow label="Матч за 3-е место" value="12 / 28" />
          <PointRow label="Финал" value="25 / 55" />
        </Card>

        <Card icon={Trophy} title="Бонус за состав стадии">
          <p className="mb-3">
            Дополнительно — за каждую правильно названную команду, дошедшую до стадии (отдельно от очков за матч):
          </p>
          <PointRow label="Команда в 1/8 финала" value="+2" />
          <PointRow label="Команда в 1/4 финала" value="+3" />
          <PointRow label="Команда в 1/2 финала" value="+5" />
          <PointRow label="Команда в финале" value="+8" />
          <p className="mt-3 text-[12.5px] text-muted">За выход в 1/16 финала бонус не начисляется.</p>
        </Card>

        <Card icon={Coins} title="Финальные ставки">
          <p className="mb-3">Сделаны до старта турнира и зафиксированы:</p>
          <PointRow label="Чемпион" value="55" />
          <PointRow label="Финалист (2-е место)" value="15" />
          <PointRow label="3-е место" value="8" />
        </Card>

        <Card icon={GitFork} title="Сетка плей-офф">
          <ul className="space-y-2.5">
            <li className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-green" />Вся сетка пишется «вслепую» до первого матча и больше не меняется.</li>
            <li className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-green" />Если ваша команда не дошла до стадии — за этот матч 0 очков.</li>
            <li className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-green" />Пенальти не учитываются: счёт фиксируется по концу дополнительного времени, победитель — тот, кто прошёл дальше.</li>
          </ul>
        </Card>

        <Card icon={Scale} title="При равенстве очков">
          <p className="mb-3">Места делятся по порядку:</p>
          <ol className="space-y-2">
            <li className="flex gap-2.5"><span className="font-mono text-[12px] font-bold text-green-deep">1.</span>больше угаданных точных счётов;</li>
            <li className="flex gap-2.5"><span className="font-mono text-[12px] font-bold text-green-deep">2.</span>больше очков за финальные ставки;</li>
            <li className="flex gap-2.5"><span className="font-mono text-[12px] font-bold text-green-deep">3.</span>больше очков за плей-офф;</li>
            <li className="flex gap-2.5"><span className="font-mono text-[12px] font-bold text-green-deep">4.</span>иначе участники делят одно место.</li>
          </ol>
        </Card>
      </div>

      {/* FAQ */}
      <div id="faq" className="mt-6 scroll-mt-24">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/70 text-sky ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <HelpCircle className="size-4.5" strokeWidth={2.3} />
          </span>
          <h2 className="font-display text-[20px] font-extrabold leading-tight sm:text-[24px]">Вопросы и ответы</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { q: "Можно ли менять прогнозы по ходу турнира?", a: "Нет. Все прогнозы зафиксированы до старта и не редактируются — в этом весь смысл лиги." },
            { q: "Как часто обновляются очки?", a: "Результаты подтягиваются автоматически по ходу матчей, рейтинг пересчитывается в течение минуты." },
            { q: "Что с пенальти в плей-офф?", a: "Не учитываются. Берётся счёт по концу дополнительного времени, а победителем считается команда, прошедшая дальше." },
            { q: "Что если моя команда вылетела раньше?", a: "За матчи стадий, до которых она не дошла, начисляется 0 очков — сетка остаётся как была написана." },
          ].map((f) => (
            <div key={f.q} className="glass p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <ListChecks className="mt-0.5 size-4 shrink-0 text-green-deep" strokeWidth={2.3} />
                <div>
                  <div className="text-[14px] font-bold leading-snug">{f.q}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
