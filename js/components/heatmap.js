// Heat map rendering
import { hC } from '../state.js';

const FZ=[
{m:"Shoulders",cx:.33,cy:.24,rx:.07,ry:.032},
{m:"Shoulders",cx:.68,cy:.24,rx:.07,ry:.032},
{m:"Chest",cx:.5,cy:.265,rx:.165,ry:.04},
{m:"Biceps",cx:.295,cy:.325,rx:.04,ry:.045},
{m:"Biceps",cx:.72,cy:.325,rx:.04,ry:.045},
{m:"Forearms",cx:.23,cy:.405,rx:.05,ry:.05},
{m:"Forearms",cx:.775,cy:.405,rx:.05,ry:.045},
{m:"Core",cx:.5,cy:.385,rx:.12,ry:.075},
{m:"Hip flexors",cx:.405,cy:.45,rx:.035,ry:.018},
{m:"Hip flexors",cx:.63,cy:.45,rx:.035,ry:.018},
{m:"Quads",cx:.4,cy:.55,rx:.06,ry:.08},
{m:"Quads",cx:.6,cy:.55,rx:.06,ry:.08},
{m:"Adductors",cx:.47,cy:.53,rx:.025,ry:.05},
{m:"Adductors",cx:.53,cy:.53,rx:.025,ry:.05},
{m:"Abductors",cx:.35,cy:.48,rx:.025,ry:.025},
{m:"Abductors",cx:.65,cy:.48,rx:.025,ry:.025},
{m:"Calves",cx:.385,cy:.78,rx:.045,ry:.06},
{m:"Calves",cx:.625,cy:.78,rx:.045,ry:.06}
];
const BZ=[
{m:"Traps",cx:.468,cy:.201,rx:.16,ry:.022},
{m:"Shoulders",cx:.332,cy:.233,rx:.06,ry:.022},
{m:"Shoulders",cx:.632,cy:.226,rx:.06,ry:.022},
{m:"Rear delts",cx:.254,cy:.245,rx:.035,ry:.018},
{m:"Rear delts",cx:.691,cy:.232,rx:.035,ry:.018},
{m:"Back",cx:.5,cy:.27,rx:.13,ry:.045},
{m:"Lats",cx:.345,cy:.326,rx:.05,ry:.065},
{m:"Lats",cx:.592,cy:.332,rx:.05,ry:.065},
{m:"Triceps",cx:.255,cy:.332,rx:.055,ry:.045},
{m:"Triceps",cx:.705,cy:.343,rx:.055,ry:.045},
{m:"Glutes",cx:.416,cy:.484,rx:.08,ry:.045},
{m:"Glutes",cx:.556,cy:.48,rx:.08,ry:.045},
{m:"Hamstrings",cx:.377,cy:.582,rx:.075,ry:.09},
{m:"Hamstrings",cx:.586,cy:.574,rx:.075,ry:.09},
{m:"Calves",cx:.361,cy:.77,rx:.07,ry:.08},
{m:"Calves",cx:.611,cy:.766,rx:.07,ry:.08}
];

function paintHeat(cid, zones, vol) {
  const c = document.getElementById(cid); if (!c) return;
  const ctx = c.getContext("2d");
  c.width = 140; c.height = 290;
  ctx.clearRect(0, 0, 140, 290);
  zones.forEach(z => {
    const s = vol[z.m] || 0; if (s < 1) return;
    ctx.fillStyle = hC(s);
    ctx.beginPath();
    ctx.ellipse(z.cx * 140, z.cy * 290, z.rx * 140, z.ry * 290, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function renderHeatMap(vol) {
  setTimeout(() => { paintHeat("cvF", FZ, vol); paintHeat("cvB", BZ, vol); }, 50);
}
