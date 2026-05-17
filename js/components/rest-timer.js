// Rest timer popup
import { fmtRest } from '../utils/helpers.js';

let restPopupInt = null, restPopupSec = 0, restPopupTotal = 0;

export function showRestPopup(seconds, exerciseName) {
  if (seconds <= 0) return;
  const ov = document.getElementById("ovl");
  const circ = 2 * Math.PI * 90;
  ov.innerHTML = '<div class="timer-overlay" id="restPopup"><div class="timer-label">Rest — ' + exerciseName + '</div><div class="timer-ring"><svg viewBox="0 0 200 200"><circle class="bg-ring" cx="100" cy="100" r="90"/><circle class="fg-ring" id="timerArc" cx="100" cy="100" r="90" stroke-dasharray="' + circ + '" stroke-dashoffset="0"/></svg><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><span class="big-time" id="popTime">' + fmtRest(seconds) + '</span></div></div><button class="skip-btn" onclick="window._skipRest()">Skip rest</button></div>';
  ov.style.display = "block";
  restPopupSec = seconds; restPopupTotal = seconds;
  restPopupInt = setInterval(() => {
    restPopupSec--;
    if (restPopupSec <= 0) { skipRest(); return; }
    const el = document.getElementById("popTime"); if (el) el.textContent = fmtRest(restPopupSec);
    const arc = document.getElementById("timerArc");
    if (arc) { const off = circ * (1 - restPopupSec / restPopupTotal); arc.style.strokeDashoffset = off; }
  }, 1000);
}

export function skipRest() {
  clearInterval(restPopupInt); restPopupInt = null;
  const ov = document.getElementById("ovl"); ov.style.display = "none"; ov.innerHTML = "";
}

// Expose globally for onclick
window._skipRest = skipRest;
