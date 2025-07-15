-- Workplace Booking Database Schema
-- Execute this in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'Europe/Paris';

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.desks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., "A01", "A02", "B01", "B02"
    description TEXT,
    location VARCHAR(255), -- e.g., "Open Space - Zone A", "Open Space - Zone B"
    is_available BOOLEAN DEFAULT true,
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- For permanent desk assignments
    assignment_note TEXT, -- Optional note about the assignment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    desk_id UUID REFERENCES public.desks(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '18:00:00',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(desk_id, booking_date), -- One booking per desk per day
    CHECK (booking_date >= CURRENT_DATE), -- Can't book in the past
    CHECK (end_time > start_time)
);

-- Insert Zone A desks (50 desks: A01 to A50)
INSERT INTO public.desks (name, description, location) 
SELECT 
    'A' || LPAD(generate_series::text, 2, '0') as name,
    'Desk ' || 'A' || LPAD(generate_series::text, 2, '0') as description,
    'Open Space - Zone A' as location
FROM generate_series(1, 50);

-- Insert Zone B desks (16 desks: B01 to B16)
INSERT INTO public.desks (name, description, location) 
SELECT 
    'B' || LPAD(generate_series::text, 2, '0') as name,
    'Desk ' || 'B' || LPAD(generate_series::text, 2, '0') as description,
    'Open Space - Zone B' as location
FROM generate_series(1, 16);

-- Insert Zone C desks (14 desks: C01 to C14)
INSERT INTO public.desks (name, description, location) 
SELECT 
    'C' || LPAD(generate_series::text, 2, '0') as name,
    'Desk ' || 'C' || LPAD(generate_series::text, 2, '0') as description,
    'Open Space - Zone C' as location
FROM generate_series(1, 14);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Everyone can view available desks
CREATE POLICY "Anyone can view desks" ON public.desks
    FOR SELECT USING (true);

-- Bookings policies
CREATE POLICY "Users can view all bookings" ON public.bookings
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_desk ON public.bookings(desk_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 