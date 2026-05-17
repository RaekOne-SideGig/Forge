// Firebase configuration and sync
const firebaseConfig = {
  apiKey: "AIzaSyDMmdEUADNrmpCYwJ5QAvkpbsi-OUFRyH0",
  authDomain: "forge-84eb0.firebaseapp.com",
  databaseURL: "https://forge-84eb0-default-rtdb.firebaseio.com",
  projectId: "forge-84eb0",
  storageBucket: "forge-84eb0.firebasestorage.app",
  messagingSenderId: "310182194636",
  appId: "1:310182194636:web:8514bc705c911d9f69c169"
};

firebase.initializeApp(firebaseConfig);
export const fbDb = firebase.database();
export const fbAuth = firebase.auth();
export const gProvider = new firebase.auth.GoogleAuthProvider();
export let fbUser = null;
export let fbConnected = false;

export function setFbUser(u) { fbUser = u; }

export function fbUserPath(S) {
  return "users/" + (fbUser ? fbUser.uid : encodeURIComponent(S.user));
}

let syncTimer = null;
let fbSyncing = false;

export function syncToFb(S) {
  if (!S || fbSyncing) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fbSyncing = true;
    const syncData = Object.assign({}, S);
    delete syncData.athletes;
    fbDb.ref(fbUserPath(S)).update(syncData).then(() => {
      fbConnected = true; fbSyncing = false; updSync();
    }).catch(e => {
      fbConnected = false; fbSyncing = false; updSync();
      console.warn("Firebase write failed:", e);
    });
  }, 1000);
}

export async function loadFromFb(S, svLocal) {
  if (!S) return false;
  try {
    const snap = await fbDb.ref(fbUserPath(S)).once("value");
    const d = snap.val();
    if (d) {
      const safeLen = (v) => Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 0);
      const localLog = safeLen(S.log);
      const remoteLog = safeLen(d.log);
      if (remoteLog > localLog) {
        const preserveRole = S.role;
        const preserveCoach = S.linkedCoach;
        const preserveCoachName = S.coachName;
        Object.assign(S, d);
        // Firebase may convert arrays to objects - fix them
        if (S.log && !Array.isArray(S.log)) S.log = Object.values(S.log);
        if (S.days && !Array.isArray(S.days)) S.days = Object.values(S.days);
        if (S.ncItems && !Array.isArray(S.ncItems)) S.ncItems = Object.values(S.ncItems);
        if (preserveCoach && !S.linkedCoach) {
          S.linkedCoach = preserveCoach;
          S.coachName = preserveCoachName;
          S.role = preserveRole;
        }
        svLocal(); fbConnected = true; updSync(); return true;
      } else if (localLog > 0 && localLog > remoteLog) {
        syncToFb(S); fbConnected = true; updSync(); return false;
      } else if (remoteLog > 0 && localLog === 0) {
        Object.assign(S, d);
        if (S.log && !Array.isArray(S.log)) S.log = Object.values(S.log);
        if (S.days && !Array.isArray(S.days)) S.days = Object.values(S.days);
        if (S.ncItems && !Array.isArray(S.ncItems)) S.ncItems = Object.values(S.ncItems);
        svLocal(); fbConnected = true; updSync(); return true;
      } else { fbConnected = true; updSync(); return false; }
    } else { syncToFb(S); fbConnected = true; updSync(); return false; }
  } catch (e) { fbConnected = false; updSync(); return false; }
}

export function updSync() {
  const el = document.getElementById("syncDot");
  if (el) el.className = "dot " + (fbConnected ? "ok" : "off");
  const el2 = document.getElementById("syncTxt");
  if (el2) el2.textContent = fbConnected ? "Synced" : "Offline";
}

export async function loadCoachAthletes(S) {
  if (!fbUser) return [];
  try {
    const snap = await fbDb.ref("users/" + fbUser.uid + "/athletes").once("value");
    const data = snap.val();
    return data ? Object.values(data) : [];
  } catch (e) { return []; }
}

export function genInviteCode(S) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (fbUser) fbDb.ref("invites/" + code).set({ uid: fbUser.uid, name: S.user, photo: S.photoURL || "" });
  return code;
}
