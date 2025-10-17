// async function postJson(url, body, headers = {}) {
//   const r = await fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", ...headers },
//     body: JSON.stringify(body)
//   });
//   const text = await r.text();
//   let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
//   return { ok: r.ok, status: r.status, json };
// }

// export default async function handler(req, res) {
//   const rid = Math.random().toString(36).slice(2, 8);

//   try {
//     if (req.method === "GET") {
//       return res.status(200).json({ ok: true, route: "orders-upsert", rid });
//     }
//     if (req.method !== "POST") {
//       return res.status(405).json({ ok: false, error: "Method Not Allowed", rid });
//     }

//     const secretHeader = req.headers["x-silk-secret"];
//     const secretEnv = process.env.SILK_SHARED_SECRET;
//     const ORDERS_UPSERT_URL = process.env.BASE44_ORDERS_UPSERT_URL; // <- paste exact Base44 Invoke URL here (as env)

//     if (!secretEnv || !ORDERS_UPSERT_URL) {
//       return res.status(500).json({
//         ok: false,
//         error: "Missing env vars",
//         missing: { SILK_SHARED_SECRET: !!secretEnv, BASE44_ORDERS_UPSERT_URL: !!ORDERS_UPSERT_URL },
//         rid
//       });
//     }
//     if (secretHeader !== secretEnv) {
//       return res.status(401).json({ ok: false, error: "Unauthorized", rid });
//     }

//     const { order, trace_id } = req.body || {};
//     if (!order || typeof order !== "object") {
//       return res.status(400).json({ ok: false, error: "Missing 'order' object", rid });
//     }

//     // Forward to Base44 using the exact function URL
//     const extraHeaders = {
//       "x-silk-secret": secretEnv,
//       "Base44-Functions-Version": "production"
//     };

//     const upstream = await postJson(ORDERS_UPSERT_URL, { order, trace_id }, extraHeaders);

//     if (!upstream.ok) {
//       return res.status(upstream.status).json({
//         ok: false,
//         rid,
//         upstreamStatus: upstream.status,
//         upstreamUrl: ORDERS_UPSERT_URL,
//         payload: upstream.json
//       });
//     }

//     return res.status(200).json({ ok: true, rid, ...upstream.json });
//   } catch (err) {
//     console.error("[orders-upsert]", err);
//     return res.status(500).json({ ok: false, error: String(err?.message || err), rid });
//   }
// }


export default async function handler(req, res) {
  const rid = Math.random().toString(36).slice(2, 8);

  if (req.method === "GET") return res.status(200).json({ ok: true, route: "orders-upsert", rid });
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed", rid });

  const secret = req.headers["x-silk-secret"];
  if (secret !== process.env.SILK_SHARED_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized", rid });
  }

  const { order, trace_id } = req.body || {};
  if (!order) return res.status(400).json({ ok: false, error: "Missing 'order'", rid });

  const r = await fetch(process.env.BASE44_ORDERS_UPSERT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-silk-secret": process.env.SILK_SHARED_SECRET,
      "Base44-Functions-Version": "production"
    },
    body: JSON.stringify({ order, trace_id })
  });

  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }

  return res.status(r.status).json(json);
}
