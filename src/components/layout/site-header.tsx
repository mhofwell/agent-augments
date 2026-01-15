"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight">
          augs
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
