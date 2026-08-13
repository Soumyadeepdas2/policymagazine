/**
 * Vercel Serverless Function: ImageKit Authentication Parameters Generator
 *
 * IMAGEKIT_PRIVATE_KEY MUST NEVER BE hardcoded or exposed to the frontend.
 * This endpoint runs server-side on Vercel to generate short-lived tokens and signatures.
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    return res.status(500).json({
      error: 'IMAGEKIT_PRIVATE_KEY environment variable is missing on Vercel server.'
    });
  }

  try {
    const token = req.query.token || crypto.randomUUID();
    const expire = req.query.expire || Math.floor(Date.now() / 1000) + 1800; // valid for 30 minutes

    // ImageKit signature calculation formula: HMAC-SHA1 of (token + expire) with privateKey
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    return res.status(200).json({
      token: token,
      expire: Number(expire),
      signature: signature
    });
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return res.status(500).json({ error: 'Failed to generate ImageKit authentication parameters.' });
  }
};
