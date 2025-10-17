export default function handler(req, res) {
  res.status(200).json({ ok: true, service: "silkroute-api", time: new Date().toISOString() });
}
