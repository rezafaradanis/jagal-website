const { getSnapshot, CLUB_ID, PLATFORM } = require('./_lib/ea');
const { getDb } = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'GET/POST only' });
  }

  let stage = 'init';

  try {
    stage = 'ea_fetch';
    const snapshot = await getSnapshot({
      matchType: req.query?.matchType || 'leagueMatch',
      count: req.query?.count || 10
    });

    stage = 'neon_insert';
    const sql = getDb();
    await sql`INSERT INTO club_snapshots (club_id, platform, payload) VALUES (${CLUB_ID}, ${PLATFORM}, ${JSON.stringify(snapshot)}::jsonb)`;

    return res.status(200).json({
      ok: true,
      saved: true,
      clubId: CLUB_ID,
      updatedAt: snapshot.updatedAt
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      stage,
      error: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      code: error?.code || error?.cause?.code || null,
      cause: error?.cause?.message || null,
      clubId: CLUB_ID,
      platform: PLATFORM
    });
  }
};
