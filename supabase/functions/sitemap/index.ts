import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://angelaithutrang.lovable.app";
const MAX_URLS = 50000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch profiles with handles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("handle, updated_at")
      .not("handle", "is", null)
      .order("updated_at", { ascending: false })
      .limit(MAX_URLS);

    // Fetch published posts with author handles
    const { data: posts } = await supabase
      .from("community_posts")
      .select("slug, updated_at, user_id")
      .order("updated_at", { ascending: false })
      .limit(MAX_URLS);

    // Build a user_id -> handle map from profiles
    const handleMap = new Map<string, string>();
    for (const p of profiles || []) {
      // We need user_id for mapping - fetch it
    }

    // Re-fetch profiles with user_id for mapping
    const { data: profilesFull } = await supabase
      .from("profiles")
      .select("user_id, handle, updated_at")
      .not("handle", "is", null)
      .order("updated_at", { ascending: false })
      .limit(MAX_URLS);

    for (const p of profilesFull || []) {
      if (p.handle) handleMap.set(p.user_id, p.handle);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Profile URLs
    for (const p of profilesFull || []) {
      if (!p.handle) continue;
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      xml += `
  <url>
    <loc>${SITE_URL}/${p.handle}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Post URLs
    for (const post of posts || []) {
      const handle = handleMap.get(post.user_id);
      if (!handle || !post.slug) continue;
      const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : "";
      xml += `
  <url>
    <loc>${SITE_URL}/${handle}/post/${post.slug}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
