import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { FrameworkDetail } from "@/components/framework/framework-detail";

interface FrameworkPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FrameworkPage({ params }: FrameworkPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: framework, error } = await supabase
    .from("frameworks")
    .select(`
      *,
      skills:framework_skills(id, name, slug, description, file_path),
      mcps:framework_mcps(id, name, slug, description),
      subagents:framework_subagents(id, name, slug, description, file_path)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !framework) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-lime-500/5 via-transparent to-transparent pointer-events-none" />

      <SiteHeader />

      <main className="max-w-5xl mx-auto px-6 relative z-10">
        <FrameworkDetail framework={framework} />
      </main>

      <SiteFooter />
    </div>
  );
}
