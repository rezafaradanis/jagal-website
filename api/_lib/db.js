const { neon } = require('@neondatabase/serverless');

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

module.exports = { getDb };
