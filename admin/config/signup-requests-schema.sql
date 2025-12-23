-- Admin Signup Requests Schema
-- Run this SQL in your Supabase SQL Editor after running rbac-schema.sql

-- Signup Requests Table - Stores pending user signup requests
CREATE TABLE IF NOT EXISTS admin_signup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    reason TEXT, -- Why they need access
    organization TEXT, -- Their organization/company
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    approved_role TEXT CHECK (approved_role IN ('super_admin', 'admin', 'manager', 'viewer')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for signup requests
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON admin_signup_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON admin_signup_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_username ON admin_signup_requests(username);
CREATE INDEX IF NOT EXISTS idx_signup_requests_requested_at ON admin_signup_requests(requested_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_signup_requests_updated_at BEFORE UPDATE
    ON admin_signup_requests FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE admin_signup_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert signup requests (public access)
CREATE POLICY "Anyone can submit signup requests" ON admin_signup_requests
    FOR INSERT WITH CHECK (true);

-- Policy: Only authenticated admins can view signup requests
CREATE POLICY "Authenticated users can view signup requests" ON admin_signup_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only authenticated admins can update signup requests
CREATE POLICY "Authenticated users can update signup requests" ON admin_signup_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to approve signup request and create user
CREATE OR REPLACE FUNCTION approve_signup_request(
    p_request_id UUID,
    p_approved_by UUID,
    p_role TEXT,
    p_custom_permissions JSONB DEFAULT '[]'::jsonb
) RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID) AS $$
DECLARE
    v_request RECORD;
    v_new_user_id UUID;
BEGIN
    -- Get the signup request
    SELECT * INTO v_request FROM admin_signup_requests WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Signup request not found or already processed', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if username or email already exists
    IF EXISTS (SELECT 1 FROM admin_users WHERE username = v_request.username OR email = v_request.email) THEN
        -- Update request as rejected
        UPDATE admin_signup_requests 
        SET status = 'rejected',
            reviewed_at = NOW(),
            reviewed_by = p_approved_by,
            rejection_reason = 'Username or email already exists'
        WHERE id = p_request_id;
        
        RETURN QUERY SELECT false, 'Username or email already exists', NULL::UUID;
        RETURN;
    END IF;
    
    -- Create the user
    INSERT INTO admin_users (username, email, full_name, password_hash, role, is_active)
    VALUES (v_request.username, v_request.email, v_request.full_name, v_request.password_hash, p_role, true)
    RETURNING id INTO v_new_user_id;
    
    -- Apply custom permissions if provided
    IF jsonb_array_length(p_custom_permissions) > 0 THEN
        INSERT INTO user_permissions (admin_user_id, permission_id, granted)
        SELECT v_new_user_id, (perm->>'permission_id')::UUID, (perm->>'granted')::BOOLEAN
        FROM jsonb_array_elements(p_custom_permissions) AS perm;
    END IF;
    
    -- Update signup request as approved
    UPDATE admin_signup_requests 
    SET status = 'approved',
        approved_role = p_role,
        reviewed_at = NOW(),
        reviewed_by = p_approved_by
    WHERE id = p_request_id;
    
    -- Log the action
    INSERT INTO admin_audit_log (admin_user_id, action, target_user_id, details)
    VALUES (p_approved_by, 'approve_signup', v_new_user_id, 
            jsonb_build_object('username', v_request.username, 'email', v_request.email, 'role', p_role));
    
    RETURN QUERY SELECT true, 'Signup approved and user created successfully', v_new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject signup request
CREATE OR REPLACE FUNCTION reject_signup_request(
    p_request_id UUID,
    p_rejected_by UUID,
    p_rejection_reason TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_request RECORD;
BEGIN
    -- Get the signup request
    SELECT * INTO v_request FROM admin_signup_requests WHERE id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Signup request not found or already processed';
        RETURN;
    END IF;
    
    -- Update signup request as rejected
    UPDATE admin_signup_requests 
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_rejected_by,
        rejection_reason = p_rejection_reason
    WHERE id = p_request_id;
    
    -- Log the action
    INSERT INTO admin_audit_log (admin_user_id, action, details)
    VALUES (p_rejected_by, 'reject_signup', 
            jsonb_build_object('username', v_request.username, 'email', v_request.email, 'reason', p_rejection_reason));
    
    RETURN QUERY SELECT true, 'Signup request rejected';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signup request statistics
CREATE OR REPLACE FUNCTION get_signup_stats()
RETURNS TABLE(
    total_requests BIGINT,
    pending_requests BIGINT,
    approved_requests BIGINT,
    rejected_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests
    FROM admin_signup_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add notification preference to admin_users (optional)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notify_on_signup BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON TABLE admin_signup_requests IS 'Stores pending admin user signup requests for approval';
COMMENT ON FUNCTION approve_signup_request IS 'Approves a signup request and creates the admin user account';
COMMENT ON FUNCTION reject_signup_request IS 'Rejects a signup request with a reason';
COMMENT ON FUNCTION get_signup_stats IS 'Returns statistics about signup requests';

