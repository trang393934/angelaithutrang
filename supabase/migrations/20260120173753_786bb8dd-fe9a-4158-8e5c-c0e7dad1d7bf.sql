-- 1. Bảng cache câu trả lời phổ biến
CREATE TABLE public.cached_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_keywords TEXT[] NOT NULL,
  question_normalized TEXT NOT NULL,
  response TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Index để tìm kiếm nhanh theo keywords
CREATE INDEX idx_cached_responses_keywords ON public.cached_responses USING GIN(question_keywords);
CREATE INDEX idx_cached_responses_normalized ON public.cached_responses USING btree(question_normalized);

-- RLS cho cached_responses (chỉ admin có thể quản lý)
ALTER TABLE public.cached_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached responses"
ON public.cached_responses
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert cached responses"
ON public.cached_responses
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update cached responses"
ON public.cached_responses
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete cached responses"
ON public.cached_responses
FOR DELETE
USING (public.is_admin());

-- 2. Bảng chunks cho knowledge search tối ưu
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category TEXT,
  chunk_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes cho tìm kiếm nhanh
CREATE INDEX idx_knowledge_chunks_keywords ON public.knowledge_chunks USING GIN(keywords);
CREATE INDEX idx_knowledge_chunks_document ON public.knowledge_chunks USING btree(document_id);
CREATE INDEX idx_knowledge_chunks_category ON public.knowledge_chunks USING btree(category);

-- RLS cho knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge chunks"
ON public.knowledge_chunks
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert knowledge chunks"
ON public.knowledge_chunks
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update knowledge chunks"
ON public.knowledge_chunks
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete knowledge chunks"
ON public.knowledge_chunks
FOR DELETE
USING (public.is_admin());