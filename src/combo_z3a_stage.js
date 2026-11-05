// The stage of the S-combo films of the original's anime_pattern 28xx (docs/anim-f-plan.md cmc), ported frame by frame from
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/combo-anime.js. These combos open in Z3 or later
// (variable 40 ≥ 2, $btl_progress 2): the attack pattern (combo id + 10) runs anime_pattern 31 → 32 → the 28xx film →
// the damage pattern, and Z3 draws the special-move bars (output_back) and the lead's cut-in (output_cutin) — the
// stage of src/anime_zfighters.js (ZfStage: draw lists rebuilt every frame, the bars → the film's own pictures → the
// fighters → the effects → the cut-in). Frame numbers in the comments are the original's @battle_anime_frame.
// The original's per-frame movement (@ax @ay @gx @gy, applied after the frame's own drawing, @gx negated every frame
// by output_battle_anime) is st.v here, applied by mv(). Its persistent effect (@effect_anime_pattern, drawn after
// the fighters with @effect_anime_frame / @ray_anime_frame counting up every frame it is drawn) is st.ef.
// The films are in src/combo_z3a.js (with src/combo_z3a2.js and src/combo_z3a3.js); this file has the stage, the
// shared effects and damage patterns, and the ?dev=cmc… jumps.
import { audio, img, rand, view } from './core.js?v=20261105-1811';
import { spark, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED, ANIME_IMAGES } from './anime.js?v=20261105-1811';
import { ComboDuel, addComboFilms } from './combo-anime.js?v=20261105-1811';
import { ZfStage, zfBlt as blt } from './anime_zfighters.js?v=20261105-1811';
export { blt };
import { registerZ3, party, heal } from './z3.js?v=20261105-1811';
import { applyLevel } from './party.js?v=20261105-1811';
import { superSaiyan } from './supersaiyan.js?v=20261105-1811';
import { comboData } from './combo.js?v=20261105-1811';

export const pic = (n) => `Graphics/Pictures/${n}`;
export const STD_CHAX = -70;
export const SPARK = pic('戦闘アニメ.PNG');
const BOOM = { 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120, 254], 103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 298, 120, 234],
  104: [pic('戦闘アニメ_爆発5.PNG'), 158, 160, 282, 104, 218], 105: [pic('戦闘アニメ_爆発6.PNG'), 256, 256, 234, 46, 170] }; // [sheet, w, h, x, y, x (@damage_center)]
// combo → [film, damage, the move switch's @tec_back_small before pattern 32]; the other files add theirs (cmcFilms)
const MINE = {};
export function cmcFilms(films) {
  const reg = {};
  for (const [id, [film, dmg, small = true]] of Object.entries(films)) { MINE[id] = { small }; reg[id] = [film, dmg]; }
  addComboFilms(reg);
}
// @tec_output_back_no 4 (output_back, all.rb 68095): the ZG super kamehameha's panels down both sides, 176×320 ×3
const SIDES = [pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG')];
export const CMC_PICTURES = [...Object.values(BOOM).map((b) => b[0]), ...SIDES];
export function cmcPictures(list) { CMC_PICTURES.push(...list); ANIME_IMAGES.push(...list); }

// ---------- the stage ----------
export class CmcStage extends ZfStage {
  constructor(d, cfg) {
    super(d);
    this.era = 2; // (variable 40 ≥ 2 for all of these: the Z3 bars and cut-ins)
    this.actor = d.lead; // the cut-in is the one who started it ($partyc[@chanum])
    this.small = cfg.small;
    this.v = { ax: 0, ay: 0, gx: 0, gy: 0 };
  }
  // the bars of the frame (output_back): ZfStage's 0-3, and 4 the side panels, the next of three every frame
  tick() {
    if (!(this.bars && this.no === 4)) return super.tick();
    this.b = []; this.e = [];
    if (!this.cutFlag) this.cut = false;
    const k = this.corner;
    this.barList = [(c) => { blt(c, SIDES[0], k * 176, 0, 176, 320, 0, 18); blt(c, SIDES[1], k * 176, 0, 176, 320, 640 - 176, 18); }];
    this.corner = k === 2 ? 0 : k + 1;
  }
  // back_anime_pattern's counter going on without a picture of its own (115-120, 48 …)
  bk() { this.ba.frame++; }
  // back 48 師弟の絆_高速移動: the after-image every 4th count
  after(x, y) { if (this.ba.frame % 4 === 0) this.back(SPARK, 0, 48, 64, 64, x, y); this.ba.frame++; }
  // back 115-120 / effects of the same kind: a member's sprite (normal or special sheet) in row `row`
  chr(id, sp, row, x, y, list = this.b) { const s = this.d.sheet(this.d.who(id), sp); list.push((c) => blt(c, s, 0, row * 96, 96, 96, x, y)); }
  chrBack(id, sp, row, x, y) { this.chr(id, sp, row, x, y); this.ba.frame++; }
  // effect_pattern's counters: draw with them, then both count on (all.rb 139939)
  fxStep(draw) { const k = this.ef; draw(k); k.rframe++; k.frame++; }
  fxZero() { const k = this.ef; k.type = 0; k.frame = 0; k.rtype = 0; k.rframe = 0; }
}

// pattern 31 / 32 for these films: the stage, then from 32's frame 30 the bars and the cut-in (@chr_cutin_flag)
const swoop0 = ComboDuel.prototype.swoopIn, launch0 = ComboDuel.prototype.launch;
Object.assign(ComboDuel.prototype, {
  * swoopIn() {
    const cfg = MINE[this.combo];
    if (!cfg) return yield* swoop0.call(this);
    for (const p of CMC_PICTURES) img(p);
    yield* swoop0.call(this);
    this.st = new CmcStage(this, cfg);
  },
  * launch() {
    const st = this.st;
    if (!(st instanceof CmcStage)) return yield* launch0.call(this);
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      this.back.y += 4;
      if (f >= 30) { st.bars = true; if (st.cutFlag) st.cut = true; }
      yield;
    }
  },
  // output_battle_anime's movement: @ax / @ay on the attacker, @gx (negated every frame) / @gy on the defender
  mv() {
    const v = this.st.v;
    this.A.x += v.ax; this.A.y += v.ay;
    v.gx = -v.gx;
    this.G.x += v.gx; this.G.y += v.gy;
  },
  // anime_pattern_fromat: the counters and the movement go back to 0 (the film is over or moves on)
  fromat() {
    const st = this.st;
    this.mv();
    audio.seStop();
    st.v = { ax: 0, ay: 0, gx: 0, gy: 0 };
    st.ba.type = 0; st.ba.frame = 0;
    st.fxZero();
  },
  // set_chr_display_out: the attacker leaves, the defender in the middle, the cut-in turns to the defender's
  out() {
    const st = this.st;
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    if (st.cutFlag) st.mirror = true;
  },
  // the attacker drawn as member `id` (@btl_ani_cha_chg_no), `sp` the special sheet (@output_anime_type 1)
  as(id, row, sp = true) { this.L.sheets = this.crew[this.who(id)]; this.pose(this.A, row, sp); },

  // ---------- the damage patterns (each one starts on frame 0 with the counters at 0) ----------
  // 22 衝撃波系 (@tec_kyouda_se: ZG 打撃4); 41 爆発系ZD中, 42 ZD大, 43 Z2大, 44 Z2特大, 74 Z2大(左): blown back right;
  // 46 ZD中縦, 47 ZD大縦: blown down. `still` (@damage_huttobi false): not blown; `center` (@damage_center): the
  // explosion further left
  * cmcHit(kind, { kyouda = false, still = false, center = false } = {}) {
    const st = this.st, G = this.G;
    if (kind === 22) {
      this.se(kyouda ? 'ZG 打撃4' : 'Z3 跳ね返し');
      this.showHit();
      this.pose(G, 17, false);
      for (let f = 0; f < 60; f++) { if (f < 20) G.x += 20; yield; }
      return;
    }
    const [se, eff, end, from, to, dx, dy] = { 41: ['ZG 光線系ヒット2', 102, 60, 21, 39, 20, 0], 42: ['ZG 光線系ヒット3', 103, 60, 21, 39, 20, 0],
      43: ['Z1 爆発1', 104, 60, 21, 39, 20, 0], 44: ['DB3 大爆発', 105, 60, 21, 39, 20, 0], 74: ['Z1 爆発1', 104, 60, 21, 49, -20, 0],
      46: ['ZG 光線系ヒット2', 102, 45, 21, 34, 0, 20], 47: ['ZG 光線系ヒット3', 103, 45, 21, 34, 0, 20] }[kind];
    const [sheet, w, h, x, y, cx] = BOOM[eff], ex = center ? cx : x;
    this.se(se);
    this.showHit();
    this.pose(G, 17, false);
    st.fxZero();
    for (let f = 0; f < end; f++) {
      if (!still && f >= from && f <= to) { G.x += dx; G.y += dy; }
      if (f < to + 1) st.fxStep((k) => { st.front(sheet, k.type * w, 0, w, h, ex, y); if (k.frame >= 10) { k.type++; k.frame = 0; } });
      yield;
    }
  },
});
for (const k of [22, 41, 42, 43, 44, 46, 47, 74]) ComboDuel.prototype[`cmcD${k}`] = function* () { yield* this.cmcHit(k); };
Object.assign(ComboDuel.prototype, {
  * cmcD22k() { yield* this.cmcHit(22, { kyouda: true }); }, // (@tec_kyouda_se)
  * cmcD41c() { yield* this.cmcHit(41, { still: true, center: true }); }, // (@damage_huttobi false, @damage_center)
});

// ---------- the shared effects (effect_pattern) ----------
Object.assign(ComboDuel.prototype, {
  // 89 / 90 スパーキングコンボキャラ現れる2人目上 / 下: the second one flying in from the left, 8 a frame, above / below
  fx8990(id, up) { const st = this.st; st.fxStep((k) => st.chr(id, true, 0, STD_CHAX + k.frame * 8 + 30, STD_Y + (up ? -50 : 50), st.e)); },
  // 92: the second one waiting below
  fx92(id) { const st = this.st; st.fxStep(() => st.chr(id, true, 0, TEC_CENTER, STD_Y + 50, st.e)); },
  // 121 攻撃ヒット: the spark at the attacker's fist and on the defender
  fx121() {
    const st = this.st, A = this.A, G = this.G;
    st.fxStep((k) => { // (where they are once this frame's movement is done, as the original draws it)
      if (k.frame > 10) return;
      const b = k.frame <= 4 ? 0 : 32;
      st.e.push((c) => { blt(c, SPARK, b, 16, 32, 32, A.x + 96, A.y + 32); blt(c, SPARK, 32, 0, 32, 16, G.x, G.y); });
    });
  },
  // 123 キャラぶつかる自由位置: the spark at (x, y)
  fx123(x, y) { const st = this.st; st.fxStep((k) => st.front(SPARK, k.frame <= 4 ? 0 : 32, 16, 32, 32, x, y)); },
});

// ---------- ?dev=cmc…: these combos in a fight (like ?dev=cmbx…, src/combo_dev.js) ----------
// Every combo switch on, variable 40 = 2, Lv 60, every move used 999 times and known, a fight with 甜菜人 ×3 (high HP).
// __cmc(id) deals the cards for the first open row of combo `id` whose members are in the party and runs the turn.
const PARTIES = { // (every one of the 43 combos has a row in one of them; the numbers after: Super Saiyan forms)
  cmc1: [[3, 6, 24, 8, 9, 7]], // 746 749 729 745 712 799
  cmc2: [[3, 5, 12, 17, 4, 6], [1, 2, 3, 4]], // 738 740 764 720 726 761 762
  cmc3: [[5, 17, 25, 4, 15, 10]], // 726 747 760 769 771 772 773 783
  cmc4: [[21, 22, 23, 6, 5, 8]], // 716 718 719 723 793 794 795
  cmc5: [[21, 22, 23, 9, 25, 4]], // 796 797 798 792 727 780
  cmc6: [[16, 27, 28, 29, 30, 24], [7]], // 785
  cmc7: [[7, 10, 24, 12, 8, 17]], // 741 744 763 784 781
  cmc8: [[3, 5, 25, 10, 9, 17], [1, 2, 6]], // 791 770 782 754
};
registerZ3('cmc', {
  dev(game, step) {
    const p = PARTIES[step];
    if (!p) return false;
    const s = game.state = game.newState(), w = game.world;
    s.var[40] = 2;
    s.flags.z3 = 'done';
    comboData.then((d) => {
      for (const c of d.combos) if (c.sw) s.sw[c.sw] = true;
      party(game, p[0]);
      for (const no of p[1] || []) superSaiyan(w, s, no, true);
      for (const m of s.party) { m.level = 60; m.exp = w.actors[m.id].exp[60]; applyLevel(w, m); heal(m); }
      for (const m of s.party) {
        for (const c of d.combos) c.cha.forEach((a, x) => { if (a === m.id && !m.skills.includes(c.tec[x])) m.skills.push(c.tec[x]); });
        m.skills.sort((x, y) => x - y);
      }
      s.skillLv = {};
      for (const c of d.combos) for (const t of c.tec) s.skillLv[t] = 999;
      s.combos = [];
      s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
      game.startField();
      setTimeout(() => game.startBattle([1, 1, 1], false, { loseOk: true }), 300);
      const tough = () => { const b = game.scene; if (b && b.constructor.name === 'Battle' && b.foes[0]) for (const f of b.foes) f.hp = f.maxhp = 999999; else setTimeout(tough, 100); };
      setTimeout(tough, 400);
      window.__cmc = (id) => fire(game, d, id);
      window.__cmcPlay = (id, lead, ids) => play(game, d, id, lead, ids);
      window.__go = (id, lead, times, ids) => { capture(game, times); return play(game, d, id, lead, ids).then(sheet); };
    });
    return true;
  },
});
function fire(game, d, id) {
  const b = game.scene, w = game.world;
  if (!b || b.phase !== 'plan') return 'not planning';
  const row = d.combos.find((c) => c.id === id && c.cha.every((a) => b.party.some((m) => m.id === a)) && (!c.sw || game.state.sw[c.sw]));
  if (!row) return 'no row with this party';
  b.plans = b.party.map(() => null);
  let k = 0;
  row.cha.forEach((a, x) => {
    const i = b.party.findIndex((m) => m.id === a), m = b.party[i];
    b.hand[k] = { a: Math.min(7, row.atk[x] + 1), g: Math.min(7, row.grd[x] + 1), s: m.school };
    b.plans[i] = { card: k++, skill: w.skills[row.tec[x]], target: 0 };
  });
  b.resolveTurn();
  return row.name;
}
// __go(id, lead, [frames], ids): plays it and shows the stage at those frames (anim.t: the film's frame 0 is about 128) on
// a contact sheet over the page (tap it away)
let shots = [];
function capture(game, times) {
  shots = [];
  const b = game.scene, wait = () => {
    const a = b.anim;
    if (!a || !a.combo) return setTimeout(wait, 5);
    const step = a.step.bind(a);
    a.step = () => {
      step();
      if (!times.includes(a.t)) return;
      const c = document.createElement('canvas'); c.width = 640; c.height = 356;
      const x = c.getContext('2d'); x.fillStyle = '#346'; x.fillRect(0, 0, 640, 356); x.drawImage(a.render(), 0, 0);
      shots.push([a.t, c]);
    };
  };
  wait();
}
function sheet() {
  const w = 320, h = 178, c = document.createElement('canvas');
  c.width = w * 2; c.height = h * Math.ceil(shots.length / 2);
  const x = c.getContext('2d');
  shots.forEach(([t, cv], i) => {
    const px = (i % 2) * w, py = Math.floor(i / 2) * h;
    x.drawImage(cv, px, py, w, h); x.fillStyle = '#ff0'; x.font = '14px monospace'; x.fillText(String(t), px + 4, py + 14); x.strokeRect(px, py, w, h);
  });
  let el = document.getElementById('__sheet');
  if (!el) { el = document.createElement('img'); el.id = '__sheet'; el.style.cssText = 'position:fixed;left:0;top:0;width:100vw;z-index:99999;background:#000'; document.body.appendChild(el); el.onclick = () => el.remove(); }
  el.src = c.toDataURL();
  return shots.length;
}
// __cmcPlay(id, lead, ids): the film alone, on the first enemy, with any lead and crew (default: the first row's members)
function play(game, d, id, lead, ids) {
  const b = game.scene, w = game.world, foe = b.foes[0];
  const row = d.combos.find((c) => c.id === id);
  ids = ids || row.cha;
  const crew = Object.fromEntries(ids.map((a) => [a, { normal: w.actors[a].sprite, special: w.actors[a].special }]));
  b.anim = new ComboDuel({ party: crew[lead || ids[0]], foe: { normal: foe.portrait, special: foe.sprite, size: foe.size }, combo: id, crew,
    lead: lead || ids[0], damage: 1234, margin: Math.max(0, (640 - view.w) / 2), onHit: () => {} });
  return b.anim.finished.then(() => { b.anim = null; return 'done'; });
}

export const CMC_SOUNDS = ['Z1 必殺技', 'ZG 打撃4', 'Z3 跳ね返し', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z1 爆発1', 'DB3 大爆発'];
ANIME_IMAGES.push(...CMC_PICTURES);
