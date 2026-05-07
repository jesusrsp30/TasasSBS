export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  let bcv = null, usdt = null, source = 'yadio';

  try {
    const r = await fetch('https://api.yadio.io/exrates/VES', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await r.json();
    if (data?.VES?.BCV)  bcv  = parseFloat(data.VES.BCV);
    if (data?.VES?.USDT) usdt = parseFloat(data.VES.USDT);
  } catch (e) {}

  // Fallback individual endpoints
  if (!bcv) {
    try {
      const r = await fetch('https://api.yadio.io/rate/USD/VES');
      const d = await r.json();
      if (d?.rate) bcv = parseFloat(d.rate);
    } catch(e) {}
  }
  if (!usdt) {
    try {
      const r = await fetch('https://api.yadio.io/rate/USDT/VES');
      const d = await r.json();
      if (d?.rate) usdt = parseFloat(d.rate);
    } catch(e) {}
  }

  if (!bcv && !usdt) {
    return res.status(502).json({ error: 'No se pudieron obtener las tasas' });
  }

  res.status(200).json({ bcv, usdt, source, ts: Date.now() });
}
