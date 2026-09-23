(()=>{const $=x=>document.getElementById(x),note=(x,t)=>$(x).textContent=t;
async function showDashboard(){ $("auth").hidden=true; $("dash").hidden=false; await load(); }
function showLogin(){ $("auth").hidden=false; $("dash").hidden=true; }

$("login").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("email").value,password:$("password").value})});
    const j=await r.json();
    if(!j.ok) throw Error(j.error||"Login failed");
    await showDashboard();
  }catch(err){note("note",err.message)}
});

$("logout").addEventListener("click",async()=>{
  await fetch("/api/admin/login",{method:"DELETE"});
  showLogin();
});

$("sync").addEventListener("click",async()=>{
  note("syncNote","Syncing EA...");
  try{
    const r=await fetch("/api/admin/sync",{method:"POST"});
    const j=await r.json();
    note("syncNote",j.ok?"SYNC COMPLETE":j.error||"SYNC FAILED");
    if(j.ok) await load();
  }catch(err){note("syncNote",err.message)}
});

async function load(){
  const r=await fetch("/api/admin/data");
  if(r.status===401){showLogin();return false}
  const j=await r.json();
  if(!j.ok){note("note",j.error||"Load failed");return false}
  $("playersCount").firstChild.textContent=j.players;
  $("matchesCount").firstChild.textContent=j.matches;
  $("trialCount").firstChild.textContent=j.trials;
  $("trialsBody").innerHTML=(j.applications||[]).map(x=>"<tr><td>"+new Date(x.created_at).toLocaleDateString("id-ID")+"</td><td>"+x.name+"</td><td>"+x.ea_id+"</td><td>"+x.primary_position+"</td><td>"+(x.country||"--")+"</td><td>"+x.status+"</td></tr>").join("")||"<tr><td colspan=6>NO APPLICATIONS</td></tr>";
  return true;
}

$("news").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const r=await fetch("/api/admin/news",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:$("title").value,category:$("category").value,excerpt:$("excerpt").value,cover_image:$("cover").value||null})});
    const j=await r.json();
    if(!j.ok) throw Error(j.error||"News failed");
    note("newsNote","NEWS PUBLISHED");
    e.target.reset();
  }catch(err){note("newsNote",err.message)}
});

load();
})();