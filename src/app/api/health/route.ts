import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Check database connection
  const { count: marketplaceCount, error: marketplaceError } = await supabase
    .from("marketplaces")
    .select("*", { count: "exact", head: true });

  const { count: pluginCount, error: pluginError } = await supabase
    .from("plugins")
    .select("*", { count: "exact", head: true });

  const healthy = !marketplaceError && !pluginError;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: healthy,
        marketplaces: marketplaceCount ?? 0,
        plugins: pluginCount ?? 0,
      },
      errors: [marketplaceError?.message, pluginError?.message].filter(Boolean),
    },
    { status: healthy ? 200 : 503 }
  );
}
