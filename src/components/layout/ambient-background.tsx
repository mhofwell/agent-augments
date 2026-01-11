"use client";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top-left cyan gradient */}
      <div
        className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.15 195 / 40%) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Bottom-right violet gradient */}
      <div
        className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.2 280 / 40%) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Center subtle gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, oklch(0.5 0.1 240 / 30%) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}
