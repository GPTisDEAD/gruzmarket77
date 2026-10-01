// gruzmarket77-lead — приём заявок: honeypot + rate-limit → Telegram + Google Sheets.
// Секреты: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SA_KEY, SHEETS_ID (wrangler secret put).

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    let data;
    const ct = request.headers.get('content-type') || '';
    try {
      data = ct.includes('application/json')
        ? await request.json()
        : Object.fromEntries((await request.formData()).entries());
    } catch {
      return json({ ok: false, error: 'bad body' }, 400, cors);
    }

    // Honeypot: поле website заполняют только боты
    if (data.website) return json({ ok: true }, 200, cors);

    const phone = String(data.phone || '').replace(/[^\d+]/g, '');
    if (phone.length < 10) return json({ ok: false, error: 'phone' }, 422, cors);

    // Rate-limit по IP: 5 заявок / 10 минут (если привязан KV)
    if (env.RATE) {
      const ip = request.headers.get('cf-connecting-ip') || 'x';
      const key = `rl:${ip}`;
      const n = parseInt((await env.RATE.get(key)) || '0', 10);
      if (n >= 5) return json({ ok: false, error: 'rate' }, 429, cors);
      await env.RATE.put(key, String(n + 1), { expirationTtl: 600 });
    }

    const lead = {
      task: String(data.task || '').slice(0, 500),
      name: String(data.name || '').slice(0, 100),
      phone,
      when: String(data.when || '').slice(0, 100),
      page: String(data.page || '').slice(0, 200),
      utm: String(data.utm || '').slice(0, 300),
      ts: new Date().toISOString()
    };

    const results = await Promise.allSettled([
      sendTelegram(env, lead),
      appendSheet(env, lead)
    ]);
    const tgOk = results[0].status === 'fulfilled';
    const shOk = results[1].status === 'fulfilled';

    if (!tgOk && !shOk) return json({ ok: false, error: 'delivery' }, 502, cors);
    return json({ ok: true, tg: tgOk, sheet: shOk }, 200, cors);
  }
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

async function sendTelegram(env, lead) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error('tg not configured');
  const text = [
    '🔔 Новая заявка — ГрузМаркет77',
    '',
    `Задача: ${lead.task || '—'}`,
    `Имя: ${lead.name || '—'}`,
    `Телефон: ${lead.phone}`,
    `Когда: ${lead.when || '—'}`,
    `Страница: ${lead.page || '—'}`,
    lead.utm ? `UTM: ${lead.utm}` : null,
    `Время: ${lead.ts}`
  ].filter(Boolean).join('\n');

  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
  });
  if (!r.ok) throw new Error(`tg ${r.status}`);
}

async function appendSheet(env, lead) {
  if (!env.GOOGLE_SA_KEY || !env.SHEETS_ID) throw new Error('sheets not configured');
  const sa = JSON.parse(env.GOOGLE_SA_KEY);
  const token = await googleToken(sa);
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEETS_ID}/values/A:G:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [[lead.ts, lead.name, lead.phone, lead.task, lead.when, lead.page, lead.utm]]
      })
    }
  );
  if (!r.ok) throw new Error(`sheets ${r.status}`);
}

async function googleToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const input = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToBuf(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
  const jwt = `${input}.${b64url(sig)}`;

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  if (!r.ok) throw new Error(`oauth ${r.status}`);
  return (await r.json()).access_token;
}

function b64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBuf(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
