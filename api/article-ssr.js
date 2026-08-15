/**
 * Vercel Serverless Function: Server-Side Pre-Rendering for Article Open Graph & Twitter Cards
 *
 * Ensures social media crawlers (Facebook, WhatsApp, Twitter, LinkedIn) receive pre-rendered,
 * article-specific Open Graph tags, title, description, canonical link, and optimized 1200x630 image URL
 * in the INITIAL raw HTML response BEFORE client JavaScript runs.
 *
 * Route: /article.html?slug=ARTICLE_SLUG -> /api/article-ssr.js (via Vercel routes)
 */

const fs = require('fs');
const path = require('path');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Dynamic ImageKit URL Optimizer for Open Graph & Social Sharing
 * Appends tr=w-1200,h-630,fo-auto to optimize image payload (<300KB) and standardize 1200x630 dimensions.
 */
function getOptimizedOgImage(url) {
  if (!url) return 'https://policytells.in/images/parliament-hero.jpg';
  
  if (url.includes('ik.imagekit.io') && !url.includes('tr=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=w-1200,h-630,fo-auto`;
  }
  
  return url;
}

module.exports = async function handler(req, res) {
  const domain = 'https://policytells.in';
  const slug = req.query.slug || req.query.id;

  let article = null;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (slug && supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
      const restEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles?select=*&slug=eq.${encodeURIComponent(slug)}`;
      
      const response = await fetch(restEndpoint, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          article = data[0];
        }
      }
    } catch (err) {
      console.warn('Error querying Supabase for article SSR:', err);
    }
  }

  // Fallback sample dataset if Supabase environment variables are placeholders
  if (!article && slug) {
    const samples = [
      {
        slug: 'from-sanskrit-to-sorry-i-dont-speak-that',
        title: "From Sanskrit to \"Sorry, I Don't Speak That\": Language Policy & Cultural Shift",
        excerpt: "An in-depth investigation into language policy, regional linguistic preservation, and shifting cultural standards across modern India.",
        image_url: 'https://ik.imagekit.io/policytells/articles/language_war_seedgram_fO4sySuOc.jpeg',
        author: 'Editorial Desk',
        created_at: '2026-08-11T10:00:00Z'
      },
      {
        slug: 'architecture-of-parliamentary-reform-india',
        title: "The Architecture of Reform: How Parliamentary Committees Shape India's Policy Future",
        excerpt: "An in-depth analysis of how legislative scrutiny, bipartisan committee reports, and policy drafting mechanisms are laying the groundwork for India's next decade of economic and digital governance.",
        image_url: 'https://policytells.in/images/parliament-hero.jpg',
        author: 'Arjun Swaminathan',
        created_at: '2026-08-12T09:00:00Z'
      },
      {
        slug: 'indias-tech-sovereignty-strategy-semiconductors-ai',
        title: "India's Tech Sovereignty Strategy: Semiconductors, AI & Data Protection",
        excerpt: 'How targeted state incentives, domestic fabrication hubs, and digital public infrastructure are positioning India as a primary node in global technology supply chains.',
        image_url: 'https://policytells.in/images/economy-hero.jpg',
        author: 'Priya Ramachandran',
        created_at: '2026-08-10T14:30:00Z'
      },
      {
        slug: 'global-south-alignment-indias-strategic-autonomy',
        title: "Global South Alignment: India's Strategic Autonomy in a Multipolar World",
        excerpt: "In an era of great power friction, India's issue-based diplomacy and trade coalitions offer a blueprint for middle powers seeking strategic independence.",
        image_url: 'https://policytells.in/images/diplomacy-hero.jpg',
        author: 'Vikramaditya Sen',
        created_at: '2026-08-08T11:15:00Z'
      }
    ];

    article = samples.find(s => s.slug === slug);
  }

  // Read template HTML
  let templateHtml = '';
  try {
    const primaryPath = path.join(process.cwd(), 'article.html');
    const fallbackPath = path.join(__dirname, '..', 'article.html');
    if (fs.existsSync(primaryPath)) {
      templateHtml = fs.readFileSync(primaryPath, 'utf8');
    } else if (fs.existsSync(fallbackPath)) {
      templateHtml = fs.readFileSync(fallbackPath, 'utf8');
    }
  } catch (e) {
    console.warn('Could not read article.html template:', e);
  }

  if (!templateHtml) {
    templateHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Article — Policytells</title></head><body><main><article class="reading-container" id="single-article-content"></article></main></body></html>`;
  }

  // Default SEO Values if article not found
  const pageTitle = article ? `${article.title} | Policytells` : 'Article — Policytells';
  const pageDesc = article ? (article.excerpt || article.title) : 'An independent editorial magazine of longform policy analysis, governance insights, economics, and foreign policy.';
  const articleUrl = slug ? `${domain}/article.html?slug=${encodeURIComponent(slug)}` : `${domain}/article.html`;
  
  // Apply dynamic ImageKit URL optimization
  const rawImageUrl = (article && article.image_url) ? article.image_url : `${domain}/images/parliament-hero.jpg`;
  const optimizedOgImage = getOptimizedOgImage(rawImageUrl);

  // Construct Dynamic SEO Meta Head Section with explicit OG image specifications
  const seoHeadTags = `
  <title>${escapeXml(pageTitle)}</title>
  <meta name="description" content="${escapeXml(pageDesc)}">
  <link rel="canonical" href="${escapeXml(articleUrl)}">

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:site_name" content="Policytells">
  <meta property="og:title" content="${escapeXml(pageTitle)}">
  <meta property="og:description" content="${escapeXml(pageDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeXml(articleUrl)}">
  <meta property="og:image" content="${escapeXml(optimizedOgImage)}">
  <meta property="og:image:secure_url" content="${escapeXml(optimizedOgImage)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeXml(pageTitle)}">
  <meta name="twitter:description" content="${escapeXml(pageDesc)}">
  <meta name="twitter:image" content="${escapeXml(optimizedOgImage)}">

  ${article ? `
  <!-- Schema.org Article JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(article.title)},
    "description": ${JSON.stringify(article.excerpt || article.title)},
    "image": [${JSON.stringify(optimizedOgImage)}],
    "author": {
      "@type": "Person",
      "name": ${JSON.stringify(article.author || "Editorial Desk")}
    },
    "publisher": {
      "@type": "Organization",
      "name": "Policytells",
      "url": "https://policytells.in/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://policytells.in/images/favicon.png"
      }
    },
    "datePublished": ${JSON.stringify(article.created_at || new Date().toISOString())},
    "dateModified": ${JSON.stringify(article.updated_at || article.created_at || new Date().toISOString())},
    "mainEntityOfPage": ${JSON.stringify(articleUrl)}
  }
  </script>
  ` : ''}
  `;

  let finalHtml = templateHtml;

  if (finalHtml.includes('<title>')) {
    finalHtml = finalHtml.replace(/<title>[\s\S]*?<\/title>/i, seoHeadTags);
  } else {
    finalHtml = finalHtml.replace('</head>', `${seoHeadTags}\n</head>`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');

  return res.status(200).send(finalHtml);
};
