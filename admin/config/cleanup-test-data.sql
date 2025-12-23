-- Cleanup Test Data from Supabase
-- Run this SQL in your Supabase SQL Editor to remove all test service requests

-- This will DELETE all service requests from the database
-- CAUTION: This cannot be undone!

-- Option 1: Delete ALL service requests (use with caution)
DELETE FROM service_requests;

-- Option 2: Delete only test/old requests (before a certain date)
-- Uncomment and modify the date below if you want to keep recent requests
-- DELETE FROM service_requests WHERE created_at < '2025-10-16';

-- Option 3: Delete by specific IDs (if you know which ones are test data)
-- Uncomment and add your test request IDs
-- DELETE FROM service_requests WHERE id IN (
--     'test-id-1',
--     'test-id-2'
-- );

-- Verify the deletion (should return 0 if all deleted)
SELECT COUNT(*) as remaining_requests FROM service_requests;

