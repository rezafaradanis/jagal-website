const { getAdminUser } = require('../_lib/adminAuth');
const { getDb } = require('../_lib/db');
module.exports = async (req,res)=>{
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST only'});
  if(!getAdminUser(req)) return res.status(401).json({ok:false,error:'Unauthorized'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const title=String(body.title||'').trim(), category=String(body.category||'').trim(), excerpt=String(body.excerpt||'').trim(), cover=String(body.cover_image||'').trim();
    if(!title||!excerpt) return res.status(400).json({ok:false,error:'Title and excerpt are required'});
    const sql=getDb();
    await sql`INSERT INTO news (title,category,excerpt,cover_image,published,published_at) VALUES (${title},${category||null},${excerpt},${cover||null},true,NOW())`;
    return res.status(200).json({ok:true});
  }catch(error){return res.status(500).json({ok:false,error:error.message});}
};
