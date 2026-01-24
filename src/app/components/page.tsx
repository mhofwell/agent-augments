import { Suspense } from "react";
import { ComponentContent } from "@/components/component-libraries";

export const metadata = {
  title: "Component Libraries - Agent Augments",
  description: "Component libraries with official MCP servers for AI-powered development",
};

function ComponentLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-zinc-500">Loading...</div>
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <ComponentContent />
    </Suspense>
  );
}
