// Default configuration
export const SWAP={1:4,4:1,5:6,6:5,32:36,36:32,34:37,37:34,35:38,38:35,50:55,55:50,11:17,17:11,13:14,14:13,21:24,24:21,60:61,61:60,40:42,42:40};
const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];

export const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];

export const DEF_NC=["Protein target hit","100g+ vegetables","Water > 3L","Creatine taken"];

export const MS=["Chest","Back","Shoulders","Rear delts","Biceps","Triceps","Forearms","Quads","Hamstrings","Glutes","Hip flexors","Core","Calves","Lats","Traps","Adductors","Abductors"];

export function defDays(){return[
{label:"Upper Body A",exercises:[
{exId:406,sets:1,reps:"15",rest:0},{exId:416,sets:1,reps:"20",rest:0},
{exId:400,sets:3,reps:"5,8,10",rest:180},{exId:401,sets:3,reps:"10",rest:120},{exId:22,sets:3,reps:"10,12,15",rest:60},{exId:402,sets:2,reps:"15",rest:60},{exId:403,sets:3,reps:"8,10,12",rest:90},
{exId:404,sets:3,reps:"10,10,AMRAP",rest:0,ss:"F"},{exId:405,sets:3,reps:"10,10,AMRAP",rest:60,ss:"F"}
]},
{label:"Lower Body",exercises:[
{exId:417,sets:1,reps:"15",rest:0},
{exId:50,sets:3,reps:"5,6,8",rest:180},{exId:60,sets:3,reps:"8,8,10",rest:150},{exId:53,sets:3,reps:"10,12,15",rest:120},{exId:63,sets:3,reps:"12,15,AMRAP",rest:90},{exId:57,sets:3,reps:"12,15,AMRAP",rest:60},{exId:407,sets:3,reps:"20",rest:60},{exId:408,sets:3,reps:"10",rest:60}
]},
{label:"Upper Body B",exercises:[
{exId:406,sets:1,reps:"20",rest:0},{exId:416,sets:1,reps:"20",rest:0},
{exId:409,sets:3,reps:"6,8,10",rest:180},{exId:410,sets:3,reps:"6,8,10",rest:120},{exId:411,sets:3,reps:"8,10,12",rest:90},{exId:412,sets:3,reps:"8,10,12",rest:90},
{exId:413,sets:2,reps:"10,12",rest:0,ss:"E"},{exId:25,sets:2,reps:"10,12",rest:60,ss:"E"},
{exId:414,sets:2,reps:"12,15",rest:0,ss:"F"},{exId:415,sets:2,reps:"12,15",rest:60,ss:"F"}
]},
{label:"Light Cardio",exercises:[
{exId:303,sets:1,reps:"30 min"},{exId:304,sets:1,reps:"20 min"}
]}
]}

export const GLOSS={"AMRAP":"As Many Reps As Possible — push to near failure with good form","RIR":"Reps In Reserve — how many reps you could still do","RPE":"Rate of Perceived Exertion — 1 (easy) to 10 (max effort)","1RM":"One Rep Max — heaviest weight you can lift once","PR":"Personal Record","EMOM":"Every Minute On the Minute","HIIT":"High Intensity Interval Training","BW":"Bodyweight — no added weight","SS":"Superset — two exercises back to back with no rest","TUT":"Time Under Tension"};
