// State management
import { DDB } from './data/exercises.js';
import { DEF_NC, defDays } from './data/defaults.js';
import { syncToFb } from './firebase.js';

export let S = null;

export function setS(val) { S = val; }

export function ld(n) {
  let r = null;
  try { r = localStorage.getItem("forge_" + n); } catch (e) {}
  if (r) try { S = JSON.parse(r); } catch (e) { S = null; }
  if (!S) S = {
    user: n, weight: "", role: "", inviteCode: "", linkedCoach: "",
    athletes: [], days: defDays(), customEx: [], nxId: 1000, ltf: "all",
    chk: { bw: "", steps: "", sleep: "", cal: "", exMin: "", prot: "" },
    log: [], wlogs: {}, ncItems: DEF_NC.slice(), recLog: {}
  };
  if (!S.log) S.log = [];
  if (!S.wlogs) S.wlogs = {};
  if (!S.ncItems) S.ncItems = DEF_NC.slice();
  if (!S.recLog) S.recLog = {};
  if (!S.days) S.days = defDays();
  if (!S.role) S.role = "";
  if (!S.inviteCode) S.inviteCode = "";
  if (!S.linkedCoach) S.linkedCoach = "";
  if (!S.athletes) S.athletes = [];
  svLocal();
}

export function svLocal() {
  try {
    localStorage.setItem("forge_" + S.user, JSON.stringify(S));
    localStorage.setItem("forge_last", S.user);
  } catch (e) {}
}

export function sv() { svLocal(); syncToFb(S); }

export function aDB() { return DDB.concat(S.customEx || []); }

export function gx(id) { return aDB().find(e => e.id === id); }

export function isL(t) { return t === "compound" || t === "isolation"; }

export function tB(t) {
  return t === "compound" ? "bw" : t === "isolation" ? "bb" : t === "mobility" ? "ba" : t === "stretch" ? "bp" : t === "cardio" ? "bg2" : "bt";
}

export function hC(s) { return s >= 12 ? "#ED4FBA" : s >= 6 ? "#7F77DD" : s >= 1 ? "#1D9E75" : "#181820"; }

export function tds() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function wlk(di) { return tds() + "_" + di; }

export function compColor(p) { return p >= 75 ? "#ED4FBA" : p >= 25 ? "#7F77DD" : "#1D9E75"; }

export function cDay(cD) { return S.days[cD] || S.days[0]; }

export function cV(cD) {
  const v = {};
  cDay(cD).exercises.forEach(w => {
    const e = gx(w.exId);
    if (!e || e.p === "Cardio") return;
    v[e.p] = (v[e.p] || 0) + w.sets;
    (e.s || []).forEach(s => { if (s !== "Cardio") v[s] = (v[s] || 0) + Math.max(1, Math.round(w.sets * 0.75)); });
  });
  return v;
}
