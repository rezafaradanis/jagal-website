const { createToken, setAuthCookie, clearAuthCookie } = require('../_lib/adminAuth');
module.exports = async (req,res)=>{
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');return res.status(204).end();}
  if(req.method!=='POST' && req.method!=='DELETE') return res.status(405).json({ok:false,error:'POST/DELETE only'});
  if(req.method==='DELETE'){clearAuthCookie(res);return res.status(200).json({ok:true});}
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const email=String(body.email||'').trim().toLowerCase();
    const password=String(body.password||'');
    const expectedEmail=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
    const expectedPassword=String(process.env.ADMIN_PASSWORD||'');
    if(!expectedEmail||!expectedPassword) return res.status(503).json({ok:false,error:'Admin credentials are not configured'});
    if(email!==expectedEmail || password!==expectedPassword) return res.status(401).json({ok:false,error:'Invalid email or password'});
    setAuthCookie(res,createToken(email));
    return res.status(200).json({ok:true,email});
  }catch(error){return res.status(400).json({ok:false,error:error.message});}
};
