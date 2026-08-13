# PolicyTells — Beginner-Level Editorial Magazine

**PolicyTells** is an independent digital magazine focusing on longform analysis, policy explainers, technology governance, and cultural critique. Built from scratch with a clean, lightweight tech stack designed for simplicity, maintainability, and high readability.

---

## 1. Tech Stack

- **HTML5**: Semantic, accessible markup.
- **CSS3**: Publication-ready custom editorial design system with typography tokens and responsive layout.
- **Vanilla JavaScript**: Pure JS client logic without complex frameworks.
- **Supabase**: Relational database (`articles`, `contact_messages`) & Auth for admin management.
- **ImageKit**: High-performance CDN and image upload platform.
- **Vercel**: Static site hosting with Node.js Serverless Function (`/api/imagekit-auth.js`) for secure ImageKit authentication signatures.

---

## 2. Simple Project Structure

```
/
├── index.html              # Homepage with Featured Hero & Selected Stories
├── article.html            # Article detail reading view
├── category.html           # Category-filtered story listing
├── about.html              # Magazine manifesto & editorial mission
├── contact.html            # Contact form (saves directly to Supabase contact_messages)
│
├── admin/
│   ├── login.html          # Admin authentication portal
│   ├── index.html          # Article & inbox management dashboard
│   └── editor.html         # Article editor with ImageKit upload
│
├── api/
│   └── imagekit-auth.js    # Vercel serverless function for ImageKit HMAC-SHA1 signature
│
├── css/
│   └── style.css           # Complete editorial CSS design system
│
├── js/
│   ├── config.js           # Configuration, default categories & sample articles fallback
│   ├── app.js              # Public site engine (data fetching, rendering, contact form)
│   └── admin.js            # Admin Auth, CRUD operations, ImageKit upload handler
│
├── schema.sql              # Supabase table creation & RLS security rules
├── .env.example            # Environment variables placeholder reference
├── .env.local              # Local environment variables (git-ignored)
├── .gitignore              # Ignores sensitive environment files and cache
├── vercel.json             # Vercel deployment configuration
└── README.md               # Project documentation
```

---

## 3. Database & Supabase Setup

### Creating Tables & RLS Policies
Copy and execute the contents of `schema.sql` in your **Supabase SQL Editor**:

1. **`articles` Table**:
   - `id`: UUID (Primary Key)
   - `title`: TEXT
   - `slug`: TEXT (Unique)
   - `excerpt`: TEXT
   - `content`: TEXT
   - `category`: TEXT
   - `author`: TEXT
   - `image_url`: TEXT
   - `featured`: BOOLEAN
   - `published`: BOOLEAN
   - `created_at`: TIMESTAMPTZ
   - `updated_at`: TIMESTAMPTZ

2. **`contact_messages` Table**:
   - `id`: UUID (Primary Key)
   - `name`: TEXT
   - `email`: TEXT
   - `subject`: TEXT
   - `message`: TEXT
   - `created_at`: TIMESTAMPTZ

3. **Row Level Security (RLS)**:
   - Public readers can only view `published = true` articles and insert into `contact_messages`.
   - Authenticated Admin users can perform all operations (Create, Edit, Delete, Publish).

---

## 4. ImageKit Integration Flow

1. Admin selects an image (JPG, PNG, WebP ≤ 5 MB) in `admin/editor.html`.
2. Frontend requests short-lived signature parameters from `/api/imagekit-auth`.
3. Vercel serverless function generates HMAC-SHA1 signature using `IMAGEKIT_PRIVATE_KEY` (kept strictly server-side).
4. Browser uploads image directly to ImageKit upload API (`https://upload.imagekit.io/api/v1/files/upload`).
5. ImageKit returns CDN URL, which is saved into `articles.image_url`.

---

## 5. Environment Variables Configuration

Create a `.env.local` file for local development or set environment variables in your **Vercel Project Settings**:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

IMAGEKIT_PUBLIC_KEY=public_your_imagekit_key
IMAGEKIT_PRIVATE_KEY=private_your_imagekit_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

> **SECURITY NOTICE**: `IMAGEKIT_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE` keys are NEVER exposed in frontend code, HTML, or client-side JavaScript. Only the serverless function accesses secrets.

---

## 6. Vercel Deployment

1. Connect your repository to Vercel.
2. Set Environment Variables in Vercel Dashboard (Settings → Environment Variables).
3. Deploy! Vercel automatically hosts the static HTML files and provisions the `/api/imagekit-auth` serverless function.

---

## 7. Testing & Verification Checklist

- [x] Homepage (`index.html`) renders featured story & grid.
- [x] Article page (`article.html?slug=...`) renders longform typography & related stories.
- [x] Category page (`category.html?cat=politics`) filters stories correctly.
- [x] About page (`about.html`) displays editorial manifesto.
- [x] Contact page (`contact.html`) saves messages directly to Supabase `contact_messages`.
- [x] Admin Login (`/admin/login.html`) authenticates via Supabase Auth.
- [x] Admin Dashboard (`/admin/index.html`) displays articles, toggles publish/feature, and shows contact inbox.
- [x] Editor (`/admin/editor.html`) supports ImageKit upload and article saving.
- [x] Responsive layout tested on desktop, tablet, and mobile.
