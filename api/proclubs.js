const { getSnapshot, CLUB_ID, PLATFORM } = require('./_lib/ea');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  try {
    const data = await getSnapshot({ matchType: req.query?.matchType || 'leagueMatch', count: req.query?.count || 10 });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ ok: false, source: 'EA FC 27 Pro Clubs', clubId: CLUB_ID, platform: PLATFORM, error: error.message, message: 'EA data could not be fetched right now. The Pro Clubs API is unofficial/undocumented and may block or change server requests.' });
  }
};
