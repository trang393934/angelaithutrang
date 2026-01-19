-- Create knowledge_folders table
CREATE TABLE public.knowledge_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on knowledge_folders
ALTER TABLE public.knowledge_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for knowledge_folders (admin only)
CREATE POLICY "Admins can view all folders" 
ON public.knowledge_folders 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert folders" 
ON public.knowledge_folders 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update folders" 
ON public.knowledge_folders 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete folders" 
ON public.knowledge_folders 
FOR DELETE 
USING (is_admin());

-- Add folder_id column to knowledge_documents
ALTER TABLE public.knowledge_documents 
ADD COLUMN folder_id UUID REFERENCES public.knowledge_folders(id) ON DELETE SET NULL;

-- Create trigger for updated_at on knowledge_folders
CREATE TRIGGER update_knowledge_folders_updated_at
BEFORE UPDATE ON public.knowledge_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();