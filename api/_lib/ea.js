const EA_BASE = 'https://proclubs.ea.com/api/fc';
const CLUB_ID = '438867';
const PLATFORM = 'common-gen5';

const headers = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
  referer: 'https://www.ea.com/',
  origin: 'https://www.ea.com',
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function ea(path, params = {}) {
  const url = new URL(`${EA_BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  let response;
  let lastError;

  // EA sometimes blocks cloud/serverless IPs even though the same endpoint
  // works from a normal browser. Try EA directly first.
  try {
    response = await fetchWithTimeout(url, { headers, method: 'GET' });
  } catch (error) {
    lastError = error;
  }

  // Fallback for serverless/cloud IPs blocked by EA.
  if (!response || !response.ok) {
    try {
      const proxyUrl = `https://proxy.corsfix.com/?${url.toString()}`;
      response = await fetchWithTimeout(proxyUrl, { headers, method: 'GET' });
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw new Error(`EA API connection failed: ${lastError?.message || 'unknown network error'}`);
  }

  const text = await response.text();
  if (!response.ok) throw new Error(`EA API ${response.status}: ${text.slice(0, 180)}`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('EA returned non-JSON data');
  }
}

function records(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['members', 'items', 'matches', 'clubs']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return Object.values(value).filter(v => v && typeof v === 'object' && !Array.isArray(v));
}

function num(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pick(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
}

function firstObject(value, id) {
  if (value && typeof value === 'object' && value[id] && typeof value[id] === 'object') return value[id];
  const list = records(value);
  return list[0] || {};
}

function normalizeClub(info, overall) {
  const rawInfo = firstObject(info, CLUB_ID);
  const rawOverall = firstObject(overall, CLUB_ID);
  const gamesPlayed = num(pick(rawOverall, ['gamesPlayed', 'matches', 'games']));
  const wins = num(pick(rawOverall, ['wins', 'totalWins']));
  const draws = num(pick(rawOverall, ['ties', 'draws', 'totalDraws']));
  const losses = num(pick(rawOverall, ['losses', 'totalLosses']));
  return {
    id: CLUB_ID,
    name: pick(rawInfo, ['name', 'clubName'], 'JAGAL FC'),
    division: pick(rawOverall, ['currentDivision', 'division'], pick(rawInfo, ['division'], '')),
    gamesPlayed: gamesPlayed || wins + draws + losses,
    wins, draws, losses,
    goalsFor: num(pick(rawOverall, ['goals', 'goalsFor', 'totalGoals'])),
    goalsAgainst: num(pick(rawOverall, ['goalsAgainst', 'totalGoalsAgainst'])),
    skillRating: num(pick(rawOverall, ['skillRating', 'skill', 'rating'])),
    winStreak: num(pick(rawOverall, ['wstreak', 'winStreak', 'currentWinStreak'])),
    unbeatenStreak: num(pick(rawOverall, ['unbeatenstreak', 'unbeatenStreak'])),
    bestDivision: pick(rawOverall, ['bestDivision'], ''),
    promotions: num(pick(rawOverall, ['promotions'])),
    relegations: num(pick(rawOverall, ['relegations']))
  };
}

function normalizeMembers(data) {
  return records(data).map((p, i) => ({
    id: String(pick(p, ['playerId', 'memberId', 'id'], String(i))),
    name: pick(p, ['name', 'playerName', 'gamertag', 'username'], `PLAYER ${i + 1}`),
    playerName: pick(p, ['proName', 'playerName'], ''),
    position: pick(p, ['favoritePosition', 'position'], ''),
    overall: num(pick(p, ['proOverall', 'overall'])),
    games: num(pick(p, ['gamesPlayed', 'games', 'matches', 'appearances', 'totalGames'])),
    winRate: num(pick(p, ['winRate'])),
    goals: num(pick(p, ['goals', 'totalGoals'])),
    assists: num(pick(p, ['assists', 'totalAssists'])),
    rating: num(pick(p, ['ratingAve', 'averageRating', 'avgRating', 'rating'])),
    manOfTheMatch: num(pick(p, ['manOfTheMatch', 'manOfTheMatchCount', 'mom'])),
    passRate: num(pick(p, ['passSuccessRate', 'passRate', 'passingPct'])),
    tackleRate: num(pick(p, ['tackleSuccessRate', 'tackleRate', 'tacklingPct'])),
    shots: num(pick(p, ['shots'])),
    passesMade: num(pick(p, ['passesMade'])),
    tacklesMade: num(pick(p, ['tacklesMade'])),
    redCards: num(pick(p, ['redCards']))
  })).filter(p => p.name);
}

function normalizeCareer(data) {
  return records(data).map((p, i) => ({
    id: String(pick(p, ['playerId', 'memberId', 'id'], String(i))),
    name: pick(p, ['name', 'playerName'], `PLAYER ${i + 1}`),
    games: num(pick(p, ['gamesPlayed', 'games'])),
    goals: num(pick(p, ['goals'])),
    assists: num(pick(p, ['assists'])),
    rating: num(pick(p, ['ratingAve', 'averageRating'])),
    manOfTheMatch: num(pick(p, ['manOfTheMatch', 'mom']))
  })).filter(p => p.name);
}

function normalizeMatches(data, matchType) {
  return records(data).map((m, i) => {
    const clubs = m?.clubs || {};
    const us = clubs[CLUB_ID] || {};
    const opponentId = Object.keys(clubs).find(id => id !== CLUB_ID);
    const them = opponentId ? clubs[opponentId] || {} : {};
    const gf = num(us.goals, m.goalsFor, m.clubGoals, m.goals);
    const ga = num(us.goalsAgainst, m.goalsAgainst, m.opponentGoals);
    let result = 'draw';
    if (String(us.wins) === '1' || gf > ga) result = 'win';
    else if (String(us.losses) === '1' || gf < ga) result = 'loss';
    return {
      id: String(pick(m, ['matchId', 'id'], String(i))),
      timestamp: pick(m, ['timestamp', 'date', 'matchDate'], ''),
      opponent: pick(them, ['details'], {})?.name || pick(m, ['opponentName', 'opponent', 'opponentClubName'], 'OPPONENT'),
      opponentId: opponentId || '',
      goals: gf, goalsAgainst: ga, result,
      dnf: String(us.winnerByDnf || them.winnerByDnf) === '1',
      matchType
    };
  });
}

function normalizeMatchPlayers(data) {
  const rows = [];
  for (const match of records(data)) {
    const players = match?.players || {};
    const clubPlayers = players[CLUB_ID] || {};
    for (const [playerId, stats] of Object.entries(clubPlayers)) {
      rows.push({
        matchId: String(match.matchId || match.id || ''),
        timestamp: match.timestamp || match.date || '',
        playerId: String(playerId),
        name: pick(stats, ['playername', 'name'], playerId),
        position: pick(stats, ['pos', 'position'], ''),
        rating: num(stats.rating), goals: num(stats.goals), assists: num(stats.assists),
        shots: num(stats.shots), passesMade: num(stats.passesmade), passAttempts: num(stats.passattempts),
        tacklesMade: num(stats.tacklesmade), tackleAttempts: num(stats.tackleattempts), saves: num(stats.saves),
        cleanSheet: num(stats.cleansheetsany), manOfTheMatch: num(stats.mom), redCards: num(stats.redcards),
        secondsPlayed: num(stats.secondsPlayed)
      });
    }
  }
  return rows;
}

async function getSnapshot({ matchType = 'leagueMatch', count = 10 } = {}) {
  const maxResultCount = String(Math.min(Math.max(Number(count) || 10, 1), 50));
  const [info, overall, members, career, matches] = await Promise.all([
    ea('clubs/info', { platform: PLATFORM, clubIds: CLUB_ID }),
    ea('clubs/overallStats', { platform: PLATFORM, clubIds: CLUB_ID }),
    ea('members/stats', { platform: PLATFORM, clubId: CLUB_ID }),
    ea('members/career/stats', { platform: PLATFORM, clubId: CLUB_ID }),
    ea('clubs/matches', { platform: PLATFORM, clubIds: CLUB_ID, matchType, maxResultCount })
  ]);
  const club = normalizeClub(info, overall);
  const squad = normalizeMembers(members);
  const careerStats = normalizeCareer(career);
  const recentMatches = normalizeMatches(matches, matchType);
  const matchPlayers = normalizeMatchPlayers(matches);
  const played = club.gamesPlayed || club.wins + club.draws + club.losses;
  const winRate = played ? +(club.wins / played * 100).toFixed(1) : 0;
  return { ok: true, source: 'EA FC 27 Pro Clubs', platform: PLATFORM, club, squad, careerStats, recentMatches, matchPlayers, winRate, updatedAt: new Date().toISOString() };
}

module.exports = { getSnapshot, CLUB_ID, PLATFORM };
