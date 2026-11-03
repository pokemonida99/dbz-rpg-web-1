// 劇情與系統的小缺口（第二批分工 sys）— docs/sys.md, docs/batch2-plan.md; the data is world.sys / world.z3.z34Recap from
// tools/build_sys.py. Here:
//   神龍的願望   496-499 ZP ×2-5 (get_zp_bairitu, all.rb 9148: battles through growth.ext 'zpRate', the trainings in
//                src/training.js zpRate); 494 / 495 card limit 8 / 9 and 490 神探測器 are in src/items.js
//   cards        179 海賊 / 180 狗星人 / 181 魚星人 (EXP / CAP / SP up 15 more battles, all.rb 147185-147223),
//                201 小吉 (+1500 ZP to one member, 46177); the skill cards are world.growth.cards (src/growth.js)
//   概況          Z3 / Z4 (variable 43 = 51-96: Map007 event 2 page 201 → CE101-137; 65-69: world.z3.recap with the
//                scenes of src/z3b.js), played like src/zg_recap.js
//   ?dev=sys…    sysrecap<variable 43>, syswish, sysbgm (&timer)
import { audio } from './core.js?v=20261104-0709';
import { addScenes, playScenes } from './cutscene.js?v=20261104-0709';
import { addRecap, storySoFar } from './fieldmenu.js?v=20261104-0709';
import { drawZgScene } from './zg_a.js?v=20261104-0709';
import { registerZ3, devZ3 } from './z3.js?v=20261104-0709';
import { fieldCards } from './items.js?v=20261104-0709';
import { extra, ensure } from './growth.js?v=20261104-0709';
import { pickMember } from './partymenu.js?v=20261104-0709';
import { zpRate } from './training.js?v=20261104-0709';

const SE_ERR = 'Z3 エラー';

// ---------- 神龍: ZP ×2-5 after a won battle (all.rb 50754) ----------
extra.push({ zpRate: (v, s) => v * zpRate(s) });

// ---------- the shop's added cards ----------
// 179 / 180 / 181: variables 311 / 312 / 313 + 15 (up to 999), as 28 ブリーフ博士 / 80 亀の甲羅 / 82 加重衣 do + 5
for (const [id, v] of [[179, 311], [180, 312], [181, 313]]) {
  fieldCards[id] = async ({ game }) => {
    const s = game.state;
    s.var = s.var || {};
    if ((s.var[v] || 0) >= 999) { audio.se(SE_ERR); return false; }
    s.var[v] = Math.min(999, (s.var[v] || 0) + 15);
    audio.se('Z3 回復');
    return true;
  };
}
// 201 小吉: +1500 ZP to one member (as 202 界王星, src/cards_square.js)
fieldCards[201] = async ({ game }) => {
  const m = await pickMember(game, '小吉', () => true, true);
  if (!m) return false;
  audio.se('Z1 パワーアップ', 80);
  ensure(m).zp += 1500;
  return true;
};

// ---------- Z3 / Z4 概況 ----------
const R = (game) => game.world.z3 && game.world.z3.z34Recap;
const v43 = (game) => (game.state.var || {})[43] || 0;
const pick = (game) => {
  const r = R(game), v = v43(game), z3b = game.world.z3 && game.world.z3.recap;
  if (r && r.recap[v]) return r.recap[v];
  if (z3b && z3b[v]) return { bgm: null, nodes: z3b[v] }; // 65-69 (their first node is the BGM: tools/build_z3b.py)
  return null;
};
let ready = false;
function ensureScenes(game) {
  if (ready) return;
  ready = true;
  const { scenes } = R(game), zga = game.world.z3.zga || {};
  const S = {}, pics = new Set(Object.values(zga.sheets || {})); // (set_character_face: the Z3 sheets and the clothes)
  for (const [n, d] of Object.entries(scenes)) {
    S[n] = { draw: async (st, ctx, quiet) => { if (!quiet) drawZgScene(game, st, ctx, d); } };
    if (d.bg) pics.add(d.bg);
    for (const it of [...d.ene, ...d.play]) if (it[0][0] !== '@') pics.add(it[0]);
  }
  addScenes(S, [], [...pics]);
}
addRecap({
  has: (game) => !!pick(game),
  // played on a copy of the state (variable 41 and the switches stay where they were), as src/zg_recap.js does
  play: (game) => {
    const r = pick(game), s = game.state;
    if (R(game)) ensureScenes(game);
    return playScenes([{ bgm: r.bgm, nodes: r.nodes }], { ...s, var: { ...s.var }, sw: { ...s.sw } });
  },
});

// ---------- ?dev=sys… (&timer) ----------
const until = (f) => new Promise((ok) => { const t = setInterval(() => { if (f()) { clearInterval(t); ok(); } }, 100); });
const settled = (game) => game.field && !game.busy && game.scene === game.field;
registerZ3('sys', {
  dev(game, step) {
    // sysrecap<variable 43>: a Z3 (z3efield) or Z4 (z4fring) save, then that 概況 as after a load
    const rv = (/^sysrecap(\d+)$/.exec(step) || [])[1];
    if (rv) {
      if (!devZ3(game, +rv >= 80 ? 'z4fring' : 'z3efield')) return false;
      until(() => settled(game)).then(async () => {
        await new Promise((ok) => setTimeout(ok, 500));
        game.state.var[43] = +rv;
        game.busy = true;
        game.field.paused = true;
        game.field.leave();
        await storySoFar(game);
        game.busy = false;
        game.field.paused = false;
      });
      return true;
    }
    // syswish: the Z3 save of z3efield with every wish of the 神龍 granted (490 神探測器, 494 / 495, 496-499, 1320) and
    // スカウター / 神探測器 / 小吉 / 海賊 in hand; sysbgm: the same with the battle-music switches on
    if (step === 'syswish' || step === 'sysbgm') {
      if (!devZ3(game, 'z3efield')) return false;
      until(() => settled(game)).then(() => {
        const s = game.state;
        const sw = step === 'syswish' ? [490, 494, 495, 496, 497, 498, 499, 1320]
          : [713, 186, 187, 735, 193, 188, 154, 184, 185, 200, 702, 710];
        for (const n of sw) s.sw[n] = true;
        s.cards = s.cards || {};
        for (const id of [34, 205, 201, 179, 180, 181, 194, 167]) s.cards[id] = 1;
        s.zeni = 99999;
        if (game.renderHud) game.renderHud();
      });
      return true;
    }
    return false;
  },
});
