const { getAdminUser } = require('../_lib/adminAuth');
const sync = require('../sync');
module.exports = async (req,res)=>{
  if(!getAdminUser(req)) return res.status(401).json({ok:false,error:'Unauthorized'});
  return sync(req,res);
};
