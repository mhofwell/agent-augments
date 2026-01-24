"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  activeClass: string;
  hoverClass: string;
  matchSubpaths?: boolean;
};

const navItems: NavItem[] = [
  { href: "/frameworks", label: "Frameworks", activeClass: "text-lime-400", hoverClass: "hover:text-lime-400", matchSubpaths: true },
  { href: "/skills", label: "Skills", activeClass: "text-cyan-400", hoverClass: "hover:text-cyan-400" },
  { href: "/components", label: "Components", activeClass: "text-violet-400", hoverClass: "hover:text-violet-400" },
];

export function SiteHeader(): React.ReactNode {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.matchSubpaths) {
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }
    return pathname === item.href;
  }

  return (
    <header className="border-b border-zinc-800 bg-black relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <img src="/augs-logo-dark.svg" alt="augs.dev" className="h-12" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors",
                  isActive(item) ? item.activeClass : item.hoverClass
                )}
              >
                {item.label}
              </Link>
            ))}
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Submit
            </a>
          </nav>
        </div>

        <a
          href="https://github.com"
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
