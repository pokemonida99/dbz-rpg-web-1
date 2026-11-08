// The films of the first moves in Z2 and on (the Z2 and Z3 move switches, all.rb 56699-57400 / 59749-60760, and the enemies of the
// Z2 switch 58400 on): src/anime.js holds the Z1 ones (patterns 1xx), whose poses are the Z1 sheets' and go wrong on the Z2 / Z3 sheets
// of the same member. Written out frame by frame like src/anime_z3base.js; f is @battle_anime_frame. The party on src/anime_zfighters.js's
// stage, the enemies on src/anime_foes_common.js's. Moves with a film of their own in Z3 only come here in Z2 (Z3B: src/anime_z3base.js).
import { audio, img } from './core.js?v=20261108-1751';
import { Duel, addMoves, draw, RAY, STD_Y, CENTER_CHAX, CENTER_ENEX, BACK_Y, RAY_SPEED } from './anime.js?v=20261108-1751';
import { ZfStage } from './anime_zfighters.js?v=20261108-1751';
import { EFFECTS, BACKS, FE_IMAGES } from './anime_foes_common.js?v=20261108-1751';

const pic = (n) => `Graphics/Pictures/${n}`;
// $btl_top_file_name + "戦闘_必殺技_…": [Z2_, Z3_] (the other era's where one has none)
const S = {
  'エネルギー弾': [pic('Z2_戦闘_必殺技_エネルギー弾.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾.PNG')],
  'エネルギー弾(緑)': [pic('Z2_戦闘_必殺技_エネルギー弾(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG')],
  'エネルギー弾(青)': [pic('Z2_戦闘_必殺技_エネルギー弾(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG')],
  'エネルギー弾2': [pic('Z2_戦闘_必殺技_エネルギー弾2.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾2.PNG')],
  'エネルギー弾2(青)': [pic('Z2_戦闘_必殺技_エネルギー弾2(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾2(青).PNG')],
  'エネルギー弾3': [pic('Z2_戦闘_必殺技_エネルギー弾3.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾3.PNG')],
  'エネルギー弾3(緑)': [pic('Z2_戦闘_必殺技_エネルギー弾3(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾3(緑).PNG')],
  'エネルギー弾3(青)': [pic('Z2_戦闘_必殺技_エネルギー弾3(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾3(青).PNG')],
  'エネルギー弾4': [pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾4.PNG')],
  'エネルギー弾4(緑)': [pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG')],
  'エネルギー弾4(青)': [pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG')],
  'エネルギー波_特大': [pic('Z2_戦闘_必殺技_エネルギー波_特大.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG')],
  'エネルギー波_中': [pic('Z2_戦闘_必殺技_エネルギー波_中.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中.PNG')],
  'エネルギー波_中_敵_青': [pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG')],
  'エネルギー波_中_敵_赤': [pic('Z2_戦闘_必殺技_エネルギー波_中_敵_赤.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_敵_赤.PNG')],
  'エネルギー波_小': [pic('Z2_戦闘_必殺技_エネルギー波_小.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小.PNG')],
  'エネルギー波_小_敵_青': [pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG')],
  '拡散エネルギー波': [pic('Z2_戦闘_必殺技_拡散エネルギー波.png'), pic('Z3_戦闘_必殺技_拡散エネルギー波.png')],
  '魔貫光殺砲': [pic('Z2_戦闘_必殺技_魔貫光殺砲.PNG'), pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG')],
  '繰気弾': [pic('Z2_戦闘_必殺技_繰気弾.PNG'), pic('Z3_戦闘_必殺技_繰気弾.PNG')],
  'エネルギー液': [pic('Z3_戦闘_必殺技_エネルギー液.PNG'), pic('Z3_戦闘_必殺技_エネルギー液.PNG')],
  'エネルギー液(緑)': [pic('Z2_戦闘_必殺技_エネルギー液(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー液(緑).PNG')],
  '界王拳': [pic('Z2_戦闘_必殺技_界王拳.PNG'), pic('Z3_戦闘_必殺技_界王拳.PNG')],
  '衝撃系': [pic('Z2_戦闘_必殺技_衝撃系.PNG'), pic('Z3_戦闘_必殺技_衝撃系.PNG')],
  '衝撃系_青': [pic('Z2_戦闘_必殺技_衝撃系_青.PNG'), pic('Z3_戦闘_必殺技_衝撃系_青.PNG')],
  'テンシンハン': [pic('Z2_戦闘_必殺技_テンシンハン.PNG'), pic('Z3_戦闘_必殺技_テンシンハン.PNG')],
  'わかもの': [pic('Z2_戦闘_必殺技_わかもの.PNG'), pic('Z3_戦闘_必殺技_わかもの.PNG')],
  '気を溜める2': [pic('Z2_戦闘_必殺技_気を溜める2.png'), pic('Z3_戦闘_必殺技_気を溜める2.png')],
  '気を溜める3': [pic('Z2_戦闘_必殺技_気を溜める3.png'), pic('Z3_戦闘_必殺技_気を溜める3.png')],
  '気を溜める3(緑)': [pic('Z2_戦闘_必殺技_気を溜める3(緑).png'), pic('Z3_戦闘_必殺技_気を溜める3(緑).png')],
  '気を溜める3(青)': [pic('Z2_戦闘_必殺技_気を溜める3(青).png'), pic('Z3_戦闘_必殺技_気を溜める3(青).png')],
  '気を溜める3(赤)': [pic('Z2_戦闘_必殺技_気を溜める3(赤).png'), pic('Z3_戦闘_必殺技_気を溜める3(赤).png')],
  '気を溜める4': [pic('Z2_戦闘_必殺技_気を溜める4.png'), pic('Z3_戦闘_必殺技_気を溜める4.png')],
  '気を溜める4(緑)': [pic('Z2_戦闘_必殺技_気を溜める4(緑).png'), pic('Z3_戦闘_必殺技_気を溜める4(緑).png')],
  '気を溜める4(青)': [pic('Z2_戦闘_必殺技_気を溜める4(青).png'), pic('Z3_戦闘_必殺技_気を溜める4(青).png')],
  '気を溜める5': [pic('Z2_戦闘_必殺技_気を溜める5.png'), pic('Z3_戦闘_必殺技_気を溜める5.png')],
  '気を溜める6': [pic('Z2_戦闘_必殺技_気を溜める6.png'), pic('Z3_戦闘_必殺技_気を溜める6.png')],
  '背景_衝撃波系': [pic('Z2_戦闘_必殺技_背景_衝撃波系.png'), pic('Z3_戦闘_必殺技_背景_衝撃波系.png')],
  '背景_気功砲系': [pic('Z2_戦闘_必殺技_背景_気功砲系.png'), pic('Z3_戦闘_必殺技_背景_気功砲系.png')],
};
const SCATTER_BLUE = [pic('Z2_戦闘_必殺技_拡散エネルギー波_青_敵.png'), pic('Z3_戦闘_必殺技_拡散エネルギー波_青_敵.png')];
const AURA2_BLUE = [pic('Z2_戦闘_必殺技_気を溜める2(青).png'), pic('Z3_戦闘_必殺技_気を溜める2(青).png')], ROSHI = pic('DB3_亀仙人カメハメは.PNG');
const KIEN = pic('Z2_戦闘_必殺技_気円斬.png'), SPARK = pic('戦闘アニメ.PNG'), KAIOKEN_SS = [pic('Z2_戦闘_必殺技_界王拳(超悟空).PNG'), pic('Z3_戦闘_必殺技_界王拳(超悟空).PNG')];
const IMAGES = [...Object.values(S).flat(), KIEN, SPARK, ...KAIOKEN_SS, ROSHI];

// skill → film: Z3B only in Z2; cut @chr_cutin_flag; small @tec_back_small ('z3': in the Z3 switch only); dmg the damage pattern (23 otherwise)
const Z3B = new Set([18, 19, 36, 47, 63, 64, 73, 82, 83, 84, 92, 123]);
const FILMS = {
  2: { film: 'zaWave', a: [1, 0, 300, 96, 'Z3 エネルギー波'] }, 5: { film: 'zaKame', a: [340, (d) => (era() >= 2 || superSaiyan(d) ? 132 : 124)], cut: true }, 6: { film: 'zaKaioken', cut: true, small: 'z3', dmg: 22 },
  7: { film: 'zaKaiokenKame', cut: true, small: 'z3' }, 18: { film: 'zaGenki', a: [103, 208, 209], cut: true, dmg: 41 }, 19: { film: 'zaGenki', a: [104, 210, 211], cut: true, dmg: 42 },
  31: { film: 'zaWave', a: [1, 1, 300, 96, 'Z3 エネルギー波'] }, 33: { film: 'zaWave', a: [4, 1, 300, 78, 'Z1 怪光線', 212, 213] }, 34: { film: 'zaWave', a: [4, 1, 300, 96, 'Z1 怪光線'] },
  35: { film: 'zaBakuretsu', cut: true, small: 'z3' }, 36: { film: 'zaMakanko', cut: true },
  46: { film: 'zaWave', a: [1, 0, 290, 108, 'Z3 エネルギー波'] }, 47: { film: 'zaMasenko', cut: true },
  61: { film: 'zaWave', a: [1, 0, 290, 108, 'Z3 エネルギー波'] }, 62: { film: 'zaKame', a: [340, () => 142] }, 63: { film: 'zaScatter', cut: true }, 64: { film: 'zaKienzan', cut: true },
  72: { film: 'zaKame', a: [340, () => (era() >= 2 ? 132 : 124)] }, 73: { film: 'zaSoki', cut: true },
  81: { film: 'zaWave', a: [1, 0, 300, 96, 'Z3 エネルギー波'] }, 82: { film: 'zaFour' }, 83: { film: 'zaKikou', cut: true }, 84: { film: 'zaFourKikou', cut: true, dmg: 24 },
  91: { film: 'zaSmall', a: [1, 0, 328, 148], cut: true }, 92: { film: 'zaPsychic', cut: true, dmg: 25 },
  102: { film: 'zaSmall', a: [4, 0, 328, 128] }, 103: { film: 'zaKame', a: [340, () => 140], cut: true }, 104: { film: 'zaSuperSlugger', cut: true, small: 'z3', dmg: 41 },
  121: { film: 'zaSmall', a: [1, 3, 352, 134] }, 123: { film: 'zaBlast', cut: true }, 124: { film: 'zaGalick', cut: true },
  141: { film: 'zaWave', a: [1, 1, 300, 96, 'Z3 エネルギー波'] }, 142: { film: 'zaWave', a: [12, 1, 300, 96, 'Z1 怪光線'], cut: true }, 143: { film: 'zaStrong', cut: true, small: 'z3' },
  144: { film: 'zaNamek', cut: true, small: true, dmg: 41 }, 226: { film: 'zaKame', a: [340, () => 140] }, 228: { film: 'zaBankoku', cut: true, dmg: 73 }, 229: { film: 'zaMax', cut: true, small: true, z3Only: true, dmg: 41 },
};
const OWNER = { 2: 3, 5: 3, 6: 3, 7: 3, 18: 3, 19: 3, 31: 4, 33: 4, 34: 4, 35: 4, 36: 4, 46: 5, 47: 5, 61: 6, 62: 6, 63: 6, 64: 6, 72: 7, 73: 7, 81: 8, 82: 8, 83: 8, 84: 8, 91: 9, 92: 9,
  102: 10, 103: 10, 104: 10, 121: 12, 123: 12, 124: 12, 141: 15, 142: 15, 143: 15, 144: 15, 226: 24, 228: 24, 229: 24 };
const AGAIN_MS = 500, ended = {};

const v = (n) => { const s = window.__game && window.__game.state; return (s && s.var && s.var[n]) || 0; };
const era = () => Math.min(2, v(40)); // ($btl_progress for the party)
const T = (name) => S[name][era() >= 2 ? 1 : 0];
const cfgOf = (d) => {
  if (d.constructor !== Duel || !d.p || era() < 1) return null;
  const c = FILMS[d.skill];
  return c && !(era() >= 2 && Z3B.has(d.skill)) && !(c.z3Only && era() < 2) ? c : null;
};
const COL = { 1: '(緑)', 3: '(青)' };
const by = (name, col) => S[name + (COL[col] || '')] || S[name];
const T2 = (name, col) => by(name, col)[era() >= 2 ? 1 : 0];

function stageFor(d, cfg) {
  const st = d.st = new ZfStage(d), sc = window.__game && window.__game.scene;
  st.era = era();
  st.actor = (sc && sc.duel && sc.duel.m && sc.duel.m.id) || OWNER[d.skill];
  st.cutFlag = !!cfg.cut;
  st.small = st.small || cfg.small === true || (cfg.small === 'z3' && st.era >= 2);
  st.again = (d.skill === 63 || d.skill === 123) && performance.now() - (ended[d.skill] || -1e9) < AGAIN_MS;
  d.finished.then(() => { ended[d.skill] = performance.now(); });
  const behind = Duel.prototype.behind, effect = Duel.prototype.effect; // (the damage films of src/anime.js set these themselves)
  d.behind = (f) => behind.call(d, (c, t) => { for (const g of st.barList) g(c); for (const g of st.b) g(c); if (f) f(c, t); });
  d.effect = (f) => effect.call(d, (c, t) => { for (const g of st.e) g(c); if (f) f(c, t); st.drawCut(c); });
  d.behind(null); d.effect(null);
  return st;
}

// ---------- back_anime_pattern (all.rb, the party's side) ----------
function step(st, every, last) {
  const o = st.ba;
  if (o.frame >= every && o.type !== last) { o.type++; o.frame = 0; } else if (o.frame >= every) { o.type = 0; o.frame = 0; }
  o.frame++;
}
const AURA = { 101: ['気を溜める3', 184, 240, 0], 102: ['気を溜める4', 224, 288, -36], 105: ['気を溜める2', 152, 192, 0] };
function back(st, n, x, y, col) {
  if (n === 201) return st.aura(x, y, col);
  if (AURA[n]) {
    const [name, w, h, dy] = AURA[n], list = S[name + ({ 1: '(緑)', 3: '(青)', 4: '(赤)' }[col] || '')] || S[name];
    st.back(list[era() >= 2 ? 1 : 0], st.ba.type * w, 0, w, h, x, y + dy);
    return step(st, 4, 2);
  }
}
// 103 / 104 気を溜める(元気弾): twelve pictures, stopping on the last
function stream103(st) { const o = st.ba; if (o.frame >= 8 && o.type !== 11) { o.type++; o.frame = 0; } o.frame++; }
function shock(st, big) {
  const sheet = T('背景_衝撃波系'), k = st.ba.type * 180;
  if (big) { st.back(sheet, 0, k, 640, 42, 0, 32); st.back(sheet, 0, 138 + k, 640, 42, 0, 266); } else st.back(sheet, 0, k, 640, 180, 0, 80);
  step(st, 4, 2);
}
function kikou(st, big) {
  const sheet = T('背景_気功砲系'), k = st.ba.type * 360;
  if (big) { st.back(sheet, 0, k, 142, 356, 156, 0); st.back(sheet, 242, k, 142, 356, 498, 0); } else st.back(sheet, 0, k, 384, 356, 170, 0);
  step(st, 4, 2);
}

// ---------- effect_pattern (135031), @attackcourse 0 ----------
function fx(st, n, rx, ry, col = 0) {
  st.fx((k) => {
    const F = k.frame, d = F * RAY_SPEED, f = (sheet, sx, sy, w, h, x, y) => st.front(sheet, sx, sy, w, h, x, y);
    switch (n) {
      case 201: f(T2('エネルギー弾', col), 256, 0, 128, 128, rx + d, ry); break;
      case 202: f(T2('エネルギー弾', col), 256, 0, 128, 128, -128 + d, 96); break;
      case 203: f(T2('エネルギー弾2', col), 0, 0, 96, 64, rx + d, ry); break;
      case 204: f(T2('エネルギー弾2', col), 0, 0, 96, 64, -128 + d, 144); break;
      case 205: f(st.ss ? KAIOKEN_SS[era() >= 2 ? 1 : 0] : T('界王拳'), 0, 0, 236, 122, -236 + d, 120); break;
      case 206: case 207: {
        const z3 = era() >= 2, sheet = T2(z3 ? 'エネルギー弾4' : 'エネルギー弾3', col), [w, h] = z3 ? [190, 126] : [222, 134];
        if (n === 206) f(sheet, 0, 0, w, h, rx + d, ry); else f(sheet, 0, 0, w, h, -192 + d, 96);
        break;
      }
      case 208: f(T2('エネルギー弾', col), 384, 0, 128, 128, rx + d, ry); break;
      case 209: f(T2('エネルギー弾', col), 384, 0, 128, 128, -128 + d, 112); break;
      case 210: f(T2('エネルギー弾', col), 640, 0, 128, 128, rx + d, ry); break;
      case 211: f(T2('エネルギー弾', col), 640, 0, 128, 128, -128 + d, 112); break;
      case 212: f(T2('エネルギー弾', col), 128, 0, 128, 128, rx + d, ry); break;
      case 213: f(T2('エネルギー弾', col), 128, 0, 128, 128, -128 + d, 96); break;
      case 214: f(T('魔貫光殺砲'), 0, 46, 54 + d, 46, rx, ry); break;
      case 215: f(T('魔貫光殺砲'), 0, 0, 400, 46, -400 + d, 140); break;
      case 216: f(T('拡散エネルギー波'), 0, 112, 54 + d, 112, rx, ry); break;
      case 217: f(T('拡散エネルギー波'), 0, 0, 400, 112, -400 + d, 122); break;
      case 218: f(KIEN, 0, 0, 128, 44, rx + d, ry); break;
      case 219: f(KIEN, 0, 0, 192, 128, -192 + d, 150); break;
      case 220: f(T('繰気弾'), 256, 0, 128, 128, rx + d, ry); break;
      case 221: f(T('繰気弾'), 256, 0, 128, 128, -128 + d, 120); break;
      case 223: { // 4 balls closing on the defender
        const Y = STD_Y - 20;
        for (const y of [Y - 90 + F * 3, Y - 30 + F, Y + 30 - F, Y + 90 - F * 3]) f(T('エネルギー弾'), 256, 0, 128, 128, -128 + d, y);
        break;
      }
      case 225: f(col === 3 ? T('エネルギー波_小_敵_青') : T('エネルギー波_小'), 0, 48, 54 + d, 48, rx, ry); break;
      case 226: f(col === 3 ? T('エネルギー波_小_敵_青') : T('エネルギー波_小'), 0, 0, 400, 48, -400 + d, 148); break;
      case 229: f(T('衝撃系_青'), 0, 0, 30, 116, rx + d, ry); break;
      case 230: f(T('衝撃系_青'), 0, 0, 30, 116, -64 + d, ry); break;
      case 233: f(T('エネルギー波_中_敵_青'), 0, 80, 54 + d, 80, rx, ry); break;
      case 234: f(T('エネルギー波_中_敵_青'), 0, 0, 400, 80, -400 + d, ry); break;
      case 283: f(T2('エネルギー液', col), 0, 32, 24 + d, 32, rx, ry); break;
      case 44: f(T2('エネルギー液', col), 0, 0, 400, 32, -400 + d, 150); break;
      case 331: { const m = T('エネルギー波_中'); f(m, 0, 80, 54 + d, 80, 326, 116); f(m, 0, 80, 54 + d, 80, 282, 42); f(m, 0, 80, 54 + d, 80, 282, 172); break; }
      case 48: f(T('エネルギー波_特大'), 0, 0, 400, 192, -400 + d, 76); break;
      default:
    }
  });
}
// 222 / 224 四身の拳: he splits in two, in four along the diagonal; 222 then fires four balls, 224 raises the hands
function four(d, st, n, rx, ry) {
  st.fx((k) => {
    const F = k.frame, X = rx + 26, at = (row, x, y) => st.front(T('テンシンハン'), 0, 96 * row, 96, 96, x, y);
    const pair = (row, t) => { at(row, X + 0.5 * t, ry - t); at(row, X - 0.5 * t, ry + t); };
    if (F <= 30) pair(4, F);
    else if (F <= 59) { pair(3, 30); if (F === 59) d.se('Z1 分身'); } else if (F <= 120) { pair(4, 30); pair(4, F - 30); } else if (F <= 150) { pair(4, 30); pair(4, 90); } else {
      if (F === 151) d.se(n === 222 ? 'Z3 エネルギー波' : 'Z1 ザー');
      const row = n === 222 ? 1 : 2;
      pair(row, 90); pair(row, 30);
      if (n === 222) for (const t of [90, 30, -30, -90]) st.front(T('エネルギー弾'), 256, 0, 128, 128, X + 0.5 * t + (F - 150) * RAY_SPEED, ry - 20 - t);
    }
  });
}
const big = (d) => (d.G.sheets.size || 96) > 96;
const superSaiyan = (d) => String(d.A.sheets.special || '').includes('超'); // ($super_saiyazin_flag[1])
const shakeZ3 = (d, f, s) => { if (era() >= 2 && f >= s && f < s + 3) d.vel(2, 0, 0, 0); else if (era() >= 2 && f >= s + 3 && f < s + 6) d.vel(-2, 0, 0, 0); };

const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch, rain0 = Duel.prototype.rainDown;
Object.assign(Duel.prototype, {
  * swoopIn() {
    const cfg = cfgOf(this);
    if (!cfg) return yield* swoop0.call(this);
    IMAGES.forEach((p) => img(p));
    const st = stageFor(this, cfg);
    if (st.again) return;
    yield* swoop0.call(this);
  },
  * launch() { // 32
    const cfg = cfgOf(this), st = this.st;
    if (!cfg || !st) return yield* launch0.call(this);
    if (st.again) return;
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      this.back.y += 4;
      if (f >= 30) { st.bars = true; if (st.cutFlag) st.cut = true; }
      yield;
    }
  },
  * rainDown(start) { // src/anime.js run: a further target of 拡散エネルギー波, Z2 (1163): the beam on the defender straight away
    const cfg = cfgOf(this);
    if (!cfg || this.skill !== 63) return yield* rain0.call(this, start);
    IMAGES.forEach((p) => img(p));
    const st = stageFor(this, cfg);
    st.bars = true; st.cut = true; st.cutFlag = true; st.mirror = true;
    this.se('Z1 エネルギー波2');
    this.zfOut();
    for (let f = 0; f <= 25; f++) { fx(st, 217, 0, 0); yield; }
    return 'explode';
  },
  // the end of a film: its damage pattern
  * zaEnd() {
    const c = FILMS[this.skill], n = c.dmg || 23;
    if (n === 41 || n === 42) { yield* this.zfHit(n); return 'none'; }
    return { 22: 'shock', 24: 'down', 25: 'psychic', 73: 'numb' }[n] || 'explode';
  },

  // ---------- the plain waves ----------
  * zaWave(pose, col, rx, ry, se, a = 201, b = 202) { // 1102 / 1131 / 1133 / 1134 / 1146 / 1242: the ball from the hand, across the defender
    const st = this.st;
    this.se(se);
    this.pose(this.A, pose, true);
    yield;
    for (let f = 1; f <= 40; f++) { fx(st, a, rx, ry, col); yield; }
    st.fxReset(); // 41
    for (let f = 41; f < 45; f++) yield;
    this.zfOut(); // 45
    yield;
    for (let f = 46; f <= 75; f++) { fx(st, b, 0, 0, col); yield; }
    return yield* this.zaEnd();
  },
  * zaSmall(pose, col, rx, ry) { // 1191 / 1202 / 1221: the small beam
    const st = this.st;
    this.se('Z1 怪光線');
    this.pose(this.A, pose, true);
    yield;
    for (let f = 1; f <= 40; f++) { fx(st, 225, rx, ry, col); yield; }
    st.fxReset();
    for (let f = 41; f < 45; f++) yield;
    this.zfOut();
    yield;
    for (let f = 46; f <= 72; f++) { fx(st, 226, 0, 0, col); yield; }
    return yield* this.zaEnd();
  },
  * zaKame(rx, ryOf) { // 1105 / 1162 / 1203 / 1326: charge, pose, the ball across
    const st = this.st, ry = ryOf(this);
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    for (let f = 0; f <= 40; f++) yield;
    for (let f = 41; f <= 45; f++) { this.pose(this.A, 3, true); yield; }
    audio.seStop(); this.se('Z3 エネルギー波'); // 46
    yield;
    for (let f = 47; f <= 75; f++) { shakeZ3(this, f, 47); fx(st, 203, rx, ry); yield; }
    st.fxReset(); // 76
    for (let f = 76; f < 80; f++) yield;
    this.zfOut();
    yield;
    for (let f = 81; f <= 110; f++) { fx(st, 204, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 悟空 ----------
  * zaKaioken() { // 1106 界王拳
    const st = this.st, z3 = era() >= 2, [no, x, y] = z3 ? [201, 228, 88] : [101, 220, 32], col = z3 ? 3 : 0;
    st.ss = superSaiyan(this);
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, st.ss ? 0 : 4, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, col); yield; }
    audio.seStop(); this.se('Z1 高速移動'); // 90
    this.A.y = -120;
    back(st, no, x, y, col);
    yield;
    for (let f = 91; f <= 130; f++) {
      back(st, no, x, y, col);
      if (f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, this.A.x + 20, 144);
      yield;
    }
    this.se('Z1 逃げる'); this.zfOut(); // 131
    yield;
    for (let f = 132; f <= 159; f++) { fx(st, 205, 0, 0); yield; }
    return yield* this.zaEnd();
  },
  * zaKaiokenKame() { // 1107 界王拳・カメハメ波
    const st = this.st, z3 = era() >= 2, [no, x, y, ry] = z3 ? [201, 228, 88, 108] : [102, 198, 32, 92], col = z3 ? 3 : 0;
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, superSaiyan(this) ? 0 : 4, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, col); yield; }
    audio.seStop(); this.se('Z1 気を溜める'); this.pose(this.A, 2, true); // 90
    back(st, no, x, y, col);
    yield;
    for (let f = 91; f <= 140; f++) { back(st, no, x, y, col); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 141
    fx(st, 206, 340, ry, 0);
    back(st, no, x, y, col);
    yield;
    for (let f = 142; f <= 179; f++) { back(st, no, x, y, col); shakeZ3(this, f, 142); fx(st, 206, 340, ry, 0); yield; }
    st.fxReset(); // 180
    for (let f = 180; f < 190; f++) yield;
    this.zfOut();
    yield;
    for (let f = 191; f <= 217; f++) { fx(st, 207, 0, 0); yield; }
    return yield* this.zaEnd();
  },
  * zaGenki(no, up, down) { // 1118 元気弾 / 1119 超元気弾 (Z2)
    const st = this.st, [x, y] = no === 103 ? [190, 36] : [180, 0];
    this.se('Z2 気を溜める_元気弾');
    this.pose(this.A, 5, true);
    yield;
    for (let f = 1; f <= 89; f++) {
      if (no === 103) st.back(T('気を溜める5'), st.ba.type * 236, 0, 236, 254, x, y); else st.back(T('気を溜める6'), st.ba.type * 512, 0, 256, 320, x, y);
      stream103(st);
      yield;
    }
    audio.seStop(); this.pose(this.A, 6, true); // 90
    for (let f = 90; f <= 110; f++) yield;
    this.se('Z1 エネルギー波'); this.pose(this.A, 1, true); // 111
    for (let f = 111; f <= 149; f++) { fx(st, up, 340, 112); yield; }
    this.pose(this.A, 1, true); st.fxReset(); // 150
    for (let f = 150; f < 160; f++) yield;
    this.zfOut();
    yield;
    for (let f = 161; f <= 187; f++) { fx(st, down, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 比克 ----------
  * zaBakuretsu() { // 1135 爆裂魔光砲
    const st = this.st, z3 = era() >= 2, [no, x, y] = z3 ? [201, 228, 88] : [101, 214, 32];
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, 2, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, 1); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 90
    fx(st, 206, 340, 96, 1);
    back(st, no, x, y, 1);
    yield;
    for (let f = 91; f <= 128; f++) { back(st, no, x, y, 1); shakeZ3(this, f, 91); fx(st, 206, 340, 96, 1); yield; }
    st.fxReset(); // 129
    for (let f = 129; f < 139; f++) yield;
    this.zfOut();
    yield;
    for (let f = 140; f <= 166; f++) { fx(st, 207, 0, 0, 1); yield; }
    return yield* this.zaEnd();
  },
  * zaMakanko() { // 1136 魔貫光殺砲 (Z2)
    const st = this.st;
    this.se('Z2 気を溜める_元気弾');
    this.pose(this.A, 5, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 102, 190, 32, 1); yield; }
    audio.seStop(); this.pose(this.A, 6, true); // 90
    for (let f = 90; f <= 100; f++) yield;
    this.se('Z1 エネルギー波3'); // 101
    for (let f = 101; f <= 139; f++) { fx(st, 214, 340, 130); yield; }
    st.fxReset(); // 140
    for (let f = 140; f < 150; f++) yield;
    this.zfOut();
    yield;
    for (let f = 151; f <= 177; f++) { fx(st, 215, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 悟飯 ----------
  * zaMasenko() { // 1147 魔閃光 (Z2)
    const st = this.st;
    this.se('Z2 気を溜める');
    this.pose(this.A, 2, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 101, 198, 34, 0); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 90
    fx(st, 203, 325, 138);
    back(st, 101, 198, 34, 0);
    yield;
    for (let f = 91; f <= 128; f++) { back(st, 101, 198, 34, 0); fx(st, 203, 325, 138); yield; }
    st.fxReset();
    for (let f = 129; f < 139; f++) yield;
    this.zfOut();
    yield;
    for (let f = 140; f <= 166; f++) { fx(st, 204, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 克林 ----------
  * zaScatter() { // 1163 拡散エネルギー波 (Z2)
    const st = this.st;
    this.se('Z2 気を溜める');
    this.pose(this.A, 2, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 101, 198, 32, 0); yield; }
    audio.seStop(); this.se('Z1 気を溜める'); this.pose(this.A, 2, true); // 90
    back(st, 101, 198, 32, 0);
    yield;
    for (let f = 91; f <= 140; f++) { back(st, 101, 198, 32, 0); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 4, true); // 141
    for (let f = 141; f <= 179; f++) { fx(st, 216, 340, 122); yield; }
    st.fxReset();
    for (let f = 180; f < 190; f++) yield;
    this.zfOut();
    yield;
    for (let f = 191; f <= 217; f++) { fx(st, 217, 0, 0); yield; }
    return yield* this.zaEnd();
  },
  * zaKienzan() { // 1164 気円斬 (Z2)
    const st = this.st;
    this.pose(this.A, 5, true);
    for (let f = 0; f < 13; f++) yield;
    this.pose(this.A, 6, true); // 13
    for (let f = 13; f < 26; f++) yield;
    this.A.x -= 10; this.pose(this.A, 7, true); // 26 (@ax -10 for one frame)
    for (let f = 26; f < 41; f++) yield;
    this.A.x += 10; this.pose(this.A, 1, true); // 41
    for (let f = 41; f < 46; f++) yield;
    audio.seStop(); this.se('Z1 気円斬'); // 46
    yield;
    for (let f = 47; f <= 75; f++) { fx(st, 218, 340, 150); yield; }
    st.fxReset();
    for (let f = 76; f < 80; f++) yield;
    this.zfOut();
    yield;
    for (let f = 81; f <= 110; f++) { fx(st, 219, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 雅木茶 ----------
  * zaSoki() { // 1173 繰気弾 (Z2): he steers the ball by hand
    const st = this.st, P = { 90: 4, 100: 5, 110: 6, 120: 7, 130: 6, 140: 8, 150: 6 };
    this.se('Z2 気を溜める');
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 101, 204, 32, 0); yield; }
    audio.seStop();
    for (let f = 90; f < 160; f++) { if (P[f] != null) this.pose(this.A, P[f], true); yield; }
    audio.seStop(); this.se('Z1 エネルギー波'); this.pose(this.A, 6, true); // 160
    for (let f = 160; f <= 198; f++) { fx(st, 220, 325, 120); yield; }
    st.fxReset();
    for (let f = 199; f < 209; f++) yield;
    this.zfOut();
    yield;
    for (let f = 210; f <= 236; f++) { fx(st, 221, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 天津飯 ----------
  * zaFour() { // 1182 四身の拳 (Z2)
    const st = this.st;
    this.pose(this.A, 3, true);
    for (let f = 0; f < 24; f++) yield;
    this.se('Z1 分身'); yield; // 24
    for (let f = 25; f <= 225; f++) { this.A.y = -120; four(this, st, 222, CENTER_CHAX, STD_Y); yield; }
    this.pose(this.A, 2, true); st.fxReset(); // 226
    yield;
    this.zfOut(); // 227
    for (let f = 227; f < 237; f++) yield;
    for (let f = 237; f <= 266; f++) { fx(st, 223, 0, 0); yield; }
    return yield* this.zaEnd();
  },
  * zaKikou() { // 1183 気功砲 (Z2)
    const st = this.st;
    this.se('Z2 気を溜める');
    this.pose(this.A, 0, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 105, 222, 60, 0); yield; }
    audio.seStop(); this.se('Z1 ザー'); this.pose(this.A, 2, true); // 90
    for (let f = 90; f <= 128; f++) yield;
    st.fxReset();
    for (let f = 129; f < 139; f++) yield;
    this.zfOut(); st.bars = false; // 139
    yield;
    for (let f = 140; f <= 190; f++) { shock(st, big(this)); yield; }
    return yield* this.zaEnd();
  },
  * zaFourKikou() { // 1184 四身の拳・気功砲 (Z2)
    const st = this.st;
    this.pose(this.A, 3, true);
    for (let f = 0; f < 24; f++) yield;
    this.se('Z1 分身'); yield;
    for (let f = 25; f <= 225; f++) { this.A.y = -120; four(this, st, 224, CENTER_CHAX, STD_Y); yield; }
    this.pose(this.A, 2, true); st.fxReset(); // 226
    yield;
    this.zfOut(); st.bars = false; st.cutFlag = false; // 227
    for (let f = 227; f < 237; f++) yield;
    for (let f = 237; f <= 266; f++) { kikou(st, big(this)); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 餃子 ----------
  * zaPsychic() { // 1192 超能力 (Z2)
    const st = this.st;
    this.se('Z2 気を溜める');
    this.pose(this.A, 2, true);
    yield;
    for (let f = 1; f <= 108; f++) { back(st, 105, 218, 60, 0); yield; }
    audio.seStop(); st.fxReset(); // 109
    for (let f = 109; f < 119; f++) yield;
    this.zfOut(); st.bars = false; st.cutFlag = false; // 119
    yield;
    for (let f = 120; f <= 146; f++) { kikou(st, big(this)); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 琪琪 ----------
  * zaSuperSlugger() { // 1204 超気功スラッガー
    const st = this.st, z3 = era() >= 2, [no, x, y, ry] = z3 ? [201, 224, 88, 96] : [102, 194, 32, 90], col = z3 ? 3 : 0;
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, 5, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, col); yield; }
    audio.seStop(); this.se('Z1 気を溜める'); this.pose(this.A, 2, true); // 90
    back(st, no, x, y, col);
    yield;
    for (let f = 91; f <= 140; f++) { back(st, no, x, y, col); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 141
    fx(st, 206, 340, ry, 0);
    back(st, no, x, y, col);
    yield;
    for (let f = 142; f <= 179; f++) { back(st, no, x, y, col); shakeZ3(this, f, 142); fx(st, 206, 340, ry, 0); yield; }
    st.fxReset();
    for (let f = 180; f < 190; f++) yield;
    this.zfOut();
    yield;
    for (let f = 191; f <= 217; f++) { fx(st, 207, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 貝吉塔 ----------
  * zaBlast() { // 1223 爆発波 (Z2)
    const st = this.st;
    if (st.again) { // (@all_attack_count >= 2)
      st.bars = true; st.cut = true; st.cutFlag = true; st.mirror = true;
      this.se('Z1 ザー');
      this.zfOut();
      for (let f = 0; f <= 25; f++) { fx(st, 230, 0, 96); yield; }
      return yield* this.zaEnd();
    }
    this.se('Z2 気を溜める');
    this.pose(this.A, 0, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 101, 210, 32, 3); yield; }
    audio.seStop(); // 90
    back(st, 101, 210, 32, 3);
    yield;
    for (let f = 91; f <= 140; f++) { back(st, 101, 210, 32, 3); yield; }
    audio.seStop(); this.se('Z1 ザー'); this.pose(this.A, 2, true); // 141
    for (let f = 141; f <= 179; f++) { fx(st, 229, 326, 96); yield; }
    st.fxReset();
    for (let f = 180; f < 190; f++) yield;
    this.zfOut();
    yield;
    for (let f = 191; f <= 217; f++) { fx(st, 230, 0, 96); yield; }
    return yield* this.zaEnd();
  },
  * zaGalick() { // 1224 ギャリック砲
    const st = this.st, z3 = era() >= 2, [no, x, y] = z3 ? [201, 220, 86] : [102, 190, 32];
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, 5, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, 3); yield; }
    audio.seStop(); this.pose(this.A, 6, true); // 90
    for (let f = 90; f < 110; f++) yield;
    audio.seStop(); this.se('Z1 エネルギー波2'); // 110
    for (let f = 110; f <= 148; f++) { fx(st, 233, 350, 124); yield; }
    st.fxReset();
    for (let f = 149; f < 159; f++) yield;
    this.zfOut();
    yield;
    for (let f = 160; f <= 186; f++) { fx(st, 234, 0, 124); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 青年 ----------
  * zaStrong() { // 1243 強力エネルギー波
    const st = this.st, ry = era() >= 2 ? 94 : 88;
    this.se('Z2 気を溜める');
    this.pose(this.A, 11, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, 101, 214, 32, 1); yield; }
    audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 90
    for (let f = 90; f <= 128; f++) { fx(st, 206, 340, ry, 1); yield; }
    st.fxReset();
    for (let f = 129; f < 139; f++) yield;
    this.zfOut();
    yield;
    for (let f = 140; f <= 166; f++) { fx(st, 207, 0, 0, 1); yield; }
    return yield* this.zaEnd();
  },
  * zaNamek() { // 1244 ナメック戦士: two more of them fly in, charge together, one kicks the defender away, all three fire
    const st = this.st, z3 = era() >= 2, [no, bx, by2] = z3 ? [201, 224, 86] : [101, 216, 32], stop = 188, Y = STD_Y, M = T('わかもの'), A = this.A, G = this.G;
    const two = (a, b, x = stop) => { st.back(M, 0, 96 * a, 96, 96, x, Y - 64); if (b != null) st.back(M, 0, 96 * b, 96, 96, x, Y + 64); };
    this.se('Z1 飛ぶ'); // 0
    yield;
    for (let f = 1; f <= 60; f++) { two(4, 5, Math.min(stop, -96 + (f - 1) * 12)); yield; }
    for (let f = 61; f <= 150; f++) {
      if (f === 61) this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
      back(st, no, bx, by2, 1); st.ba.frame--;
      back(st, no, bx - 78, by2 - 64, 1); st.ba.frame--;
      back(st, no, bx - 78, by2 + 64, 1);
      two(4, 5);
      yield;
    }
    for (let f = 151; f <= 190; f++) {
      if (f === 151) { audio.seStop(); this.se('Z1 高速移動'); }
      two(4);
      if (f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, stop + 10, Y + 64 + 20);
      yield;
    }
    for (let f = 191; f <= 250; f++) {
      if (f === 191) this.se('Z1 飛ぶ');
      two(4);
      this.pose(A, 10, true);
      this.vel(18, -2, 0, 0);
      yield;
    }
    for (let f = 251; f <= 280; f++) { G.x = CENTER_ENEX; G.y = Y; this.vel(18, -2, 0, 0); yield; }
    for (let f = 281; f <= 320; f++) {
      if (f === 281) this.se('Z1 高速移動');
      this.vel(18, -2, 0, 0);
      if (f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, CENTER_CHAX - 62, Y + 20);
      yield;
    }
    for (let f = 321; f <= 330; f++) { st.back(M, 0, 96 * 5, 96, 96, CENTER_CHAX - 62, Y); yield; }
    for (let f = 331; f <= 370; f++) { // the kick
      if (f === 335) { this.se('ZG 打撃2'); this.pose(G, 17, false); }
      if (f >= 335 && !this.hit) { st.fxReset(); this.zfOut(); return yield* this.zaEnd(); } // (@battle_anime_frame = 737)
      if (f >= 335) this.vel(0, 0, -24, 0);
      st.back(M, 0, 96 * 9, 96, 96, CENTER_CHAX - 62 + Math.min(200, (f - 331) * 20), Y);
      yield;
    }
    let ax = 0;
    for (let f = 371; f <= 410; f++) {
      if (f === 371) G.x = -96;
      this.vel(ax, 0, f <= 381 ? -16 : f <= 386 ? -14 : f <= 391 ? -12 : f <= 396 ? -10 : -8, 0);
      if (f === 381) { this.se('Z1 飛ぶ'); A.y = Y - 64; A.x = -96; ax = 20; }
      yield;
    }
    for (let f = 411; f <= 430; f++) {
      if (f === 421) { this.se('Z1 飛ぶ'); A.y = Y; A.x = 640; ax = -14; this.pose(A, 16, true); }
      this.vel(ax, 0, -6, 0);
      yield;
    }
    for (let f = 431; f <= 440; f++) {
      if (f === 431) { ax = 0; this.pose(A, 18, true); }
      if (f === 435) this.se('Z1 強打');
      if (f <= 439) A.x += 4;
      if (f < 435) this.vel(0, 0, -4, 0);
      yield;
    }
    for (let f = 441; f <= 460; f++) yield;
    for (let f = 461; f <= 520; f++) {
      if (f === 461) this.se('ZG 打撃4');
      if (f <= 465) { A.x -= 12; this.pose(A, 17, true); }
      this.vel(0, 0, 18, -4);
      yield;
    }
    for (let f = 521; f <= 540; f++) {
      if (f === 521) { A.x = CENTER_CHAX; A.y = Y; this.pose(A, 4, true); G.x = 640; G.y = Y; }
      this.vel(0, 0, 18, 0);
      yield;
    }
    for (let f = 541; f <= 580; f++) {
      if (f === 541) { this.pose(A, 8, true); this.se('ZG 打撃4'); }
      this.vel(0, 0, -24, 0);
      yield;
    }
    this.pose(A, 0, true);
    for (let f = 581; f <= 610; f++) { two(4, 5); yield; }
    this.se('Z1 エネルギー波2');
    this.pose(A, 1, true);
    for (let f = 611; f <= 709; f++) { two(6, 7); fx(st, 331, 0, 0); yield; }
    st.fxReset(); this.zfOut(); // 710
    yield;
    for (let f = 711; f <= 737; f++) { fx(st, 48, 0, 0); yield; }
    return yield* this.zaEnd();
  },

  // ---------- 龜仙人 ----------
  * zaMax() { // 2329 MAXパワーかめはめは (Z3): the aura, his three pictures building up, the ball, the big wave across the defender
    const st = this.st;
    this.se('Z3 変身');
    this.pose(this.A, 6, true);
    yield;
    for (let f = 1; f <= 89; f++) { st.aura(218, 88, 0); yield; }
    st.no = 1; audio.seStop(); this.se('Z1 気を溜める'); this.A.y = -100; st.cutFlag = false; // 90
    yield;
    for (let f = 91; f <= 289; f++) {
      if (f === 241) { audio.seStop(); this.se('Z1 エネルギー波2'); }
      if (f < 280) st.back(ROSHI, (f <= 140 ? 0 : f <= 190 ? 1 : 2) * 64, 0, 64, 96, CENTER_CHAX + 48, STD_Y);
      if (f === 280) st.fxReset();
      if (f >= 241 && f < 280) st.fx((k) => { st.front(T('エネルギー弾'), k.type * 128, 0, 128, 128, 242, 120); if (k.frame >= 10) { k.type++; k.frame = 0; } });
      yield;
    }
    st.no = 0; st.cutFlag = true; st.cut = true; this.zfOut(); // 290
    yield;
    for (let f = 291; f <= 317; f++) { fx(st, 207, 0, 0); yield; }
    return yield* this.zaEnd();
  },
  * zaBankoku() { // 1328 萬國驚天掌
    const st = this.st, z3 = era() >= 2, [no, x, y] = z3 ? [201, 218, 88] : [101, 200, 32];
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(this.A, 4, true);
    yield;
    for (let f = 1; f <= 89; f++) { back(st, no, x, y, 1); yield; }
    this.pose(this.A, 5, true); audio.seStop(); this.se('DB3 エネルギー波1'); // 90
    for (let f = 90; f <= 128; f++) { fx(st, 283, 340, 150, 1); yield; }
    st.fxReset();
    for (let f = 129; f < 139; f++) yield;
    this.zfOut();
    yield;
    for (let f = 140; f <= 166; f++) { fx(st, 44, 0, 0, 1); yield; }
    return yield* this.zaEnd();
  },
});

// ---------- 琪琪 in Z1 (she can join on Earth, page 145): 202 / 203 / 204; src/anime.js had lent her others' films ----------
const Z1_BALL = pic('Z1_戦闘_必殺技_エネルギー弾.PNG'), Z1_AURA = pic('Z1_戦闘_必殺技_気を溜める3.png'), Z1_WALL = pic('Z1_戦闘_必殺技_気を溜める9.PNG');
const CHICHI_Z1 = { 102: 'zaChiBeam', 103: 'zaChiSlugger', 104: 'zaChiSuper' };
const z1Film = (d) => (d.constructor === Duel && d.p && era() === 0 ? CHICHI_Z1[d.skill] : null);
// effects 2 / 8: the ball facing us, the next picture every 10 frames
const facing = (x, y) => (c, t) => draw(c, Z1_BALL, Math.floor(t / 11) * 128, 0, 128, 128, x, y);
const aura6 = (x, y) => (c, t) => draw(c, Z1_AURA, 0, Math.floor(t / 5) % 3 * 160, 160, 160, x, y); // back 6
const wall17 = () => (c, t) => draw(c, Z1_WALL, 0, Math.floor(t / 5) % 3 * 378, 640, 356, 0, 0); // back 17
Object.assign(Duel.prototype, {
  * zaChiBeam() { // 202 ビーム
    this.se('Z1 気を溜める');
    this.pose(this.A, 4, true);
    yield* this.wait(61);
    this.se('Z1 怪光線'); // 61
    yield* this.wait(9);
    this.effect(facing(252, 90)); // 70
    yield* this.wait(30);
    yield* this.cut(RAY.small); // 100
  },
  * zaChiSlugger() { // 203 気功スラッガー
    this.se('Z1 気を溜める3');
    this.pose(this.A, 2, true);
    this.behind(aura6(236, 100));
    yield* this.wait(61);
    this.se('Z1 エネルギー波2'); // 61
    this.pose(this.A, 3, true);
    yield;
    this.behind(null);
    this.effect(facing(254, 110));
    yield* this.wait(63);
    this.effect(null); // 125
    yield;
    yield* this.cut(RAY.mid); // 126
  },
  * zaChiSuper() { // 204 超気功スラッガー
    this.se('Z1 気を溜める7');
    this.pose(this.A, 5, true);
    this.behind(wall17());
    yield* this.wait(90);
    audio.seStop(); this.se('Z1 気を溜める'); this.pose(this.A, 2, true); // 90
    yield* this.wait(71);
    this.se('Z1 エネルギー波2'); this.pose(this.A, 3, true); // 161
    this.effect(facing(254, 110));
    yield* this.wait(59);
    this.effect(null); // 220
    this.behind(null);
    yield* this.wait(10);
    yield* this.cut(RAY.huge, 27, -30); // 230
  },
});

// the first films: in Z2 and on these moves go to the films above
for (const name of ['energyWave', 'kamehameha', 'kaioken', 'kaiokenKamehameha', 'genkidama', 'makouhou', 'eyeBeam', 'mouthBeam', 'bakuretsu', 'makankosappo', 'gohanMakouhou', 'masenko',
  'krillinWave', 'kameSmall', 'scatterWave', 'kienzan', 'sokidan', 'tienWave', 'shishinFist', 'kikouhou', 'shishinKikouhou', 'dodonpa', 'psychic', 'vegetaBlast', 'galickGun', 'kameKamehameha', 'bankoku', 'maxKamehameha']) {
  const film0 = Duel.prototype[name];
  if (!film0) continue;
  Duel.prototype[name] = function* film(...a) {
    const cfg = cfgOf(this), z1 = z1Film(this);
    if (cfg && this.st) return yield* this[cfg.film](...(cfg.a || []));
    if (z1) return yield* this[z1]();
    return yield* film0.apply(this, a);
  };
}

// ---------- the enemies of the Z2 switch: 兵士, 邱夷, 多多利亞, 薩博 (1431-1444) ----------
const IMPACT = { 3: [pic('Z2_戦闘_必殺技_衝撃系_青.PNG'), pic('Z3_戦闘_必殺技_衝撃系_青.PNG')] };
EFFECTS[229] = EFFECTS[229] || ((z, rx, ry) => z.front(IMPACT[3][z.era >= 2 ? 1 : 0], 0, 116, 30, 116, rx - z.eff * RAY_SPEED, ry));
EFFECTS[230] = EFFECTS[230] || ((z, rx, ry) => z.front(IMPACT[3][z.era >= 2 ? 1 : 0], 0, 116, 30, 116, 640 - z.eff * RAY_SPEED, ry));
const auraSheet = (z) => (S[`気を溜める3${{ 3: '(青)', 4: '(赤)', 1: '(緑)' }[z.color] || ''}`] || S['気を溜める3'])[z.era >= 2 ? 1 : 0];
BACKS[101] = BACKS[101] || ((z, x, y) => { z.back(auraSheet(z), z.bt * 184, 0, 184, 240, x, y); z.bstep(4, 2); });
// the shared table's 231-234 / back 9 are the Z3 pictures (for the enemies from 101 on); these go by $btl_top_file_name like the original's
const eraOf = (z) => (z.era >= 2 ? 1 : 0);
const midOf = (z) => S[z.color === 4 ? 'エネルギー波_中_敵_赤' : 'エネルギー波_中_敵_青'][eraOf(z)];
EFFECTS[1231] = (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(SCATTER_BLUE[eraOf(z)], 346 - n, 112, 54 + n, 112, rx - n, ry); };
EFFECTS[1232] = (z) => z.front(SCATTER_BLUE[eraOf(z)], 0, 0, 400, 112, 640 - z.eff * RAY_SPEED, 122);
EFFECTS[1233] = (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(midOf(z), 346 - n, 0, 54 + n, 80, rx - n, ry); };
EFFECTS[1234] = (z, rx, ry) => z.front(midOf(z), 0, 80, 400, 80, 640 - z.eff * RAY_SPEED, ry);
BACKS[1009] = (z) => {
  const sheet = S['背景_気功砲系'][eraOf(z)], k = z.bt * 360;
  if ((z.d.G.sheets.size || 96) > 96) { z.back(sheet, 0, k, 142, 356, -20, 0); z.back(sheet, 242, k, 142, 356, 322, 0); } else z.back(sheet, 0, k, 384, 356, 90, 0);
  z.bstep(4, 2);
};
BACKS[105] = BACKS[105] || ((z, x, y) => { z.back(AURA2_BLUE[z.era >= 2 ? 1 : 0], z.bt * 152, 0, 152, 192, x, y); z.bstep(4, 2); });
BACKS[102] = BACKS[102] || ((z, x, y) => { z.back((S[`気を溜める4${{ 3: '(青)' }[z.color] || ''}`] || S['気を溜める4'])[z.era >= 2 ? 1 : 0], z.bt * 224, 0, 224, 288, x, y - 36); z.bstep(4, 2); });
const foePics = () => [...S['気を溜める3'], ...S['気を溜める3(青)'], ...S['気を溜める3(赤)'], ...S['気を溜める4'], ...S['気を溜める4(青)'], ...S['エネルギー波_小_敵_青'], ...S['エネルギー波_中_敵_青'], ...S['エネルギー波_中_敵_赤'], ...SCATTER_BLUE, ...IMPACT[3], ...AURA2_BLUE, ...S['背景_気功砲系']];
// their own 31 / 32: src/anime_foes_common.js only runs them for the enemies from 101 on
const FOES = { 331: 'zaeWave', 332: 'zaeWave', 333: 'zaeWave', 334: 'zaeWave', 337: 'zaeWave', 340: 'zaeWave', 343: 'zaeWave',
  335: 'zaeBlast', 339: 'zaeBlast', 342: 'zaeBlast', 336: 'zaeChain', 338: 'zaeMouth', 341: 'zaeStrong', 344: 'zaeStrong', 357: 'zaeTimeStop' };
const FOE_NO_CUT = new Set([331, 332, 333, 334, 337, 340, 343]), FOE_AGAIN = new Set([335, 339, 342]);
addMoves(FOES);
const isFoe = (d) => d.constructor === Duel && !d.p && !!FOES[d.skill];
const swoopF = Duel.prototype.swoopIn, launchF = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    if (!isFoe(this)) return yield* swoopF.call(this);
    [...FE_IMAGES, ...foePics()].forEach((p) => img(p));
    const z = this.feStage();
    z.cutFlag = !FOE_NO_CUT.has(this.skill);
    z.again = FOE_AGAIN.has(this.skill) && performance.now() - (ended[this.skill] || -1e9) < AGAIN_MS;
    this.finished.then(() => { ended[this.skill] = performance.now(); });
    if (z.again) { // (@all_attack_count >= 2)
      this.back.y = BACK_Y + 79 * 4;
      z.cut = true; z.mirror = true;
      return;
    }
    yield* swoopF.call(this);
  },
  * launch() {
    if (!isFoe(this)) return yield* launchF.call(this);
    const z = this.fe;
    if (z.again) return;
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      if (f >= 30) { if (z.cutFlag) z.cut = true; z.tec = true; }
      this.back.y += 4;
      yield;
    }
  },
});
const charge = (z) => (z.era >= 2 ? [201, 'Z3 変身'] : [101, 'Z2 気を溜める']);
Object.assign(Duel.prototype, {
  * zaeWave() { // 1431 (敵汎用) / 1437 / 1440 / 1443 エネルギー波: the small beam from the hand
    const z = this.feStage(), id = z.id, k = this.skill;
    let [rx, ry] = id >= 37 && id <= 39 || id === 62 ? [312, 142] : id === 63 ? [308, 144] : id === 64 ? [316, 142] : [328, 148];
    if (k === 337) [rx, ry] = [324, 154]; else if (k === 340) [rx, ry] = [328, 148]; else if (k === 343) [rx, ry] = [328, 142];
    for (let f = 0; f < 76; f++) {
      if (f === 0) { z.se('Z1 怪光線'); z.pose(1); z.color = k === 337 ? 4 : 3; } else if (f <= 40) z.efp = 227;
      else if (f === 41) z.fxReset();
      else if (f === 45) z.displayOut();
      else if (f >= 46) z.efp = 228;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(23);
  },
  * zaeBlast() { // 1435 邱夷 / 1439 多多利亞 / 1442 薩博 爆発波: charge, the shock beam
    const z = this.feStage(), k = this.skill, [no, se] = charge(z);
    if (z.again) {
      z.se('Z1 ザー');
      z.displayOut();
      z.color = 3;
      for (let f = 0; f <= 25; f++) { z.efp = 230; yield* z.out(270, 96); }
      return yield* z.damage(23);
    }
    const [bx, by2] = k === 335 ? (z.era >= 2 ? [256, 86] : [240, 32]) : k === 339 ? (z.era >= 2 ? [248, 86] : [232, 36]) : [233, 36];
    const dodoria = k === 339 && z.era < 2;
    const num = k === 342 ? 101 : no;
    for (let f = 0; f < 218; f++) {
      if (f === 0) { z.se(k === 342 ? 'Z2 気を溜める' : se); z.pose(0); z.color = dodoria ? 4 : 3; } else if (f === 90) { z.seStop(); z.pose(0); z.backPattern(num, bx, by2); } else if (f <= 140) z.backPattern(num, bx, by2);
      else if (f === 141) { z.seStop(); z.se('Z1 ザー'); z.pose(2); z.efp = 229; if (k === 339) z.color = 4; } else if (f === 180) { z.pose(2); z.fxReset(); } else if (f === 190) z.displayOut();
      else if (f >= 191) z.efp = 230;
      yield* z.out(270, 96);
    }
    return yield* z.damage(23);
  },
  * zaeChain() { // 1436 (邱夷系)連続エネルギー波
    const z = this.feStage(), [no, se] = charge(z), [bx, by2] = z.era >= 2 ? [256, 86] : [240, 32];
    for (let f = 0; f < 197; f++) {
      if (f === 0) { z.se(se); z.color = 3; } else if (f <= 89) z.backPattern(no, bx, by2);
      else if (f === 90) { z.seStop(); z.pose(3); } else if (f === 100) z.pose(4);
      else if (f === 110) z.pose(1);
      else if (f === 120) { z.seStop(); z.se('Z1 エネルギー波'); z.efp = 1231; } else if (f === 159) z.fxReset();
      else if (f === 169) z.displayOut();
      else if (f >= 170) z.efp = 1232;
      yield* z.out(224, 110);
    }
    return yield* z.damage(23);
  },
  * zaeMouth() { // 1438 (多多利亞系)口から怪光線
    const z = this.feStage(), [no, se] = charge(z), [bx, by2] = z.era >= 2 ? [248, 86] : [232, 36];
    for (let f = 0; f < 187; f++) {
      if (f === 0) { z.se(se); z.color = z.era >= 2 ? 3 : 4; } else if (f <= 89) z.backPattern(no, bx, by2);
      else if (f === 90) { z.seStop(); z.pose(3); } else if (f === 110) { z.seStop(); z.se('Z1 エネルギー波2'); z.efp = 1233; z.color = 4; } else if (f === 149) z.fxReset();
      else if (f === 159) z.displayOut();
      else if (f >= 160) z.efp = 1234;
      yield* z.out(238, 128);
    }
    return yield* z.damage(23);
  },
  * zaeTimeStop() { // 1457 (古爾多)タイムストップ: he strains, the column on the member; damage 25
    const z = this.feStage();
    for (let f = 0; f < 147; f++) {
      if (f === 0) { z.se('Z2 気を溜める'); z.pose(2); z.color = 3; } else if (f <= 108) z.backPattern(105, 260, 60);
      else if (f === 109) { z.seStop(); z.fxReset(); } else if (f === 119) { z.displayOut(); z.tec = false; z.cutFlag = false; } else if (f >= 120) z.backPattern(1009);
      yield* z.out(325, 138);
    }
    return yield* z.damage(25);
  },
  * zaeStrong() { // 1441 / 1444 (薩博系)スーパーエネルギー波
    const z = this.feStage(), second = this.skill === 344, [no, se] = charge(z);
    const [bno, bx, by2, rx, ry, p0, p1] = second ? (z.era >= 2 ? [no, 250, 86, 214, 116, 3, 4] : [102, 216, 36, 214, 116, 3, 4]) : [101, 233, 36, 232, 122, null, 1];
    for (let f = 0; f < 187; f++) {
      if (f === 0) { z.se(second ? se : 'Z2 気を溜める'); z.color = 3; if (p0 != null) z.pose(p0); } else if (f <= 89) z.backPattern(bno, bx, by2);
      else if (f === 90) { z.seStop(); z.pose(p1); } else if (f === 110) { z.seStop(); z.se('Z1 エネルギー波2'); z.efp = 1233; } else if (f === 149) z.fxReset();
      else if (f === 159) z.displayOut();
      else if (f >= 160) z.efp = 1234;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(23);
  },
});
export const Z2B_SOUNDS = ['Z3 エネルギー波', 'Z1 怪光線', 'Z1 気を溜める', 'Z3 変身', 'Z2 気を溜める', 'Z1 高速移動', 'Z1 逃げる', 'Z1 エネルギー波2', 'Z2 気を溜める_元気弾', 'Z1 エネルギー波', 'Z1 エネルギー波3',
  'Z1 ザー', 'Z1 気円斬', 'Z1 分身', 'Z1 気を溜める3', 'Z1 気を溜める7', 'Z1 飛ぶ', 'ZG 打撃2', 'ZG 打撃4', 'Z1 強打', 'DB3 エネルギー波1', 'Z1 必殺技'];
