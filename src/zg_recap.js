// ZG 的概況 (前情提要) — docs/zg-recap.md; data world.z3.zgRecap from tools/build_zg_recap.py.
// From variable 43 = 111 on (未來悟飯篇, 布羅利篇, 波傑克篇, ZG 本編 with the 巴達克一夥 part) the original's 概況 — the field
// menu's あらすじ and the one after a load — is Map007 event 2 page 201: a common event for variable 43, with its own BGM,
// narration over z1field scenes (6771-6775 made for it, the rest the story's own). The scenes are drawn the way
// src/zg_a.js draws ZG's (set_character_face with the clothes of the story, character_output_all 26 / 22) under numbers
// of their own (the original's + 1000000), so nothing the story chapters register is touched.
import { addScenes, playScenes } from './cutscene.js?v=20261108-0936';
import { addRecap, storySoFar } from './fieldmenu.js?v=20261108-0936';
import { drawZgScene } from './zg_a.js?v=20261108-0936';
import { registerZ3, devZ3 } from './z3.js?v=20261108-0936';

const R = (game) => game.world.z3 && game.world.z3.zgRecap;
const pick = (game) => { const r = R(game); return r && r.recap[(game.state.var || {})[43] || 0]; };

let ready = false;
function ensure(game) {
  if (ready) return;
  ready = true;
  const { scenes } = R(game), zga = game.world.z3.zga || {};
  const S = {}, pics = new Set(Object.values(zga.sheets || {})); // (set_character_face may pick any of the ZG sheets)
  for (const [n, d] of Object.entries(scenes)) {
    S[n] = { draw: async (st, ctx, quiet) => { if (!quiet) drawZgScene(game, st, ctx, d); } };
    if (d.bg) pics.add(d.bg);
    for (const it of [...d.ene, ...d.play]) if (it[0] !== '@cf') pics.add(it[0]);
  }
  addScenes(S, [], [...pics]);
}

addRecap({
  has: (game) => !!pick(game),
  // played on a copy of the state, as src/z2a.js does: the common event's variable 41 and switch 80 stay where they were
  play: (game) => {
    const r = pick(game), s = game.state;
    ensure(game);
    return playScenes([{ bgm: r.bgm, nodes: r.nodes }], { ...s, var: { ...s.var }, sw: { ...s.sw } });
  },
});

// ?dev=ovw<variable 43> (&timer): zgc's jump (the ZG party on map 105), then that 概況 as after a load
registerZ3('ovw', {
  dev(game, step) {
    const v = (/^ovw(\d+)$/.exec(step) || [])[1];
    if (!v || !R(game).recap[v] || !devZ3(game, 'zgc')) return false;
    const until = (f) => new Promise((ok) => { const t = setInterval(() => { if (f()) { clearInterval(t); ok(); } }, 100); });
    until(() => game.field && !game.busy && game.state.map === '105').then(async () => {
      game.state.var[43] = +v;
      game.busy = true;
      game.field.paused = true;
      game.field.leave();
      await storySoFar(game);
      game.busy = false;
      game.field.paused = false;
    });
    return true;
  },
});
