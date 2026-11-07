// Z1 時之間的區域（地圖 59 的門 9102～9144：地圖 60～64） — docs/timeroom-plan.md, docs/tr-z1.md; the data is
// world.trZ1 and the maps / spots / encounters of maps 60-64, built by tools/build_tr_z1.py. The original: Map007
// event 17 「時の間」 pages 9101-9144, 145_Event_Check.rb `when 60`-`64`, battle_process 9104 …:
//   doors      9102 拉蒂茲區 (60), 9111 卡里克區 (61), 9121 界王區 (62), 9131 貝吉塔區 (63), 9141 威洛區 (64): CE181,
//              variable 43 = 901-905, the area's entry square (src/timeroom.js enterArea)
//   trz1back   the square next to it: 9103 / 9112 / 9122 / 9132 / 9142 (CE182, variable 43 = 999, back to map 59)
//   trz1boss   the boss squares: 9104 拉蒂茲, 9113 卡里克 (its win runs 9114: 卡里克(巨大化) and the three), 9123 界王
//              (map 62's training squares), 9133 那巴, 9134 貝吉塔, 9143 生化戰士, 9144 威洛 (src/timeroom.js trBattle)
// The inns, card squares and training squares are the usual field spots (src/main.js interact).
import { registerArea, registerTrSpot, registerBackdrop, enterArea, leaveArea, trBattle, goTo, healAll } from './timeroom.js?v=20261107-2349';
import { registerZ3, begin, party } from './z3.js?v=20261107-2349';
import { makeMember, applyLevel } from './party.js?v=20261107-2349';

const Z = (game) => game.world.trZ1;

// ---------- the doors of map 59 ----------
for (const no of [9102, 9111, 9121, 9131, 9141]) {
  registerArea(no, (game) => {
    const d = Z(game).doors[no];
    enterArea(game, d.to, d.v43);
  });
}

// ---------- the area squares ----------
registerTrSpot('trz1back', (game, poi) => leaveArea(game, poi.to));

// a boss page: its battle_process with what the page sets; 9113 goes on to 9114 when won (switch 128)
registerTrSpot('trz1boss', async (game, poi) => {
  for (let no = poi.boss; no;) {
    const b = Z(game).bosses[no];
    begin(game);
    const opts = { shared: b.shared, cap: b.cap, sp: b.sp, drops: b.drops, heal: b.heal, backdrop: b.backdrop };
    if (b.bgm) opts.bgm = b.bgm; else opts.eventBgm = true; // set_bgm 0: the story's default for variable 43
    for (const k of ['alone', 'hp30', 'hp40']) if (b[k]) opts[k] = true; // switches 25 / 26 / 27
    if (await trBattle(game, b.foes, opts) !== 'win') return;
    no = b.next;
  }
});

// ---------- the battle background (set_battle_map: the strip of Z1_戦闘_背景 for the ground tile) ----------
for (const map of ['60', '61', '62', '63', '64']) {
  registerBackdrop(map, (game) => {
    const s = game.state, t = Z(game).backdrops[map], m = game.world.maps[map];
    return t[m.layers[0][Math.floor(s.x / 32) + Math.floor(s.y / 32) * m.w]] || t.default;
  });
}

// ---------- ?dev=trz1hall / trz1raditz / trz1garlic / trz1kaio / trz1vegeta / trz1willow (&timer) ----------
// a save after the Willow chapter (Z1 party, levels as src/willow.js devWillow), already in the time room (what page
// 15 keeps: state.flags.tr), in the Z1 hall or at the entry of that area
const DEV = { raditz: 9102, garlic: 9111, kaio: 9121, vegeta: 9131, willow: 9141 };
registerZ3('trz1', {
  dev(game, step) {
    const k = /^trz1(hall|raditz|garlic|kaio|vegeta|willow)$/.exec(step);
    if (!k) return false;
    const w = game.world, s = game.state = game.newState();
    s.bench = {};
    const lv = { 3: 34, 4: 31, 5: 28, 6: 29, 7: 28, 8: 30, 9: 27, 10: 22, 24: 30 };
    for (const id of Object.keys(lv).map(Number)) {
      if (!w.actors[id]) continue;
      const m = makeMember(w, id);
      m.level = lv[id];
      m.exp = w.actors[id].exp[m.level];
      m.maxLv = m.level;
      applyLevel(w, m);
      s.bench[id] = m;
    }
    s.party = [];
    party(game, [3, 4, 5, 6, 7, 8]);
    for (const n of [65, 68, 69, 502, 520, 466, 471, 78]) s.sw[n] = true;
    Object.assign(s.var, { 40: 0, 41: 0, 42: 3, 43: 999 });
    s.flags.tr = { back: { map: '15', x: 58 * 32 + 16, y: 28 * 32 + 16 }, v43: 13, v17: 0, party: [3, 4, 5, 6, 7, 8], ss: {} };
    s.zeni = 8000;
    s.map = '59'; s.x = 15 * 32 + 16; s.y = 10 * 32 + 16;
    healAll(game);
    game.startField();
    if (k[1] === 'hall') { begin(game); goTo(game, { map: '59', x: 15, y: 10 }); return true; }
    const d = Z(game).doors[DEV[k[1]]];
    enterArea(game, d.to, d.v43);
    return true;
  },
});
