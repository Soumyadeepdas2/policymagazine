/**
 * Vercel Serverless Function: Dynamic Public Environment Variables Endpoint
 * Exposes ONLY public frontend configuration variables to window.ENV in the browser.
 *
 * IMPORTANT SECURITY NOTICE:
 * IMAGEKIT_PRIVATE_KEY, TURNSTILE_SECRET_KEY, and SUPABASE_SERVICE_ROLE_KEY are STRICTLY OMITTED.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const envConfig = {
    SUPABASE_URL: process.env.SUPABASE_URL || "YOUR_SUPABASE_URL",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY",
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || "YOUR_IMAGEKIT_PUBLIC_KEY",
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/your_imagekit_id",
    // Cloudflare Turnstile Public Site Key (uses Cloudflare's official testing site key as fallback)
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || "1x00000000000000000000AA"
  };

  res.status(200).send(`window.ENV = ${JSON.stringify(envConfig)};`);
};
