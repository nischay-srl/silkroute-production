export default async function handler(req, res) {
  const rid = Math.random().toString(36).slice(2, 8);
  try {
    if (req.method === "GET") return res.status(200).json({ ok: true, route: "ops-log", rid });
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed", rid });

    const secret = req.headers["x-silk-secret"];
    if (secret !== process.env.SILK_SHARED_SECRET) return res.status(401).json({ ok: false, error: "Unauthorized", rid });

    const { event, detail, order_id, trace_id, level = "info" } = req.body || {};
    if (!event) return res.status(400).json({ ok: false, error: "Missing 'event'", rid });

    const r = await fetch(process.env.BASE44_OPS_LOG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-silk-secret": process.env.SILK_SHARED_SECRET,
        "Base44-Functions-Version": "production"
      },
      body: JSON.stringify({ event, detail, order_id, trace_id, level })
    });

    const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return res.status(r.status).json(json);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e), rid });
  }
}
