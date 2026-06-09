import Image from "next/image";
import { flagUrl } from "@/lib/utils";

export function Flag({ code, name, w = 22 }: { code: string; name?: string; w?: number }) {
  const h = Math.round((w * 3) / 4);
  return (
    <Image
      src={flagUrl(code, 80)}
      alt={name ?? ""}
      width={w}
      height={h}
      className="rounded-[3px] object-cover ring-1 ring-black/10"
      style={{ width: w, height: h }}
      unoptimized
    />
  );
}
