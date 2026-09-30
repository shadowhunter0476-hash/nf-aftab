export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  const { cookie, device } = req.body || {};
  if (!cookie) {
    return res.status(400).json({ ok: false, error: 'no cookie' });
  }

  const endpoint = 'https://www.netflix.com/account';

  try {
    const r = await fetch(endpoint, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Cookie': cookie,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const loc = r.headers.get('location') || '';
    if (r.status >= 300 && r.status < 400 && loc.includes('/login')) {
      return res.status(200).json({ ok: false, error: 'expired or invalid' });
    }

    const body = await r.text();

    if (r.status !== 200) {
      return res.status(200).json({ ok: false, error: 'http ' + r.status });
    }

    if (body.includes('"authURL":"/login"') || body.includes('"authURL": "/login"')) {
      return res.status(200).json({ ok: false, error: 'not signed in' });
    }

    let profile = 'unknown';
    const m1 = body.match(/"profileName":"([^"]+)"/);
    if (m1) profile = m1[1];
    const m2 = body.match(/"emailAddress":"([^"]+)"/);
    if (m2) profile = m2[1];

    return res.status(200).json({
      ok: true,
      profile: profile,
      device: device || 'unknown'
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
