// Battle animation, ported from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb).
// Every action is a short one-on-one film on the original 640×356 stage — the party member always on the left,
// the enemy on the right — played at 60 frames a second with the original sprites, beams and sounds.
// Positions, speeds and frame numbers follow the original's anime_pattern / effect_pattern / back_anime_pattern
// (pattern numbers are noted on each piece). The stage is drawn into its own canvas and cropped to the phone.
import { img, audio, rand } from './core.js?v=20261101-1649';

export const SW = 640, SH = 356;
const STD_CHAX = -70, STD_ENEX = 602, STD_Y = 120, CENTER_CHAX = 240, CENTER_ENEX = 304, TEC_CENTER = 266;
const RAY_SPEED = 14, FADE = 10;
export const BACK_Y = 256; // where the ground strip starts; it sinks while a special move rises

// every picture used here goes through pic(); tools/copy_assets.py collects them (and ANIME_SOUNDS) from this file
const pic = (n) => `Graphics/Pictures/${n}`;
const SPARK = pic('戦闘アニメ.PNG'); // hit sparks (y 0-48) and the dodge after-image (0,48 64×64)
const BOOM = pic('戦闘アニメ_爆発1.PNG'); // 2 frames of 96×96
const DIGITS = pic('数字英語.PNG');
const BALL = { orange: pic('Z1_戦闘_必殺技_エネルギー弾.PNG'), green: pic('Z1_戦闘_必殺技_エネルギー弾(緑).PNG'),
  foe: pic('Z1_戦闘_必殺技_エネルギー弾_敵.PNG'), foeYellow: pic('Z1_戦闘_必殺技_エネルギー弾_敵(黄).PNG') }; // 128×128 frames, growing
const MAKANKO_BALL = pic('Z1_戦闘_必殺技_魔貫光殺砲系(緑).PNG');
const PIERCE_FRONT = pic('Z1_戦闘_必殺技_貫光線_正面.PNG');
// side beams: 400 px long, the top half flies left→right (party), the bottom half right→left (enemy)
const RAY = {
  small: [pic('Z1_戦闘_必殺技_エネルギー波.PNG'), 28, 150], smallGreen: [pic('Z1_戦闘_必殺技_エネルギー波(緑).PNG'), 28, 150],
  mid: [pic('Z1_戦闘_必殺技_エネルギー波_中.PNG'), 60, 140], midGreen: [pic('Z1_戦闘_必殺技_エネルギー波_中(緑).PNG'), 60, 140],
  bigGreen: [pic('Z1_戦闘_必殺技_エネルギー波_大(緑).PNG'), 92, 124], makanko: [pic('Z1_戦闘_必殺技_魔貫光殺砲.PNG'), 32, 150],
  foeMid: [pic('Z1_戦闘_必殺技_エネルギー波_敵_中.PNG'), 60, 150], foeMidYellow: [pic('Z1_戦闘_必殺技_エネルギー波_敵_中(黄).PNG'), 60, 150],
  foeBig: [pic('Z1_戦闘_必殺技_エネルギー波_敵_大.PNG'), 88, 134], liquid: [pic('Z1_戦闘_必殺技_エネルギー液.PNG'), 32, 150],
  pierce: [pic('Z1_戦闘_必殺技_貫光線_横.PNG'), 32, 150], huge: [pic('Z1_戦闘_必殺技_エネルギー波_特大.PNG'), 192, 76],
};
const BACKS = {
  shock: pic('Z1_戦闘_必殺技_背景_衝撃波系.png'), demonV: pic('Z1_戦闘_必殺技_背景_魔族系(縦).png'),
  demonH: pic('Z1_戦闘_必殺技_背景_魔族系(横).png'), auraGreen: pic('Z1_戦闘_必殺技_気を溜める(緑).PNG'),
  flame: pic('Z1_戦闘_必殺技_気を溜める2.png'), handOne: pic('Z1_戦闘_必殺技_手に気を溜める_片手.PNG'),
  handTwo: pic('Z1_戦闘_必殺技_手に気を溜める_両手.PNG'),
};

export const ANIME_IMAGES = [SPARK, BOOM, DIGITS, MAKANKO_BALL, PIERCE_FRONT, ...Object.values(BALL),
  ...Object.values(RAY).map((r) => r[0]), ...Object.values(BACKS)];

// special moves by skill id → the original's animation (attack pattern = skill id + 10)
const MOVES = {
  1: 'shockwave', 2: 'energyWave', 5: 'kamehameha', // 悟空
  31: 'makouhou', 33: 'eyeBeam', 34: 'mouthBeam', 35: 'bakuretsu', 36: 'makankosappo', // 比克
  301: 'paralysis', 302: 'paralysis', 305: 'foeWave', 306: 'pierce', 384: 'oozaru', // 雜兵
  310: 'raditzWave', 311: 'raditzBigWave', // 拉蒂茲
};

// one action: attacker vs defender. `party` / `foe` = { normal, special } sprite sheets (96×96 frames, one column)
export class Duel {
  constructor({ party, foe, playerAttacks, skill, ray, hit, damage, onHit, margin = 0 }) {
    this.L = { x: -200, y: -200, frame: 0, sp: false, sheets: party }; // party member, always on the left
    this.R = { x: -200, y: -200, frame: 0, sp: false, sheets: foe };
    this.p = playerAttacks;
    this.dir = playerAttacks ? 1 : -1;
    this.A = playerAttacks ? this.L : this.R;
    this.G = playerAttacks ? this.R : this.L;
    this.skill = skill; // skill id or null (normal attack)
    this.green = ray === 'green';
    this.hit = hit;
    this.damage = damage;
    this.onHit = onHit;
    this.margin = margin; // stage columns cut off at each side on a narrow screen
    this.back = { x: 0, y: BACK_Y };
    this.fx = null; // effect in front of the fighters { draw(f), f }
    this.bfx = null; // effect behind them (auras, speed lines)
    this.dmg = false; // show the damage number
    this.t = 0; // frames since start (for the fades)
    this.fade = 1;
    this.done = false;
    this.cv = document.createElement('canvas');
    this.cv.width = SW; this.cv.height = SH;
    this.c = this.cv.getContext('2d');
    this.c.imageSmoothingEnabled = false;
    this.gen = this.run();
    this.finished = new Promise((res) => { this.resolve = res; });
  }

  // ---------- running ----------
  step() {
    if (this.done) return;
    this.t++;
    if (!this.ending) this.fade = Math.max(0, 1 - this.t / FADE); // fade in over the first frames
    if (this.fx) this.fx.f++;
    if (this.bfx) this.bfx.f++;
    const r = this.gen.next();
    if (r.done) { this.done = true; audio.seStop(); this.resolve(); }
  }

  * run() {
    if (this.skill != null && MOVES[this.skill]) {
      yield* this.swoopIn(); // 31
      yield* this.launch(); // 32
      const kind = yield* this[MOVES[this.skill]]();
      audio.seStop();
      if (!this.hit) yield* this.dodge();
      else if (kind === 'shock') yield* this.blownAway(); // 22
      else if (kind === 'small') yield* this.explode(11, 60); // 26
      else yield* this.explode(17, 50); // 23
    } else {
      yield* this.normalAttack();
    }
    audio.seStop();
    this.ending = true;
    for (let i = 0; i < FADE; i++) { this.fade = (i + 1) / FADE; yield; }
  }

  * wait(n) { for (let i = 0; i < n; i++) yield; }
  // per-frame movement, written from the attacker's point of view like the original (ax/ay attacker, gx/gy defender)
  vel(ax, ay, gx, gy) { this.A.x += ax * this.dir; this.A.y += ay; this.G.x -= gx * this.dir; this.G.y += gy; }
  pose(o, frame, sp = o.sp) { o.frame = frame; o.sp = sp; }
  effect(draw) { this.fx = draw && { draw, f: 0 }; }
  behind(draw) { this.bfx = draw && { draw, f: 0 }; }
  showHit() { if (!this.dmg) { this.dmg = true; this.onHit(); } }
  se(name) { audio.se(name, 80); }

  // ---------- normal attacks (attack patterns 1-4, the ones open to Z1 speeds) ----------
  * normalAttack() {
    const kind = rand(4) + 1;
    if (kind === 2) yield* this.staredown();
    yield* this.approach();
    if (kind === 3) { yield* this.clash(); yield* this.loop(); }
    if (kind === 4) {
      for (const k of [1, 2, 3, 4]) { this.se('Z1 打撃'); yield* this.strike(k); }
    } else yield* this.strike(rand(4) + 1);
    if (this.hit) yield* this.knockBack();
    else yield* this.dodge();
  }

  * approach() { // 1 / 5: both fly in to the middle (5: bobbing up and down)
    const bob = rand(2);
    this.pose(this.L, 0, false); this.pose(this.R, 0, false);
    this.L.x = STD_CHAX; this.R.x = STD_ENEX; this.L.y = this.R.y = STD_Y;
    yield;
    for (let f = 1; f <= 16; f++) {
      const w = bob ? (f <= 4 || f >= 13 ? -4 : 4) : 0;
      this.vel(18, w, 18, -w);
      yield;
    }
    this.L.x = CENTER_CHAX; this.R.x = CENTER_ENEX; this.L.y = this.R.y = STD_Y;
  }

  * staredown() { // 2: both cross the screen the other way first, then turn and come back
    const A = this.A, G = this.G;
    this.pose(A, 5, false); this.pose(G, 8, false);
    A.x = this.p ? STD_ENEX : STD_CHAX; A.y = STD_Y + 60;
    G.x = this.p ? STD_CHAX : STD_ENEX; G.y = STD_Y - 60;
    yield;
    for (let f = 1; f <= 40; f++) { this.vel(-23, f > 20 ? -3 : 0, -23, f > 20 ? 3 : 0); yield; }
  }

  * clash() { // 3: they collide and bounce apart diagonally
    for (let f = 0; f < 20; f++) {
      if (f === 0) this.effect((c, t) => { if (t <= 5) spark(c, 32, 16, 32, 32, SW / 2 - 16, 150); });
      if (f < 10) this.vel(-20, -6, -20, 6); else this.vel(20, 6, 20, -6);
      yield;
    }
    this.effect(null);
  }

  * loop() { // 4: the attacker loops over the defender
    const path = [[10, 0, -14], [5, -12, -4], [3, -12, 0], [7, -12, 8], [5, 0, 4], [5, 4, 8], [8, 8, 4], [8, 12, 2]];
    for (const [n, ax, ay] of path) for (let i = 0; i < n; i++) { this.vel(ax, ay, 0, 0); yield; }
  }

  * strike(k) { // 51-54: kick left / kick right / punch left / punch right
    yield* this.wait(5);
    this.pose(this.A, { 1: 3, 2: 4, 3: 1, 4: 2 }[k]);
    yield;
  }

  * knockBack() { // 21: the defender is knocked back, a spark at the fist
    this.se('Z3 打撃');
    this.pose(this.G, 16);
    this.showHit();
    this.effect((c, t) => {
      if (t > 10) return;
      const bx = t <= 4 ? 0 : 32;
      if (this.p) { spark(c, bx, 16, 32, 32, this.L.x + 96, this.L.y + 32); spark(c, 32, 0, 32, 16, this.R.x, this.R.y); }
      else { spark(c, bx, 16, 32, 32, this.R.x - 32, this.R.y + 32); spark(c, 32, 0, 32, 16, this.L.x + 64, this.L.y); }
    });
    for (let f = 1; f <= 50; f++) { if (f <= 12) this.vel(0, 0, -18, 0); yield; }
    this.effect(null);
  }

  * dodge() { // 20: the defender vanishes, leaving a flickering after-image
    this.se('Z3 避ける');
    const G = this.G, x = G.x, y = G.y;
    G.y = -500;
    this.effect((c, t) => { if (t <= 20 && t % 4 === 0) spark(c, 0, 48, 64, 64, x + (this.p ? 32 : 8), y + 16); });
    yield* this.wait(50);
    this.effect(null);
  }

  // ---------- special moves ----------
  * swoopIn() { // 31: the attacker swoops down from the top, then flies in to the middle
    const A = this.A, m = this.margin; // (started further in on a phone, or the swoop happens off screen)
    this.pose(A, 0, false);
    if (this.p) { this.L.x = 200 + m; this.L.y = -200; this.R.x = 0; this.R.y = -200; }
    else { this.L.x = 0; this.L.y = -200; this.R.x = 344 - m; this.R.y = -200; }
    yield;
    for (let f = 1; f <= 29; f++) { this.vel(-18, 12, 0, 0); yield; }
    this.pose(A, 0, true);
    A.x = this.p ? STD_CHAX : STD_ENEX; A.y = STD_Y;
    yield;
    for (let f = 31; f <= 46; f++) { this.vel(20, 0, 0, 0); yield; }
    A.x = TEC_CENTER;
    yield;
  }

  * launch() { // 32: "必殺技!" — the ground falls away as the attacker rises
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) { this.back.y += 4; yield; }
  }

  // the cut to the defender, then the beam flying across (effects 31-48)
  * cut(ray, frames = 27, dy = 0) {
    this.A.y = -200;
    this.G.x = this.p ? CENTER_ENEX + dy : CENTER_CHAX - dy; this.G.y = STD_Y + dy;
    this.pose(this.G, 0, false);
    this.effect(null); this.behind(null);
    yield;
    const [sheet, h, y] = ray;
    this.effect((c, t) => {
      const im = img(sheet);
      if (!im.ok) return;
      const extra = sheet === RAY.smallGreen[0] && this.twin ? [-6, 24] : [0];
      for (const d of extra) {
        if (this.p) c.drawImage(im.im, 0, 0, 400, h, -400 + t * RAY_SPEED, y + d, 400, h);
        else c.drawImage(im.im, 0, h, 400, h, SW - t * RAY_SPEED, y + d, 400, h);
      }
    });
    yield* this.wait(frames);
    this.effect(null);
  }

  * explode(frame, end) { // 23 / 26: an explosion, then the defender is blown away
    this.se('Z3 光線系ヒット');
    this.showHit();
    this.pose(this.G, frame);
    const ex = this.p ? 320 : 230;
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, BOOM, k * 96, 0, 96, 96, ex, 120); });
    for (let f = 1; f < end; f++) {
      if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (f === 40) this.effect(null);
      yield;
    }
  }

  * blownAway() { // 22: shock-wave hit
    this.se('Z3 跳ね返し');
    this.showHit();
    this.pose(this.G, 17);
    for (let f = 0; f < 60; f++) { if (f < 20) this.vel(0, 0, -20, 0); yield; }
  }

  // a growing ball of ki held in front of the attacker (effects 1-8, 14-17): 128×128 frames, `every` frames each
  ball(sheet, x, y, every = 10) {
    return (c, t) => { const k = Math.floor(t / every); if (k < 6) draw(c, sheet, k * 128, 0, 128, 128, x, y); };
  }
  // effects 2-6 cycle through three frames every 5 (back_anime_pattern)
  cycler(sheet, w, h, x, y, n = 3) {
    return (c, t) => { const k = Math.floor(t / 5) % n; draw(c, sheet, 0, k * h, w, h, x, y); };
  }
  * frames(n, each) { for (let f = 1; f <= n; f++) { if (each) each(f); yield; } }

  // ---- 悟空 ----
  * shockwave() { // 101 衝撃波
    this.se('Z1 高速移動');
    this.pose(this.A, 1, true);
    yield* this.wait(59);
    this.se('Z1 衝撃波');
    this.A.y = -200;
    this.G.x = this.p ? CENTER_ENEX : CENTER_CHAX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    this.behind((c, t) => { const k = Math.floor(t / 5) % 3; draw(c, BACKS.shock, 0, k * 180, 640, 180, 0, 80); });
    yield* this.wait(59);
    this.behind(null);
    return 'shock';
  }

  * energyWave() { // 102 エネルギー波
    this.se('Z1 エネルギー波');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.orange, 240, 100));
    yield* this.wait(44);
    yield* this.cut(RAY.small);
  }

  * kamehameha() { // 105 かめはめ波
    this.se('Z1 気を溜める');
    this.pose(this.A, 3, true);
    yield* this.wait(50);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.orange, 240, 110));
    yield* this.wait(39);
    this.effect(null);
    yield* this.wait(10);
    yield* this.cut(RAY.mid);
  }

  // ---- 比克 ----
  * makouhou() { // 131 魔光砲
    this.se('Z1 エネルギー波');
    this.pose(this.A, 1, true);
    this.effect(this.ball(BALL.green, 240, 110));
    yield* this.wait(44);
    yield* this.cut(RAY.smallGreen);
  }

  * eyeBeam() { // 133 目から怪光線 (close-up of the face, two beams)
    this.se('Z1 気を溜める2');
    this.pose(this.A, 2, true);
    yield* this.wait(30);
    audio.seStop();
    this.se('Z1 怪光線');
    this.pose(this.A, 3, true);
    this.behind(this.cycler(BACKS.demonV, 640, 356, 0, 0));
    this.effect((c, t) => {
      const k = Math.min(5, Math.floor(t / 15));
      draw(c, BALL.green, k * 128, 0, 128, 128, 240 - t * 2, 122 - t * 2);
      draw(c, BALL.green, k * 128, 0, 128, 128, 262 + t * 2, 122 - t * 2);
    });
    yield* this.wait(54);
    this.effect(null);
    this.behind(null);
    this.twin = true;
    yield* this.cut(RAY.smallGreen);
  }

  * mouthBeam() { // 134 口から怪光線
    this.se('Z1 気を溜める2');
    this.pose(this.A, 2, true);
    yield* this.wait(30);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 4, true);
    this.behind(this.cycler(BACKS.demonH, 640, 304, 0, 0));
    this.effect(this.ball(BALL.green, 250, 140));
    yield* this.wait(54);
    yield* this.cut(RAY.midGreen);
  }

  * bakuretsu() { // 135 爆裂魔光砲
    this.se('Z1 気を溜める2');
    this.pose(this.A, 5, true);
    this.behind(this.cycler(BACKS.auraGreen, 160, 222, 234, 70));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 6, true);
    this.effect(this.ball(BALL.green, 250, 114));
    yield* this.wait(64);
    yield* this.cut(RAY.bigGreen);
  }

  * makankosappo() { // 136 魔貫光殺砲: fingers to the forehead for a long charge, then the drill beam
    this.se('Z1 気を溜める3');
    this.pose(this.A, 5, true);
    this.behind(this.cycler(BACKS.flame, 128, 192, 250, 56));
    yield* this.wait(30);
    this.pose(this.A, 7, true);
    yield* this.wait(100);
    this.se('Z1 エネルギー波3');
    this.pose(this.A, 8, true);
    this.effect(this.ball(MAKANKO_BALL, 238, 124, 6));
    yield* this.wait(85);
    yield* this.cut(RAY.makanko);
  }

  // ---- enemies ----
  * paralysis() { // 401 痺れ液
    this.se('Z1 ザー');
    this.pose(this.A, 1, true);
    yield* this.wait(29);
    this.se('Z1 エネルギー波3');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.orange, 249, 112));
    yield* this.wait(45);
    yield* this.cut(RAY.liquid);
  }

  * foeWave() { // 405 エネルギー波
    this.pose(this.A, 0, true);
    yield* this.wait(19);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 1, true);
    this.effect(this.ball(BALL.foeYellow, 228, 102));
    yield* this.wait(62);
    yield* this.cut(RAY.foeMidYellow);
  }

  * pierce() { // 406 貫光線
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    yield* this.wait(29);
    audio.seStop();
    this.se('Z1 貫光線');
    this.pose(this.A, 3, true);
    this.effect(this.ball(PIERCE_FRONT, 228, 102));
    yield* this.wait(52);
    yield* this.cut(RAY.pierce);
  }

  * raditzWave() { // 410
    this.se('Z1 気を溜める5');
    this.pose(this.A, 1, true);
    this.behind((c, t) => draw(c, BACKS.handOne, 0, (Math.floor(t / 5) % 10) * 48, 40, 48, 266, 116));
    yield* this.wait(99);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.foe, 228, 102));
    yield* this.wait(62);
    yield* this.cut(RAY.foeMid);
  }

  * raditzBigWave() { // 411
    this.se('Z1 気を溜める5');
    this.pose(this.A, 3, true);
    this.behind((c, t) => draw(c, BACKS.handTwo, 0, (Math.floor(t / 5) % 10) * 48, 100, 48, 266, 116));
    yield* this.wait(99);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.foe, 248, 112));
    yield* this.wait(62);
    yield* this.cut(RAY.foeBig);
  }

  * oozaru() { // 484 大猿変身 (shortened): the face flickers into a great ape, then a huge wave from its mouth
    this.se('Z1 パワーアップ');
    const A = this.A, sheet = A.sheets.special;
    const ape = (row) => (c) => draw(c, sheet, 0, row, 96, 112, TEC_CENTER, 118);
    for (let f = 1; f <= 65; f++) {
      const on = Math.floor((f - 1) / 8) % 2 === 0;
      A.y = on ? -200 : STD_Y;
      this.behind(on ? ape(384) : null);
      yield;
    }
    this.se('Z1 大猿');
    A.y = -200;
    this.behind(ape(496));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.effect(this.ball(BALL.orange, 250, 140));
    yield* this.wait(60);
    yield* this.cut(RAY.huge, 27, -30);
    return 'small';
  }

  // ---------- drawing ----------
  // the fighters and effects on a transparent stage; the battle draws the background and the fade around it
  render() {
    const c = this.c;
    c.clearRect(0, 0, SW, SH);
    if (this.bfx) this.bfx.draw(c, this.bfx.f);
    for (const o of [this.R, this.L]) {
      if (o.y < -96 || o.y > SH) continue;
      draw(c, o.sp ? o.sheets.special : o.sheets.normal, 0, o.frame * 96, 96, 96, Math.round(o.x), Math.round(o.y));
    }
    if (this.fx) this.fx.draw(c, this.fx.f);
    if (this.dmg && this.hit) { // the damage above the defender, in the original white digits
      const d = img(DIGITS);
      const s = String(this.damage), rx = this.p ? CENTER_ENEX + 72 : CENTER_CHAX + 40;
      if (d.ok) for (let i = 0; i < s.length; i++) c.drawImage(d.im, 16 * Number(s[s.length - 1 - i]), 32, 16, 16, rx - i * 16, 100, 16, 16);
    }
    return this.cv;
  }
}

function draw(c, sheet, sx, sy, w, h, x, y) {
  const im = img(sheet);
  if (im.ok) c.drawImage(im.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
function spark(c, sx, sy, w, h, x, y) { draw(c, SPARK, sx, sy, w, h, x, y); }

// sounds this file plays, for tools/copy_assets.py
export const ANIME_SOUNDS = ['Z1 打撃', 'Z3 打撃', 'Z3 避ける', 'Z1 必殺技', 'Z3 光線系ヒット', 'Z3 跳ね返し', 'Z1 高速移動', 'Z1 衝撃波',
  'Z1 エネルギー波', 'Z1 エネルギー波2', 'Z1 エネルギー波3', 'Z1 気を溜める', 'Z1 気を溜める2', 'Z1 気を溜める3', 'Z1 気を溜める5',
  'Z1 怪光線', 'Z1 ザー', 'Z1 貫光線', 'Z1 パワーアップ', 'Z1 大猿'];
