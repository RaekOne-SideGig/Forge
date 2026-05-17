// Forge - Main Application
import { DDB } from './data/exercises.js';
import { WM } from './data/warmups.js';
import { SWAP, MN, DEF_NC, MS, defDays, GLOSS } from './data/defaults.js';
import { fmtRest, fmtElapsed, calcAvgDuration, addTips } from './utils/helpers.js';
import { getOverloadClass, getOverloadHint } from './utils/overload.js';
import { exportData } from './utils/export.js';
import { fbDb, fbAuth, gProvider, fbUser, setFbUser, syncToFb, loadFromFb, updSync, loadCoachAthletes as _loadCoachAthletes, genInviteCode } from './firebase.js';
import { S, setS, ld, svLocal, sv, aDB, gx, isL, tB, hC, tds, wlk, compColor, cDay, cV } from './state.js';
import { showRestPopup, skipRest } from './components/rest-timer.js';
import { renderExerciseChart, renderVolumeChart } from './components/charts.js';
import { renderHeatMap } from './components/heatmap.js';
import { initDrag, moveEx } from './components/drag-reorder.js';

// Image paths (now actual files)
const AB = "assets/anvil-big.png";
const AT = "assets/anvil-small.png";
const BF = "assets/body-front.jpg";
const BB = "assets/body-back.jpg";

base64,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";base64,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";base64,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";base64,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";

let cD=0,calY=2026,calM=4,athTab="exec",curMode="c",coachTab="arch";

// ===== AUTO-LOGIN: skip login if user exists =====

function exportData(){
  const data=getActiveData();
  const from=document.getElementById("expFrom")?.value||"";
  const to=document.getElementById("expTo")?.value||"";
  let logs=data.log||[];
  if(from)logs=logs.filter(l=>l.date>=from);
  if(to)logs=logs.filter(l=>l.date<=to);
  
  let csv="Date,Workout,Exercise,Set,Weight (lbs),Reps,Duration (min)\n";
  logs.forEach(lg=>{
    const dayData=data.days[lg.dayIdx];if(!dayData)return;
    const dur=lg.duration?Math.floor(lg.duration/60):"";
    dayData.exercises.forEach((w,ei)=>{
      const e=gx(w.exId);if(!e||!isL(e.t))return;
      const wts=lg.weights?.[ei]||{};
      Object.entries(wts).forEach(([si,sd])=>{
        if(si==="_meta")return;
        csv+=lg.date+","+lg.label+","+e.n+","+(parseInt(si)+1)+","+(sd.lbs||sd||"")+","+(sd.reps||"")+","+dur+"\n";
      });
    });
  });
  
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="forge-export-"+(from||"all")+"-to-"+(to||"now")+".csv";
  a.click();URL.revokeObjectURL(url);
}

let coachAthletes=[],selectedAthlete=null,athleteData=null;

async function loadCoachAthletes(){
  if(!fbUser)return;
  try{
    const snap=await fbDb.ref("users/"+fbUser.uid+"/athletes").once("value");
    const data=snap.val();
    if(data){
      coachAthletes=Object.values(data);
    }else{coachAthletes=[]}
  }catch(e){coachAthletes=[]}
}

async function selectAthlete(uid){
  try{
    const snap=await fbDb.ref("users/"+uid).once("value");
    athleteData=snap.val();
    selectedAthlete=uid;
    rView();
  }catch(e){alert("Could not load athlete data: "+e.message)}
}

function getActiveData(){
  if(S.role==="coach"&&athleteData)return athleteData;
  return S;
}

async function deleteProfile(){
  if(!confirm("DELETE YOUR PROFILE?\n\nThis will permanently erase all your data including workouts, logs, and settings.\n\nThis cannot be undone."))return;
  if(!confirm("Are you absolutely sure? Type OK in the next prompt to confirm."))return;
  const check=prompt("Type DELETE to confirm permanent deletion:");
  if(check!=="DELETE"){alert("Deletion cancelled.");return}
  try{
    // Remove from coach's athlete list if linked
    if(S.linkedCoach&&fbUser){
      await fbDb.ref("users/"+S.linkedCoach+"/athletes/"+fbUser.uid).remove();
    }
    // Remove invite code
    if(S.inviteCode){
      await fbDb.ref("invites/"+S.inviteCode).remove();
    }
    // Remove all athlete links if coach
    if(S.athletes&&fbUser){
      for(const a of Object.values(S.athletes)){
        if(a.uid)await fbDb.ref("users/"+a.uid+"/linkedCoach").remove();
      }
    }
    // Delete user data from Firebase
    if(fbUser)await fbDb.ref(fbUserPath()).remove();
    // Clear local storage
    try{localStorage.removeItem("forge_"+S.user);localStorage.removeItem("forge_last")}catch(e){}
    // Sign out
    setS(null);setFbUser(null);
    await fbAuth.signOut();
    alert("Profile deleted.");
    showLogin();
  }catch(e){alert("Error deleting: "+e.message)}
}
async function init(){
  fbAuth.onAuthStateChanged(async(user)=>{
    if(user){
      setFbUser(user);
      const displayName=user.displayName||user.email||"Athlete";
      ld(displayName);
      S.user=displayName;
      S.email=user.email||"";
      S.photoURL=user.photoURL||"";
      svLocal();
      const updated=await loadFromFb();
      if(updated)ld(displayName);
      S.user=displayName;S.email=user.email||"";S.photoURL=user.photoURL||"";
      svLocal();
      if(!S.weight){showWeightPrompt();return}
      if(!S.role){showRoleSelect();return}
      renderApp();
    }else{
      setFbUser(null);
      showLogin();
    }
  });
}

function showRoleSelect(){
  const photo=S.photoURL?'<img src="'+S.photoURL+'" style="width:50px;height:50px;border-radius:50%;border:2px solid var(--cyan)">':'';
  document.getElementById("app").innerHTML='<div class="lw">'+photo+'<h2>How will you use Forge?</h2><div style="display:grid;grid-template-columns:1fr;gap:12px;width:280px;margin-top:8px"><div class="role-card" onclick="pickRole(\'both\')"><h3>Both</h3><p>I coach myself — full access to build workouts and train</p></div><div class="role-card" onclick="pickRole(\'coach\')"><h3>Coach</h3><p>I build programs for my athletes</p></div><div class="role-card" onclick="pickRole(\'athlete\')"><h3>Athlete</h3><p>My coach builds my program — I log my training</p></div></div></div>';
}

function pickRole(r){
  S.role=r;
  if(r==="coach"||r==="both"){
    if(!S.inviteCode)S.inviteCode=genInviteCode();
  }
  sv();
  if(r==="athlete"){showLinkCoach();return}
  renderApp();
}

function genInviteCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code="";for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];
  // Save invite code to Firebase under a public lookup
  if(fbUser)fbDb.ref("invites/"+code).set({uid:fbUser.uid,name:S.user,photo:S.photoURL||""});
  return code;
}

function showLinkCoach(){
  document.getElementById("app").innerHTML='<div class="lw"><h2>Link to your coach</h2><div style="font-size:13px;color:var(--w3);margin-bottom:8px;text-align:center">Enter the invite code your coach gave you, or skip to train solo</div><input class="li" id="invCode" placeholder="e.g. ABC123" style="text-transform:uppercase;letter-spacing:2px" onkeydown="if(event.key===\'Enter\')linkCoach()"><button class="lb" onclick="linkCoach()">Link to coach</button><button style="background:none;border:none;color:var(--w3);cursor:pointer;font-size:13px;margin-top:12px;font-family:inherit" onclick="S.role=\'both\';if(!S.inviteCode)S.inviteCode=genInviteCode();sv();setTimeout(()=>renderApp(),100)">Skip — I\'ll coach myself</button></div>';
}

async function linkCoach(){
  const code=(document.getElementById("invCode").value||"").trim().toUpperCase();
  if(!code||code.length<4){alert("Please enter a valid invite code");return}
  try{
    const snap=await fbDb.ref("invites/"+code).once("value");
    const data=snap.val();
    if(!data){alert("Invite code not found. Check with your coach.");return}
    S.linkedCoach=data.uid;
    S.coachName=data.name||"Coach";
    if(fbUser){
      await fbDb.ref("users/"+data.uid+"/athletes/"+fbUser.uid).set({name:S.user,photo:S.photoURL||"",uid:fbUser.uid});
    }
    sv();
    // Small delay to ensure DOM is ready after sv triggers
    setTimeout(()=>renderApp(),100);
  }catch(e){alert("Error linking: "+e.message)}
}
function showLogin(){
  document.getElementById("app").innerHTML='<div class="lw"><img src="'+AB+'" style="width:80px"><h2>Forge</h2><div style="font-size:13px;color:var(--w3);margin-bottom:8px">Sign in to sync across devices</div><button class="g-btn" onclick="doGoogleLogin()"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G"> Sign in with Google</button></div>'}

async function doGoogleLogin(){
  try{await fbAuth.signInWithPopup(gProvider)}
  catch(e){
    if(e.code==="auth/popup-blocked"){
      try{await fbAuth.signInWithRedirect(gProvider)}
      catch(e2){alert("Sign in failed: "+e2.message)}
    }else{alert("Sign in failed: "+e.message)}
  }
}

function showWeightPrompt(){
  const photo=S.photoURL?'<img src="'+S.photoURL+'" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--cyan)">':'<img src="'+AB+'" style="width:80px">';
  document.getElementById("app").innerHTML='<div class="lw">'+photo+'<h2>Welcome, '+S.user+'</h2><div style="font-size:14px;color:var(--w2);margin-bottom:4px">Current weight (lbs)</div><input class="li" id="wIn" type="text" inputmode="decimal" placeholder="e.g. 181" value="'+(S.weight||"")+'" onkeydown="if(event.key===\'Enter\')doW()"><button class="lb" onclick="doW()">Continue</button></div>'}

function doW(){const w=(document.getElementById("wIn").value||"").trim();if(!w)return;S.weight=w;S.chk.bw=w;sv();if(!S.role){showRoleSelect();return}renderApp()}

function logout(){setS(null);setFbUser(null);try{localStorage.removeItem("forge_last")}catch(e){}fbAuth.signOut();showLogin()}

function cDT(add){return S.days.map((d,i)=>'<button class="dtab'+(i===cD?' a':'')+'" onclick="cD='+i+';rView()">'+d.label+'</button>').join("")+(add?'<button class="dtab-add" onclick="addDay()">+ Day</button>':"")}
function addDay(){if(S.days.length>=7)return;S.days.push({label:"Day "+(S.days.length+1),exercises:[]});cD=S.days.length-1;sv();rView()}
function delDay(){if(S.days.length<=1)return;S.days.splice(cD,1);if(cD>=S.days.length)cD=S.days.length-1;sv();rView()}

function renderApp(){
document.getElementById("app").innerHTML='<div class="top"><h1><img src="'+AT+'"> Forge</h1><div class="psw" id="modeButtons"></div></div><div class="ctx" id="ctxBar">'+(S.photoURL?'<img class="user-avatar" src="'+S.photoURL+'">':'')+'<span>'+S.user+'</span><span id="ctxWt">'+S.weight+' lbs</span><span class="sync-bar" style="border:none;padding:0;margin:0;background:none"><span class="dot off" id="syncDot"></span><span id="syncTxt" style="font-size:10px">Syncing</span></span><button class="lo" onclick="logout()">Logout</button><button class="del-btn" onclick="deleteProfile()">Delete</button></div><div id="mainV"></div><div id="ovl" style="display:none"></div>';
// Set mode buttons based on role
const modeEl=document.getElementById("modeButtons");
if(!modeEl){console.warn("modeButtons not found");return}
if(S.role==="both"){
  modeEl.innerHTML='<button class="pb'+(curMode==="c"?" a":"")+'" onclick="swP(\'c\')">Coach</button><button class="pb'+(curMode==="a"?" a":"")+'" onclick="swP(\'a\')">Athlete</button>';
}else if(S.role==="coach"){
  curMode="c";
  modeEl.innerHTML='<button class="pb a">Coach</button>';
}else{
  curMode="a";
  modeEl.innerHTML='<button class="pb a">Athlete</button>';
}
// Load athletes then render
if(S.role==="coach"||S.role==="both"){
  loadCoachAthletes().then(()=>rView()).catch(()=>rView());
}else{rView()}}

function updCtxWt(){const el=document.getElementById("ctxWt");if(el)el.textContent=S.weight+" lbs"}

function rView(){if(curMode==="c")rCoachView();else rAthView()}

function rCoachView(){
const el=document.getElementById("mainV");
let ctabs='<div class="tabs"><button class="tab'+(coachTab==="arch"?" a":"")+'" onclick="coachTab=\'arch\';rCoachView()">Architect</button><button class="tab'+(coachTab==="lib"?" a":"")+'" onclick="coachTab=\'lib\';rCoachView()">Exercise Library</button><button class="tab'+(coachTab==="rec"?" a":"")+'" onclick="coachTab=\'rec\';rCoachView()">Recovery</button><button class="tab'+(coachTab==="dash"?" a":"")+'" onclick="coachTab=\'dash\';rCoachView()">Dashboard</button>';
if(S.role==="coach"||S.role==="both")ctabs+='<button class="tab'+(coachTab==="team"?" a":"")+'" onclick="coachTab=\'team\';rCoachView()">My Athletes</button>';
ctabs+='</div>';
let editLabel=selectedAthlete?coachAthletes.find(a=>a.uid===selectedAthlete)?.name||"Athlete":"My Program";
let topBar=(S.role==="coach"||S.role==="both")?'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:var(--ob3);border:1px solid var(--sb);border-radius:8px;font-size:13px"><span style="color:var(--w3)">Editing:</span><span style="color:var(--cyan);font-weight:600">'+editLabel+'</span>'+(selectedAthlete?'<button class="bs" style="margin-left:auto;font-size:11px;padding:3px 8px;min-height:28px" onclick="selectedAthlete=null;athleteData=null;rView()">Back to mine</button>':'')+'</div>':'';
el.innerHTML=ctabs+topBar+'<div id="cC"></div>';
if(coachTab==="arch")rArch();else if(coachTab==="lib")rLib();else if(coachTab==="rec")rCoachRec();else if(coachTab==="team")rTeam();else rCoachDash()}

function rTeam(){
var el=document.getElementById("cC");if(!el)return;
var h='<div class="cd"><div class="ch"><h3>Invite code</h3></div>';
h+='<div style="font-size:12px;color:var(--w3);margin-bottom:8px">Share this code with your athletes</div>';
h+='<div class="invite-code" onclick="copyInvite()">'+S.inviteCode+'</div>';
h+='<button class="bs" onclick="copyInvite()" style="width:100%;margin-top:6px">Copy code</button></div>';
if(coachAthletes.length>0){
h+='<div class="cd"><div class="ch"><h3>Your athletes ('+coachAthletes.length+')</h3></div>';
h+='<div class="athlete-roster">';
for(var ai=0;ai<coachAthletes.length;ai++){var a=coachAthletes[ai];
h+='<div class="athlete-item'+(selectedAthlete===a.uid?' active':'')+'" style="flex-wrap:wrap">';
h+='<span class="aname" style="flex:1;cursor:pointer" onclick="selectAthlete(\x27'+a.uid+'\x27)">'+(a.name||'Athlete')+'</span>';
h+='<button class="bs" style="font-size:11px;padding:4px 8px;min-height:28px" onclick="selectAthlete(\x27'+a.uid+'\x27)">View</button>';
h+='<button class="dbtn" style="font-size:11px" onclick="removeAthlete(\x27'+a.uid+'\x27)">Remove</button>';
h+='</div>';}
h+='</div></div>';
}else{
h+='<div class="cd"><div style="text-align:center;padding:20px;color:var(--w3)">';
h+='<div style="font-size:13px">No athletes linked yet</div>';
h+='<div style="font-size:12px;margin-top:4px">Share your invite code to get started</div>';
h+='</div></div>';}
el.innerHTML=h}

async function removeAthlete(uid){
  var a=coachAthletes.find(function(x){return x.uid===uid});
  var nm=a?a.name:'this athlete';
  if(!confirm('Remove '+nm+'? They will need to re-link to rejoin.'))return;
  try{
    if(fbUser)await fbDb.ref('users/'+fbUser.uid+'/athletes/'+uid).remove();
    await fbDb.ref('users/'+uid+'/linkedCoach').remove();
    await fbDb.ref('users/'+uid+'/coachName').remove();
    await fbDb.ref('users/'+uid+'/role').remove();
    coachAthletes=coachAthletes.filter(function(x){return x.uid!==uid});
    if(selectedAthlete===uid){selectedAthlete=null;athleteData=null}
    rView();
  }catch(e){alert('Error: '+e.message)}
}

function copyInvite(){
  if(navigator.clipboard){navigator.clipboard.writeText(S.inviteCode).then(()=>alert("Copied: "+S.inviteCode))}
  else{alert("Your invite code: "+S.inviteCode)}
}
function rArch(){
const el=document.getElementById("cC");const d=cDay(cD);const wu=getWU();const v=cV(cD);
let h='<div class="dtabs">'+cDT(true)+'</div><div class="cd"><div class="wdh"><input value="'+d.label+'" onchange="cDay(cD).label=this.value;sv();rView()" placeholder="Day name">';
if(S.days.length>1)h+='<button class="bs" style="color:var(--red);border-color:var(--red)" onclick="delDay()">Delete</button>';
h+='</div><div style="font-size:12px;color:var(--w2);margin:8px 0 4px">Warm-up (auto-matched)</div>';
h+=wu.map(w=>{const ex=aDB().find(e=>e.n===w.name);return '<div class="er"><span class="en">'+w.name+'</span><span class="bg '+(ex?tB(ex.t):"ba")+'" style="font-size:10px">'+(ex?ex.t:"mobility")+'</span><span class="wr">'+w.reason+'</span></div>'}).join("");
h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px"><span style="font-size:12px;color:var(--w2)">Working sets &amp; cardio</span><button class="bs" onclick="showAdd(\'working\')">+ Add</button></div>';
let lastSS="";h+=d.exercises.map((w,i)=>{const e=gx(w.exId);if(!e)return "";
let row="";const curSS=w.ss||"";
if(curSS&&curSS!==lastSS)row+='<div class="ss-group"><div class="ss-label">Superset '+curSS+'</div>';
const restStr=w.rest!==undefined&&w.rest>0?' <span class="wr">Rest: '+(w.rest>=60?Math.floor(w.rest/60)+":"+(w.rest%60<10?"0":"")+w.rest%60:w.rest+"s")+'</span>':"";
row+='<div class="er" data-di="'+i+'"><span class="en">'+e.n+'</span>'+(e.t==="cardio"?'<span class="ed">'+w.reps+'</span>':'<span class="ed">'+w.sets+" x "+addTips(w.reps)+'</span>')+'<span class="bg '+tB(e.t)+'" style="font-size:10px">'+(e.p==="Cardio"?"Cardio":e.p)+'</span>'+restStr+'<span class="dgrip" data-di="'+i+'" ontouchstart="tds2(event,'+i+')" ontouchmove="tdm2(event)" ontouchend="tde2(event)" onmousedown="mds2(event,'+i+')">⠿</span><div class="move-btns"><button class="move-btn" onclick="moveEx('+i+',-1)">▲</button><button class="move-btn" onclick="moveEx('+i+',1)">▼</button></div><button class="sbtn" onclick="editEx('+i+')">Edit</button>'+(SWAP[w.exId]?'<button class="sbtn" onclick="cDay(cD).exercises['+i+'].exId=SWAP['+w.exId+'];sv();rView()">Swap</button>':'')+'<button class="dbtn" onclick="cDay(cD).exercises.splice('+i+',1);sv();rView()">Del</button></div>';
const nextSS=d.exercises[i+1]?.ss||"";if(curSS&&nextSS!==curSS)row+='</div>';
lastSS=curSS;return row}).join("");
h+='</div>';
h+='<div class="cd"><div class="ch"><h3>Volume</h3><span class="bg bb">'+Object.values(v).reduce((a,b)=>a+b,0)+' sets</span></div><div class="vt">'+Object.keys(v).sort((a,b)=>v[b]-v[a]).map(m=>{const s=v[m],c=hC(s);return '<div class="vi"><div style="width:100%"><div style="display:flex;justify-content:space-between"><span>'+m+'</span><span style="font-weight:600;color:'+c+'">'+s+'</span></div><div class="vb"><div class="vf" style="width:'+Math.min(100,Math.round(s/16*100))+'%;background:'+c+'"></div></div></div></div>'}).join("")+'</div></div>';
h+='<div class="cd"><div class="ch"><h3>Heat map</h3><div style="display:flex;gap:6px;font-size:11px;color:var(--w3)"><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#1D9E75"></span>Low</span><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#7F77DD"></span>Mid</span><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#ED4FBA"></span>High</span></div></div><div class="bmap"><div class="hlg"><span>High</span><div class="hlg-bar"></div><span>Low</span></div><div><div class="bwrap"><img src="'+BF+'"><canvas id="cvF"></canvas></div><div class="blbl">Front</div></div><div><div class="bwrap"><img src="'+BB+'"><canvas id="cvB"></canvas></div><div class="blbl">Back</div></div></div></div>';
el.innerHTML=h;renderHeatMap(v)}

function getWU(){const pr=new Set();cDay(cD).exercises.forEach(w=>{const e=gx(w.exId);if(e&&e.p!=="Cardio"){pr.add(e.p);(e.s||[]).forEach(s=>{if(s!=="Cardio")pr.add(s)})}});const wu=[],sn=new Set();pr.forEach(p=>{(WM[p]||[]).forEach(w=>{if(!sn.has(w)){sn.add(w);wu.push({name:w,reason:p})}})});return wu.slice(0,6)}

function rCoachRec(){
const el=document.getElementById("cC");
let h='<div class="cd"><div class="ch"><h3>Nutrition compliance items</h3><button class="bs" onclick="addNC()">+ Add</button></div><div style="font-size:12px;color:var(--w3);margin-bottom:8px">These appear to the athlete for daily tracking</div>';
h+=S.ncItems.map((item,i)=>'<div class="nc-item"><span>'+item+'</span><button class="dbtn" onclick="S.ncItems.splice('+i+',1);sv();rCoachRec()">Remove</button></div>').join("");
h+='</div>';

el.innerHTML=h}

function addNC(){
const el=document.getElementById("ovl");
el.innerHTML='<div class="ovl" onclick="if(event.target===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>Add compliance item</h3><button class="bs" onclick="clO()">Close</button></div><label>Item name</label><input class="fi" id="ncN" placeholder="e.g. 8 hours sleep"><div style="margin-top:12px"><button class="bs bsa" onclick="svNC()" style="width:100%;padding:12px;min-height:48px">Save</button></div></div></div>';
el.style.display="block"}
function svNC(){const v=(document.getElementById("ncN").value||"").trim();if(!v)return;S.ncItems.push(v);sv();clO();rCoachRec()}

function rCoachDash(){
const el=document.getElementById("cC");
const lifts=[];S.days.forEach((d,di)=>{d.exercises.forEach((w,ei)=>{const e=gx(w.exId);if(e&&isL(e.t))lifts.push({name:e.n,di,ei,label:d.label})})});
let h='<div class="mg"><div class="mc"><div class="l">Workout days</div><div class="v">'+S.days.length+'</div></div><div class="mc"><div class="l">Logged</div><div class="v">'+S.log.length+'</div></div><div class="mc"><div class="l">Exercises</div><div class="v">'+aDB().length+'</div></div><div class="mc"><div class="l">Bodyweight</div><div class="v">'+S.weight+' lbs</div></div></div>';
h+='<div class="cd"><div class="ch"><h3>Exercise progression</h3></div><select class="fsel" id="cdSel" onchange="rCDCh()">';
lifts.forEach((l,i)=>h+='<option value="'+i+'">'+l.label+" — "+l.name+'</option>');
h+='</select><div style="position:relative;width:100%;height:220px;margin-top:10px"><canvas id="cdCh"></canvas></div></div>';
h+='<div class="cd"><div class="ch"><h3>Volume load trend</h3></div><div style="position:relative;width:100%;height:200px"><canvas id="coCh"></canvas></div></div>';
h+='<div class="cd"><div class="ch"><h3>Export data</h3></div><div style="display:flex;gap:8px;margin-bottom:8px"><div class="cf" style="flex:1"><label>From</label><input class="fi" type="date" id="expFrom"></div><div class="cf" style="flex:1"><label>To</label><input class="fi" type="date" id="expTo"></div></div><button class="bs bsa" onclick="exportData()" style="width:100%;padding:10px;min-height:44px">Download CSV</button></div>';
el.innerHTML=h;setTimeout(()=>{rCDCh();rCOCh()},100)}

function rCDCh(){
const sel=document.getElementById("cdSel");if(!sel)return;
const lifts=[];S.days.forEach((d,di)=>{d.exercises.forEach((w,ei)=>{const e=gx(w.exId);if(e&&isL(e.t))lifts.push({di,ei})})});
const l=lifts[parseInt(sel.value)||0];if(!l)return;
const pts=[];
S.log.forEach(lg=>{
  if(lg.dayIdx==l.di&&lg.weights&&lg.weights[l.ei]){
    const raw=lg.weights[l.ei];let wts=[];
    if(typeof raw==="object"&&!Array.isArray(raw)){
      Object.entries(raw).forEach(([k,s])=>{if(k==="_meta")return;if(Array.isArray(s)){s.forEach(item=>{if(item&&typeof item==="object"&&item.lbs){const n=parseFloat(item.lbs);if(!isNaN(n)&&n<2000)wts.push(n)}else{const n=parseFloat(item);if(!isNaN(n)&&n<2000)wts.push(n)}})}else if(s&&s.lbs){const n=parseFloat(s.lbs);if(!isNaN(n)&&n<2000)wts.push(n)}else if(typeof s==="string"||typeof s==="number"){const n=parseFloat(s);if(!isNaN(n)&&n<2000)wts.push(n)}});
    }else if(Array.isArray(raw)){raw.forEach(v=>{if(v&&typeof v==="object"&&v.lbs){const n=parseFloat(v.lbs);if(!isNaN(n)&&n<2000)wts.push(n)}else{const n=parseFloat(v);if(!isNaN(n)&&n<2000)wts.push(n)}})}
    if(wts.length)pts.push({date:lg.date,max:Math.max(...wts)});
  }
});
const c=document.getElementById("cdCh");if(!c)return;if(c._c)c._c.destroy();
if(pts.length===0){c.parentElement.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--w3)">No logged data yet.<br>Complete workouts to see progress.</div>';return}
const minY=Math.min(...pts.map(p=>p.max));const maxY=Math.max(...pts.map(p=>p.max));const pad=Math.max(10,Math.round((maxY-minY)*0.2)||10);
c._c=new Chart(c,{type:"line",data:{labels:pts.map(p=>p.date.slice(5)),datasets:[{data:pts.map(p=>p.max),borderColor:"#00F2FF",backgroundColor:"rgba(0,242,255,.15)",fill:true,tension:.3,pointRadius:6,pointBackgroundColor:"#00F2FF",pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:minY-pad,max:maxY+pad,grid:{color:"rgba(192,192,192,.06)"},ticks:{color:"#A8A8A8",font:{size:11}}},x:{grid:{display:false},ticks:{color:"#A8A8A8",font:{size:10}}}}}})
}

function rCOCh(){
const c=document.getElementById("coCh");if(!c)return;if(c._c)c._c.destroy();
const bd={};
S.log.forEach(lg=>{
  if(!lg.weights)return;
  let totalVol=0;
  Object.entries(lg.weights).forEach(([k,s])=>{
    if(k==="_meta")return;
    if(Array.isArray(s)){
      s.forEach(item=>{
        if(item&&typeof item==="object"&&item.lbs&&item.reps){
          const w=parseFloat(item.lbs);const r=parseInt(item.reps);
          if(!isNaN(w)&&!isNaN(r)&&w<2000)totalVol+=w*r;
        }
      });
    }else if(typeof s==="object"&&s!==null){
      Object.entries(s).forEach(([sk,v])=>{
        if(sk==="_meta")return;
        if(v&&typeof v==="object"&&v.lbs&&v.reps){
          const w=parseFloat(v.lbs);const r=parseInt(v.reps);
          if(!isNaN(w)&&!isNaN(r)&&w<2000)totalVol+=w*r;
        }
      });
    }
  });
  if(totalVol>0)bd[lg.date]=(bd[lg.date]||0)+totalVol;
});
const ds=Object.keys(bd).sort();
if(ds.length===0){c.parentElement.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--w3)">No data yet.</div>';return}
const vals=ds.map(d=>bd[d]);const minY=Math.min(...vals);const maxY=Math.max(...vals);const pad=Math.max(500,Math.round((maxY-minY)*0.15)||500);
c._c=new Chart(c,{type:"line",data:{labels:ds.map(d=>d.slice(5)),datasets:[{data:vals,borderColor:"#ED4FBA",backgroundColor:"rgba(237,79,186,.12)",fill:true,tension:.3,pointRadius:6,pointBackgroundColor:"#ED4FBA",pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.parsed.y.toLocaleString()+" lbs total volume"}}}},scales:{y:{min:Math.max(0,minY-pad),max:maxY+pad,grid:{color:"rgba(192,192,192,.06)"},ticks:{color:"#A8A8A8",font:{size:10},callback:function(v){return v>=1000?(v/1000).toFixed(1)+"k":v}}},x:{grid:{display:false},ticks:{color:"#A8A8A8",font:{size:10}}}}}})
}

// ===== ATHLETE VIEW =====
function rAthView(){
const el=document.getElementById("mainV");
el.innerHTML='<div class="tabs"><button class="tab'+(athTab==="exec"?" a":"")+'" onclick="athTab=\'exec\';rAthView()">Workout</button><button class="tab'+(athTab==="dash"?" a":"")+'" onclick="athTab=\'dash\';rAthView()">Dashboard</button><button class="tab'+(athTab==="cal"?" a":"")+'" onclick="athTab=\'cal\';rAthView()">Calendar</button><button class="tab'+(athTab==="rec"?" a":"")+'" onclick="athTab=\'rec\';rAthView()">Recovery</button></div><div id="aC"></div>';
if(athTab==="exec")rExec();else if(athTab==="dash")rDash();else if(athTab==="cal")rCal();else rRec()}

function rExec(){
const el=document.getElementById("aC");const d=cDay(cD);const wu=getWU();const wk=wlk(cD);
if(!S.wlogs[wk])S.wlogs[wk]={};
if(!S.wlogs[wk]._meta)S.wlogs[wk]._meta={};
const meta=S.wlogs[wk]._meta;
const started=!!meta.startTime;
let h='<div class="dtabs">'+cDT(false)+'</div>';

if(!started){
var avgDur=calcAvgDuration(cD);
h+=(avgDur?'<div style="font-size:12px;color:var(--w3);text-align:center;margin-bottom:8px">Avg duration: '+avgDur+'</div>':'')+'<button class="start-workout-btn" onclick="startWorkout()">▶ Start '+d.label+'</button>';
h+='<div class="cd">';
}else{
h+='<div class="workout-timer" id="wkTimer" style="display:flex;align-items:center;justify-content:center;gap:10px"><span id="wkTimeText">⏱ '+fmtElapsed(meta.startTime,meta.pausedTotal||0)+'</span>'+(!meta.paused?'<button class="bs" onclick="pauseWorkout()" style="padding:4px 12px;min-height:32px">Pause</button>':'<button class="bs" style="padding:4px 12px;min-height:32px;border-color:var(--cyan);color:var(--cyan)" onclick="resumeWorkout()">Resume</button>')+'<button class="bs" onclick="cancelWorkout()" style="padding:4px 12px;min-height:32px;border-color:var(--red);color:var(--red)">Cancel</button></div>';
h+='<div class="cd">';
}

h+='<div style="font-size:14px;color:var(--wht);margin-bottom:8px;font-weight:700">Warm-up</div>';
h+=wu.map(w=>'<div class="er"><span class="en" style="font-weight:400">'+w.name+'</span><span class="ed">2 x 10</span></div>').join("");

h+='<div style="font-size:14px;color:var(--wht);margin:12px 0 8px;font-weight:700">Workout</div>';
let lastSS="";
d.exercises.map((w,i)=>{const e=gx(w.exId);if(!e)return;
const curSS=w.ss||"";
if(curSS&&curSS!==lastSS)h+='<div class="ss-group"><div class="ss-label">Superset '+curSS+'</div>';

const restSec=w.rest!==undefined?w.rest:(e.r||0);
const restStr=restSec>0?"Rest "+fmtRest(restSec):"";
const repTargets=(w.reps||"").split(",").map(r=>r.trim());

h+='<div class="ex-card">';
h+='<div class="ex-head"><span class="ex-name">'+e.n+'</span>';
h+='<span class="bg '+tB(e.t)+'" style="font-size:10px">'+((e.t==="cardio")?"Cardio":e.p)+'</span></div>';
h+='<div class="ex-pills">';
if(e.t==="cardio"){h+='<span class="ex-pill">'+w.reps+'</span>';}
else{
h+='<span class="ex-pill">Sets '+w.sets+'</span>';
h+='<span class="ex-pill">Reps '+addTips(w.reps)+'</span>';
if(restStr)h+='<span class="ex-pill">'+restStr+'</span>';
}
h+='</div>';

if(isL(e.t)){
const wts=S.wlogs[wk][i]||{};
const prevData=getPrevWts(cD,i);

h+='<div style="display:flex;gap:8px;padding:4px 0;align-items:center"><span class="set-num"></span><span class="set-label" style="width:80px;text-align:center;font-size:11px;color:var(--w3)">lbs</span><span class="set-label" style="width:80px;text-align:center;font-size:11px;color:var(--w3)">Reps</span><span style="width:36px"></span></div>';

for(let s=0;s<w.sets;s++){
const setData=wts[s]||{};
const prevSet=prevData?prevData[s]:null;
const prevLbs=prevSet?(typeof prevSet.lbs==="object"?String(prevSet.lbs.lbs||""):String(prevSet.lbs||"")):"";
const prevReps=prevSet?(typeof prevSet.reps==="object"?String(prevSet.reps.reps||""):String(prevSet.reps||"")):"";
const curLbs=setData.lbs?(typeof setData.lbs==="object"?"":String(setData.lbs)):"";
const curReps=setData.reps?(typeof setData.reps==="object"?"":String(setData.reps)):"";
const showLbs=curLbs||prevLbs;
const showReps=curReps||prevReps;
const isCarriedLbs=!curLbs&&!!prevLbs;
const isCarriedReps=!curReps&&!!prevReps;
const target=repTargets[s]||repTargets[repTargets.length-1]||"";
const isDone=setData.done||false;

const lbsClass=isCarriedLbs?"carried":"fresh";
const repsClass=isCarriedReps?"carried":"fresh";

let olClass="";
if(prevLbs&&curLbs){
const pn=parseFloat(prevLbs),cn=parseFloat(curLbs);
const pr=prevReps?parseInt(prevReps):0,cr=curReps?parseInt(curReps):0;
if(!isNaN(pn)&&!isNaN(cn)){
if(cn>pn||(cn===pn&&cr>pr))olClass=" progress";
else if(cn===pn&&cr===pr)olClass=" stalled";
else if(cn<pn)olClass=" regress";
}}

h+='<div class="set-row">';
h+='<span class="set-num">'+(s<9?"0":"")+(s+1)+'</span>';
h+='<input class="set-input '+lbsClass+olClass+'" type="text" inputmode="decimal" placeholder="'+(prevLbs||"lbs")+'" value="'+showLbs+'" onfocus="onSetFocus(this,'+i+','+s+',\'lbs\',\''+prevLbs+'\')" onchange="onSetChange(this,'+i+','+s+',\'lbs\',\''+prevLbs+'\')" data-prev="'+prevLbs+'">';
h+='<input class="set-input '+repsClass+'" type="text" inputmode="numeric" placeholder="'+target+'" value="'+showReps+'" onfocus="onSetFocus(this,'+i+','+s+',\'reps\',\''+prevReps+'\')" onchange="onSetChange(this,'+i+','+s+',\'reps\',\''+prevReps+'\')" data-prev="'+prevReps+'">';
h+='<button class="set-check'+(isDone?" done":"")+'" onclick="completeSet('+i+','+s+','+restSec+',this)">✓</button>';
h+='</div>';

if(olClass===" stalled"&&curLbs){
h+='<div class="overload-hint warn">↑ Try +'+(parseFloat(prevLbs)>=100?"5":"2.5")+' lbs to progress</div>';
}else if(olClass===" regress"&&curLbs){
h+='<div class="overload-hint bad">↓ Below last session</div>';
}else if(olClass===" progress"&&curLbs){
h+='<div class="overload-hint good">✓ Progressive overload</div>';
}
}

if(prevData){
const prevStr=Object.entries(prevData).filter(([k,p])=>k!=="_meta"&&p&&p.lbs).map(([k,p],j)=>"S"+(j+1)+": "+p.lbs+"×"+(p.reps||"?")).join("  ");
if(prevStr)h+='<div class="ex-prev">Last session: '+prevStr+'</div>';
}
}
h+='</div>';

const nextSS=d.exercises[i+1]?.ss||"";
if(curSS&&nextSS!==curSS)h+='</div>';
lastSS=curSS;
});

h+='</div>';
if(started){
h+='<button class="end-workout-btn" onclick="endWorkout()">⏹ End workout & save</button>';
}
el.innerHTML=h;
if(started)startWkClock();
}

function logSet(ei,si,field,v){const wk=wlk(cD);if(!S.wlogs[wk])S.wlogs[wk]={};if(!S.wlogs[wk][ei])S.wlogs[wk][ei]={};if(!S.wlogs[wk][ei][si])S.wlogs[wk][ei][si]={};S.wlogs[wk][ei][si][field]=v;sv()}
function toggleSetDone(ei,si,btn){const wk=wlk(cD);if(!S.wlogs[wk])S.wlogs[wk]={};if(!S.wlogs[wk][ei])S.wlogs[wk][ei]={};if(!S.wlogs[wk][ei][si])S.wlogs[wk][ei][si]={};S.wlogs[wk][ei][si].done=!S.wlogs[wk][ei][si].done;btn.classList.toggle("done");sv()}
function getPrevWts(di,ei){const t=new Date();for(let d=1;d<60;d++){const dt=new Date(t);dt.setDate(dt.getDate()-d);const ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");const k=ds+"_"+di;if(S.wlogs[k]&&S.wlogs[k][ei]){const data=S.wlogs[k][ei];const clean={};Object.entries(data).forEach(([si,v])=>{if(si==="_meta")return;if(typeof v==="object"&&v!==null){clean[si]={lbs:String(v.lbs||""),reps:String(v.reps||"")}}else if(typeof v==="string"||typeof v==="number"){clean[si]={lbs:String(v),reps:""}}});if(Object.keys(clean).length>0)return clean}}return null}
// markDone replaced by endWorkout

function rDash(){
const el=document.getElementById("aC");
const lifts=[];S.days.forEach((d,di)=>{d.exercises.forEach((w,ei)=>{const e=gx(w.exId);if(e&&isL(e.t))lifts.push({name:e.n,di,ei,label:d.label})})});
let h='<div class="cd"><div class="ch"><h3>Exercise progression</h3></div><select class="fsel" id="dSel" onchange="rDCh()">';
lifts.forEach((l,i)=>h+='<option value="'+i+'">'+l.label+" — "+l.name+'</option>');
h+='</select><div style="position:relative;width:100%;height:220px;margin-top:10px"><canvas id="dCh"></canvas></div></div>';
h+='<div class="cd"><div class="ch"><h3>Volume load trend</h3></div><div style="position:relative;width:100%;height:200px"><canvas id="oCh"></canvas></div></div>';

el.innerHTML=h;setTimeout(()=>{rDCh();rOCh()},100)}

function rDCh(){
const sel=document.getElementById("dSel");if(!sel)return;
const lifts=[];S.days.forEach((d,di)=>{d.exercises.forEach((w,ei)=>{const e=gx(w.exId);if(e&&isL(e.t))lifts.push({di,ei})})});
const l=lifts[parseInt(sel.value)||0];if(!l)return;
const pts=[];
S.log.forEach(lg=>{
  const diMatch=lg.dayIdx==l.di;
  const hasW=lg.weights&&lg.weights[l.ei];
  if(diMatch&&hasW){
    const raw=lg.weights[l.ei];
    let wts=[];
    if(typeof raw==="object"&&!Array.isArray(raw)){
      Object.entries(raw).forEach(([k,s])=>{
        if(k==="_meta")return;
        if(s&&s.lbs){const n=parseFloat(s.lbs);if(!isNaN(n)&&n<2000)wts.push(n)}
        else if(typeof s==="string"||typeof s==="number"){const n=parseFloat(s);if(!isNaN(n)&&n<2000)wts.push(n)}
      });
    }else if(Array.isArray(raw)){raw.forEach(v=>{if(v&&typeof v==="object"&&v.lbs){const n=parseFloat(v.lbs);if(!isNaN(n)&&n<2000)wts.push(n)}else{const n=parseFloat(v);if(!isNaN(n)&&n<2000)wts.push(n)}})}
    if(wts.length)pts.push({date:lg.date,max:Math.max(...wts)});
  }
});
console.log("Dashboard chart pts:",pts,"for lift:",l,"from",S.log.length,"logs");
const c=document.getElementById("dCh");if(!c)return;if(c._c)c._c.destroy();
if(pts.length===0){c.parentElement.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--w3)">No logged data yet for this exercise.<br>Complete a workout to see your progress.</div>';return}
const minY=Math.min(...pts.map(p=>p.max));
const maxY=Math.max(...pts.map(p=>p.max));
const pad=Math.max(10,Math.round((maxY-minY)*0.2)||10);
c._c=new Chart(c,{type:"line",data:{labels:pts.map(p=>p.date.slice(5)),datasets:[{data:pts.map(p=>p.max),borderColor:"#00F2FF",backgroundColor:"rgba(0,242,255,.15)",fill:true,tension:.3,pointRadius:6,pointBackgroundColor:"#00F2FF",pointBorderColor:"#00F2FF",pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:minY-pad,max:maxY+pad,grid:{color:"rgba(192,192,192,.06)"},ticks:{color:"#A8A8A8",font:{size:11}}},x:{grid:{display:false},ticks:{color:"#A8A8A8",font:{size:10}}}}}})
}

function rOCh(){
const c=document.getElementById("oCh");if(!c)return;if(c._c)c._c.destroy();
const bd={};
S.log.forEach(lg=>{
  if(!lg.weights)return;
  let totalVol=0;
  Object.entries(lg.weights).forEach(([k,s])=>{
    if(k==="_meta")return;
    if(Array.isArray(s)){
      s.forEach(item=>{
        if(item&&typeof item==="object"&&item.lbs&&item.reps){
          const w=parseFloat(item.lbs);const r=parseInt(item.reps);
          if(!isNaN(w)&&!isNaN(r)&&w<2000)totalVol+=w*r;
        }
      });
    }else if(typeof s==="object"&&s!==null){
      Object.entries(s).forEach(([sk,v])=>{
        if(sk==="_meta")return;
        if(v&&typeof v==="object"&&v.lbs&&v.reps){
          const w=parseFloat(v.lbs);const r=parseInt(v.reps);
          if(!isNaN(w)&&!isNaN(r)&&w<2000)totalVol+=w*r;
        }
      });
    }
  });
  if(totalVol>0)bd[lg.date]=(bd[lg.date]||0)+totalVol;
});
const ds=Object.keys(bd).sort();
if(ds.length===0){c.parentElement.innerHTML='<div style="text-align:center;padding:40px 0;color:var(--w3)">No data yet.</div>';return}
const vals=ds.map(d=>bd[d]);const minY=Math.min(...vals);const maxY=Math.max(...vals);const pad=Math.max(500,Math.round((maxY-minY)*0.15)||500);
c._c=new Chart(c,{type:"line",data:{labels:ds.map(d=>d.slice(5)),datasets:[{data:vals,borderColor:"#ED4FBA",backgroundColor:"rgba(237,79,186,.12)",fill:true,tension:.3,pointRadius:6,pointBackgroundColor:"#ED4FBA",pointBorderWidth:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.parsed.y.toLocaleString()+" lbs total volume"}}}},scales:{y:{min:Math.max(0,minY-pad),max:maxY+pad,grid:{color:"rgba(192,192,192,.06)"},ticks:{color:"#A8A8A8",font:{size:10},callback:function(v){return v>=1000?(v/1000).toFixed(1)+"k":v}}},x:{grid:{display:false},ticks:{color:"#A8A8A8",font:{size:10}}}}}})
}

function rCal(){
const el=document.getElementById("aC");const yr=calY,mo=calM;
const first=new Date(yr,mo,1).getDay();const dim=new Date(yr,mo+1,0).getDate();
const today=new Date();const todayD=(today.getFullYear()===yr&&today.getMonth()===mo)?today.getDate():-1;
const wMap={};S.log.forEach(l=>{const d=new Date(l.date);if(d.getFullYear()===yr&&d.getMonth()===mo){const dd=d.getDate();if(!wMap[dd])wMap[dd]=[];wMap[dd].push(l.label)}});
const rMap={};Object.entries(S.recLog).forEach(([k,v])=>{const d=new Date(k);if(d.getFullYear()===yr&&d.getMonth()===mo)rMap[d.getDate()]=v});
let h='<div class="cd"><div class="cal-nav"><button onclick="calM--;if(calM<0){calM=11;calY--}rCal()">◀</button><span>'+MN[mo]+" "+yr+'</span><button onclick="calM++;if(calM>11){calM=0;calY++}rCal()">▶</button></div><div class="cal-grid">';
["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(d=>h+='<div class="cal-hd">'+d+'</div>');
for(let i=0;i<first;i++)h+='<div class="cal-empty"></div>';
for(let d=1;d<=dim;d++){const isT=d===todayD?" today":"";const wks=wMap[d]||[];const rec=rMap[d];
h+='<div class="cal-day'+isT+'"><div class="dn">'+d+'</div>';
wks.forEach(w=>h+='<div class="dw">'+w+'</div>');
if(rec!==undefined)h+='<span class="cal-dot" style="background:'+compColor(rec)+'"></span>';
h+='</div>'}
h+='</div></div>';
h+='<div style="display:flex;gap:8px;justify-content:center;margin-top:4px;font-size:11px;color:var(--w3)"><span style="display:flex;align-items:center;gap:3px"><span class="cal-dot" style="background:#1D9E75"></span>&lt;25%</span><span style="display:flex;align-items:center;gap:3px"><span class="cal-dot" style="background:#7F77DD"></span>25-75%</span><span style="display:flex;align-items:center;gap:3px"><span class="cal-dot" style="background:#ED4FBA"></span>&gt;75%</span></div>';
el.innerHTML=h}

function rRec(){
const el=document.getElementById("aC");const dt=tds();const saved=S.recLog[dt];
let h='<div class="cd"><div class="ch"><h3>Daily check-in</h3></div><div class="cg">';
h+='<div class="cf"><label>Body weight</label><input class="fi" type="text" inputmode="decimal" value="'+S.chk.bw+'" onchange="S.chk.bw=this.value;S.weight=this.value;sv();updCtxWt()"></div>';
h+='<div class="cf"><label>Steps</label><input class="fi" type="text" inputmode="numeric" value="'+S.chk.steps+'" onchange="S.chk.steps=this.value;sv()"></div>';
h+='<div class="cf"><label>Sleep (hrs)</label><input class="fi" type="text" inputmode="decimal" value="'+S.chk.sleep+'" onchange="S.chk.sleep=this.value;sv()"></div>';
h+='<div class="cf"><label>Calories</label><input class="fi" type="text" inputmode="numeric" value="'+S.chk.cal+'" onchange="S.chk.cal=this.value;sv()"></div>';
h+='<div class="cf"><label>Exercise min</label><input class="fi" type="text" inputmode="numeric" value="'+S.chk.exMin+'" onchange="S.chk.exMin=this.value;sv()"></div>';
h+='<div class="cf"><label>Protein (g)</label><input class="fi" type="text" inputmode="numeric" value="'+S.chk.prot+'" onchange="S.chk.prot=this.value;sv()"></div>';
h+='</div></div>';
h+='<div class="cd"><div class="ch"><h3>Nutrition compliance</h3></div>';
h+=S.ncItems.map((item,i)=>'<div class="hi"><span>'+item+'</span><div class="tp" id="nc_'+i+'" onclick="this.classList.toggle(\'on\')"><div class="dt"></div></div></div>').join("");
if(saved!==undefined)h+='<div style="font-size:12px;color:var(--grn);margin-top:8px">✓ Saved today ('+saved+'% compliance)</div>';
h+='<button class="save-btn" onclick="saveRec()">Save recovery log</button></div>';

h+='<div class="cd"><div class="ch"><h3>Coach link</h3></div>';
if(S.linkedCoach){
  h+='<div style="font-size:12px;color:var(--grn);margin-bottom:6px">✓ Linked to '+(S.coachName||"coach")+'</div>';
  h+='<button class="bs" style="font-size:11px" onclick="unlinkSelf()">Unlink from coach</button>';
}else{
  h+='<div style="font-size:12px;color:var(--w3);margin-bottom:6px">Not linked to a coach</div>';
  h+='<div style="display:flex;gap:6px;align-items:center"><input class="fi" id="relinkCode" placeholder="Enter invite code" style="flex:1;text-transform:uppercase;letter-spacing:2px"><button class="bs bsa" onclick="relinkCoach()">Link</button></div>';
}
h+='</div>';
el.innerHTML=h}

function saveRec(){const total=S.ncItems.length;if(total===0)return;let on=0;S.ncItems.forEach((item,i)=>{const el=document.getElementById("nc_"+i);if(el&&el.classList.contains("on"))on++});const pct=Math.round(on/total*100);S.recLog[tds()]=pct;sv();rRec();alert("Recovery saved: "+pct+"% compliance")}

// ===== LIBRARY =====

function unlinkSelf(){
  if(!confirm("Unlink from your coach? You can relink anytime with their code."))return;
  S.linkedCoach="";S.coachName="";sv();rRec();
}

async function relinkCoach(){
  const code=(document.getElementById("relinkCode").value||"").trim().toUpperCase();
  if(!code||code.length<4){alert("Enter a valid invite code");return}
  try{
    const snap=await fbDb.ref("invites/"+code).once("value");
    const data=snap.val();
    if(!data){alert("Code not found");return}
    S.linkedCoach=data.uid;S.coachName=data.name||"Coach";
    if(!S.role||S.role==="both")S.role="athlete";
    if(fbUser){
      await fbDb.ref("users/"+data.uid+"/athletes/"+fbUser.uid).set({name:S.user,photo:S.photoURL||"",uid:fbUser.uid});
    }
    sv();rRec();
    alert("Linked to "+S.coachName);
  }catch(e){alert("Error: "+e.message)}
}
function rLib(){
const el=document.getElementById("cC");const f=S.ltf;
const ts=["all","compound","isolation","mobility","stretch","foam roll","cardio"];
let h='<div class="cd"><div class="ch"><h3>Exercise Library</h3><button class="bs bsa" onclick="showAdd(\'library\')">+ New</button></div><input class="fi" placeholder="Search by name or muscle..." id="libS" oninput="rLib()" style="margin-bottom:8px"><div class="tts">'+ts.map(t=>'<button class="tt'+(f===t?' a':'')+'" onclick="S.ltf=\''+t+'\';sv();rLib()">'+t+'</button>').join("")+'</div>';
const q=(document.getElementById("libS")?.value||"").toLowerCase();
const ls=aDB().filter(e=>{if(f!=="all"&&e.t!==f)return false;if(q)return(e.n+" "+e.p+" "+(e.s||[]).join(" ")).toLowerCase().includes(q);return true});
h+='<div class="lc">'+ls.length+" of "+aDB().length+'</div>';
h+=ls.slice(0,50).map(e=>'<div class="er"><span class="en">'+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.t+'</span><span class="ed">'+e.p+(e.s.length?" + "+e.s.join(", "):"")+'</span><button class="bs" onclick="a2d('+e.id+')">+ Add</button></div>').join("");
h+='</div>';el.innerHTML=h}
function a2d(id){const e=gx(id);if(!e)return;cDay(cD).exercises.push(e.t==="cardio"?{exId:id,sets:1,reps:"30 min"}:{exId:id,sets:e.t==="compound"?4:3,reps:e.t==="compound"?"6-8":"10-12",rest:e.r||60});sv();coachTab="arch";rView()}

// ===== ADD OVERLAY =====
function showAdd(ctx){
const el=document.getElementById("ovl");const st=ctx==="library"?"compound,isolation,mobility,stretch,foam roll,cardio":"compound,isolation,cardio";
let h='<div class="ovl" onclick="if(event.target===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>'+(ctx==="library"?"Create exercise":"Add to "+cDay(cD).label)+'</h3><button class="bs" onclick="clO()">Close</button></div>';
if(ctx!=="library")h+='<label>Search existing</label><input class="fi" id="aSr" placeholder="Type name or muscle..." oninput="rAS(\''+st+"','"+ctx+'\')" autocomplete="off"><div id="aSrR"></div><div style="border-top:1px solid var(--sb);margin:12px 0;font-size:12px;color:var(--w3);padding-top:8px">Or create new:</div>';
h+='<label>Name</label><input class="fi" id="mN" placeholder="e.g. Bulgarian split squat"><label>Type</label><div class="gp" id="mTG"><button class="gpi a" onclick="pkT(this,\'compound\')">Compound</button><button class="gpi" onclick="pkT(this,\'isolation\')">Isolation</button><button class="gpi" onclick="pkT(this,\'mobility\')">Mobility</button><button class="gpi" onclick="pkT(this,\'stretch\')">Stretch</button><button class="gpi" onclick="pkT(this,\'foam roll\')">Foam roll</button><button class="gpi" onclick="pkT(this,\'cardio\')">Cardio</button></div><input type="hidden" id="mT" value="compound"><label>Primary muscle</label><div class="gp" id="mPG">'+["Cardio",...MS].map((m,i)=>'<button class="bpp'+(i===1?" a":"")+'" onclick="pkP(this,\''+m.replace(/'/g,"\\'")+'\')">'+m+'</button>').join("")+'</div><input type="hidden" id="mP" value="Chest"><label>Secondary muscles</label><div class="gp" id="mS2" style="max-height:80px;overflow-y:auto">'+MS.map(m=>'<button class="bpp" onclick="this.classList.toggle(\'a\')">'+m+'</button>').join('')+'</div>';
if(ctx!=="library")h+='<label>Sets x Reps</label><div style="display:flex;gap:8px;align-items:center"><input class="fis" id="mSt" type="text" inputmode="numeric" value="3"><span style="color:var(--wht);font-size:16px">x</span><input class="fis" id="mRp" type="text" value="10" style="width:80px"></div><label>Rest (seconds)</label><input class="fi" id="mRst" type="text" inputmode="numeric" value="90" placeholder="e.g. 90" style="width:100px"><label>Superset group (optional)</label><input class="fi" id="mSS" type="text" placeholder="e.g. E or F" style="width:100px">';
h+='<div style="margin-top:12px"><button class="bs bsa" onclick="svA(\''+ctx+'\')" style="width:100%;padding:12px;min-height:48px">Save</button></div></div></div>';
el.innerHTML=h;el.style.display="block"}
function pkT(b,v){document.querySelectorAll("#mTG .gpi").forEach(x=>x.classList.remove("a"));b.classList.add("a");document.getElementById("mT").value=v}
function pkP(b,v){document.querySelectorAll("#mPG .bpp").forEach(x=>x.classList.remove("a"));b.classList.add("a");document.getElementById("mP").value=v}
function clO(){document.getElementById("ovl").style.display="none";document.getElementById("ovl").innerHTML=""}
function rAS(ts,ctx){const q=(document.getElementById("aSr").value||"").toLowerCase();if(q.length<2){document.getElementById("aSrR").innerHTML="";return}const al=ts.split(",");const r=aDB().filter(e=>{if(!al.includes(e.t))return false;return(e.n+" "+e.p+" "+(e.s||[]).join(" ")).toLowerCase().includes(q)}).slice(0,8);document.getElementById("aSrR").innerHTML=r.length?'<div class="sr">'+r.map(e=>'<div class="sri" onclick="pkSR('+e.id+",'"+ctx+"')\"><span style=\"font-weight:500;flex:1\">"+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.t+'</span><span style="font-size:11px;color:var(--w3)">'+e.p+'</span></div>').join('')+'</div>':'<div style="font-size:12px;color:var(--w3);padding:6px">No matches</div>'}
function pkSR(id,ctx){const e=gx(id);cDay(cD).exercises.push(e.t==="cardio"?{exId:id,sets:1,reps:"30 min"}:{exId:id,sets:e?.t==="compound"?4:3,reps:e?.t==="compound"?"6-8":"10-12",rest:e?.r||60});sv();clO();rView()}
function svA(ctx){const nm=(document.getElementById("mN").value||"").trim();if(!nm)return;const ne={id:S.nxId++,n:nm,t:document.getElementById("mT").value,p:document.getElementById("mP").value,s:[...document.querySelectorAll("#mS2 .bpp.a")].map(b=>b.textContent),r:0};if(ne.t==="compound")ne.r=120;else if(ne.t==="isolation")ne.r=60;S.customEx.push(ne);if(ctx!=="library"){const rst=parseInt(document.getElementById("mRst")?.value)||0;const ssv=(document.getElementById("mSS")?.value||"").trim();const item=ne.t==="cardio"?{exId:ne.id,sets:1,reps:"30 min"}:{exId:ne.id,sets:parseInt(document.getElementById("mSt")?.value)||3,reps:document.getElementById("mRp")?.value||"10",rest:rst};if(ssv)item.ss=ssv;cDay(cD).exercises.push(item)}sv();clO();rView()}

// ===== TIMER =====

let _di=null,_doi=null;
function tds2(e,i){e.preventDefault();_di=i;const r=e.target.closest(".er");if(r)r.classList.add("dact")}
function tdm2(e){if(_di===null)return;e.preventDefault();const y=e.touches[0].clientY;document.querySelectorAll(".er[data-di]").forEach(r=>{r.classList.remove("dtgt");const rc=r.getBoundingClientRect();if(y>rc.top&&y<rc.bottom){const idx=parseInt(r.dataset.di);if(idx!==_di){r.classList.add("dtgt");_doi=idx}}})}
function tde2(e){document.querySelectorAll(".er").forEach(r=>{r.classList.remove("dact","dtgt")});if(_di!==null&&_doi!==null&&_doi!==_di){const exs=cDay(cD).exercises;const item=exs.splice(_di,1)[0];exs.splice(_doi,0,item);sv();rView()}_di=null;_doi=null}
function mds2(e,i){_di=i;const r=e.target.closest(".er");if(r)r.classList.add("dact");const mm=e2=>{if(_di===null)return;document.querySelectorAll(".er[data-di]").forEach(r=>{r.classList.remove("dtgt");const rc=r.getBoundingClientRect();if(e2.clientY>rc.top&&e2.clientY<rc.bottom){const idx=parseInt(r.dataset.di);if(idx!==_di){r.classList.add("dtgt");_doi=idx}}})};const mu=()=>{document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);document.querySelectorAll(".er").forEach(r=>{r.classList.remove("dact","dtgt")});if(_di!==null&&_doi!==null&&_doi!==_di){const exs=cDay(cD).exercises;const item=exs.splice(_di,1)[0];exs.splice(_doi,0,item);sv();rView()}_di=null;_doi=null};document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu)}

function moveEx(i,dir){
  const exs=cDay(cD).exercises;
  const newIdx=i+dir;
  if(newIdx<0||newIdx>=exs.length)return;
  const temp=exs[i];
  exs[i]=exs[newIdx];
  exs[newIdx]=temp;
  sv();rView();
}
function editEx(i){
const w=cDay(cD).exercises[i];const e=gx(w.exId);if(!e)return;
const el=document.getElementById("ovl");
el.innerHTML='<div class="ovl" onclick="if(event.target===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>Edit exercise</h3><button class="bs" onclick="clO()">Close</button></div>'+
'<label>Exercise</label><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-weight:600;font-size:14px;flex:1" id="edExName">'+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.p+'</span></div>'+
'<input class="fi" id="edSearch" placeholder="Search to swap exercise..." oninput="editSearch('+i+')" autocomplete="off" style="margin-bottom:4px"><div id="edSearchRes"></div>'+
'<input type="hidden" id="edExId" value="'+w.exId+'">'+
(e.t==="cardio"?
'<label>Duration</label><input class="fi" id="edReps" value="'+w.reps+'">'
:
'<label>Sets</label><input class="fi" id="edSets" type="text" inputmode="numeric" value="'+w.sets+'">'+
'<label>Reps (per set, comma separated)</label><input class="fi" id="edReps" value="'+w.reps+'" placeholder="e.g. 8,10,12 or 10,10,AMRAP">'
)+
'<label>Rest (seconds)</label><input class="fi" id="edRest" type="text" inputmode="numeric" value="'+(w.rest||0)+'" placeholder="e.g. 90">'+
'<label>Superset group (optional)</label><input class="fi" id="edSS" value="'+(w.ss||"")+'" placeholder="e.g. E or F">'+
'<div style="margin-top:12px"><button class="bs bsa" onclick="saveEdit('+i+')" style="width:100%;padding:12px;min-height:48px">Save changes</button></div>'+
'</div></div>';
el.style.display="block"}

function editSearch(idx){
const q=(document.getElementById("edSearch").value||"").toLowerCase();
if(q.length<2){document.getElementById("edSearchRes").innerHTML="";return}
const res=aDB().filter(e=>(e.n+" "+e.p+" "+(e.s||[]).join(" ")).toLowerCase().includes(q)).slice(0,6);
document.getElementById("edSearchRes").innerHTML=res.length?'<div class="sr">'+res.map(e=>'<div class="sri" onclick="pickEditEx('+e.id+')"><span style="font-weight:500;flex:1">'+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.t+'</span><span style="font-size:11px;color:var(--w3)">'+e.p+'</span></div>').join("")+'</div>':'<div style="font-size:12px;color:var(--w3);padding:6px">No matches</div>'}

function pickEditEx(newId){
const e=gx(newId);if(!e)return;
document.getElementById("edExId").value=newId;
document.getElementById("edExName").textContent=e.n;
document.getElementById("edSearch").value="";
document.getElementById("edSearchRes").innerHTML="";
}

function saveEdit(i){
const w=cDay(cD).exercises[i];
const newExId=parseInt(document.getElementById("edExId").value);
if(newExId&&newExId!==w.exId)w.exId=newExId;
const e=gx(w.exId);
if(e&&e.t!=="cardio"){w.sets=parseInt(document.getElementById("edSets").value)||3}
w.reps=document.getElementById("edReps").value||"10";
w.rest=parseInt(document.getElementById("edRest").value)||0;
const ss=(document.getElementById("edSS").value||"").trim();
if(ss)w.ss=ss;else delete w.ss;
sv();clO();rView()}

// Feature 3: Input focus/change handlers for styling
function onSetFocus(el,ei,si,field,prev){
  if(el.value===prev&&prev){el.value="";el.classList.remove("carried");el.classList.add("fresh")}
}
function onSetChange(el,ei,si,field,prev){
  const v=el.value;
  el.classList.remove("carried");el.classList.add("fresh");
  logSet(ei,si,field,v);
  // Trigger overload check - re-render is expensive so just update border
  if(field==="lbs"){
    const pn=parseFloat(prev),cn=parseFloat(v);
    el.classList.remove("progress","stalled","regress");
    if(prev&&v&&!isNaN(pn)&&!isNaN(cn)){
      if(cn>pn)el.classList.add("progress");
      else if(cn===pn)el.classList.add("stalled");
      else el.classList.add("regress");
    }
  }
}

// Feature 2: Rest timer popup
function showRestPopup(seconds,exerciseName){
  if(seconds<=0)return;
  const ov=document.getElementById("ovl");
  const circ=2*Math.PI*90;
  ov.innerHTML='<div class="timer-overlay" id="restPopup"><div class="timer-label">Rest — '+exerciseName+'</div><div class="timer-ring"><svg viewBox="0 0 200 200"><circle class="bg-ring" cx="100" cy="100" r="90"/><circle class="fg-ring" id="timerArc" cx="100" cy="100" r="90" stroke-dasharray="'+circ+'" stroke-dashoffset="0"/></svg><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><span class="big-time" id="popTime">'+fmtRest(seconds)+'</span></div></div><button class="skip-btn" onclick="skipRest()">Skip rest</button></div>';
  ov.style.display="block";
  restPopupSec=seconds;restPopupTotal=seconds;
  restPopupInt=setInterval(()=>{
    restPopupSec--;
    if(restPopupSec<=0){skipRest();return}
    const el=document.getElementById("popTime");if(el)el.textContent=fmtRest(restPopupSec);
    const arc=document.getElementById("timerArc");
    if(arc){const off=circ*(1-restPopupSec/restPopupTotal);arc.style.strokeDashoffset=off}
  },1000);
}
let restPopupInt=null,restPopupSec=0,restPopupTotal=0;
function skipRest(){clearInterval(restPopupInt);restPopupInt=null;const ov=document.getElementById("ovl");ov.style.display="none";ov.innerHTML=""}

function completeSet(ei,si,restSec,btn){
  const wk=wlk(cD);
  if(!S.wlogs[wk])S.wlogs[wk]={};if(!S.wlogs[wk][ei])S.wlogs[wk][ei]={};if(!S.wlogs[wk][ei][si])S.wlogs[wk][ei][si]={};
  S.wlogs[wk][ei][si].done=true;btn.classList.add("done");sv();
  // Auto-fill from inputs if not already saved
  const row=btn.closest(".set-row");
  if(row){
    const inputs=row.querySelectorAll(".set-input");
    if(inputs[0]&&inputs[0].value&&!S.wlogs[wk][ei][si].lbs){S.wlogs[wk][ei][si].lbs=inputs[0].value;sv()}
    if(inputs[1]&&inputs[1].value&&!S.wlogs[wk][ei][si].reps){S.wlogs[wk][ei][si].reps=inputs[1].value;sv()}
  }
  const e=gx(cDay(cD).exercises[ei]?.exId);
  if(restSec>0)showRestPopup(restSec,e?e.n:"");
}

// Feature 5: Workout start/end timestamps
function startWorkout(){
  const wk=wlk(cD);
  if(!S.wlogs[wk])S.wlogs[wk]={};
  if(!S.wlogs[wk]._meta)S.wlogs[wk]._meta={};
  S.wlogs[wk]._meta.startTime=Date.now();
  // Clear all done flags so user must re-confirm each set
  Object.entries(S.wlogs[wk]).forEach(([k,v])=>{
    if(k==="_meta")return;
    if(typeof v==="object"&&v!==null){
      Object.values(v).forEach(set=>{if(set&&typeof set==="object")delete set.done});
    }
    if(Array.isArray(v)){v.forEach(set=>{if(set&&typeof set==="object")delete set.done})}
  });
  sv();rExec();
}

let wkClockInt=null;
function startWkClock(){
  clearInterval(wkClockInt);
  wkClockInt=setInterval(()=>{
    const wk=wlk(cD);const meta=S.wlogs[wk]?._meta;
    if(!meta||!meta.startTime||meta.paused)return;
    const el=document.getElementById("wkTimeText");
    if(el)el.textContent="⏱ "+fmtElapsed(meta.startTime,meta.pausedTotal||0);
  },1000);
}
function pauseWorkout(){
  const wk=wlk(cD);const meta=S.wlogs[wk]?._meta;
  if(!meta)return;
  meta.paused=true;
  meta.pauseStart=Date.now();
  clearInterval(wkClockInt);
  sv();rExec();
}

function resumeWorkout(){
  const wk=wlk(cD);const meta=S.wlogs[wk]?._meta;
  if(!meta||!meta.pauseStart)return;
  const pausedFor=Date.now()-meta.pauseStart;
  meta.pausedTotal=(meta.pausedTotal||0)+pausedFor;
  meta.paused=false;
  delete meta.pauseStart;
  sv();rExec();
}

function cancelWorkout(){
  if(!confirm("Cancel this workout? Your logged sets will be kept but the workout won't be saved to your history."))return;
  const wk=wlk(cD);
  if(S.wlogs[wk]&&S.wlogs[wk]._meta){
    delete S.wlogs[wk]._meta.startTime;
    delete S.wlogs[wk]._meta.endTime;
    delete S.wlogs[wk]._meta.paused;
    delete S.wlogs[wk]._meta.pauseStart;
    delete S.wlogs[wk]._meta.pausedTotal;
  }
  clearInterval(wkClockInt);
  sv();rExec();
}

function endWorkout(){
  const wk=wlk(cD);
  if(!S.wlogs[wk])S.wlogs[wk]={};
  if(!S.wlogs[wk]._meta)S.wlogs[wk]._meta={};
  S.wlogs[wk]._meta.endTime=Date.now();
  const startT=S.wlogs[wk]._meta.startTime||Date.now();
  const pausedTotal=S.wlogs[wk]._meta.pausedTotal||0;
  const duration=Math.floor((Date.now()-startT-pausedTotal)/1000);
  clearInterval(wkClockInt);
  // Save to log
  S.log.push({
    date:tds(),dayIdx:cD,label:cDay(cD).label,
    weights:JSON.parse(JSON.stringify(S.wlogs[wk]||{})),
    startTime:startT,endTime:Date.now(),duration:duration
  });
  sv();
  const mins=Math.floor(duration/60);
  alert("Workout saved: "+cDay(cD).label+"\nDuration: "+mins+" minutes");
  rExec();
}

// Old timer removed - replaced by per-set rest popup
function swP(p){curMode=p;document.querySelectorAll(".pb").forEach(b=>b.classList.remove("a"));event.target.closest(".pb").classList.add("a");rView()}

init();
// Expose functions for onclick handlers
window.a2d = a2d;
window.addDay = addDay;
window.addNC = addNC;
window.cDT = cDT;
window.cancelWorkout = cancelWorkout;
window.clO = clO;
window.completeSet = completeSet;
window.copyInvite = copyInvite;
window.delDay = delDay;
window.deleteProfile = deleteProfile;
window.doGoogleLogin = doGoogleLogin;
window.doW = doW;
window.editEx = editEx;
window.editSearch = editSearch;
window.endWorkout = endWorkout;
window.exportData = exportData;
window.genInviteCode = genInviteCode;
window.getActiveData = getActiveData;
window.getPrevWts = getPrevWts;
window.getWU = getWU;
window.init = init;
window.linkCoach = linkCoach;
window.loadCoachAthletes = loadCoachAthletes;
window.logSet = logSet;
window.logout = logout;
window.mds2 = mds2;
window.moveEx = moveEx;
window.onSetChange = onSetChange;
window.onSetFocus = onSetFocus;
window.pauseWorkout = pauseWorkout;
window.pickEditEx = pickEditEx;
window.pickRole = pickRole;
window.pkP = pkP;
window.pkSR = pkSR;
window.pkT = pkT;
window.rAS = rAS;
window.rArch = rArch;
window.rAthView = rAthView;
window.rCDCh = rCDCh;
window.rCOCh = rCOCh;
window.rCal = rCal;
window.rCoachDash = rCoachDash;
window.rCoachRec = rCoachRec;
window.rCoachView = rCoachView;
window.rDCh = rDCh;
window.rDash = rDash;
window.rExec = rExec;
window.rLib = rLib;
window.rOCh = rOCh;
window.rRec = rRec;
window.rTeam = rTeam;
window.rView = rView;
window.relinkCoach = relinkCoach;
window.removeAthlete = removeAthlete;
window.renderApp = renderApp;
window.resumeWorkout = resumeWorkout;
window.saveEdit = saveEdit;
window.saveRec = saveRec;
window.selectAthlete = selectAthlete;
window.showAdd = showAdd;
window.showLinkCoach = showLinkCoach;
window.showLogin = showLogin;
window.showRestPopup = showRestPopup;
window.showRoleSelect = showRoleSelect;
window.showWeightPrompt = showWeightPrompt;
window.skipRest = skipRest;
window.startWkClock = startWkClock;
window.startWorkout = startWorkout;
window.svA = svA;
window.svNC = svNC;
window.swP = swP;
window.tde2 = tde2;
window.tdm2 = tdm2;
window.tds2 = tds2;
window.toggleSetDone = toggleSetDone;
window.unlinkSelf = unlinkSelf;
window.updCtxWt = updCtxWt;

// Expose reactive state for inline handlers
Object.defineProperty(window, 'cD', { get: () => cD, set: (v) => { cD = v; } });
Object.defineProperty(window, 'S', { get: () => S });
Object.defineProperty(window, 'coachTab', { get: () => coachTab, set: (v) => { coachTab = v; } });
Object.defineProperty(window, 'athTab', { get: () => athTab, set: (v) => { athTab = v; } });
Object.defineProperty(window, 'curMode', { get: () => curMode, set: (v) => { curMode = v; } });
Object.defineProperty(window, 'calY', { get: () => calY, set: (v) => { calY = v; } });
Object.defineProperty(window, 'calM', { get: () => calM, set: (v) => { calM = v; } });
Object.defineProperty(window, 'selectedAthlete', { get: () => selectedAthlete, set: (v) => { selectedAthlete = v; } });
Object.defineProperty(window, 'athleteData', { get: () => athleteData, set: (v) => { athleteData = v; } });
window.cDay = (d) => cDay(d !== undefined ? d : cD);
window.cV = (d) => cV(d !== undefined ? d : cD);
window.sv = sv;
window.gx = gx;
window.aDB = aDB;
window.isL = isL;
window.tB = tB;
window.hC = hC;
window.tds = tds;
window.wlk = (d) => wlk(d !== undefined ? d : cD);
window.SWAP = SWAP;
window.svLocal = svLocal;
window.ld = ld;
window.genInviteCode = () => genInviteCode(S);
window.addTips = addTips;
window.fmtRest = fmtRest;

