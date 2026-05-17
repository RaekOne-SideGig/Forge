// Drag and drop reorder
let _di = null, _doi = null;

export function initDrag(getExercises, save, rerender) {
  window._tds2 = function(e, i) { e.preventDefault(); _di = i; const r = e.target.closest(".er"); if (r) r.classList.add("dact"); };
  window._tdm2 = function(e) { if (_di === null) return; e.preventDefault(); const y = e.touches[0].clientY; document.querySelectorAll(".er[data-di]").forEach(r => { r.classList.remove("dtgt"); const rc = r.getBoundingClientRect(); if (y > rc.top && y < rc.bottom) { const idx = parseInt(r.dataset.di); if (idx !== _di) { r.classList.add("dtgt"); _doi = idx; } } }); };
  window._tde2 = function(e) { document.querySelectorAll(".er").forEach(r => { r.classList.remove("dact", "dtgt"); }); if (_di !== null && _doi !== null && _doi !== _di) { const exs = getExercises(); const item = exs.splice(_di, 1)[0]; exs.splice(_doi, 0, item); save(); rerender(); } _di = null; _doi = null; };
  window._mds2 = function(e, i) { _di = i; const r = e.target.closest(".er"); if (r) r.classList.add("dact"); const mm = e2 => { if (_di === null) return; document.querySelectorAll(".er[data-di]").forEach(r => { r.classList.remove("dtgt"); const rc = r.getBoundingClientRect(); if (e2.clientY > rc.top && e2.clientY < rc.bottom) { const idx = parseInt(r.dataset.di); if (idx !== _di) { r.classList.add("dtgt"); _doi = idx; } } }); }; const mu = () => { document.removeEventListener("mousemove", mm); document.removeEventListener("mouseup", mu); document.querySelectorAll(".er").forEach(r => { r.classList.remove("dact", "dtgt"); }); if (_di !== null && _doi !== null && _doi !== _di) { const exs = getExercises(); const item = exs.splice(_di, 1)[0]; exs.splice(_doi, 0, item); save(); rerender(); } _di = null; _doi = null; }; document.addEventListener("mousemove", mm); document.addEventListener("mouseup", mu); };
}

export function moveEx(i, dir, getExercises, save, rerender) {
  const exs = getExercises();
  const newIdx = i + dir;
  if (newIdx < 0 || newIdx >= exs.length) return;
  const temp = exs[i]; exs[i] = exs[newIdx]; exs[newIdx] = temp;
  save(); rerender();
}
