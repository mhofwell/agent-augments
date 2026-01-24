"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  size = 100,
  duration = 8,
  delay = 0,
  colorFrom = "#ffffff",
  colorTo = "#ffffff",
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      <div
        className="absolute inset-[-100%] animate-[border-beam_var(--duration)_linear_infinite]"
        style={{
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
          "--size": `${size}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          background: `conic-gradient(from 0deg, transparent 0 340deg, var(--color-from) 360deg)`,
          animationDelay: `var(--delay)`,
        } as React.CSSProperties}
      />
      {/* Mask to only show the border */}
      <div className="absolute inset-[1px] rounded-[inherit] bg-zinc-900" />
    </div>
  );
}
