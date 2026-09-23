const { getDb } = require('./_lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = String(body.name || '').trim();
    const eaId = String(body.ea_id || '').trim();
    const primaryPosition = String(body.primary_position || '').trim();
    if (!name || !eaId || !primaryPosition) {
      return res.status(400).json({ ok:false, error:'Name, EA ID, and primary position are required' });
    }

    const sql = getDb();
    await sql`INSERT INTO trial_applications
      (name, ea_id, country, primary_position, secondary_position, previous_club)
      VALUES
      (${name}, ${eaId}, ${String(body.country || 'Indonesia').trim()}, ${primaryPosition},
       ${String(body.secondary_position || '').trim() || null},
       ${String(body.previous_club || '').trim() || null})`;

    return res.status(200).json({ ok:true });
  } catch (error) {
    return res.status(500).json({ ok:false, error:error.message });
  }
};
