// Small pieces of the original's battle presentation (docs/batch2-plan.md, part viz):
//   - the names of the passive skills that fired, sliding in over the battle film (output_runskill, all.rb 54324;
//     the effect code records them with growth.ran)
//   - the cover scene (anime_pattern 39 かばう, all.rb 72565) before an enemy's attack lands on the member who covers
//   - the Great Ape's face in the battle status (set_character_face, all.rb 19769: Z1_顔大猿 row 2, Z1 only)
//   - ZG / Z3 card faces follow the part of the story (src/era.js; set_card_frame, all.rb 14062)
// ?dev=viz… jumps (registerZ3) are at the end.
import { img, view, audio, setImageAlias, VERSION } from './core.js?v=20261103-0423';
import { Battle } from './battle.js?v=20261103-0423';
import * as growth from './growth.js?v=20261103-0423';
import { SW, SH, BACK_Y } from './anime.js?v=20261103-0423';
import { options } from './fieldmenu.js?v=20261103-0423';
import { applyEra, eraKey } from './era.js?v=20261103-0423';
import { registerZ3, party, devZ3 } from './z3.js?v=20261103-0423';
import { pirate } from './zg_c.js?v=20261103-0423';
import { playScenes } from './cutscene.js?v=20261103-0423';
import { cardState, gainCard } from './items.js?v=20261103-0423';

const WAKU = 'Graphics/Pictures/戦闘_Sコンボ表示枠.PNG'; // 240×28
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // row 0: 0-9 / … and cell 21 「l」 (the LV glyph)
const FONT = 'Cubic11, system-ui, sans-serif';
const APE_FACES = 'ui/faces_ape_z1.png'; // Z1_顔味方 with row 2 (悟飯) taken from Z1_顔大猿 (tools/build_viz.py)
const Z1_FACES = 'Graphics/Pictures/Z1_顔味方.PNG';

// ---------- output_runskill ----------
// shown for 60 film frames from when the group was recorded; up to 3 names, a 4th line reads ETC; each slides in from
// -240 - 48·row at 32 px a frame (option 352: fixed); option 351: 0 all, 1 the party's attacks, 2 the enemies' (and
// covers), 3 none. Tapping speeds the film ×3, the box with it.
const show = { n: -1, f: 0, xs: [] };
// output_mozi (all.rb 9336): digits and 「l」 (LV) are 16×16 glyphs of 数字英語, the rest is text; all of it white
// (change_tone 255) — here the glyphs are whitened once
let white = null;
function glyphs() {
  if (white) return white;
  const e = img(DIGITS);
  if (!e.ok) return null;
  white = document.createElement('canvas');
  white.width = 512; white.height = 16;
  const g = white.getContext('2d');
  g.drawImage(e.im, 0, 0, 512, 16, 0, 0, 512, 16);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 16);
  return white;
}
function drawName(c, name, x, y) {
  const gl = glyphs();
  [...name].forEach((ch, i) => {
    const cell = ch === 'l' ? 21 : /[0-9]/.test(ch) ? +ch : -1;
    if (cell >= 0) { if (gl) c.drawImage(gl, cell * 16, 0, 16, 16, x + 16 * i, y + 7, 16, 16); } else c.fillText(ch, x + 16 * i, y + 5);
  });
}
function runFrames(b, dt) {
  const r = growth.runShow;
  if (r.n !== show.n) { show.n = r.n; show.f = 0; show.xs = []; }
  if (b.phase === 'fight' && r.ids.length) show.f += dt * 60 * (b.fast ? 3 : 1);
}
function drawRun(b, c) {
  const r = growth.runShow;
  if (b.phase !== 'fight' || !r.ids.length || r.quiet || show.f > 60 || b.practice) return;
  const opt = options.runSkill || 0;
  if (opt === 3 || (opt === 1 && r.course !== 0) || (opt === 2 && r.course !== 1)) return;
  const st = b.L && b.L.stage;
  if (!st) return;
  const waku = img(WAKU);
  const rows = r.ids.length > 3 ? 4 : r.ids.length;
  const k = Math.floor(show.f);
  c.save();
  c.beginPath(); c.rect(0, st.y, view.w, st.h); c.clip();
  c.font = `16px ${FONT}`;
  c.textBaseline = 'top';
  for (let y = 0; y < rows; y++) {
    const x = options.runSlide ? 0 : Math.min(0, -240 - y * 48 + 32 * (k + 1));
    const name = y === 3 ? 'ETC' : growth.skillName(b.world, r.ids[y]);
    const top = st.y + 28 * y;
    if (waku.ok) c.drawImage(waku.im, 0, 0, 240, 28, x, top, 240, 28);
    c.fillStyle = '#fff';
    drawName(c, name, x + 16, top);
  }
  c.restore();
}

// ---------- the cover scene (anime_pattern 39) ----------
// frames 1-33: the member who covers flies in from the left (16 px a frame, dropping from 96 above from frame 25) to
// x 328, the covered one steps back from the middle to 192 (6 px a frame from 25); both stand until 92. Their normal
// sheets, first frame (back_anime_pattern 115 / 117). The skill box shows the かばう skill meanwhile (output_runskill 3).
const STD_Y = 120, CENTER_CHAX = 240;
class CoverFilm {
  constructor(by, who) {
    this.by = by; this.who = who;
    this.t = 0; this.fade = 1; this.back = { y: BACK_Y };
    this.cv = document.createElement('canvas');
    this.cv.width = SW; this.cv.height = SH;
    this.c = this.cv.getContext('2d');
    this.c.imageSmoothingEnabled = false;
    this.finished = new Promise((res) => { this.resolve = res; });
  }
  step() {
    if (this.t > 92) return;
    this.t++;
    this.fade = Math.max(0, 1 - this.t / 10);
    if (this.t > 92) this.resolve();
  }
  sprite(m, x, y) {
    const path = m.sprite || (window.__game && window.__game.world.actors[m.id] || {}).sprite, size = m.spriteSize || 96;
    const im = path && img(path);
    if (im && im.ok) this.c.drawImage(im.im, 0, 0, size, size, x, y - (size - 96), size, size);
  }
  render() {
    const c = this.c, f = Math.min(this.t, 92);
    c.clearRect(0, 0, SW, SH);
    if (f >= 1) {
      const a = f <= 33 ? -200 + f * 16 : 328, ay = f <= 33 ? STD_Y - 96 + 12 * Math.max(0, f - 25) : STD_Y;
      const bx = f <= 33 ? CENTER_CHAX - 6 * Math.max(0, f - 25) : 192;
      this.sprite(this.who, bx, STD_Y);
      this.sprite(this.by, Math.min(328, a), Math.min(STD_Y, ay));
    }
    return this.cv;
  }
}
// growth.ext('cover', one, b, foe) runs cards_b.js's choice; these two entries around it see who was aimed at and who
// covers (src/battle.js then says 「X 掩護了 Y！」, plays Z1 逃げる and waits)
let aimed = null;
growth.extra.unshift({ cover: (one) => { aimed = one; return one; } });
growth.extra.push({
  cover: (c, b) => {
    if (c && aimed && c !== aimed && b && b.phase === 'fight') b.anim = new CoverFilm(c, aimed);
    return c;
  },
});

// ---------- the battle hooks: update / draw ----------
const update0 = Battle.prototype.update, draw0 = Battle.prototype.draw;
Battle.prototype.update = function (dt) {
  update0.call(this, dt);
  runFrames(this, dt);
};
Battle.prototype.draw = function () {
  // the Great Ape's face (Z1, variable 40 = 0): Z1_顔味方 row 2 from Z1_顔大猿 while 悟飯 is the ape
  const s = this.game.state, ape = !((s.var || {})[40]) && this.party.some((m) => m.id === 5 && m.cdaApe);
  if (ape) setImageAlias({ ...((this.world.era || {})[0] || {}), [Z1_FACES]: APE_FACES });
  draw0.call(this);
  if (ape) setImageAlias((this.world.era || {})[0] || {});
  if (this.L) drawRun(this, view.begin());
};
img(WAKU); img(APE_FACES); img(DIGITS);

// ---------- the era's pictures: re-applied when the part of the story changes (ZG starts from the 時之間) ----------
let eraAt = null;
setInterval(() => {
  const g = window.__game;
  if (!g || !g.world || !g.state) return;
  const k = eraKey(g.state);
  if (eraAt !== null && k !== eraAt) applyEra(g);
  eraAt = k;
}, 500);

// ---------- development: ?dev=viz (Z1: 悟空・悟飯・比克・克林 with skills that show their names, 月亮和尾巴 for the ape),
// vizcover (a dying member and one with かばう), vizz3 / vizzg (the Z3 / ZG card faces), vizpod (map 36, the pod lands),
// vizfusion (z1field 1384), vizpirate (map 108, the pirate ship), vizhatch (CE94, Hatchiyack) ----------
const SCENE_DEV = {
  vizpod: ['z3c36'],
  vizfusion: ['z3elab', [{ v41: 1384 }, { z1field: true }, { wait: 90 }]],
  vizpirate: ['zgc108', (game) => { game.state.sw[833] = true; pirate(game); }],
  vizhatch: ['zgc108', [{ x: 'zgcFilm', name: 'hatch' }]],
};
const SKILLS = { 3: [48, 22, 0], 5: [8, 0, 0], 4: [39, 0, 0], 6: [13, 0, 0] }; // 鋼鉄の拳1, 激怒, 最終決戦, かなしばり1, Z戦士の絆1
registerZ3('viz', {
  dev(game, step) {
    if (!step.startsWith('viz')) return false;
    const sd = SCENE_DEV[step];
    if (sd) {
      devZ3(game, sd[0]);
      if (sd[1]) setTimeout(() => (typeof sd[1] === 'function' ? sd[1](game) : playScenes([{ nodes: sd[1] }], game.state)), 2500);
      return true;
    }
    const s = game.state = game.newState();
    s.var = s.var || {}; s.sw = s.sw || {};
    if (step === 'vizz3') { s.var[40] = 2; s.var[43] = 51; }
    if (step === 'vizzg') { s.var[40] = 2; s.var[43] = 186; s.sw[431] = true; }
    party(game, [3, 5, 4, 6]);
    for (const m of s.party) {
      growth.ensure(m);
      m.level = Math.max(m.level, 20);
      (SKILLS[m.id] || []).forEach((id, k) => { if (id) growth.setTypical(game.world, s, m, k, id); });
      m.hp = m.maxhp; m.ki = m.maxki;
    }
    if (step === 'vizcover') {
      const k = s.party.find((m) => m.id === 6);
      growth.setTypical(game.world, s, k, 1, 279); // かばう9
      s.party[0].hp = 1;
    }
    cardState(s);
    s.zeni = 9999;
    for (const id of [55, 19, 21, 23, 24, 25, 38, 62, 156, 169]) gainCard(game.world, s, id, 2);
    s.map = '1'; s.x = 20 * 32 + 16; s.y = 20 * 32 + 16;
    if (step === 'vizpod1') { s.x = 57 * 32 + 16; s.y = 7 * 32 + 16; } // (map 1: Gohan's 「たすけて」 by the pod)
    game.startField();
    return true;
  },
});
export const vizVersion = VERSION;
