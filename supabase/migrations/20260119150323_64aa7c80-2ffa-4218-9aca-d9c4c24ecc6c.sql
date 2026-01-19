
-- Make knowledge-documents bucket public for download access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'knowledge-documents';
