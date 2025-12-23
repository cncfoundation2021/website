-- Add comments column to service_requests table
-- This migration adds a comments field to store multiple comments/notes for each request

-- Add comments column as JSONB to store array of comments
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;

-- Add an index on comments for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_service_requests_comments 
ON service_requests USING GIN (comments);

-- Add a comment to document the column
COMMENT ON COLUMN service_requests.comments IS 'Array of comment objects with content, author, and timestamp';
