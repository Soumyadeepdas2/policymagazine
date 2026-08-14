const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).send("Failed to generate sitemap");
    }

    const urls = [
      `
      <url>
        <loc>https://policytells.in/</loc>
      </url>
      `,
      `
      <url>
        <loc>https://policytells.in/about.html</loc>
      </url>
      `,
      `
      <url>
        <loc>https://policytells.in/category.html</loc>
      </url>
      `,
      `
      <url>
        <loc>https://policytells.in/contact.html</loc>
      </url>
      `
    ];

    articles.forEach(article => {
      const lastmod = article.updated_at
        ? `<lastmod>${new Date(article.updated_at).toISOString()}</lastmod>`
        : "";

      urls.push(`
        <url>
          <loc>https://policytells.in/article.html?slug=${encodeURIComponent(article.slug)}</loc>
          ${lastmod}
        </url>
      `);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(sitemap);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Sitemap generation failed");
  }
};