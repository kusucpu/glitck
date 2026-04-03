const POLLINATIONS_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';

export default async function handler(req, res) {
  // CORS Header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, model = 'nova-fast', userKey } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'Messages required' });

  const apiKey = userKey || process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    return res.status(403).json({ 
      error: 'Key needed.' 
    });
  }

  try {
    const upstream = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({ 
        model, 
        messages, 
        temperature: 0.7, 
        max_tokens: 1500 
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('Upstream Error:', data);
      throw new Error(data.error?.message || `API Error ${upstream.status}`);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
