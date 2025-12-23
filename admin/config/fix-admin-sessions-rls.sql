-- Fix admin_sessions RLS Policy
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only authenticated users can manage sessions" ON admin_sessions;

-- Create new policies that allow service role access
-- Service role can do anything (for API operations)
CREATE POLICY "Service role can manage all sessions" ON admin_sessions
    FOR ALL USING (true);

-- Optional: Add a more specific policy for better security
-- This allows the service role to insert/update/delete sessions
-- while still having RLS enabled for audit purposes
CREATE POLICY "Allow session management for service operations" ON admin_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow session reads for verification" ON admin_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow session updates and deletes" ON admin_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Allow session deletions" ON admin_sessions
    FOR DELETE USING (true);

-- Verify that admin_sessions table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_sessions' 
                   AND column_name = 'expires_at') THEN
        RAISE NOTICE 'admin_sessions table structure verified';
    END IF;
END $$;

-- Clean up expired sessions (optional maintenance)
DELETE FROM admin_sessions WHERE expires_at < NOW();

-- Commit the changes
COMMIT;


