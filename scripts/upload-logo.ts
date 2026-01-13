import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env vars from .env.local
const envPath = resolve(import.meta.dir, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

// This script uploads the logo to Supabase Storage
// Run with: bun run scripts/upload-logo.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadLogo() {
  const logoPath = resolve(process.argv[2] || "./public/augs-logo.svg");

  console.log(`Reading logo from: ${logoPath}`);
  const logoContent = readFileSync(logoPath);

  console.log("Uploading to Supabase Storage...");
  const { data, error } = await supabase.storage
    .from("assets")
    .upload("logo/augs-dark.svg", logoContent, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) {
    console.error("Upload failed:", error.message);
    process.exit(1);
  }

  console.log("Upload successful:", data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("assets")
    .getPublicUrl("logo/augs-dark.svg");

  console.log("Public URL:", urlData.publicUrl);
}

uploadLogo();
