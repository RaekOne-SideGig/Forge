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
  if (!S) { console.warn("syncToFb: S is null"); return; }
  if (fbSyncing) { console.log("syncToFb: already syncing, queued"); return; }
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fbSyncing = true;
    const syncData = Object.assign({}, S);
    delete syncData.athletes;
    const path = fbUserPath(S);
    console.log("syncToFb: writing to", path, "keys:", Object.keys(syncData).join(","));
    fbDb.ref(path).update(syncData).then(() => {
      fbConnected = true; fbSyncing = false; updSync();
      console.log("syncToFb: SUCCESS");
    }).catch(e => {
      fbConnected = false; fbSyncing = false; updSync();
      console.error("syncToFb: FAILED:", e.message);
    });
  }, 1000);
}

export async function loadFromFb(S, svLocal) {
  if (!S) return false;
  try {
    const path = fbUserPath(S);
    console.log("loadFromFb: reading from", path);
    const snap = await fbDb.ref(path).once("value");
    const d = snap.val();
    if (d) {
      console.log("loadFromFb: got remote data, applying");
      const preserveRole = S.role;
      const preserveCoach = S.linkedCoach;
      const preserveCoachName = S.coachName;
      // Always use remote data as source of truth
      Object.assign(S, d);
      // Firebase may convert arrays to objects - fix them
      if (S.log && !Array.isArray(S.log)) S.log = Object.values(S.log);
      if (S.days && !Array.isArray(S.days)) S.days = Object.values(S.days);
      if (S.ncItems && !Array.isArray(S.ncItems)) S.ncItems = Object.values(S.ncItems);
      // Fix exercises arrays within days
      if (S.days && Array.isArray(S.days)) {
        S.days.forEach(d => {
          if (d && d.exercises && !Array.isArray(d.exercises)) d.exercises = Object.values(d.exercises);
        });
      }
      // Preserve coach link if it was set locally but not remotely
      if (preserveCoach && !S.linkedCoach) {
        S.linkedCoach = preserveCoach;
        S.coachName = preserveCoachName;
        S.role = preserveRole;
      }
      svLocal();
      fbConnected = true; updSync();
      return true;
    } else {
      // No remote data - push local to Firebase
      console.log("loadFromFb: no remote data, pushing local");
      syncToFb(S);
      fbConnected = true; updSync();
      return false;
    }
  } catch (e) {
    console.warn("loadFromFb failed:", e);
    fbConnected = false; updSync();
    return false;
  }
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
