// Heat map rendering
import { hC } from '../state.js';

const FZ = [{m:"Shoulders",x:.13,y:.14,w:.16,h:.06},{m:"Shoulders",x:.71,y:.14,w:.16,h:.06},{m:"Chest",x:.25,y:.16,w:.50,h:.14},{m:"Core",x:.30,y:.32,w:.40,h:.14},{m:"Biceps",x:.05,y:.20,w:.14,h:.16},{m:"Biceps",x:.81,y:.20,w:.14,h:.16},{m:"Forearms",x:.02,y:.37,w:.12,h:.18},{m:"Forearms",x:.86,y:.37,w:.12,h:.18},{m:"Quads",x:.22,y:.48,w:.22,h:.22},{m:"Quads",x:.56,y:.48,w:.22,h:.22},{m:"Calves",x:.24,y:.72,w:.18,h:.18},{m:"Calves",x:.58,y:.72,w:.18,h:.18}];
const BZ = [{m:"Traps",x:.30,y:.12,w:.40,h:.06},{m:"Shoulders",x:.10,y:.14,w:.16,h:.06},{m:"Shoulders",x:.74,y:.14,w:.16,h:.06},{m:"Back",x:.25,y:.18,w:.50,h:.14},{m:"Lats",x:.20,y:.24,w:.15,h:.10},{m:"Lats",x:.65,y:.24,w:.15,h:.10},{m:"Triceps",x:.04,y:.20,w:.14,h:.16},{m:"Triceps",x:.82,y:.20,w:.14,h:.16},{m:"Glutes",x:.28,y:.35,w:.44,h:.10},{m:"Hamstrings",x:.22,y:.48,w:.22,h:.22},{m:"Hamstrings",x:.56,y:.48,w:.22,h:.22},{m:"Calves",x:.24,y:.72,w:.18,h:.18},{m:"Calves",x:.58,y:.72,w:.18,h:.18},{m:"Rear delts",x:.12,y:.14,w:.12,h:.05},{m:"Rear delts",x:.76,y:.14,w:.12,h:.05}];

function paintHeat(cid, zones, vol) {
  const c = document.getElementById(cid); if (!c) return;
  const ctx = c.getContext("2d");
  c.width = 140; c.height = 290;
  ctx.clearRect(0, 0, 140, 290);
  zones.forEach(z => {
    const s = vol[z.m] || 0; if (s < 1) return;
    ctx.fillStyle = hC(s);
    ctx.beginPath();
    ctx.ellipse(z.x * 140 + z.w * 70, z.y * 290 + z.h * 145, z.w * 77, z.h * 160, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function renderHeatMap(vol) {
  setTimeout(() => { paintHeat("cvF", FZ, vol); paintHeat("cvB", BZ, vol); }, 50);
}
