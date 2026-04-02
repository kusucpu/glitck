export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const FREE_MODELS = ['qwen-safety'];
  const { messages, model = 'qwen-safety' } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });
  if (!FREE_MODELS.includes(model)) return res.status(403).json({ error: 'use your own key for this model' });

  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}`
      },
      body: JSON.stringify({ model, messages, temperature: 0.85, max_tokens: 800 })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'upstream error' });

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
