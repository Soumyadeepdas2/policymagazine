-- ==========================================================================
-- PolicyTells Magazine - Hardened Supabase RLS Migration Script
-- Enforces strict Admin UUID (16ce5847-98be-43d9-b726-57e834b7bb6c) authorization.
-- Revokes direct contact_messages INSERT for anon & authenticated roles.
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

-- Indexes
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

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- ARTICLES POLICIES
-- --------------------------------------------------------------------------

-- Drop old policies
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
DROP POLICY IF EXISTS "Admin full access to articles" ON public.articles;
DROP POLICY IF EXISTS "Public read published articles" ON public.articles;

-- Policy 1: Anonymous AND non-admin authenticated users can SELECT published articles ONLY
CREATE POLICY "Public read published articles"
ON public.articles
FOR SELECT
USING (published = true);

-- Policy 2: Admin user ONLY (checked strictly via auth.uid()) has full CRUD access to all articles
CREATE POLICY "Admin full access to articles"
ON public.articles
FOR ALL
TO authenticated
USING (
  auth.uid() = '16ce5847-98be-43d9-b726-57e834b7bb6c'::uuid
)
WITH CHECK (
  auth.uid() = '16ce5847-98be-43d9-b726-57e834b7bb6c'::uuid
);

-- --------------------------------------------------------------------------
-- CONTACT MESSAGES POLICIES
-- --------------------------------------------------------------------------

-- Drop old policies
DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Server contact insert" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin view contact messages" ON public.contact_messages;

-- Direct INSERT on contact_messages is DENIED for both anon and authenticated roles.
-- Serverless function /api/contact uses SUPABASE_SERVICE_ROLE_KEY to insert after CAPTCHA verification.

-- Policy 1: Admin user ONLY (checked strictly via auth.uid()) can SELECT contact messages
CREATE POLICY "Admin view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = '16ce5847-98be-43d9-b726-57e834b7bb6c'::uuid
);
