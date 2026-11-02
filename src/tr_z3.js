// Z3 時之間的區域（地圖 72 的門 9502～9554：地圖 73～77、83） — docs/timeroom-plan.md, docs/tr-z3.md; the data is
// world.trZ3 (tools/build_tr_z3.py). The original: Map007 event 20 pages 9501-9554, 145_Event_Check.rb `when 73` … `77`,
// `83`, battle_process 9504 …:
//   the doors (9502 克拉斯 → map 73, 9511 皮拉爾 → 74, 9521 凱澤 → 75, 9531 古拉 → 76, 9541 人造人間 → 77,
//   9551 卡里克 Jr. → 83): CE181, variable 43 = 921-926; each map's 時の間 square (9503 …): CE182, back to the door
//   trz3Boss   a boss standing on the map (fought again and again): the story battle, the page's rewards (trBattle);
//              9534 Cooler → on a win at once 9535 his last form (switch 128)
//   trz3Card30 map 77's special card square (variable 44 = 30)    trz3Warp  map 77: 9545 / 9546 (No. 20 ↔ Nos. 16-18)
//   trz3Ball   map 76's seven balls (page 1431 of the story: src/z3d.js), while not held and switch 446 is off
import { audio, toast } from './core.js?v=20261103-0433';
import { registerZ3, begin, party, z3Spot, z3BackdropAt } from './z3.js?v=20261103-0433';
import { registerArea, registerTrSpot, registerBackdrop, enterArea, leaveArea, trBattle, goTo } from './timeroom.js?v=20261103-0433';
import { cardSquare } from './cardgames.js?v=20261103-0433';
import { spotTally } from './fieldmenu.js?v=20261103-0433';

const T = (game) => game.world.trZ3;
const MAPS = ['73', '74', '75', '76', '77', '83'];

// ---------- the doors of map 72 and the way back ----------
for (const no of [9502, 9511, 9521, 9531, 9541, 9551]) {
  registerArea(no, (game) => { const a = T(game).areas[no]; enterArea(game, a.to, a.v43); });
}
registerTrSpot('trz3Leave', (game, poi) => leaveArea(game, T(game).areas[poi.area].back));

// ---------- the bosses ----------
registerTrSpot('trz3Boss', async (game, poi) => {
  begin(game);
  for (let no = String(poi.boss); no;) {
    const { foes, next, ...opts } = T(game).bosses[no];
    if (await trBattle(game, foes, opts) !== 'win') break;
    if (next) begin(game);
    no = next;
  }
});

// ---------- map 77 ----------
registerTrSpot('trz3Card30', async (game, poi) => {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi; // once per stop, like the other card squares
  s.var[44] = 30; // カード特殊 (create_get_card: the Z3 cards)
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
});
registerTrSpot('trz3Warp', (game, poi) => { begin(game); goTo(game, poi.to); });

// ---------- map 76: the balls (has_item? of that ball, switch 446) ----------
registerTrSpot('trz3Ball', (game, poi) => {
  const s = game.state;
  if (s.cards && s.cards[poi.ball + 1] > 0) { audio.se('Z1 出る'); return null; } // (held: the original's square does nothing)
  return z3Spot(game, { chapter: 'z3d', page: 1431, ball: poi.ball });
});
// a ball's square is there while that ball (card ball + 1) is not held and switch 446 is off (as src/z3d.js does on map 39)
let patched = null;
function patchBalls(game) {
  if (!game || !game.world || patched === game.world) return;
  patched = game.world;
  for (const p of game.world.pois['76'] || []) {
    if (p.page !== 'trz3Ball') continue;
    Object.defineProperty(p, 'when', {
      configurable: true,
      get() { const s = game.state; return s && s.cards && s.cards[p.ball + 1] > 0 ? ['sw', 0, true] : ['sw', 446, false]; },
    });
  }
}

// ---------- the field battles' backgrounds ----------
// set_battle_map in the 時の間 (switch 466: scenario_progress = variable 301, the Z3 hall's era 2): the Z3 tile rules
for (const map of MAPS) registerBackdrop(map, (game) => z3BackdropAt(game));
// (the ball squares: once src/main.js has made the game and loaded the world, for a save loaded inside an area too)
const wait = setInterval(() => { const g = window.__game; if (g && g.world) { clearInterval(wait); patchBalls(g); } }, 500);

// ---------- ?dev=trz3 (the Z3 hall), ?dev=trz3kuraz / trz3pilaf / trz3kaiz / trz3cooler / trz3android / trz3garlic
// (straight into that area): a Z4-end save already in the 時之間 ----------
const DEV = { kuraz: 9502, pilaf: 9511, kaiz: 9521, cooler: 9531, android: 9541, garlic: 9551 };
registerZ3('trz3', {
  dev(game, step) {
    const m = /^trz3(\w*)$/.exec(step);
    if (!m || (m[1] && !DEV[m[1]])) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568, 470, 466, 473]) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, [3, 5, 4, 12, 17, 6]);
    s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((x) => x.id), ss: {} };
    Object.assign(s.var, { 43: 999, 17: 2, 23: 2, 308: 64, 309: 13 });
    s.map = '72'; s.x = 15 * 32 + 16; s.y = 10 * 32 + 16;
    game.startField();
    patchBalls(game);
    if (m[1]) { const a = T(game).areas[DEV[m[1]]]; enterArea(game, a.to, a.v43); } else { begin(game); goTo(game, { map: '72', x: 15, y: 10 }); }
    return true;
  },
});
