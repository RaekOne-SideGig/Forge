// Progressive overload nudge logic
export function getOverloadClass(prevLbs, curLbs, prevReps, curReps) {
  if (!prevLbs || !curLbs) return "";
  const pn = parseFloat(prevLbs), cn = parseFloat(curLbs);
  const pr = prevReps ? parseInt(prevReps) : 0, cr = curReps ? parseInt(curReps) : 0;
  if (isNaN(pn) || isNaN(cn)) return "";
  if (cn > pn || (cn === pn && cr > pr)) return "progress";
  if (cn === pn && cr === pr) return "stalled";
  if (cn < pn) return "regress";
  return "";
}

export function getOverloadHint(cls, prevLbs) {
  const bump = parseFloat(prevLbs) >= 100 ? "5" : "2.5";
  if (cls === "stalled") return '<div class="overload-hint warn">↑ Try +' + bump + ' lbs to progress</div>';
  if (cls === "regress") return '<div class="overload-hint bad">↓ Below last session</div>';
  if (cls === "progress") return '<div class="overload-hint good">✓ Progressive overload</div>';
  return "";
}
