// Utility functions
import { GLOSS } from '../data/defaults.js';

export function fmtRest(s){if(s>=60){const m=Math.floor(s/60);const sec=s%60;return m+":"+(sec<10?"0":"")+sec}return s+"s"}

export function fmtElapsed(startMs,pausedMs){
  const pm=pausedMs||0;
  const diff=Math.floor((Date.now()-startMs-pm)/1000);
  if(diff<0)return "0:00";
  const h=Math.floor(diff/3600);const m=Math.floor((diff%3600)/60);const s=diff%60;
  if(h>0)return h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
  return m+":"+(s<10?"0":"")+s;
}

export function calcAvgDuration(dayIdx){
  const durations=S.log.filter(lg=>lg.dayIdx==dayIdx&&lg.duration&&lg.duration>0).map(lg=>lg.duration);
  if(durations.length===0)return null;
  const avg=Math.round(durations.reduce((a,b)=>a+b,0)/durations.length);
  const m=Math.floor(avg/60);const s=avg%60;
  return m+" min"+(s>0?" "+s+"s":"")+" ("+durations.length+" sessions)";
}

export function addTips(s){return s.replace(/\b(AMRAP|RIR|RPE|1RM|PR|EMOM|HIIT|BW|SS|TUT)\b/g,(m)=>{const d=GLOSS[m];return d?'<span class="tip">'+m+'<span class="tiptext">'+d+'</span></span>':m})}

