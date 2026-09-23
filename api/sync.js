const { createClient } = require('@supabase/supabase-js');
const { getSnapshot, CLUB_ID, PLATFORM } = require('./_lib/ea');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'GET/POST only' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase environment variables are not configured yet',
      clubId: CLUB_ID,
      platform: PLATFORM
    });
  }

  let stage = 'init';

  try {
    stage = 'create_supabase_client';
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    stage = 'ea_fetch';
    const snapshot = await getSnapshot({
      matchType: req.query?.matchType || 'leagueMatch',
      count: req.query?.count || 10
    });

    stage = 'supabase_insert';
    const { error: snapshotError } = await supabase
      .from('club_snapshots')
      .insert({
        club_id: CLUB_ID,
        platform: PLATFORM,
        payload: snapshot
      });

    if (snapshotError) {
      const err = new Error(snapshotError.message || 'Supabase insert failed');
      err.code = snapshotError.code;
      err.details = snapshotError.details;
      err.hint = snapshotError.hint;
      throw err;
    }

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
      details: error?.details || null,
      hint: error?.hint || null,
      clubId: CLUB_ID,
      platform: PLATFORM
    });
  }
};
