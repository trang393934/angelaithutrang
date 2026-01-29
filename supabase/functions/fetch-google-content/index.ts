import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Force HTTP/1.1 to avoid intermittent HTTP/2 stream/protocol errors when fetching Google export URLs
const httpClient = Deno.createHttpClient({ http2: false });

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing Google URL:', url);

    let exportUrl = '';
    let contentType = '';
    let sourceType = '';

    // Detect Google Docs URL
    if (url.includes('docs.google.com/document')) {
      const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Invalid Google Docs URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const docId = match[1];
      exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      contentType = 'text/plain';
      sourceType = 'google_docs';
      console.log('Detected Google Docs, export URL:', exportUrl);
    }
    // Detect Google Sheets URL
    else if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Invalid Google Sheets URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const sheetId = match[1];
      exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      contentType = 'text/csv';
      sourceType = 'google_sheets';
      console.log('Detected Google Sheets, export URL:', exportUrl);
    }
    else {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported URL. Please use Google Docs or Google Sheets URL.',
          hint: 'URL should contain docs.google.com/document or docs.google.com/spreadsheets'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch content from Google with retry logic
    console.log('Fetching content from Google...');
    
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': contentType,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
            },
            client: httpClient,
          });
          return response;
        } catch (error) {
          console.error(`Fetch attempt ${i + 1} failed:`, error);
          if (i === retries - 1) throw error;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw new Error('All fetch attempts failed');
    };

    const response = await fetchWithRetry(exportUrl);

    if (!response.ok) {
      console.error('Google fetch failed:', response.status, response.statusText);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Không thể truy cập file. Vui lòng kiểm tra file đã được chia sẻ công khai.',
            hint: 'Mở file trong Google Drive → Nhấn "Chia sẻ" → Chọn "Bất kỳ ai có liên kết"'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Không tìm thấy file. Vui lòng kiểm tra URL.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Failed to fetch content: ${response.statusText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = await response.text();
    console.log('Content fetched successfully, length:', content.length);

    // Format content for better readability
    let formattedContent = content;
    
    if (sourceType === 'google_sheets') {
      // Convert CSV to readable format
      formattedContent = formatCSVContent(content);
    }

    return new Response(
      JSON.stringify({ 
        content: formattedContent,
        rawContent: content,
        sourceType,
        contentType,
        contentLength: content.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Format CSV content for AI readability
function formatCSVContent(csvText: string): string {
  const lines = csvText.split('\n');
  if (lines.length === 0) return csvText;

  // Parse CSV properly (handle quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).filter(line => line.trim()).map(parseCSVLine);

  // Format as readable text
  let formatted = `📊 BẢNG DỮ LIỆU (${rows.length} dòng)\n`;
  formatted += `${'─'.repeat(50)}\n`;
  formatted += `Các cột: ${headers.join(' | ')}\n`;
  formatted += `${'─'.repeat(50)}\n\n`;

  rows.forEach((row, index) => {
    formatted += `--- Dòng ${index + 1} ---\n`;
    headers.forEach((header, i) => {
      const value = row[i] || '';
      if (value) {
        formatted += `${header}: ${value}\n`;
      }
    });
    formatted += '\n';
  });

  return formatted;
}
