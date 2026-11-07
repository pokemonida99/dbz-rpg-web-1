// Which opening, title picture and title music — the original's rule. Every save writes game.ini (all.rb 39509-39533):
// Progress = variable 40, Op_Change = variable 84, or 4 while variable 43 is 143-149 (ZG バーダック一味編) and 5 while
// it is 151-200 (ZG 本編). The next start reads them back (190293): Title_Anime#op (167225) plays the opening,
// Scene_Title create_title_graphic (37713) and play_title_music (37806) pick the title. Here the newest save stands in
// for game.ini.
// Variable 84 is set by Map007's pages: 1 when Z3 hands over to Z4 (event 5 page 56), 2 at the Metal Cooler chapter
// (event 7 page 41, variable 41 = 2701), 3 after the Cell Games (event 7 page 39, 2602) — src/z4a.js, z4d.js, z4f.js.
// A save from before the remake kept it is worked out from its chapter.
const Z4_CELL = ['z4a', 'z4b', 'z4c'], Z4_LATER = ['z4d', 'z4e', 'z4f'];
function opChange(s) {
  const v43 = (s.var && s.var[43]) || 0;
  if (v43 >= 143 && v43 <= 149) return 4;
  if (v43 >= 151 && v43 <= 200) return 5;
  if (s.var && s.var[84] != null) return s.var[84];
  const z = String((s.flags && s.flags.z3) || '');
  if (Z4_CELL.includes(z)) return 1;
  if (Z4_LATER.includes(z)) return 2;
  if (z === 'done' || /^(tr|zg)/.test(z)) return (s.var && s.var[40]) >= 2 ? 3 : 0;
  return 0;
}

// $z2opchano: the ZG Bardock crew's member (rand(4)), drawn once a start, shared by the opening and the title
let crew = null;
export const crewNo = () => (crew == null ? (crew = Math.floor(Math.random() * 4)) : crew);

// { prog, op, film, pic, bgm } for a save (null: a new device, the Z1 ones)
export function opPick(s) {
  const prog = Math.min(2, (s && s.var && s.var[40]) || 0), op = s ? opChange(s) : 0;
  if (prog === 0) return { prog, op, film: 'z1', pic: 'Title', bgm: 'Z1 オープニング' };
  if (prog === 1) return { prog, op, film: op === 4 ? 'z2crew' : 'z2', pic: op === 4 ? `Title2_${crewNo()}` : 'Title2', bgm: 'Z2 オープニング' };
  if (op === 1) return { prog, op, film: 'cell3', pic: 'Title3_2', bgm: 'ZD オープニング' };
  if (op === 2) return { prog, op, film: 'cell0', pic: 'Title3_3', bgm: 'ZD オープニング' };
  if (op === 3) return { prog, op, film: 'cell4', pic: 'Title3_4', bgm: 'ZD オープニング' };
  if (op === 4) return { prog, op, film: 'z3', pic: 'Title2', bgm: 'Z3 オープニング' };
  if (op === 5) return { prog, op, film: 'zg', pic: 'TitleG', bgm: 'ZG オープニング' };
  return { prog, op, film: 'z3', pic: 'Title3', bgm: 'Z3 オープニング' };
}
