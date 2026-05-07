export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  let bcv = null, usdt = null, source = 'dolarapi';

  // Primary source: ve.dolarapi.com (reliable Venezuela rates)
  try {
    const r = await fetch('https://ve.dolarapi.com/v1/dolares', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await r.json();
    
    if (Array.isArray(data)) {
      // Find oficial (BCV) rate
      const oficial = data.find(d => d.fuente === 'oficial');
      if (oficial?.promedio) {
        bcv = parseFloat(oficial.promedio);
      }
      // Find paralelo (USDT/Binance) rate
      const paralelo = data.find(d => d.fuente === 'paralelo');
      if (paralelo?.promedio) {
        usdt = parseFloat(paralelo.promedio);
      }
    }
  } catch (e) {
    console.error('[v0] dolarapi error:', e.message);
  }

  // Fallback to Yadio if dolarapi fails
  if (!bcv) {
    try {
      const r = await fetch('https://api.yadio.io/rate/USD/VES', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const d = await r.json();
      // Yadio returns VES per USD inverted, so we need 1/rate
      if (d?.rate && d.rate > 0) {
        bcv = 1 / parseFloat(d.rate);
        source = 'yadio';
      }
    } catch(e) {
      console.error('[v0] yadio USD error:', e.message);
    }
  }

  // If still no USDT, use BCV as fallback
  if (!usdt && bcv) {
    usdt = bcv;
  }

  if (!bcv && !usdt) {
    return res.status(502).json({ error: 'No se pudieron obtener las tasas' });
  }

  res.status(200).json({ bcv, usdt, source, ts: Date.now() });
}
