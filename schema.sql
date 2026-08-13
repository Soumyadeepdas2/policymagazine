-- ==========================================================================
-- PolicyTells Magazine - Supabase Database Schema & RLS Setup
-- Copy and run this script in your Supabase SQL Editor.
-- ==========================================================================

-- 1. Create Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT DEFAULT 'Editorial Desk',
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast category and slug lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published);

-- 2. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

-- Enable RLS on both tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- ARTICLES POLICIES
-- Policy 1: Anyone (public) can read published articles
CREATE POLICY "Public can read published articles"
ON public.articles
FOR SELECT
USING (published = true);

-- Policy 2: Authenticated admin users can perform all operations (Create, Read, Update, Delete)
CREATE POLICY "Admin full access to articles"
ON public.articles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- CONTACT MESSAGES POLICIES
-- Policy 1: Anyone can submit a contact message
CREATE POLICY "Public can insert contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Only authenticated admin users can read contact messages
CREATE POLICY "Admin can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);
