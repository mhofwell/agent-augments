import Link from "next/link";
import { Github } from "lucide-react";

const navigation = {
  browse: [
    { name: "Frameworks", href: "/frameworks" },
    { name: "Skills", href: "/skills" },
    { name: "Components", href: "/components" },
  ],
  resources: [
    { name: "Submit Augment", href: "#", external: false },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/50 bg-black relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/augs-logo-dark.svg"
                alt="augs.dev"
                className="h-8"
              />
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Discover frameworks, skills, and tools for AI coding assistants.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>

          {/* Browse column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Browse</h3>
            <ul className="space-y-3">
              {navigation.browse.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Standards column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Standards</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://agentskills.io/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Agent Skills
                </a>
              </li>
              <li>
                <a
                  href="https://modelcontextprotocol.io/docs/getting-started/intro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Model Context Protocol
                </a>
              </li>
              <li>
                <a
                  href="https://agents.md/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  AGENTS.md
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} augs.dev. Open source directory for AI agent augments.
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <span>Next.js</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span>Railway</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
