

## Fix: Chat Demo Widget showing {} instead of AI response

### Root Cause

The `angel-chat` edge function returns a **Server-Sent Events (SSE) stream** for demo mode (`stream: true`). But the `ChatDemoWidget` calls the function using `supabase.functions.invoke()`, which does NOT handle SSE streams -- it tries to read the entire response body as JSON or text.

The result: `response.data` becomes a `ReadableStream` object, which when passed to `JSON.stringify()` in the fallback branch produces `{}`. This is why the chat shows empty curly braces.

### Solution (2 files)

**1. Edge Function: `supabase/functions/angel-chat/index.ts`**

Change the demo mode to NOT use streaming. Instead of `stream: true`, use `stream: false` so the AI gateway returns a regular JSON response. Then return that JSON to the client with `Content-Type: application/json`.

Changes at lines 940-964:
- Set `stream: false` in the AI gateway request body
- Return `response.json()` as a regular JSON response (not a forwarded stream)
- Change response Content-Type from `text/event-stream` to `application/json`
- Also fix the greeting path in demo mode (lines 909-922) to return JSON instead of SSE

**2. Frontend: `src/components/ChatDemoWidget.tsx`**

Simplify the response parsing logic since the edge function will now return a standard JSON response:
- Remove the SSE stream parsing code (lines 90-105) since it's no longer needed
- Keep the `response.data.choices` path as the primary parser
- Keep the fallback welcome message for safety

### Technical Details

**Edge function demo mode (before):**
```
// Streams SSE -- supabase.functions.invoke cannot parse this
stream: true
return new Response(response.body, { "Content-Type": "text/event-stream" })
```

**Edge function demo mode (after):**
```
// Returns normal JSON -- supabase.functions.invoke parses correctly
stream: false
const data = await response.json();
return new Response(JSON.stringify(data), { "Content-Type": "application/json" })
```

**Widget parsing (before):**
```
if (typeof response.data === "string") { /* SSE parse */ }
else if (response.data.choices) { /* JSON parse */ }
else { aiResponse = JSON.stringify(response.data); } // <-- produces "{}"
```

**Widget parsing (after):**
```
if (response.data?.choices?.[0]?.message?.content) {
  aiResponse = response.data.choices[0].message.content;
}
```

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/angel-chat/index.ts` | Demo mode: disable streaming, return JSON response. Fix both greeting and AI response paths. |
| `src/components/ChatDemoWidget.tsx` | Simplify response parsing to handle standard JSON only. |

### No database changes needed

This is a response format fix only -- no migrations or schema changes required.

