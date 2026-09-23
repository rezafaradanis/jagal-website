const { getAdminUser } = require('../_lib/adminAuth');
const { getDb } = require('../_lib/db');
module.exports = async (req,res)=>{
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'GET only'});
  const user=getAdminUser(req);
  if(!user) return res.status(401).json({ok:false,error:'Unauthorized'});
  try{
    const sql=getDb();
    const [playersCount,matchesCount,trialsCount,trials]=await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM players WHERE club_id = '438867'`,
      sql`SELECT COUNT(*)::int AS count FROM matches WHERE club_id = '438867'`,
      sql`SELECT COUNT(*)::int AS count FROM trial_applications`,
      sql`SELECT created_at,name,ea_id,primary_position,country,status FROM trial_applications ORDER BY created_at DESC LIMIT 100`
    ]);
    return res.status(200).json({ok:true,players:playersCount[0]?.count||0,matches:matchesCount[0]?.count||0,trials:trialsCount[0]?.count||0,applications:trials});
  }catch(error){return res.status(500).json({ok:false,error:error.message});}
};
