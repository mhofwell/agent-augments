"use client";

import { useState } from "react";
import { LivingCommandHome, SearchConversationHome, InstallCinemaHome } from "@/components/home";

type Concept = "install-cinema" | "living-command" | "search-conversation";

export default function PreviewPage() {
  const [concept, setConcept] = useState<Concept>("install-cinema");

  return (
    <div className="relative">
      {/* Floating switcher */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-700 backdrop-blur-sm shadow-xl">
        <button
          onClick={() => setConcept("install-cinema")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            concept === "install-cinema"
              ? "bg-cyan-500 text-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          Install Cinema
        </button>
        <button
          onClick={() => setConcept("living-command")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            concept === "living-command"
              ? "bg-cyan-500 text-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          Living Command
        </button>
        <button
          onClick={() => setConcept("search-conversation")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            concept === "search-conversation"
              ? "bg-cyan-500 text-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          Search Conversation
        </button>
      </div>

      {/* Render selected concept */}
      {concept === "install-cinema" ? (
        <InstallCinemaHome />
      ) : concept === "living-command" ? (
        <LivingCommandHome />
      ) : (
        <SearchConversationHome />
      )}
    </div>
  );
}
