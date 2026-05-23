// Forge - Main Application
import { DDB } from './data/exercises.js';
import { WM } from './data/warmups.js';
import { SWAP, MN, DEF_NC, MS, defDays, GLOSS } from './data/defaults.js';
import { fmtRest, fmtElapsed, calcAvgDuration, addTips } from './utils/helpers.js';
import { getOverloadClass, getOverloadHint } from './utils/overload.js';
import { exportData } from './utils/export.js';
import { fbDb, fbAuth, gProvider, fbUser, setFbUser, syncToFb, loadFromFb, updSync, loadCoachAthletes as _loadCoachAthletes, genInviteCode, fbUserPath} from './firebase.js';
import { S, setS, ld, svLocal, sv as _sv, aDB, gx, isL, tB, hC, tds, wlk, compColor, cDay as _cDay, cV as _cV } from './state.js';
import { showRestPopup, skipRest } from './components/rest-timer.js';
import { renderExerciseChart, renderVolumeChart } from './components/charts.js';
import { renderHeatMap } from './components/heatmap.js';
import { initDrag, moveEx } from './components/drag-reorder.js';

// Image paths (now actual files)
const AB = "assets/anvil-big.png";
const AT = "assets/anvil-small.png";
const BF = "assets/body-front.jpg";
const BB = "assets/body-back.jpg";

// Athlete-aware wrappers
function cDay(d) {
  const di = d !== undefined ? d : cD;
  if (selectedAthlete && athleteData) {
    if(!athleteData.days||!Array.isArray(athleteData.days))athleteData.days=[];
    if(!athleteData.days.length)return {label:"New Day",exercises:[]};
    return athleteData.days[di] || athleteData.days[0];
  }
  return _cDay(di);
}
function cV(d) {
  const di = d !== undefined ? d : cD;
  if (selectedAthlete && athleteData) {
    const v = {};
    const day = cDay(di);
    if (!day || !day.exercises) return v;
    day.exercises.forEach(w => {
      const e = gx(w.exId);
      if (!e || e.p === "Cardio") return;
      v[e.p] = (v[e.p] || 0) + w.sets;
      (e.s || []).forEach(s => { if (s !== "Cardio") v[s] = (v[s] || 0) + Math.ceil(w.sets / 2); });
    });
    return v;
  }
  const day2 = _cDay(di);
  if (!day2 || !day2.exercises) return {};
  return _cV(di);
}
function sv() {
  if (selectedAthlete && athleteData) {
    svLocal();
    // Ensure days is a clean array before saving
    if(!athleteData.days||!Array.isArray(athleteData.days))athleteData.days=[];
    var cleanDays=JSON.parse(JSON.stringify(athleteData.days));
    fbDb.ref("users/"+selectedAthlete).update({days:cleanDays}).then(()=>{
      console.log("Athlete data saved to Firebase");
      // Update sync indicator
      var dot=document.getElementById("syncDot");if(dot)dot.className="dot ok";
      var txt=document.getElementById("syncTxt");if(txt)txt.textContent="Synced";
    }).catch(e=>{
      console.error("Athlete save failed:",e);
      var dot=document.getElementById("syncDot");if(dot)dot.className="dot off";
      var txt=document.getElementById("syncTxt");if(txt)txt.textContent="Error";
    });
  } else {
    _sv();
  }
}


let cD=0,calY=2026,calM=4,athTab="exec",curMode="c",coachTab="arch";

// ===== AUTO-LOGIN: skip login if user exists =====

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
    cD=0;
    // Fix arrays from Firebase
    if(athleteData){
      if(athleteData.days&&!Array.isArray(athleteData.days))athleteData.days=Object.values(athleteData.days);
      if(athleteData.log&&!Array.isArray(athleteData.log))athleteData.log=Object.values(athleteData.log);
      if(athleteData.ncItems&&!Array.isArray(athleteData.ncItems))athleteData.ncItems=Object.values(athleteData.ncItems);
      // Fix exercises arrays within days
      if(athleteData.days){athleteData.days.forEach(d=>{if(d.exercises&&!Array.isArray(d.exercises))d.exercises=Object.values(d.exercises)})}
    }
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
    if(fbUser)await fbDb.ref(fbUserPath(S)).remove();
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
      const updated=await loadFromFb(S, svLocal);
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
    if(!S.inviteCode)S.inviteCode=genInviteCode(S);
  }
  sv();
  if(r==="athlete"){showLinkCoach();return}
  renderApp();
}

function showLinkCoach(){
  document.getElementById("app").innerHTML='<div class="lw"><h2>Link to your coach</h2><div style="font-size:13px;color:var(--w3);margin-bottom:8px;text-align:center">Enter the invite code your coach gave you, or skip to train solo</div><input class="li" id="invCode" placeholder="e.g. ABC123" style="text-transform:uppercase;letter-spacing:2px" onkeydown="if(event.key===\'Enter\')linkCoach()"><button class="lb" onclick="linkCoach()">Link to coach</button><button style="background:none;border:none;color:var(--w3);cursor:pointer;font-size:13px;margin-top:12px;font-family:inherit" onclick="S.role=\'both\';if(!S.inviteCode)S.inviteCode=genInviteCode(S);sv();setTimeout(()=>renderApp(),100)">Skip — I\'ll coach myself</button></div>';
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

function cDT(add){
  const days=selectedAthlete&&athleteData&&athleteData.days?athleteData.days:S.days;
  if(!days||!days.length)return '<div style="color:var(--w3);font-size:12px;padding:8px">No workout days set up</div>';
  if(!Array.isArray(days))days=Object.values(days);return days.map((d,i)=>'<button class="dtab'+(i===cD?' a':'')+'" onclick="cD='+i+';rView()">'+d.label+'</button>').join("")+(add?'<button class="dtab-add" onclick="addDay()">+ Day</button>':"");
}
function addDay(){
  const days=selectedAthlete&&athleteData?athleteData.days:S.days;
  if(days.length>=7)return;
  days.push({label:"Day "+(days.length+1),exercises:[]});
  cD=days.length-1;sv();rView();
}
function delDay(){
  const days=selectedAthlete&&athleteData?athleteData.days:S.days;
  if(days.length<=1)return;
  days.splice(cD,1);
  if(cD>=days.length)cD=days.length-1;
  sv();rView();
}


function getActiveDays(){
  if(selectedAthlete && athleteData && athleteData.days) return athleteData.days;
  return S.days;
}
function getActiveCDay(){
  return getActiveDays()[cD] || getActiveDays()[0];
}
function saveActiveData(){
  if(selectedAthlete && athleteData){
    // Save athlete data to Firebase
    athleteData.days = getActiveDays();
    fbDb.ref("users/"+selectedAthlete).update({days:athleteData.days});
  } else {
    sv();
  }
}
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
  if(coachAthletes.length===0){
    loadCoachAthletes().then(()=>rView()).catch(()=>rView());
  }else{rView()}
}else{rView()}}

function updCtxWt(){const el=document.getElementById("ctxWt");if(el)el.textContent=S.weight+" lbs"}

function rView(){if(curMode==="c")rCoachView();else rAthView()}

function rCoachView(){
const el=document.getElementById("mainV");
let ctabs='<div class="tabs"><button class="tab'+(coachTab==="arch"?" a":"")+'" onclick="coachTab=\'arch\';rCoachView()">Architect</button><button class="tab'+(coachTab==="lib"?" a":"")+'" onclick="coachTab=\'lib\';rCoachView()">Exercise Library</button><button class="tab'+(coachTab==="rec"?" a":"")+'" onclick="coachTab=\'rec\';rCoachView()">Recovery</button><button class="tab'+(coachTab==="dash"?" a":"")+'" onclick="coachTab=\'dash\';rCoachView()">Dashboard</button>';
if(S.role==="coach"||S.role==="both")ctabs+='<button class="tab'+(coachTab==="team"?" a":"")+'" onclick="selectedAthlete=null;athleteData=null;coachTab=\'team\';rCoachView()">My Athletes</button>';
ctabs+='</div>';
let editLabel=selectedAthlete?coachAthletes.find(a=>a.uid===selectedAthlete)?.name||"Athlete":"My Program";
let topBar=(S.role==="coach"||S.role==="both")?'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:var(--ob3);border:1px solid var(--sb);border-radius:8px;font-size:13px"><span style="color:var(--w3)">Editing:</span><span style="color:var(--cyan);font-weight:600">'+editLabel+'</span>'+(selectedAthlete?'<button class="bs" style="margin-left:auto;font-size:11px;padding:3px 8px;min-height:28px" onclick="selectedAthlete=null;athleteData=null;rView()">Back to mine</button>':'')+'</div>':'';
el.innerHTML=ctabs+topBar+'<div id="cC"></div>';
if(coachTab==="team"){selectedAthlete=null;athleteData=null;rTeam()}else if(coachTab==="arch")rArch();else if(coachTab==="lib")rLib();else if(coachTab==="rec")rCoachRec();else rCoachDash()}

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
h+='<button class="bs" style="font-size:11px;padding:4px 8px;min-height:28px;color:var(--cyan);border-color:var(--cyan)" onclick="showCopyWorkout(\x27'+a.uid+'\x27,\x27'+((a.name||'Athlete').replace(/'/g,''))+'\x27)">Copy to</button>';
h+='<button class="dbtn" style="font-size:11px" onclick="removeAthlete(\x27'+a.uid+'\x27)">Remove</button>';
h+='</div>';}
h+='</div></div>';
}else{
h+='<div class="cd"><div style="text-align:center;padding:20px;color:var(--w3)">';
h+='<div style="font-size:13px">No athletes linked yet</div>';
h+='<div style="font-size:12px;margin-top:4px">Share your invite code to get started</div>';
h+='</div></div>';}
el.innerHTML=h}


function showCopyWorkout(targetUid, targetName){
  var ov=document.getElementById("ovl");
  var sources='<div class="sr">';
  sources+='<div class="sri" onclick="doCopyWorkout(\x27mine\x27,\x27'+targetUid+'\x27,\x27'+targetName+'\x27)"><span style="font-weight:500;flex:1">My Program</span><span class="bg bb" style="font-size:10px">Coach</span></div>';
  for(var i=0;i<coachAthletes.length;i++){
    var a=coachAthletes[i];
    if(a.uid!==targetUid){
      sources+='<div class="sri" onclick="doCopyWorkout(\x27'+a.uid+'\x27,\x27'+targetUid+'\x27,\x27'+targetName+'\x27)"><span style="font-weight:500;flex:1">'+(a.name||'Athlete')+'</span><span class="bg ba" style="font-size:10px">Athlete</span></div>';
    }
  }
  sources+='</div>';
  ov.innerHTML='<div class="ovl" onmousedown="this._md=event.target" onmouseup="if(event.target===this&&this._md===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>Copy workout to '+targetName+'</h3><button class="bs" onclick="clO()">Close</button></div><div style="font-size:12px;color:var(--w3);margin-bottom:8px">Select whose workout to copy:</div>'+sources+'</div></div>';
  ov.style.display="block";
}

async function doCopyWorkout(sourceUid, targetUid, targetName){
  if(!confirm("Copy workout to "+targetName+"? This will replace their current program."))return;
  try{
    var sourceDays;
    if(sourceUid==="mine"){
      // Read fresh from Firebase to avoid state issues
      var snap=await fbDb.ref(fbUserPath(S)+"/days").once("value");
      sourceDays=snap.val();
      if(!sourceDays){
        sourceDays=JSON.parse(JSON.stringify(S.days));
      }
    }else{
      var snap=await fbDb.ref("users/"+sourceUid+"/days").once("value");
      sourceDays=snap.val();
    }
    if(sourceDays&&!Array.isArray(sourceDays))sourceDays=Object.values(sourceDays);
    if(!sourceDays||!sourceDays.length){alert("Source has no workout data");return}
    // Deep copy and fix any Firebase array conversions
    sourceDays=JSON.parse(JSON.stringify(sourceDays));
    sourceDays.forEach(function(d){
      if(d.exercises&&!Array.isArray(d.exercises))d.exercises=Object.values(d.exercises);
    });
    await fbDb.ref("users/"+targetUid+"/days").set(sourceDays);
    clO();
    alert("Workout copied to "+targetName);
  }catch(e){alert("Error: "+e.message)}
}


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

function addWarmup(){
  var ov=document.getElementById("ovl");
  ov.innerHTML='<div class="ovl" onmousedown="this._md=event.target" onmouseup="if(event.target===this&&this._md===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()"><div class="ovl-inner"><h3>Add warm-up exercise</h3><input class="fi" id="wuSearch" placeholder="Search exercises..." oninput="searchWarmup()" autocomplete="off"><div id="wuResults"></div><button class="bs" onclick="clO()" style="width:100%;margin-top:10px">Cancel</button></div></div>';
  ov.style.display="block";
}

function searchWarmup(){
  var q=(document.getElementById("wuSearch").value||"").toLowerCase();
  if(q.length<2){document.getElementById("wuResults").innerHTML="";return}
  var res=aDB().filter(e=>(e.n+" "+e.p+" "+e.t).toLowerCase().includes(q)).slice(0,8);
  document.getElementById("wuResults").innerHTML=res.length?'<div class="sr">'+res.map(e=>'<div class="sri" onclick="pickWarmup('+e.id+')"><span style="flex:1">'+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.p+'</span></div>').join("")+'</div>':'';
}

function pickWarmup(exId){
  var d=cDay(cD);
  if(!d.warmups)d.warmups=getWU().map(w=>({name:w.name,exId:w.id||0}));
  var e=gx(exId);
  d.warmups.push({name:e?e.n:"Exercise",exId:exId});
  sv();clO();rView();
}

function removeWarmup(wi){
  var d=cDay(cD);
  if(!d.warmups)return;
  d.warmups.splice(wi,1);
  if(d.warmups.length===0)delete d.warmups;
  sv();rView();
}

function resetWarmups(){
  var d=cDay(cD);
  delete d.warmups;
  sv();rView();
}
function rArch(){
const el=document.getElementById("cC");
var days=selectedAthlete&&athleteData&&athleteData.days?athleteData.days:S.days;
if(!days||!Array.isArray(days)||!days.length){
  if(selectedAthlete&&athleteData){athleteData.days=[];days=athleteData.days}
  el.innerHTML='<div class="cd" style="text-align:center;padding:20px;color:var(--w3)">No workout days set up yet.</div><div style="display:flex;gap:8px;margin-top:8px"><button class="bs bsa" onclick="addDay()" style="flex:1;padding:10px">+ Create first day</button>'+(selectedAthlete?'<button class="bs" style="flex:1;padding:10px;color:var(--cyan);border-color:var(--cyan)" onclick="showCopyWorkout(\x27'+selectedAthlete+'\x27,\x27'+(athleteData?.user||'Athlete')+'\x27)">Copy from...</button>':'')+'</div>';return}
if(cD>=days.length)cD=0;
const d=cDay(cD);
if(d&&d.exercises&&!Array.isArray(d.exercises))d.exercises=Object.values(d.exercises);
if(d&&!d.exercises)d.exercises=[];const wu=getWU();const v=cV(cD);
let h='<div class="dtabs">'+cDT(true)+'</div><div class="cd"><div class="wdh"><input value="'+d.label+'" onchange="cDay(cD).label=this.value;sv();rView()" placeholder="Day name">';
if(days.length>1)h+='<button class="bs" style="color:var(--red);border-color:var(--red)" onclick="delDay()">Delete</button>';
h+='</div>';
var customWU=d.warmups||null;
var displayWU=customWU||wu;
h+='<div style="font-size:12px;color:var(--w2);margin:8px 0 4px;display:flex;justify-content:space-between;align-items:center">Warm-up '+(customWU?'(custom)':'(auto-matched)')+'<div style="display:flex;gap:4px">'+(customWU?'<button class="bs" style="font-size:10px;padding:2px 6px;min-height:24px" onclick="resetWarmups()">Auto</button>':'')+'<button class="bs" style="font-size:10px;padding:2px 6px;min-height:24px" onclick="addWarmup()">+ Add</button></div></div>';
if(customWU){
h+=customWU.map((w,wi)=>'<div class="er"><span class="en" style="font-weight:400">'+(typeof w==="object"?w.name:gx(w)?.n||"?")+'</span><button class="dbtn" style="font-size:10px;padding:2px 6px" onclick="removeWarmup('+wi+')">✕</button></div>').join("");
}else{
h+=wu.map(w=>{var ex=aDB().find(e=>e.n===w.name);return '<div class="er"><span class="en">'+w.name+'</span><span class="bg '+(ex?tB(ex.t):"ba")+'" style="font-size:10px">'+(ex?ex.t:"mobility")+'</span><span class="wr">'+w.reason+'</span></div>'}).join("");
}
h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px"><span style="font-size:12px;color:var(--w2)">Working sets &amp; cardio</span><button class="bs" onclick="showAdd(\'working\')">+ Add</button></div>';
let lastSS="";h+=d.exercises.map((w,i)=>{const e=gx(w.exId);if(!e)return "";
let row="";const curSS=w.ss||"";
if(curSS&&curSS!==lastSS)row+='<div class="ss-group"><div class="ss-label">Superset '+curSS+'</div>';
const restStr=w.rest!==undefined&&w.rest>0?' <span class="wr">Rest: '+(w.rest>=60?Math.floor(w.rest/60)+":"+(w.rest%60<10?"0":"")+w.rest%60:w.rest+"s")+'</span>':"";
row+='<div class="er" data-di="'+i+'"><span class="en">'+e.n+'</span>'+(e.t==="cardio"?'<span class="ed">'+w.reps+'</span>':'<span class="ed">'+w.sets+" x "+addTips(w.reps)+'</span>')+'<span class="bg '+tB(e.t)+'" style="font-size:10px">'+(e.p==="Cardio"?"Cardio":e.p)+'</span>'+restStr+'<span class="dgrip" data-di="'+i+'" ontouchstart="tds2(event,'+i+')" ontouchmove="tdm2(event)" ontouchend="tde2(event)" onmousedown="mds2(event,'+i+')">⠿</span><button class="sbtn" onclick="editEx('+i+')">Edit</button>'+(SWAP[w.exId]?'<button class="sbtn" onclick="cDay(cD).exercises['+i+'].exId=SWAP['+w.exId+'];sv();rView()">Swap</button>':'')+'<button class="dbtn" onclick="cDay(cD).exercises.splice('+i+',1);sv();rView()">Del</button></div>';
const nextSS=d.exercises[i+1]?.ss||"";if(curSS&&nextSS!==curSS)row+='</div>';
lastSS=curSS;return row}).join("");
h+='</div>';
h+='<div class="cd"><div class="ch"><h3>Volume</h3><span class="bg bb">'+Object.values(v).reduce((a,b)=>a+b,0)+' sets</span></div><div class="vt">'+Object.keys(v).sort((a,b)=>v[b]-v[a]).map(m=>{const s=v[m],c=hC(s);return '<div class="vi"><div style="width:100%"><div style="display:flex;justify-content:space-between"><span>'+m+'</span><span style="font-weight:600;color:'+c+'">'+s+'</span></div><div class="vb"><div class="vf" style="width:'+Math.min(100,Math.round(s/16*100))+'%;background:'+c+'"></div></div></div></div>'}).join("")+'</div></div>';
h+='<div class="cd"><div class="ch"><h3>Heat map</h3><div style="display:flex;gap:6px;font-size:11px;color:var(--w3)"><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#1D9E75"></span>Low</span><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#7F77DD"></span>Mid</span><span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:2px;background:#ED4FBA"></span>High</span></div></div><div class="bmap"><div class="hlg"><span>High</span><div class="hlg-bar"></div><span>Low</span></div><div><div class="bwrap"><img src="'+BF+'"><canvas id="cvF"></canvas></div><div class="blbl">Front</div></div><div><div class="bwrap"><img src="'+BB+'"><canvas id="cvB"></canvas></div><div class="blbl">Back</div></div></div></div>';
el.innerHTML=h;renderHeatMap(v)}

function getWU(){const day=cDay(cD);if(!day||!day.exercises)return[];const pr=new Set();day.exercises.forEach(w=>{const e=gx(w.exId);if(e&&e.p!=="Cardio"){pr.add(e.p);(e.s||[]).forEach(s=>{if(s!=="Cardio")pr.add(s)})}});const wu=[],sn=new Set();pr.forEach(p=>{(WM[p]||[]).forEach(w=>{if(!sn.has(w)){sn.add(w);wu.push({name:w,reason:p})}})});return wu.slice(0,6)}

function rCoachRec(){
const el=document.getElementById("cC");
let h='<div class="cd"><div class="ch"><h3>Nutrition compliance items</h3><button class="bs" onclick="addNC()">+ Add</button></div><div style="font-size:12px;color:var(--w3);margin-bottom:8px">These appear to the athlete for daily tracking</div>';
h+=S.ncItems.map((item,i)=>'<div class="nc-item"><span>'+item+'</span><button class="dbtn" onclick="S.ncItems.splice('+i+',1);sv();rCoachRec()">Remove</button></div>').join("");
h+='</div>';

el.innerHTML=h}

function addNC(){
const el=document.getElementById("ovl");
el.innerHTML='<div class="ovl" onmousedown="this._md=event.target" onmouseup="if(event.target===this&&this._md===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>Add compliance item</h3><button class="bs" onclick="clO()">Close</button></div><label>Item name</label><input class="fi" id="ncN" placeholder="e.g. 8 hours sleep"><div style="margin-top:12px"><button class="bs bsa" onclick="svNC()" style="width:100%;padding:12px;min-height:48px">Save</button></div></div></div>';
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
h+='<input class="set-input '+lbsClass+olClass+'" id="lbs_'+i+'_'+s+'" type="text" inputmode="decimal" placeholder="'+(prevLbs||"lbs")+'" value="'+showLbs+'" onfocus="onSetFocus(this,'+i+','+s+',\'lbs\',\''+prevLbs+'\')" onchange="onSetChange(this,'+i+','+s+',\'lbs\',\''+prevLbs+'\')" data-prev="'+prevLbs+'"'+(setData.bw?' disabled style="opacity:.4"':'')+'>'; 
if(e.bw){const bwChecked=setData.bw||false;h+='<label class="bw-check" style="display:flex;align-items:center;gap:2px;font-size:10px;color:var(--w3);cursor:pointer;min-width:32px"><input type="checkbox" '+(bwChecked?'checked':'')+' onchange="toggleBW('+i+','+s+',this)"><span>BW</span></label>';}
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
let h='<div class="ovl" onmousedown="this._md=event.target" onmouseup="if(event.target===this&&this._md===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>'+(ctx==="library"?"Create exercise":"Add to "+cDay(cD).label)+'</h3><button class="bs" onclick="clO()">Close</button></div>';
if(ctx!=="library")h+='<label>Search existing</label><input class="fi" id="aSr" placeholder="Type name or muscle..." oninput="rAS(\''+st+"','"+ctx+'\')" autocomplete="off"><div id="aSrR"></div><div style="border-top:1px solid var(--sb);margin:12px 0;font-size:12px;color:var(--w3);padding-top:8px">Or create new:</div>';
h+='<label>Name</label><input class="fi" id="mN" placeholder="e.g. Bulgarian split squat"><label>Type</label><div class="gp" id="mTG"><button class="gpi a" onclick="pkT(this,\'compound\')">Compound</button><button class="gpi" onclick="pkT(this,\'isolation\')">Isolation</button><button class="gpi" onclick="pkT(this,\'mobility\')">Mobility</button><button class="gpi" onclick="pkT(this,\'stretch\')">Stretch</button><button class="gpi" onclick="pkT(this,\'foam roll\')">Foam roll</button><button class="gpi" onclick="pkT(this,\'cardio\')">Cardio</button></div><input type="hidden" id="mT" value="compound"><label>Primary muscle</label><div class="gp" id="mPG">'+["Cardio",...MS].map((m,i)=>'<button class="bpp'+(i===1?" a":"")+'" onclick="pkP(this,\''+m.replace(/'/g,"\\'")+'\')">'+m+'</button>').join("")+'</div><input type="hidden" id="mP" value="Chest"><label>Secondary muscles</label><div class="gp" id="mS2" style="max-height:80px;overflow-y:auto">'+MS.map(m=>'<button class="bpp" onclick="this.classList.toggle(\'a\')">'+m+'</button>').join('')+'</div>';
if(ctx!=="library")h+='<label>Sets x Reps</label><div style="display:flex;gap:8px;align-items:center"><input class="fis" id="mSt" type="text" inputmode="numeric" value="3"><span style="color:var(--wht);font-size:16px">x</span><input class="fis" id="mRp" type="text" value="10" style="width:80px"></div><label>Rest (seconds)</label><input class="fi" id="mRst" type="text" inputmode="numeric" value="90" placeholder="e.g. 90" style="width:100px"><label>Superset group (optional)</label><input class="fi" id="mSS" type="text" placeholder="e.g. E or F" style="width:100px">';
h+='<div style="margin-top:12px"><button class="bs bsa" onclick="svA(\''+ctx+'\')" style="width:100%;padding:12px;min-height:48px">Save</button></div></div></div>';
el.innerHTML=h;el.style.display="block"}
function pkT(b,v){document.querySelectorAll("#mTG .gpi").forEach(x=>x.classList.remove("a"));b.classList.add("a");document.getElementById("mT").value=v}
function pkP(b,v){document.querySelectorAll("#mPG .bpp").forEach(x=>x.classList.remove("a"));b.classList.add("a");document.getElementById("mP").value=v}
function clO(){document.getElementById("ovl").style.display="none";document.getElementById("ovl").innerHTML=""}
function rAS(ts,ctx){const q=(document.getElementById("aSr").value||"").toLowerCase();if(q.length<2){document.getElementById("aSrR").innerHTML="";return}const al=ts.split(",");const r=aDB().filter(e=>{if(!al.includes(e.t))return false;return(e.n+" "+e.p+" "+(e.s||[]).join(" ")).toLowerCase().includes(q)}).slice(0,8);document.getElementById("aSrR").innerHTML=r.length?'<div class="sr">'+r.map(e=>'<div class="sri" onclick="pkSR('+e.id+",'"+ctx+"')\"><span style=\"font-weight:500;flex:1\">"+e.n+'</span><span class="bg '+tB(e.t)+'" style="font-size:10px">'+e.t+'</span><span style="font-size:11px;color:var(--w3)">'+e.p+'</span></div>').join('')+'</div>':'<div style="font-size:12px;color:var(--w3);padding:6px">No matches</div>'}
function pkSR(id,ctx){
  const e=gx(id);if(!e)return;
  // Populate form fields instead of auto-adding
  document.getElementById("aSr").value="";
  document.getElementById("aSrR").innerHTML="";
  document.getElementById("mN").value=e.n;
  // Set type pill
  document.querySelectorAll("#mTG .gpi").forEach(b=>b.classList.remove("a"));
  document.querySelectorAll("#mTG .gpi").forEach(b=>{if(b.textContent.toLowerCase()===e.t)b.classList.add("a")});
  document.getElementById("mT").value=e.t;
  // Set primary muscle pill
  document.querySelectorAll("#mPG .bpp").forEach(b=>b.classList.remove("a"));
  document.querySelectorAll("#mPG .bpp").forEach(b=>{if(b.textContent===e.p)b.classList.add("a")});
  document.getElementById("mP").value=e.p;
  // Set defaults for sets/reps
  var setsEl=document.getElementById("mSt");
  var repsEl=document.getElementById("mRp");
  if(setsEl)setsEl.value=e.t==="compound"?4:e.t==="cardio"?1:3;
  if(repsEl)repsEl.value=e.t==="compound"?"6-8":e.t==="cardio"?"30 min":"10-12";
  // Store the picked exercise ID for svA to use
  window._pickedExId=id;
}
function svA(ctx){
  // Check if user picked an existing exercise from search
  if(window._pickedExId){
    const id=window._pickedExId;
    window._pickedExId=null;
    const e=gx(id);
    const sets=parseInt(document.getElementById("mSt")?.value)||3;
    const reps=document.getElementById("mRp")?.value||"10";
    const rst=parseInt(document.getElementById("mRst")?.value)||0;
    const ssv=(document.getElementById("mSS")?.value||"").trim();
    const item=e.t==="cardio"?{exId:id,sets:1,reps:reps}:{exId:id,sets:sets,reps:reps,rest:rst};
    if(ssv)item.ss=ssv;
    cDay(cD).exercises.push(item);
    sv();clO();rView();
    return;
  }
  // Otherwise create new exercise
  const nm=(document.getElementById("mN").value||"").trim();if(!nm)return;
  const ne={id:S.nxId++,n:nm,t:document.getElementById("mT").value,p:document.getElementById("mP").value,s:[...document.querySelectorAll("#mS2 .bpp.a")].map(b=>b.textContent),r:0};
  if(ne.t==="compound")ne.r=120;else if(ne.t==="isolation")ne.r=60;
  S.customEx.push(ne);
  if(ctx!=="library"){
    const sets=parseInt(document.getElementById("mSt")?.value)||3;
    const reps=document.getElementById("mRp")?.value||"10";
    const rst=parseInt(document.getElementById("mRst")?.value)||0;
    const ssv=(document.getElementById("mSS")?.value||"").trim();
    const item=ne.t==="cardio"?{exId:ne.id,sets:1,reps:reps}:{exId:ne.id,sets:sets,reps:reps,rest:rst};
    if(ssv)item.ss=ssv;
    cDay(cD).exercises.push(item);
  }
  sv();clO();rView();
}

// ===== TIMER =====

let _di=null,_doi=null;
function tds2(e,i){e.preventDefault();_di=i;const r=e.target.closest(".er");if(r)r.classList.add("dact")}
function tdm2(e){if(_di===null)return;e.preventDefault();const y=e.touches[0].clientY;document.querySelectorAll(".er[data-di]").forEach(r=>{r.classList.remove("dtgt");const rc=r.getBoundingClientRect();if(y>rc.top&&y<rc.bottom){const idx=parseInt(r.dataset.di);if(idx!==_di){r.classList.add("dtgt");_doi=idx}}})}
function tde2(e){document.querySelectorAll(".er").forEach(r=>{r.classList.remove("dact","dtgt")});if(_di!==null&&_doi!==null&&_doi!==_di){const exs=cDay(cD).exercises;const item=exs.splice(_di,1)[0];exs.splice(_doi,0,item);sv();rView()}_di=null;_doi=null}
function mds2(e,i){_di=i;const r=e.target.closest(".er");if(r)r.classList.add("dact");const mm=e2=>{if(_di===null)return;document.querySelectorAll(".er[data-di]").forEach(r=>{r.classList.remove("dtgt");const rc=r.getBoundingClientRect();if(e2.clientY>rc.top&&e2.clientY<rc.bottom){const idx=parseInt(r.dataset.di);if(idx!==_di){r.classList.add("dtgt");_doi=idx}}})};const mu=()=>{document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);document.querySelectorAll(".er").forEach(r=>{r.classList.remove("dact","dtgt")});if(_di!==null&&_doi!==null&&_doi!==_di){const exs=cDay(cD).exercises;const item=exs.splice(_di,1)[0];exs.splice(_doi,0,item);sv();rView()}_di=null;_doi=null};document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu)}
function editEx(i){
const w=cDay(cD).exercises[i];const e=gx(w.exId);if(!e)return;
const el=document.getElementById("ovl");
el.innerHTML='<div class="ovl" onmousedown="this._md=event.target" onmouseup="if(event.target===this&&this._md===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()" ontouchstart="this._ts=event.target" ontouchend="if(event.target===this&&this._ts===this)clO()"><div class="ovl-inner"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>Edit exercise</h3><button class="bs" onclick="clO()">Close</button></div>'+
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

function toggleBW(ei,si,cb){
  const wk=wlk(cD);
  if(!S.wlogs[wk])S.wlogs[wk]={};
  if(!S.wlogs[wk][ei])S.wlogs[wk][ei]={};
  if(!S.wlogs[wk][ei][si])S.wlogs[wk][ei][si]={};
  S.wlogs[wk][ei][si].bw=cb.checked;
  if(cb.checked){
    S.wlogs[wk][ei][si].lbs="BW";
    var lbsInput=document.getElementById("lbs_"+ei+"_"+si);
    if(lbsInput){lbsInput.value="BW";lbsInput.disabled=true;lbsInput.style.opacity=".4"}
  }else{
    S.wlogs[wk][ei][si].lbs="";
    var lbsInput=document.getElementById("lbs_"+ei+"_"+si);
    if(lbsInput){lbsInput.value="";lbsInput.disabled=false;lbsInput.style.opacity="1"}
  }
  sv();
}
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
let restPopupInt=null,restPopupSec=0,restPopupTotal=0;

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
window.toggleBW = toggleBW;
window.copyInvite = copyInvite;
window.showCopyWorkout = showCopyWorkout;
window.doCopyWorkout = doCopyWorkout;
window.delDay = delDay;
window.deleteProfile = deleteProfile;
window.doGoogleLogin = doGoogleLogin;
window.doW = doW;
window.editEx = editEx;
window.addWarmup = addWarmup;
window.searchWarmup = searchWarmup;
window.pickWarmup = pickWarmup;
window.removeWarmup = removeWarmup;
window.resetWarmups = resetWarmups;
window.editSearch = editSearch;
window.endWorkout = endWorkout;
window.exportData = exportData;
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
window.saveActiveData = saveActiveData;
window.getActiveCDay = getActiveCDay;
window.getActiveDays = getActiveDays;
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
window.cDay = cDay;
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

