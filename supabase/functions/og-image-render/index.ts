import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_ORIGIN = "https://angel.fun.rich";
const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/Js11exSIIMYg8g78z1hnsAsNHi42/social-images/social-1769757256964-image.jpg";
const SITE_NAME = "Angel AI – FUN Ecosystem";

function html(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}"/>
  <link rel="canonical" href="${esc(meta.url)}"/>

  <meta property="og:type" content="${meta.type}"/>
  <meta property="og:title" content="${esc(meta.title)}"/>
  <meta property="og:description" content="${esc(meta.description)}"/>
  <meta property="og:image" content="${esc(meta.image)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${esc(meta.url)}"/>
  <meta property="og:site_name" content="${SITE_NAME}"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(meta.title)}"/>
  <meta name="twitter:description" content="${esc(meta.description)}"/>
  <meta name="twitter:image" content="${esc(meta.image)}"/>

  <meta http-equiv="refresh" content="0;url=${esc(meta.url)}"/>
</head>
<body>
  <p>Redirecting to <a href="${esc(meta.url)}">${esc(meta.title)}</a></p>
</body>
</html>`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  try {
    // Pattern: /{username}/post/{slug}
    const postMatch = path.match(/^\/([a-z0-9_]+)\/post\/([a-z0-9_]+)$/i);
    if (postMatch) {
      const [, username, slug] = postMatch;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, handle")
        .ilike("handle", username)
        .maybeSingle();

      if (!profile) {
        return notFound();
      }

      const { data: post } = await supabase
        .from("community_posts")
        .select("content, image_urls, image_url, slug, created_at")
        .eq("user_id", profile.user_id)
        .eq("slug", slug)
        .maybeSingle();

      if (!post) {
        return notFound();
      }

      const displayName = profile.display_name || username;
      const description = (post.content || "").substring(0, 155);
      const image =
        post.image_urls?.[0] ||
        post.image_url ||
        profile.avatar_url ||
        DEFAULT_OG_IMAGE;
      const canonicalUrl = `${SITE_ORIGIN}/${username}/post/${post.slug}`;

      return htmlResponse(
        html({
          title: `${displayName} - Bài viết | FUN Ecosystem`,
          description,
          image,
          url: canonicalUrl,
          type: "article",
        })
      );
    }

    // Pattern: /{username} (profile)
    const profileMatch = path.match(/^\/([a-z0-9_]+)$/i);
    if (profileMatch) {
      const [, username] = profileMatch;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, handle, bio")
        .ilike("handle", username)
        .maybeSingle();

      if (!profile) {
        return notFound();
      }

      const displayName = profile.display_name || username;
      const description =
        profile.bio || `${displayName} trên FUN Ecosystem`;
      const image = profile.avatar_url || DEFAULT_OG_IMAGE;
      const canonicalUrl = `${SITE_ORIGIN}/${profile.handle}`;

      return htmlResponse(
        html({
          title: `${displayName} | FUN Profile`,
          description,
          image,
          url: canonicalUrl,
          type: "profile",
        })
      );
    }

    // Fallback: homepage
    return htmlResponse(
      html({
        title: "Angel AI – Ánh Sáng Thông Minh Từ Cha Vũ Trụ",
        description:
          "Angel AI - The Intelligent Light of Father Universe. Kênh dẫn Ánh Sáng Trí Tuệ.",
        image: DEFAULT_OG_IMAGE,
        url: SITE_ORIGIN,
        type: "website",
      })
    );
  } catch (err) {
    console.error("og-image-render error:", err);
    return notFound();
  }
});

function htmlResponse(body: string) {
  return new Response(body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function notFound() {
  return htmlResponse(
    html({
      title: SITE_NAME,
      description: "Trang không tồn tại",
      image: DEFAULT_OG_IMAGE,
      url: SITE_ORIGIN,
      type: "website",
    })
  );
}
