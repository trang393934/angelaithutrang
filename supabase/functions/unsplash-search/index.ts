import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  width: number;
  height: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    
    if (!UNSPLASH_ACCESS_KEY) {
      console.error('Missing UNSPLASH_ACCESS_KEY');
      return new Response(
        JSON.stringify({ error: 'Unsplash API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, page = 1, perPage = 12 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Unsplash for: ${query}, page: ${page}`);

    const searchUrl = new URL('https://api.unsplash.com/search/photos');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('page', String(page));
    searchUrl.searchParams.set('per_page', String(perPage));
    searchUrl.searchParams.set('orientation', 'landscape');

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unsplash API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search Unsplash', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Transform to simpler format
    const photos = data.results.map((photo: UnsplashPhoto) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbUrl: photo.urls.small,
      alt: photo.alt_description || photo.description || 'Unsplash image',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    }));

    console.log(`Found ${photos.length} photos for query: ${query}`);

    return new Response(
      JSON.stringify({
        photos,
        totalPages: data.total_pages,
        total: data.total,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in unsplash-search:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
