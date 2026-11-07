// 比克 and 貝吉塔's Z3 special moves, ported frame by frame from the classic version's Scene_Db_Battle_Anime
// (102_Scene_Db_Battle_Anime.rb, docs/anim-ab-plan.md anpv). All of them are learned in Z3 or later, so they are the
// original's $btl_progress 2 films (the Z3 block of the attack patterns, all.rb 59742):
//   32 爆裂波 → attack 42 → 2132 (all.rb 92614): the blue aura, the burst over the demon backdrop, the shock behind the
//      enemy; it hits every enemy and the ones after the first get only the shock (@all_attack_count >= 2)
//   39 激烈光弾 → 49 → 2139 (92753), damage 42 / 40 魔空包囲弾 → 50 → 2140 (92829), damage 42
//   41 フルパワー魔貫光殺砲 → 51: the original has no attack 51 in any era (and the move is the ひらめき of 魔貫光殺砲 that
//      needs 99999 uses, _tecspark.rvdata), so it plays the Z3 魔貫光殺砲 2136 (92693), damage 41
//   122 複数エネルギー波 → 132: no attack 132 either (and no event teaches it), so it plays 貝吉塔's Z3 エネルギー波 1221
//      (79974, attack 131), damage 23
//   125 ビッグバンアタック → 135 → 2225 (95111), damage 41 / 130 ファイナルフラッシュ → 140 → 2230 (95213), damage 42
// Every Z3 move also has, from frame 30 of 必殺技! (anime 32, all.rb 72525), the scrolling strips of output_back
// (@tec_output_back, all.rb 67937: 戦闘_必殺技_背景_上 / 下, red with @tec_back_color 1, thinner by a giant) and the
// cut-in bar of output_cutin (67657: the attacker's 味方カットイン row, or the enemy's 敵カットイン row once the film cuts
// to it) — the Z1 films (src/anime.js) have neither. Positions are written for the party attacking (the only side
// that has these moves); an enemy using one gets the same film mirrored.
// Frame numbers in the comments are the original's @battle_anime_frame of the pattern.
import { audio, img, rand } from './core.js?v=20261107-2255';
import { registerZ3, party, heal } from './z3.js?v=20261107-2255';
import { applyLevel } from './party.js?v=20261107-2255';
import { addMoves, ANIME_IMAGES, Duel, draw, filmCut, SW, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED, BACK_Y } from './anime.js?v=20261107-2255';

addMoves({ 32: 'pvBakuretsuha', 39: 'pvGekiretsu', 40: 'pvMakuHoidan', 41: 'pvMakankoFull', // 比克
  122: 'pvVegetaWave', 125: 'pvBigBang', 130: 'pvFinalFlash' }); // 貝吉塔 / 超貝吉塔

const pic = (n) => `Graphics/Pictures/${n}`;
const CUT_ME = pic('Z3_味方カットイン.PNG'), CUT_FOE = { 2: pic('Z2_敵カットイン.PNG'), 3: pic('Z3_敵カットイン.PNG') };
const STRIP = { top: pic('Z3_戦闘_必殺技_背景_上.png'), topRed: pic('Z3_戦闘_必殺技_背景_上(赤).png'),
  bottom: pic('Z3_戦闘_必殺技_背景_下(加工).PNG'), bottomRed: pic('Z3_戦闘_必殺技_背景_下(加工)(赤).PNG'),
  ur: pic('Z3_戦闘_必殺技_背景_右上.PNG'), urRed: pic('Z3_戦闘_必殺技_背景_右上(赤).PNG'),
  ll: pic('Z3_戦闘_必殺技_背景_左下.PNG'), llRed: pic('Z3_戦闘_必殺技_背景_左下(赤).PNG'), ff: pic('ZG_戦闘_必殺技_背景(赤).png') };
const AURA = { green: pic('Z3_戦闘_必殺技_気を溜める(緑).png'), blue: pic('Z3_戦闘_必殺技_気を溜める(青).png') }; // back 201
const DEMON_V = pic('Z3_戦闘_必殺技_背景_魔族系(縦).png'), SHOCK = pic('Z3_戦闘_必殺技_背景_衝撃波系.png'); // back 2 / 1
const BAKURETSU = pic('FC風_GBZ1 戦闘_ピッコロ_爆裂波2.png');
const MKK_CUT = pic('Z3_必殺技_カットイン_魔貫光殺砲(ピッコロ).png'), MKK_POSE = pic('Z3_必殺技_魔貫光殺砲(ピッコロ).png');
const MKK_FIRE = pic('Z3_戦闘_必殺技_魔貫光殺砲(発動).PNG'), MKK_RAY = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // effects 254 / 255
const GEKIRETSU = pic('Z3_必殺技_激烈光弾(ピッコロ).png');
const BLINK = { green: pic('Z3_必殺技_超カメハメ波(球点滅)(緑).png'), blue: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png') }; // effect 235
const GENKI_GREEN = pic('Z3_必殺技_元気玉(球点滅中)(緑).PNG'); // effect 252
const HALF = { green: pic('Z3_戦闘_必殺技_エネルギー波_半円(緑).PNG'), blue: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG') }; // 256 / 265
const BALL_GREEN = pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG'); // effect 201
const HOIDAN = pic('ZG_戦闘_必殺技_魔空包囲弾.PNG');
const BIGBANG = { ss: pic('Z3_必殺技_ビッグバンアタック(超ベジータ).PNG'), base: pic('Z3_必殺技_ビッグバンアタック(ベジータ).PNG') };
const BIGBANG_FIRE = pic('Z3_必殺技_ビッグバンアタック発動(青).PNG'), BALL4_BLUE = pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'); // 264 / 266
const FF = { charge: pic('ZG_必殺技_ファイナルフラッシュ(溜め)_ベジータ.PNG'), ki: pic('ZG_必殺技_ファイナルフラッシュ(溜め)_ベジータ(気).PNG'),
  ball: pic('ZG_戦闘_必殺技_ファイナルフラッシュ弾.PNG'), fire: pic('ZG_必殺技_ファイナルフラッシュ(発動)_ベジータ.PNG'),
  half: pic('ZG_戦闘_必殺技_エネルギー波_半円(青).PNG') };
const SMALL_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG'); // effects 225 / 226
const BOOM_MID = pic('戦闘アニメ_爆発3.PNG'), BOOM_LARGE = pic('戦闘アニメ_爆発4.PNG'); // effects 102 / 103
export const PV_PICTURES = [CUT_ME, ...Object.values(CUT_FOE), ...Object.values(STRIP), ...Object.values(AURA), DEMON_V, SHOCK, BAKURETSU,
  MKK_CUT, MKK_POSE, MKK_FIRE, MKK_RAY, GEKIRETSU, ...Object.values(BLINK), GENKI_GREEN, ...Object.values(HALF), BALL_GREEN, HOIDAN,
  ...Object.values(BIGBANG), BIGBANG_FIRE, BALL4_BLUE, ...Object.values(FF), SMALL_BLUE, BOOM_MID, BOOM_LARGE];
ANIME_IMAGES.push(...PV_PICTURES); // (loaded with the battle pictures, as src/combo-anime.js does)

// each move: the strip from 必殺技! on (no / red; launch: false = the dispatch turns it off again, as 46 does) and
// whether the attacker's cut-in comes on (@chr_cutin_flag)
const MOVES = {
  32: { strip: 0, red: false, cutin: true }, 39: { strip: 0, red: true, cutin: true }, 40: { strip: 0, red: true, cutin: true },
  41: { strip: 3, red: true, cutin: true, launch: false }, 122: { strip: 0, red: false, cutin: false },
  125: { strip: 0, red: true, cutin: true }, 130: { strip: 0, red: true, cutin: true },
};
const BAKURETSUHA = 32;
let bakuretsuEnd = -1e9; // 爆裂波 hits every enemy: a film started right after the last one is a further target

// who is fighting: the battle's current pair (src/battle.js this.duel), or the attacker guessed from the move
function fighters(d) {
  const g = typeof window !== 'undefined' && window.__game, b = g && g.scene;
  if (b && b.anim === d && b.duel) return { actor: b.duel.m.id, foe: Number(b.duel.f.id) };
  const sheet = String(d.A.sheets.special || '');
  return { actor: [32, 39, 40, 41].includes(d.skill) ? 4 : sheet.includes('(超)') ? 19 : 12, foe: 0 };
}

// ---------- the Z3 stage: what output_back, the pattern's own blits and output_cutin draw around the fighters ----------
function stage(d) {
  const cfg = MOVES[d.skill], who = fighters(d);
  const st = { strip: null, cut: null, under: [], over: [], e: null, ex: 0, ey: 0, dx: 0, dy: 0, bt: 0, bf: 0, rt: 0, rf: 0, ef: 0, who,
    small: (d.R.sheets.size || 96) > 96 || (d.L.sheets.size || 96) > 96, mirror: !d.p };
  const flip = (c, f) => { if (!st.mirror) return f(); c.save(); c.translate(SW, 0); c.scale(-1, 1); f(); c.restore(); };
  const items = (c, list) => flip(c, () => {
    for (const it of list) {
      if (it === 'white') { c.fillStyle = '#fff'; c.fillRect(0, 0, SW, 378); } else draw(c, ...it);
    }
  });
  d.behind((c, t) => {
    if (st.strip) flip(c, () => strip(c, st, t, cfg.red));
    items(c, st.under);
    cutIn(c, st);
  });
  d.effect((c) => items(c, st.over));
  return st;
}
// output_back, $btl_progress 2: no 0 the strips above and below (8 px a frame, the bottom one 加工), no 3 the corner
// bursts (三 frames, the next every frame), no 5 ファイナルフラッシュ's three thin red rows (ZG)
function strip(c, st, t, red) {
  const tile = (sheet, w, h, y, step = 8) => { const x0 = -((t * step) % w); for (let x = x0 - w; x < SW + w; x += w) draw(c, sheet, 0, 0, w, h, x, y); };
  const no = st.strip.no;
  if (no === 0) {
    tile(red ? STRIP.topRed : STRIP.top, 648, st.small ? 64 : 110, 0);
    if (st.small) tile(red ? STRIP.bottomRed : STRIP.bottom, 648, 60, 296);
    else tile(red ? STRIP.bottomRed : STRIP.bottom, 648, 114, 242);
  } else if (no === 3) {
    const k = t % 3;
    draw(c, red ? STRIP.urRed : STRIP.ur, k * 238, 0, 238, 238, SW - 238, 0);
    draw(c, red ? STRIP.llRed : STRIP.ll, k * 222, 0, 222, 222, 0, 480 - 222 - 124);
  } else if (no === 5) {
    tile(STRIP.ff, 672, 46, 0);
    tile(STRIP.ff, 672, 46, 128 + 46);
    tile(STRIP.ff, 672, 42, 128 + 188);
  }
}
// output_cutin: the attacker's row of Z3_味方カットイン (actor − 3), or once the film is on the enemy (mirror) its row of
// 敵カットイン (Z2 enemies 31-100, Z3 101 on; a Z1 enemy has none), 640×64 at y 292
function cutIn(c, st) {
  if (!st.cut) return;
  filmCut.on = st.cut === 'me' || st.who.foe >= 31;
  if (st.cut === 'me') { draw(c, CUT_ME, 0, 64 * (st.who.actor - 3), 640, 64, 0, 292); return; }
  const id = st.who.foe;
  if (id >= 101) draw(c, CUT_FOE[3], 0, 64 * (id - 101), 640, 64, 0, 292);
  else if (id >= 31) draw(c, CUT_FOE[2], 0, 64 * (id - 31), 640, 64, 0, 292);
}

// the original's counters: back_anime_pattern advances @back_anime_type every `every` frames (then +1 frame),
// effect_pattern @ray_anime_type the same way and @effect_anime_frame (beam positions) every call
function back(st, every, n) {
  const k = st.bt;
  if (st.bf >= every) { st.bt = (st.bt + 1) % n; st.bf = 0; }
  st.bf++;
  return k;
}
function ray(st, every, n, hold = false) {
  const k = st.rt;
  if (st.rf >= every) { st.rt = hold ? Math.min(st.rt + 1, n - 1) : (st.rt + 1) % n; st.rf = 0; }
  return k;
}
// effect_pattern n at (x, y) for this frame (into st.over); afterwards @ray_anime_frame and @effect_anime_frame + 1
function effect(st, n, x, y) {
  const f = st.ef, o = st.over;
  if (n === 235) { const k = ray(st, 4, 5); o.push([st.blink, 32 * k, 0, 32, 32, x, y]); } // スーパーカメハメ波ため
  else if (n === 252) { const k = ray(st, 4, 4); o.push([GENKI_GREEN, 64 * k, 0, 64, 64, x, y]); } // 元気玉ため
  else if (n === 254) { const k = ray(st, 2, 2); o.push([MKK_FIRE, 166 * k, 0, 166, 176, x, y]); } // まかんこうさっぽう発動
  else if (n === 255) o.push([MKK_RAY, 0, 0, 400, 64, -400 + f * RAY_SPEED, y]); // Z3まかんこうさっぽう(ヒット)
  else if (n === 256) { if (f > 0) o.push([st.half, 0, 0, f * RAY_SPEED, 128, x, y]); } // Z3エネルギー波半円発動
  else if (n === 265) o.push([st.half, 0, 128, 700, 128, -700 + f * RAY_SPEED, y]); // Z3エネルギー波半円ヒット
  else if (n === 266) o.push([BALL4_BLUE, 0, 0, 190, 126, -162 + f * RAY_SPEED, y]); // Z3エネルギー弾ヒット
  else if (n === 201) o.push([BALL_GREEN, 2 * 128, 0, 128, 128, x + f * (RAY_SPEED + 6), y]); // エネルギー弾系(発動), @ray_spd_up_flag
  else if (n === 264) { const k = ray(st, 4, 2); o.push([BIGBANG_FIRE, 302 * k, 0, 302, 200, x, y]); } // ビッグバンアタック
  else if (n === 278) { const k = ray(st, 4, 5, true); o.push([FF.ball, 32 * k, 0, 32, 32, x, y]); } // ファイナルフラッシュため
  else if (n === 225) o.push([SMALL_BLUE, 0, 48, 54 + f * RAY_SPEED, 48, x, y]); // エネルギー波_小系(発動)
  else if (n === 226) o.push([SMALL_BLUE, 0, 0, 400, 48, -400 + f * RAY_SPEED, 148]); // エネルギー波_小系(ヒット)
  st.rf++;
  st.ef++;
}

Object.assign(Duel.prototype, {
  // frames a..b of a pattern: body(f) draws and moves (it may set st.e = effect number and st.ex / st.ey for this
  // frame: ray_x / ray_y start from the pattern's defaults every frame), then the effect, then the frame is shown
  * pvFrames(st, a, b, body) {
    for (let f = a; f <= b; f++) {
      st.under = []; st.over = []; st.ex = st.dx; st.ey = st.dy;
      if (body) body(f);
      if (st.e) effect(st, st.e, st.ex, st.ey);
      yield;
    }
  },
  // the original's per-pattern reset (anime_pattern_fromat): the counters back to 0, no effect
  pvFormat(st) { st.bt = st.bf = st.rt = st.rf = st.ef = 0; st.e = null; },
  // back 201 気を溜める(Z3): two frames of 136×142, the next every 17 calls
  pvAura(st, color, x = 228, y = 88) { st.under.push([AURA[color], back(st, 16, 2) * 136, 0, 136, 142, x, y]); },
  pvDemon(st) { st.under.push([DEMON_V, 0, back(st, 4, 3) * 480, 640, 356, 0, 0]); }, // back 2 必殺技発動時縦
  pvShock(st) { st.under.push([SHOCK, 0, back(st, 4, 3) * 180, 640, 180, 0, 80]); }, // back 1 衝撃波系横
  // set_chr_display_out: the attacker leaves, the defender stands in the middle; with the cut-in on it shows the enemy's
  pvOut(st) {
    this.A.y = -200;
    this.G.x = this.p ? CENTER_ENEX : CENTER_CHAX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    if (st.cut) st.cut = 'foe';
  },

  // 必殺技! (anime 32) with the Z3 flags: from frame 30 the strips and the cut-in
  * pvLaunch() {
    const cfg = MOVES[this.skill], st = this.pv = stage(this);
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      this.back.y += 4;
      if (f >= 30) {
        if (cfg.cutin) st.cut = 'me';
        if (cfg.launch !== false) st.strip = { no: 0 };
      }
      yield;
    }
    st.strip = cfg.launch === false ? null : { no: 0 };
    st.cfgNo = cfg.strip;
  },

  // the damage films these end with: 41 爆発系ZD中 (ZG 光線系ヒット2, effect 102 爆発3) / 42 爆発系ZD大 (光線系ヒット3, 103 爆発4)
  * pvBoom(large) {
    if (!this.hit) { yield* this.dodge(); return; }
    this.se(large ? 'ZG 光線系ヒット3' : 'ZG 光線系ヒット2');
    this.showHit();
    this.pose(this.G, 17);
    const [sheet, w, h, x] = large ? [BOOM_LARGE, 176, 144, this.p ? 298 : 204] : [BOOM_MID, 112, 120, this.p ? 318 : 230];
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, sheet, k * w, 0, w, h, x, 120); });
    for (let f = 1; f < 60; f++) {
      if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (f === 40) this.effect(null);
      yield;
    }
  },

  // ---- 比克 ----
  * pvBakuretsuha() { // 2132 爆裂波(ピッコロ), @ray_color 3: the blue aura, the burst over the demon backdrop, the shock
    const st = this.pv;
    this.pvFormat(st);
    this.se('Z3 変身');
    yield;
    yield* this.pvFrames(st, 1, 89, () => this.pvAura(st, 'blue'));
    yield* this.pvFrames(st, 90, 180, (f) => {
      if (f === 90) { audio.seStop(); this.se('Z1 エネルギー波'); this.A.y = -120; st.strip = null; }
      this.pvDemon(st);
      st.under.push([BAKURETSU, 0, 0, 160, 292, 248, -32]);
    });
    this.pvOut(st); this.A.y = -120; st.cut = 'me'; // 181 (the enemy's cut-in from 182)
    yield* this.pvFrames(st, 181, 181);
    yield* this.pvFrames(st, 182, 242, () => { st.cut = 'foe'; this.pvShock(st); });
    st.under = [];
  },
  * pvBakuretsuhaAgain() { // 2132, @all_attack_count >= 2: only the shock behind each further enemy
    const st = this.pv = stage(this);
    st.small = true; // (the dispatch's @tec_back_small, but the strips stay off)
    this.se('Z1 ザー');
    this.pvOut(st);
    st.cut = 'foe';
    yield;
    yield* this.pvFrames(st, 1, 61, () => this.pvShock(st));
    st.under = [];
  },

  * pvGekiretsu() { // 2139 激烈光弾: the green aura, his close-up, the blinking ball, the half-circle wave
    const st = this.pv;
    this.pvFormat(st);
    st.dx = 350; st.dy = 114; st.blink = BLINK.green; st.half = HALF.green;
    this.se('Z3 変身');
    this.pose(this.A, 13, true);
    yield;
    yield* this.pvFrames(st, 1, 89, () => this.pvAura(st, 'green'));
    yield* this.pvFrames(st, 90, 250, (f) => {
      st.under.push([GEKIRETSU, 0, 0, 218, 230, 190, 66]);
      if (f === 90) { this.A.y = -160; st.small = true; audio.seStop(); }
      if (f >= 180) {
        st.e = 252; st.ex = 322 - 16; st.ey = 164 - 16;
        if (f === 180) st.rt = 0;
      } else if (f >= 120) {
        st.e = 235; st.ex = 322; st.ey = 164;
        if (f === 120) this.se('Z1 気を溜める2');
      }
    });
    yield* this.pvFrames(st, 251, 288, (f) => {
      if (f === 251) {
        audio.seStop();
        st.small = false;
        st.ef = 0;
        this.se('Z1 エネルギー波2');
        this.pose(this.A, 14, true);
        st.e = 256;
        this.A.y = STD_Y;
        this.pvAura(st, 'green');
      }
      if (f === 279) { st.e = null; st.ef = 0; }
    });
    this.pvOut(st); // 289
    yield* this.pvFrames(st, 289, 289);
    st.ef = 0;
    st.e = 265; st.dy = 114;
    yield* this.pvFrames(st, 290, 316);
    st.e = null; st.over = [];
    yield* this.pvBoom(true);
    return 'none';
  },

  * pvMakuHoidan() { // 2140 魔空包囲弾: eight balls fired off, then they close in round the enemy from every side
    const st = this.pv;
    this.pvFormat(st);
    st.dx = 340; st.dy = 96;
    this.se('Z3 変身');
    this.pose(this.A, 0, true);
    yield;
    yield* this.pvFrames(st, 1, 89, () => this.pvAura(st, 'green'));
    // 90-330: four poses, two balls each, twice (each ball: the sound, effect 201 from (320, y), 15 frames)
    const SHOTS = [[121, 9, 80], [136, null, 104], [181, 11, 140], [196, null, 116]];
    yield* this.pvFrames(st, 90, 359, (f) => {
      if (f === 90 || f === 211) { audio.seStop(); this.pose(this.A, 8, true); }
      if (f === 151 || f === 271) this.pose(this.A, 10, true);
      const g = f >= 241 ? f - 120 : f;
      for (const [s, pose, y] of SHOTS) {
        if (g >= s && g <= s + 14 && (f <= 210 || f >= 241)) {
          if (g === s) { this.se('ZG エネルギー弾1'); st.ef = 0; if (pose) this.pose(this.A, pose, true); }
          st.e = 201; st.ex = 320; st.ey = y;
        }
      }
    });
    st.e = null; st.ef = 0; // 360
    this.pvOut(st);
    st.small = true; st.strip = null; st.cut = null;
    yield* this.pvFrames(st, 360, 400);
    // 401-671: the balls (ZG_戦闘_必殺技_魔空包囲弾, 32×32) come in from eight directions at 8 px a frame for 28 frames,
    // tremble from 571, then all close on the enemy from 660 (drawn behind him, on the back window)
    const START = { 401: [220, 90], 421: [360, 280], 438: [472, 90], 460: [190, 164], 482: [520, 170], 500: [224, 260],
      518: [360, 60], 540: [470, 274] };
    const DIR = [[8, -8], [0, 8], [-8, -8], [8, 0], [-8, 0], [8, 8], [0, -8], [-8, 8]];
    const balls = []; // { cx, cy, f, sx, sy } (@genkityuushin, @genkitama_kanri_frame / _x / _y)
    const div = (a, b) => Math.floor(a / b); // (Ruby's integer division)
    yield* this.pvFrames(st, 401, 671, (f) => {
      balls.forEach((b, i) => {
        const [dx, dy] = DIR[i];
        if (f > 570 && f < 660) {
          if (f === 571 && i === 0) this.se('Z1 怪しい気');
          if (f % 2 === 0) { // the tremble: y goes 0 → ±2 → ±4 → ±2 → 0 → ∓2 …
            if (b.sx === 0) { if (rand(2) === 1) { b.sy = 2; b.sx = 1; } else { b.sy = -2; b.sx = -1; } }
            else if (b.sy === 0) b.sy = b.sx === 1 ? 2 : -2;
            else if (b.sy === 2) { if (b.sx === 1) b.sy = 4; else b.sy = 0; }
            else if (b.sy === 4) { b.sy = 2; b.sx = -b.sx; }
            else if (b.sy === -2) { if (b.sx === 1) b.sy = 0; else b.sy = -4; }
            else if (b.sy === -4) { b.sy = -2; b.sx = -b.sx; }
          }
        }
        const x = b.cx - dx * 28 + b.f * dx, top = b.cy + dy * 28 - b.f * dy, y = top + b.sy;
        if (top < 356) {
          const h = Math.min(32, 356 - top);
          if (f < 660) st.under.push([HOIDAN, 0, 0, 32, h, x, y]);
          else st.under.push([HOIDAN, 0, 0, 32, h, x + div(CENTER_ENEX + 48 - x, 16) * (f - 660), y + div(STD_Y + 48 - y, 16) * (f - 660)]);
        }
        if (b.f < 28) b.f++;
      });
      if (START[f]) { this.se('ZG 打撃2'); balls.push({ cx: START[f][0], cy: START[f][1], f: 1, sx: 0, sy: 0 }); }
    });
    st.under = [];
    yield* this.pvBoom(true);
    return 'none';
  },

  * pvMakankoFull() { // 2136 魔貫光殺砲 (Z3): the shaking cut-in and the flash, his pose, the drill beam
    const st = this.pv;
    this.pvFormat(st);
    st.dx = 640 - 246 - 16; st.dy = 180;
    this.se('Z1 気を溜める3');
    this.A.y = -160;
    st.cut = null; // (@chr_cutin_flag = false)
    yield;
    yield* this.pvFrames(st, 1, 130, (f) => {
      const k = rand(9); // pic_shake_cal 4: one of the eight directions or none
      const sx = [-4, 0, 4, -4, 0, 4, -4, 0, 4][k], sy = [4, 4, 4, 0, 0, 0, -4, -4, -4][k];
      if (f >= 116) st.under.push('white');
      st.under.push([MKK_CUT, 0, 0, 648, 64, -4 + sx, 146 + sy]);
      if (f >= 118) st.under.push('white');
      if (f === 130) { audio.seStop(); st.strip = { no: 3 }; }
    });
    yield* this.pvFrames(st, 131, 260, (f) => {
      st.under.push([MKK_POSE, 0, 0, 124, 172, 260, 80]);
      if (f === 160) { this.se('Z1 エネルギー波3'); st.e = 254; }
    });
    this.se('Z1 衝撃波'); // 261
    st.e = null; st.ef = 0;
    st.cut = 'me';
    this.pvOut(st);
    st.strip = { no: 0 };
    yield* this.pvFrames(st, 261, 261);
    st.e = 255; st.dy = 134;
    yield* this.pvFrames(st, 262, 287);
    st.e = null; st.over = [];
    yield* this.pvBoom(false);
    return 'none';
  },

  // ---- 貝吉塔 ----
  * pvVegetaWave() { // 1221 (ベジータ)エネルギー波 (Z3), @ray_color 3: the small blue wave grows from his hand
    const st = this.pv;
    this.pvFormat(st);
    this.se('Z1 怪光線');
    this.pose(this.A, 1, true);
    yield;
    st.e = 225; st.dx = 352; st.dy = 134;
    yield* this.pvFrames(st, 1, 40);
    st.e = null; st.ef = 0;
    yield* this.pvFrames(st, 41, 44);
    this.pvOut(st); // 45
    yield* this.pvFrames(st, 45, 45);
    st.e = 226;
    yield* this.pvFrames(st, 46, 72);
    st.e = null; st.over = [];
  },

  * pvBigBang() { // 2225 ビッグバンアタック: the blue aura, his close-up (the Super Saiyan's own), the blinking ball, the blast
    const st = this.pv, ss = st.who.actor === 19;
    this.pvFormat(st);
    st.dx = 338; st.dy = 156; st.blink = BLINK.blue; st.half = HALF.blue;
    this.se('Z3 変身');
    this.pose(this.A, 0, true);
    yield;
    yield* this.pvFrames(st, 1, 128, (f) => {
      this.pvAura(st, 'blue');
      if (f === 128) { st.strip = { no: 3 }; st.cut = null; }
    });
    yield* this.pvFrames(st, 129, 300, (f) => {
      if (f === 129) audio.seStop();
      this.A.y = -160;
      let [sheet, x, y, w, h] = ss ? [BIGBANG.ss, 190, 40, 178, 248] : [BIGBANG.base, 270, 100, 110, 208];
      const j = { 231: 2, 232: 2, 233: 2, 234: 4, 235: 2 }[f] || 0; // (as written: 232 / 233 move 2 too)
      x -= j; y -= j;
      st.under.push([sheet, 0, 0, w, h, x, y]);
      if (f >= 140 && f <= 230) {
        if (f === 140) this.se('DB3 気を溜める2');
        [st.ex, st.ey] = ss ? [368, 220] : [344, 180];
        st.e = 235;
      } else if (f === 231) {
        this.se('Z1 エネルギー波'); this.se('Z1 ゴー');
        st.rt = 0; st.rf = 0;
        st.e = 264;
      }
    });
    st.cut = 'me'; // 301
    st.e = null; st.ef = 0;
    st.strip = { no: 0 };
    this.pvOut(st);
    yield* this.pvFrames(st, 301, 310);
    st.e = ss ? 265 : 266; st.dy = 112;
    yield* this.pvFrames(st, 311, 336);
    st.e = null; st.over = [];
    yield* this.pvBoom(false);
    return 'none';
  },

  * pvFinalFlash() { // 2230 ファイナルフラッシュ: the blue aura, the long charge in the ZG close-up, the beam from the right
    const st = this.pv;
    this.pvFormat(st);
    st.dx = 338; st.dy = 156; st.half = HALF.blue;
    this.se('Z3 変身');
    this.pose(this.A, 12, true);
    yield;
    yield* this.pvFrames(st, 1, 128, (f) => {
      this.pvAura(st, 'blue');
      if (f === 128) { st.strip = { no: 5 }; st.cut = null; }
    });
    yield* this.pvFrames(st, 129, 340, (f) => {
      if (f === 129) audio.seStop();
      if (f === 130) this.se('Z1 気を溜める6');
      this.A.y = -160;
      let x = 130;
      if (f > 160) st.under.push([FF.ki, 0, 0, 382, 96, x, 220]);
      if (f >= 140 && f <= 180) x += f % 2 === 1 ? -2 : 2;
      st.under.push([FF.charge, 0, 0, 382, 96, x, 220]);
      if (f >= 180 && f <= 210) { st.e = 278; st.ex = 276 + 24; st.ey = 284 - 16; }
      if (f >= 211) {
        st.e = null;
        st.under.push([FF.ball, 0, 32, 64, 64, 276 + 10, 284 - 32]);
        if (f > 230) {
          if (f === 231) this.se('ZG 光線1');
          const tx = Math.min(500, (f - 231) * 16);
          st.under.push([FF.fire, 0, 0, 204, 128, 640 - tx, 46]);
          st.under.push([FF.half, 0, 0, 700, 128, 640 + 204 - 4 - tx, 46]);
        }
      }
    });
    st.cut = 'me'; // 341
    st.e = null; st.ef = 0;
    st.strip = { no: 0 };
    this.pvOut(st);
    yield* this.pvFrames(st, 341, 350);
    st.e = 265; st.dy = 112;
    yield* this.pvFrames(st, 351, 376);
    st.e = null; st.over = [];
    yield* this.pvBoom(true);
    return 'none';
  },
});

// 必殺技! of these moves is the Z3 one (the strips and cut-in from frame 30); every other move keeps src/anime.js's
const baseLaunch = Duel.prototype.launch;
Duel.prototype.launch = function* launch() {
  if (MOVES[this.skill]) yield* this.pvLaunch();
  else yield* baseLaunch.call(this);
};
// 爆裂波 on the enemies after the first: no swoop-in and no 必殺技!, the ground already gone (as src/anime.js 拡散エネルギー波)
const baseRun = Duel.prototype.run;
Duel.prototype.run = function* run() {
  if (this.skill === BAKURETSUHA && performance.now() - bakuretsuEnd < 500) {
    this.back.y = BACK_Y + 79 * 4;
    yield* this.pvBakuretsuhaAgain();
    audio.seStop();
    if (!this.hit) yield* this.dodge();
    else yield* this.explode(17, 50); // 23
    audio.seStop();
    this.ending = true;
    for (let i = 0; i < 10; i++) { this.fade = (i + 1) / 10; yield; }
  } else yield* baseRun.call(this);
  if (this.skill === BAKURETSUHA) bakuretsuEnd = performance.now();
};

// ?dev=anpv: a Z3 save, 比克・貝吉塔・超貝吉塔 at level 40 with all these moves, against three Z3 enemies (爆裂波 hits
// all three); the films can also be played straight from the console: __game.scene.play(m, f, true, skill, dmg, f)
registerZ3('anpv', {
  dev(game, step) {
    if (step !== 'anpv') return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [4, 12, 19]);
    const MORE = { 4: [32, 39, 40, 41], 12: [122, 125, 133], 19: [122, 125, 130] };
    for (const m of s.party) {
      m.level = 40; m.exp = game.world.actors[m.id].exp[40]; applyLevel(game.world, m); heal(m);
      for (const id of MORE[m.id] || []) if (!m.skills.includes(id)) m.skills.push(id);
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle([116, 113, 119], true, { loseOk: true }), 300);
    return true;
  },
});

// sounds these films play beyond src/anime.js's, for tools/copy_assets.py
export const PV_SOUNDS = ['Z3 変身', 'ZG エネルギー弾1', 'ZG 打撃2', 'ZG 光線1', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'DB3 気を溜める2',
  'Z1 気を溜める6', 'Z1 怪しい気', 'Z1 衝撃波', 'Z1 ゴー', 'Z1 ザー', 'Z1 怪光線', 'Z1 気を溜める2', 'Z1 気を溜める3', 'Z1 エネルギー波3'];
