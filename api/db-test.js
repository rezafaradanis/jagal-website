const { getDb } = require('./_lib/db');

module.exports = async (req,res)=>{
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'GET only'});
  try{
    const sql=getDb();
    const rows=await sql`SELECT NOW() AS now`;
    return res.status(200).json({ok:true,database:'neon',serverTime:rows[0]?.now||null});
  }catch(error){
    return res.status(500).json({ok:false,database:'neon',error:error?.message||'Database connection failed'});
  }
};
