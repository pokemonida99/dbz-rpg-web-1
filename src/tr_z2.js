// Z2 時之間的區域（地圖 66 的門 9302～9341：地圖 67～71） — docs/tr-z2.md; the data is world.trz2 (tools/build_tr_z2.py).
// The original: Map007 event 18 pages 9302-9362, 145_Event_Check.rb `when 67`-`71`, battle_process 9304-9349.
//   doors  9302 邱夷區 (map 67) / 9311 多多利亞區 (68) / 9321 薩博區 (69) / 9331 基紐區 (70) / 9341 弗利薩區 (71):
//          CE181, variable 43 = 911-915 (enterArea, src/timeroom.js)
//   spots  z2exit  the way back (9303 / 9312 / 9322 / 9332 / 9342: CE182, variable 43 = 999, in front of the door)
//          z2boss  a boss page (9304 …): no EXP, the page's shared EXP / CAP / SP and card drops (trBattle); 9323 and
//                  9346 go straight on to 9324 / 9347 after a win (switch 128)
//          z2warp  map 71's squares between its parts (9353-9362)
// The card squares, inns and training squares are the ordinary ones (world.pois effect shop / rest / training).
import { registerArea, registerTrSpot, registerBackdrop, enterArea, leaveArea, trBattle, goTo } from './timeroom.js?v=20261102-2150';
import { registerZ3, begin, party } from './z3.js?v=20261102-2150';
import { moveTo } from './chapter2.js?v=20261102-2150';

const C = (game) => game.world.trz2;

for (const no of [9302, 9311, 9321, 9331, 9341]) {
  registerArea(no, (game) => {
    const a = C(game).areas[no];
    enterArea(game, a.to, a.v43);
  });
}
registerTrSpot('z2exit', (game, poi) => leaveArea(game, C(game).areas[poi.area].back));
registerTrSpot('z2warp', (game, poi) => { begin(game); goTo(game, poi.to); });
registerTrSpot('z2boss', (game, poi) => boss(game, poi.boss));

async function boss(game, page) {
  const s = game.state, b = C(game).battles[page];
  // 493 / 9346: ソリッドステートスカウター with the planet Kanassa seen (93), Bardock in the party (109) and leading
  const bgm = b.sorid && s.sw[93] && s.sw[109] && s.var[42] === 16 ? b.sorid : b.bgm;
  const r = await trBattle(game, b.foes, {
    shared: b.shared, cap: b.cap, sp: b.sp, drops: b.drops, heal: !!b.heal, bgm, backdrop: b.backdrop,
    alone: !!b.alone, hp30: !!b.hp30, hp40: !!b.hp40, // switches 25 / 26 / 27
  });
  if (r === 'win' && b.next) await boss(game, b.next);
}

// the battle background of these maps: set_battle_map with variable 301 = 1 (the Z2 hall), the row of Z2_戦闘_背景 by
// the ground tile
function z2Backdrop(game) {
  const s = game.state, m = game.world.maps[s.map], i = Math.floor(s.x / 32) + Math.floor(s.y / 32) * m.w;
  return `bg/z2_battle_${C(game).backdrops[m.layers[0][i]] ?? 0}.png`;
}
for (const map of ['67', '68', '69', '70', '71']) registerBackdrop(map, z2Backdrop);

// map 71's late encounters (140_Field_Main.rb: variable 43 = 915 and switch 119, Frieza beaten): src/main.js has no
// hook for an area's encounters, so this wraps game.onStep once the game object is there
function lateEncounters(game) {
  const a = game.world.areas && game.world.areas['71'];
  if (a && a.late) a.late.var43 = game.state.sw[119] ? 915 : -1;
}
setTimeout(() => {
  const game = window.__game;
  if (!game || game.trz2Hooked) return;
  game.trz2Hooked = true;
  const step = game.onStep;
  game.onStep = function () {
    if (this.state.map === '71') lateEncounters(this);
    return step.call(this);
  };
});

// ?dev=trz2: a Z4-end save in the Z2 hall (map 66); trz2cui / trz2dodoria / trz2zarbon / trz2ginyu / trz2frieza: in
// that area, next to its boss (trz2frieza: by Frieza's last form and Vegeta)
const DEV = {
  trz2cui: [9302, { map: '67', x: 6, y: 24 }], trz2dodoria: [9311, { map: '68', x: 12, y: 33 }],
  trz2zarbon: [9321, { map: '69', x: 9, y: 7 }], trz2ginyu: [9331, { map: '70', x: 56, y: 25 }],
  trz2frieza: [9341, { map: '71', x: 40, y: 58 }],
};
registerZ3('trz2', {
  dev(game, step) {
    if (step !== 'trz2' && !DEV[step]) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568,
      87, 88, 93, 97, 528, 529, 530, 531, 504]) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, [3, 5, 4, 12, 17, 6]);
    // what page 15 does on the way in (src/timeroom.js enter), the first-time lines already seen
    s.flags.tr = { back: { map: '48', x: 44, y: 29 }, v43: 0, v17: 0, party: s.party.map((m) => m.id), ss: {} };
    for (const n of [470, 466, 473, 476, 1301, 1304]) s.sw[n] = true;
    s.sw[78] = true;
    s.var[43] = 999;
    s.var[17] = 1;
    moveTo(s, { map: '66', x: 15, y: 10 });
    game.startField();
    if (DEV[step]) {
      const [no, at] = DEV[step];
      enterArea(game, at, C(game).areas[no].v43);
    }
    return true;
  },
});
