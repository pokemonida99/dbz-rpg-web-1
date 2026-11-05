// Z4 時之間的區域（地圖 85／86 的門 9702～9771：地圖 87～95） — docs/tr-z4.md (plan: docs/timeroom-plan.md); the data is
// world.trZ4 and the areas' maps / spots / encounters, built by tools/build_tr_z4.py. The original: Map007 event 21
// pages 9701-9773, 145_Event_Check.rb `when 87` … `when 95`, battle_process 9704 … 9773.
//   z4back   an area's 時の間 square (9703 …): CE182, back to its door in the hall (map 85 after Z4, 86 before)
//   z4boss   a boss square (9704 …): the battle page (poi.boss), 9755 (No. 13) goes on to 9756 (No. 13 merged)
//   z4warp   map 94's squares between the androids (9761-9766)
//   z4card40 map 95 カード特殊 (variable 44 = 40)
import { audio, toast, sleep } from './core.js?v=20261105-1811';
import { registerZ3, member, party, z3BackdropAt } from './z3.js?v=20261105-1811';
import { cardSquare } from './cardgames.js?v=20261105-1811';
import { spotTally } from './fieldmenu.js?v=20261105-1811';
import { registerArea, registerTrSpot, enterArea, leaveArea, trBattle, goTo, registerBackdrop } from './timeroom.js?v=20261105-1811';

const T = (game) => game.world.trZ4;
const DOORS = [9702, 9711, 9721, 9731, 9741, 9751, 9771];

// the doors of the hall (9702 …): CE181, variable 43 = 931 …, the area
for (const no of DOORS) registerArea(no, (game) => { const d = T(game).doors[no]; return enterArea(game, d, d.v43); });

// 9703 …: back to the door's square below it ((x, 3) of map 85 once Z4 is over, map 86 before)
registerTrSpot('z4back', (game, poi) => leaveArea(game, { map: game.state.sw[458] ? '85' : '86', x: poi.hall, y: 3 }));

// 9704 …: the battle page (242 BGM fade-out, the switches and variables it sets, battle_process); won with switch
// 128 on, chk_set_event_no runs the next page's battle at once (9755 → 9756)
async function boss(game, no) {
  const { foes, next, ...opts } = T(game).bosses[no]; // opts: the rewards, heal, bgm, backdrop, alone / hp30 / two / hp50
  audio.fadeBgm(1);
  await sleep(300);
  const r = await trBattle(game, foes, opts);
  if (r === 'win' && next) return boss(game, next);
  return r;
}
registerTrSpot('z4boss', (game, poi) => boss(game, poi.boss));

// 9761-9766: to the next android (a plain transfer)
registerTrSpot('z4warp', (game, poi) => goTo(game, poi.to));

// map 95 (38,29) カード特殊: the card square with variable 44 = 40 (as src/z4f.js card40)
registerTrSpot('z4card40', async (game, poi) => {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi; // once per stop, like the other card squares
  s.var[44] = 40;
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
});

// the field battles' background on these maps: set_battle_map (scenario_progress = variable 301 = 2 in the time room),
// the Z3 tile rules (the map events by square: world.z3.tileEvents, tools/build_tr_z4.py)
for (const m of ['87', '88', '89', '91', '92', '94', '95']) registerBackdrop(m, (game) => z3BackdropAt(game));

// ?dev=trz4 (&timer): a Z4-end save in the Z4 hall (map 85); ?dev=trz4willow / cell1 / cell2 / metal / core / android /
// cellgame: next to that area's boss; ?dev=trz4before: the hall before the clear (map 86)
const DEV = { willow: 9702, cell1: 9711, cell2: 9721, metal: 9731, core: 9741, android: 9751, cellgame: 9771 };
const NEAR = { 9702: [19, 10], 9711: [8, 42], 9721: [40, 35], 9731: [68, 4], 9741: [49, 11], 9751: [10, 25], 9771: [44, 36] };
registerZ3('trz4', {
  dev(game, step) {
    const k = /^trz4(\w*)$/.exec(step);
    if (!k || (k[1] && k[1] !== 'before' && !DEV[k[1]])) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    const sws = [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568];
    if (k[1] !== 'before') sws.push(458);
    for (const n of sws) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, [3, 5, 4, 12, 17, 6]);
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    // page 15 has run (src/timeroom.js enter)
    s.flags.tr = { back: { map: s.map, x: s.x, y: s.y }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
    Object.assign(s.var, { 43: 999, 17: 2, 23: 2 });
    Object.assign(s.sw, { 78: true, 466: true, 470: true, 473: true });
    for (const id of [3, 5, 4, 12, 17, 6]) member(game, id);
    game.startField();
    const no = DEV[k[1]];
    if (!no) { goTo(game, k[1] === 'before' ? { map: '86', x: 18, y: 10 } : { map: '85', x: 23, y: 10 }); return true; }
    enterArea(game, T(game).doors[no], T(game).doors[no].v43);
    goTo(game, { map: T(game).doors[no].map, x: NEAR[no][0], y: NEAR[no][1] });
    return true;
  },
});
