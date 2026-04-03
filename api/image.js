const ALLOWED_IMG_MODELS = ['flux', 'zimage'];

const ASPECT_SIZES = {
  '1:1':  { width: 1024, height: 1024 },
  '3:4':  { width: 768,  height: 1024 },
  '4:3':  { width: 1024, height: 768  },
  '9:16': { width: 576,  height: 1024 },
  '16:9': { width: 1024, height: 576  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    prompt,
    model   = 'flux',
    aspect  = '1:1',
    userKey
  } = req.body;

  if (!prompt?.trim()) return res.status(400).json({ error: 'prompt required' });
  if (!ALLOWED_IMG_MODELS.includes(model)) {
    return res.status(403).json({ error: 'model not available' });
  }

  const size = ASPECT_SIZES[aspect] || ASPECT_SIZES['1:1'];
  const apiKey = userKey || process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'no api key available' });

  const params = new URLSearchParams({
    model:  model,
    width:  String(size.width),
    height: String(size.height),
    nologo: 'true',
    seed:   String(Math.floor(Math.random() * 99999))
  });

  const imgUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt.trim())}?${params}`;

  try {
    const upstream = await fetch(imgUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(502).json({ error: `upstream ${upstream.status}`, detail: errText.slice(0, 200) });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);

  } catch (err) {
    console.error('Image fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
