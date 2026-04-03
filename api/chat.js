const FREE_MODELS = ['qwen-coder'];
const POLLINATIONS_URL = 'https://text.pollinations.ai/openai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, model = 'qwen-coder', userKey } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages required' });

  // Pilih key: userKey dari request, atau server key untuk free model
  let apiKey = null;
  if (userKey) {
    apiKey = userKey; // BYOP: pakai pollen user sendiri
  } else if (FREE_MODELS.includes(model)) {
    apiKey = process.env.POLLINATIONS_API_KEY; // Free: pakai key server
  } else {
    return res.status(403).json({ error: 'this model requires your own pollen key' });
  }

  try {
    const upstream = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ model, messages, temperature: 0.85, max_tokens: 800 })
    });

    // Log response status untuk debug
    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`Pollinations error ${upstream.status}:`, errText);
      return res.status(502).json({
        error: `upstream error ${upstream.status}`,
        detail: errText.slice(0, 200)
      });
    }

    const data = await upstream.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
