// Chart rendering
export function renderExerciseChart(canvasId, logs, dayIdx, exIdx, gx, isL) {
  const c = document.getElementById(canvasId); if (!c) return;
  if (c._c) c._c.destroy();
  const pts = [];
  logs.forEach(lg => {
    if (lg.dayIdx != dayIdx || !lg.weights || !lg.weights[exIdx]) return;
    const raw = lg.weights[exIdx];
    let wts = [];
    if (Array.isArray(raw)) {
      raw.forEach(v => {
        if (v && typeof v === "object" && v.lbs) { const n = parseFloat(v.lbs); if (!isNaN(n) && n < 2000) wts.push(n); }
        else { const n = parseFloat(v); if (!isNaN(n) && n < 2000) wts.push(n); }
      });
    } else if (typeof raw === "object" && raw !== null) {
      Object.entries(raw).forEach(([k, s]) => {
        if (k === "_meta") return;
        if (Array.isArray(s)) { s.forEach(item => { if (item?.lbs) { const n = parseFloat(item.lbs); if (!isNaN(n) && n < 2000) wts.push(n); } }); }
        else if (s?.lbs) { const n = parseFloat(s.lbs); if (!isNaN(n) && n < 2000) wts.push(n); }
        else { const n = parseFloat(s); if (!isNaN(n) && n < 2000) wts.push(n); }
      });
    }
    if (wts.length) pts.push({ date: lg.date, max: Math.max(...wts) });
  });
  if (pts.length === 0) { c.parentElement.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--w3)">No logged data yet.<br>Complete a workout to see progress.</div>'; return; }
  const minY = Math.min(...pts.map(p => p.max)), maxY = Math.max(...pts.map(p => p.max));
  const pad = Math.max(10, Math.round((maxY - minY) * 0.2) || 10);
  c._c = new Chart(c, { type: "line", data: { labels: pts.map(p => p.date.slice(5)), datasets: [{ data: pts.map(p => p.max), borderColor: "#00F2FF", backgroundColor: "rgba(0,242,255,.15)", fill: true, tension: .3, pointRadius: 6, pointBackgroundColor: "#00F2FF", borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: minY - pad, max: maxY + pad, grid: { color: "rgba(192,192,192,.06)" }, ticks: { color: "#A8A8A8", font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: "#A8A8A8", font: { size: 10 } } } } } });
}

export function renderVolumeChart(canvasId, logs, color) {
  const c = document.getElementById(canvasId); if (!c) return;
  if (c._c) c._c.destroy();
  const bd = {};
  logs.forEach(lg => {
    if (!lg.weights) return;
    let totalVol = 0;
    Object.entries(lg.weights).forEach(([k, s]) => {
      if (k === "_meta") return;
      const items = Array.isArray(s) ? s : (typeof s === "object" ? Object.values(s) : []);
      items.forEach(item => {
        if (item && typeof item === "object" && item.lbs && item.reps) {
          const w = parseFloat(item.lbs), r = parseInt(item.reps);
          if (!isNaN(w) && !isNaN(r) && w < 2000) totalVol += w * r;
        }
      });
    });
    if (totalVol > 0) bd[lg.date] = (bd[lg.date] || 0) + totalVol;
  });
  const ds = Object.keys(bd).sort();
  if (ds.length === 0) { c.parentElement.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--w3)">No data yet.</div>'; return; }
  const vals = ds.map(d => bd[d]), minY = Math.min(...vals), maxY = Math.max(...vals);
  const pad = Math.max(500, Math.round((maxY - minY) * 0.15) || 500);
  c._c = new Chart(c, { type: "line", data: { labels: ds.map(d => d.slice(5)), datasets: [{ data: vals, borderColor: color || "#ED4FBA", backgroundColor: (color || "#ED4FBA") + "20", fill: true, tension: .3, pointRadius: 6, pointBackgroundColor: color || "#ED4FBA", borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.parsed.y.toLocaleString() + " lbs volume" } } }, scales: { y: { min: Math.max(0, minY - pad), max: maxY + pad, grid: { color: "rgba(192,192,192,.06)" }, ticks: { color: "#A8A8A8", font: { size: 10 }, callback: v => v >= 1000 ? (v / 1000).toFixed(1) + "k" : v } }, x: { grid: { display: false }, ticks: { color: "#A8A8A8", font: { size: 10 } } } } } });
}
