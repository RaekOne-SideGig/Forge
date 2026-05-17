// CSV Export
export function exportData(S, gx, isL) {
  const from = document.getElementById("expFrom")?.value || "";
  const to = document.getElementById("expTo")?.value || "";
  let logs = S.log || [];
  if (from) logs = logs.filter(l => l.date >= from);
  if (to) logs = logs.filter(l => l.date <= to);
  
  let csv = "Date,Workout,Exercise,Set,Weight (lbs),Reps,Duration (min)\n";
  logs.forEach(lg => {
    const dayData = S.days[lg.dayIdx]; if (!dayData) return;
    const dur = lg.duration ? Math.floor(lg.duration / 60) : "";
    dayData.exercises.forEach((w, ei) => {
      const e = gx(w.exId); if (!e || !isL(e.t)) return;
      const wts = lg.weights?.[ei] || {};
      if (Array.isArray(wts)) {
        wts.forEach((sd, si) => {
          csv += lg.date + "," + lg.label + "," + e.n + "," + (si + 1) + "," + (sd?.lbs || "") + "," + (sd?.reps || "") + "," + dur + "\n";
        });
      } else {
        Object.entries(wts).forEach(([si, sd]) => {
          if (si === "_meta") return;
          csv += lg.date + "," + lg.label + "," + e.n + "," + (parseInt(si) + 1) + "," + (sd?.lbs || sd || "") + "," + (sd?.reps || "") + "," + dur + "\n";
        });
      }
    });
  });
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "forge-export-" + (from || "all") + "-to-" + (to || "now") + ".csv";
  a.click(); URL.revokeObjectURL(url);
}
