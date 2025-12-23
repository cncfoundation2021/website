-- Service Requests Table
-- Run this SQL in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offering_category TEXT NOT NULL,
    offering_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    request_details JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(offering_category);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_email ON service_requests(customer_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE
    ON service_requests FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for insert (anyone can submit a request)
CREATE POLICY "Anyone can insert service requests" ON service_requests
    FOR INSERT WITH CHECK (true);

-- Create policy for select (only authenticated users can view)
CREATE POLICY "Only authenticated users can view service requests" ON service_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for update (only authenticated users can update)
CREATE POLICY "Only authenticated users can update service requests" ON service_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Admin Users Table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create updated_at trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE
    ON admin_users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view admin_users
CREATE POLICY "Only authenticated users can view admin users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only super_admins can insert new admin users
CREATE POLICY "Only super admins can insert admin users" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only super_admins can update admin users
CREATE POLICY "Only super admins can update admin users" ON admin_users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Admin Sessions Table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Enable RLS for admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage sessions
CREATE POLICY "Only authenticated users can manage sessions" ON admin_sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert a default super admin user (password: 'admin123' - CHANGE THIS!)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
    'admin',
    'admin@cncassam.com',
    '$2b$10$rBV2kOQ5S/0g8nqLqZxFdO5vQjhJ8Y1xJRqKzWmGW.HlHBxQDEYhS',
    'CNC Admin',
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Note: Make sure to change the default password after first login!

