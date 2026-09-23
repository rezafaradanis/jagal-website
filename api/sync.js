const { createClient } = require('@supabase/supabase-js');
const { getSnapshot, CLUB_ID, PLATFORM } = require('./_lib/ea');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'GET/POST only' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase environment variables are not configured yet',
      clubId: CLUB_ID,
      platform: PLATFORM
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const snapshot = await getSnapshot({
      matchType: req.query?.matchType || 'leagueMatch',
      count: req.query?.count || 10
    });

    const { error: snapshotError } = await supabase
      .from('club_snapshots')
      .insert({
        club_id: CLUB_ID,
        platform: PLATFORM,
        payload: snapshot
      });

    if (snapshotError) throw snapshotError;

    return res.status(200).json({
      ok: true,
      saved: true,
      clubId: CLUB_ID,
      updatedAt: snapshot.updatedAt
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
      clubId: CLUB_ID,
      platform: PLATFORM
    });
  }
};
