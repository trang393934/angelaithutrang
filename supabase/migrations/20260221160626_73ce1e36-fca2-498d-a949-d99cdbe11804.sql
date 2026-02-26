
-- Create coordinator_projects table
CREATE TABLE public.coordinator_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform_type TEXT NOT NULL DEFAULT 'custom',
  value_model TEXT DEFAULT '',
  token_flow_model TEXT DEFAULT '',
  vision_statement TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coordinator_project_versions table
CREATE TABLE public.coordinator_project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.coordinator_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_summary TEXT DEFAULT '',
  snapshot_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coordinator_chat_messages table
CREATE TABLE public.coordinator_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.coordinator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  mode TEXT DEFAULT 'product_spec',
  ai_role TEXT DEFAULT 'product_architect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coordinator_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('coordinator', 'admin')
  )
$$;

-- RLS: coordinator_projects
CREATE POLICY "Coordinators can view own projects"
ON public.coordinator_projects FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Admins can view all projects"
ON public.coordinator_projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coordinators can create projects"
ON public.coordinator_projects FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can update own projects"
ON public.coordinator_projects FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can delete own projects"
ON public.coordinator_projects FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.is_coordinator_or_admin(auth.uid()));

-- RLS: coordinator_project_versions
CREATE POLICY "Users can view versions of own projects"
ON public.coordinator_project_versions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coordinator_projects cp
  WHERE cp.id = project_id AND (cp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Users can create versions for own projects"
ON public.coordinator_project_versions FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.coordinator_projects cp
  WHERE cp.id = project_id AND cp.user_id = auth.uid()
));

-- RLS: coordinator_chat_messages
CREATE POLICY "Users can view messages of own projects"
ON public.coordinator_chat_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coordinator_projects cp
  WHERE cp.id = project_id AND (cp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Users can create messages for own projects"
ON public.coordinator_chat_messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.coordinator_projects cp
  WHERE cp.id = project_id AND cp.user_id = auth.uid()
));

-- Indexes
CREATE INDEX idx_coordinator_projects_user ON public.coordinator_projects(user_id);
CREATE INDEX idx_coordinator_versions_project ON public.coordinator_project_versions(project_id);
CREATE INDEX idx_coordinator_chat_project ON public.coordinator_chat_messages(project_id);
CREATE INDEX idx_coordinator_chat_created ON public.coordinator_chat_messages(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_coordinator_projects_updated_at
BEFORE UPDATE ON public.coordinator_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
