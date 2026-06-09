"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЯABCDEFGHKMNOPRSTUVWXYZ0123456789";

/**
 * Letter-scramble reveal (siberia.es vibe). Scrambles on mount and re-runs on
 * hover. `speed` = ms per character before it locks in; `flipMs` = how often the
 * still-scrambling glyphs change (higher = calmer). Respects reduced-motion.
 */
function scrambled(text: string) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += text[i] === " " ? " " : GLYPHS[(i * 5) % GLYPHS.length];
  }
  return out;
}

export function ScrambleText({
  text,
  className,
  as: Tag = "span",
  speed = 80,
  flipMs = 65,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  speed?: number;
  flipMs?: number;
  startDelay?: number;
}) {
  const [display, setDisplay] = useState(text);
  const flip = useRef(0);
  const raf = useRef<number | null>(null);

  const run = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // display is initialised to `text`; nothing to animate.
      return;
    }
    const start = performance.now();
    const total = text.length * speed + 600;
    let lastFlip = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const revealed = Math.floor(elapsed / speed);
      if (now - lastFlip >= flipMs) {
        flip.current++;
        lastFlip = now;
      }
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") {
          out += " ";
          continue;
        }
        if (i < revealed) out += ch;
        else out += GLYPHS[(flip.current + i * 5) % GLYPHS.length];
      }
      setDisplay(out);
      if (elapsed < total) raf.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf.current = requestAnimationFrame(tick);
  }, [text, speed, flipMs]);

  useEffect(() => {
    // intentional client-only animation kickoff (RAF-driven); not a render cascade.
    /* eslint-disable react-hooks/set-state-in-effect */
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (startDelay > 0) {
      // hold a scrambled placeholder, then resolve when its turn comes
      setDisplay(scrambled(text));
      timer = setTimeout(run, startDelay);
    } else {
      run();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      if (timer) clearTimeout(timer);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [run, startDelay, text]);

  return (
    <Tag className={cn("inline-block", className)} onMouseEnter={run} aria-label={text}>
      <span aria-hidden>{display}</span>
    </Tag>
  );
}
