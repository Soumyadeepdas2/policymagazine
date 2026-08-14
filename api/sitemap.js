/**
 * Dynamic XML Sitemap Generator Vercel Serverless Function
 *
 * Automatically fetches published articles from Supabase table `articles`
 * and generates a standard XML sitemap for SEO crawlers.
 *
 * Public URL: https://policytells.in/sitemap.xml
 */

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

module.exports = async function handler(req, res) {
  const domain = "https://policytells.in";

  // Static Public Pages
  const staticPages = [
    { url: `${domain}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { url: `${domain}/about.html`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.6' },
    { url: `${domain}/category.html`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.8' },
    { url: `${domain}/contact.html`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.5' }
  ];

  let publishedArticles = [];

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
      const restEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/articles?select=slug,updated_at,created_at&published=eq.true&order=created_at.desc`;
      
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
        if (Array.isArray(data)) {
          publishedArticles = data;
        }
      } else {
        console.warn(`Supabase REST query returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('Error fetching published articles for sitemap:', err);
    }
  }

  // Fallback to sample published articles if Supabase database query returned no rows or environment variables not yet set
  if (publishedArticles.length === 0) {
    publishedArticles = [
      { slug: 'architecture-of-parliamentary-reform-india', updated_at: '2026-08-12T09:00:00Z' },
      { slug: 'indias-tech-sovereignty-strategy-semiconductors-ai', updated_at: '2026-08-10T14:30:00Z' },
      { slug: 'global-south-alignment-indias-strategic-autonomy', updated_at: '2026-08-08T11:15:00Z' }
    ];
  }

  // Construct XML Sitemap
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static Pages
  staticPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(page.lastmod)}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Dynamic Published Articles
  publishedArticles.forEach(article => {
    if (!article.slug) return;
    const articleUrl = `${domain}/article.html?slug=${encodeURIComponent(article.slug)}`;
    const lastmod = formatDate(article.updated_at || article.created_at);

    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(articleUrl)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  
  return res.status(200).send(xml);
};
