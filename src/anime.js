// Battle animation, ported from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb).
// Every action is a short one-on-one film on the original 640×356 stage — the party member always on the left,
// the enemy on the right — played at 60 frames a second with the original sprites, beams and sounds.
// Positions, speeds and frame numbers follow the original's anime_pattern / effect_pattern / back_anime_pattern
// (pattern numbers are noted on each piece). The stage is drawn into its own canvas and cropped to the phone.
import { img, audio, rand } from './core.js?v=20261102-2225';

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
  foe: pic('Z1_戦闘_必殺技_エネルギー弾_敵.PNG'), foeYellow: pic('Z1_戦闘_必殺技_エネルギー弾_敵(黄).PNG'),
  purple: pic('Z1_戦闘_必殺技_エネルギー弾(紫).PNG'), pink: pic('Z1_戦闘_必殺技_エネルギー弾(桃).PNG'),
  blue: pic('Z1_戦闘_必殺技_エネルギー弾(青).PNG') }; // 128×128 frames, growing
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
  big: [pic('Z1_戦闘_必殺技_エネルギー波_大.PNG'), 92, 124], smallPurple: [pic('Z1_戦闘_必殺技_エネルギー波(紫).PNG'), 28, 150],
  circlePink: [pic('Z1_戦闘_必殺技_エネルギー波_円_中(桃).PNG'), 60, 140], midPink: [pic('Z1_戦闘_必殺技_エネルギー波_中(桃).PNG'), 60, 140],
  liquidGreen: [pic('Z1_戦闘_必殺技_エネルギー液(緑).PNG'), 32, 150], liquidBlue: [pic('Z1_戦闘_必殺技_エネルギー液(青).PNG'), 32, 150],
};
const RAY_DOWN = pic('Z1_戦闘_必殺技_エネルギー波_中_縦.PNG'); // 120×400, the right half falls from the sky
const KIENZAN = pic('Z1_戦闘_必殺技_気円斬.PNG'); // 4 frames of 128×28, the disc growing
const SOKIDAN = pic('Z1_戦闘_必殺技_繰気弾.PNG'); // 128×128 frames
const SOKIDAN_PINK = pic('Z1_戦闘_必殺技_繰気弾(桃).PNG');
const POWER_BALL = pic('Z1_戦闘_必殺技_繰気弾.PNG'); // 128×128 frames: the 元気玉 and Vegeta's power ball
const BACKS = {
  shock: pic('Z1_戦闘_必殺技_背景_衝撃波系.png'), demonV: pic('Z1_戦闘_必殺技_背景_魔族系(縦).png'),
  demonH: pic('Z1_戦闘_必殺技_背景_魔族系(横).png'), auraGreen: pic('Z1_戦闘_必殺技_気を溜める(緑).PNG'),
  flame: pic('Z1_戦闘_必殺技_気を溜める2.png'), handOne: pic('Z1_戦闘_必殺技_手に気を溜める_片手.PNG'),
  handTwo: pic('Z1_戦闘_必殺技_手に気を溜める_両手.PNG'),
  aura: pic('Z1_戦闘_必殺技_気を溜める.PNG'), flame3: pic('Z1_戦闘_必殺技_気を溜める3.png'),
  gather4: pic('Z1_戦闘_必殺技_気を溜める4.png'), gatherFour: pic('Z1_戦闘_必殺技_気を溜める(四身の拳気功砲).PNG'),
  kikou: pic('Z1_戦闘_必殺技_背景_気功砲系.png'), psychic: pic('Z1_戦闘_必殺技_超能力.PNG'),
  blackHole: pic('Z1_戦闘_必殺技_気を溜める5.PNG'),
  nappa: pic('Z1_戦闘_必殺技_気を溜める6.PNG'), nappaMouth: pic('Z1_戦闘_必殺技_気を溜める7.PNG'),
  galick: pic('Z1_戦闘_必殺技_気を溜める8.png'), kaioken: pic('Z1_戦闘_必殺技_気を溜める9.PNG'),
  auraBlue: pic('Z1_戦闘_必殺技_気を溜める(青).PNG'),
};
// the Willow chapter: Dr. Willow's rush (two 472×244 frames), the 96×96 after-image, the ice, the big explosion (Z2)
const WILLOW_RUSH = pic('Z1_戦闘_必殺技_突進(ウィロー).png');
const AFTER_BIG = pic('戦闘アニメ96×96用回避.png');
const ICE = pic('Z1_戦闘_必殺技_氷(FF3).PNG'); // 3 frames of 96×96
const BOOM_BIG = pic('戦闘アニメ_爆発5.PNG'); // 4 frames of 158×160
// 悟飯 as the Great Ape (anime 146 / 151): the full moon rising (11 frames of 48×48) and his face turning into the ape's
// (the Z1 special sheet, rows 384 / 496: 96×112)
const MOON = pic('Z1_戦闘_必殺技_満月.PNG');
const GOHAN_SP = pic('Z1_戦闘_必殺技_ゴハン.PNG');

export const ANIME_IMAGES = [SPARK, BOOM, DIGITS, WILLOW_RUSH, AFTER_BIG, ICE, BOOM_BIG, MOON, GOHAN_SP, MAKANKO_BALL, PIERCE_FRONT, RAY_DOWN, KIENZAN, POWER_BALL, SOKIDAN, SOKIDAN_PINK, ...Object.values(BALL),
  ...Object.values(RAY).map((r) => r[0]), ...Object.values(BACKS)];

// special moves by skill id → the original's animation (attack pattern = skill id + 10)
const MOVES = {
  1: 'shockwave', 2: 'energyWave', 5: 'kamehameha', // 悟空
  31: 'makouhou', 33: 'eyeBeam', 34: 'mouthBeam', 35: 'bakuretsu', 36: 'makankosappo', // 比克
  46: 'gohanMakouhou', 47: 'masenko', 51: 'gohanApe', // 悟飯
  61: 'krillinWave', 62: 'kameSmall', 63: 'scatterWave', 64: 'kienzan', // 克林
  71: 'wolfFang', 72: 'kameSmall', 73: 'sokidan', // 亞姆茶
  81: 'tienWave', 82: 'shishinFist', 83: 'kikouhou', 84: 'shishinKikouhou', // 天津飯
  91: 'dodonpa', 92: 'psychic', 93: 'psychoAttack', // 餃子
  301: 'paralysis', 302: 'paralysis', 305: 'foeWave', 306: 'pierce', 384: 'oozaru', // 雜兵
  310: 'raditzWave', 311: 'raditzBigWave', // 拉蒂茲
  307: 'gingerWave', 321: 'gingerWave', 324: 'sanshoWave', 325: 'sanshoBigWave', // 卡里克的手下
  322: 'nikkiBigWave', 323: 'swordAttack', // 尼奇
  308: 'nikkiBigWave', 309: 'swordAttack', // 吉加
  326: 'garlicBall', 328: 'garlicBigWave', 329: 'giantWave', 330: 'blackHole', // 卡里克 / 卡里克(巨大化)
  6: 'kaioken', 7: 'kaiokenKamehameha', 18: 'genkidama', // 悟空 after King Kai's training (CE12)
  101: 'shockwave', 102: 'energyWave', 103: 'kienzan', 104: 'kienzan', // 琪琪
  303: 'paralysis', 304: 'selfDestruct', // 栽培人
  312: 'nappaWave', 313: 'nappaBlast', 314: 'nappaMouth', // 那巴
  316: 'vegetaWave', 319: 'vegetaBlast', 320: 'galickGun', 373: 'vegetaApe', 585: 'apeWave', // 貝吉塔
  // the Willow chapter (attack pattern = skill id + 10; the Z1 films, $btl_progress 0)
  225: 'zanzouken', 226: 'kameKamehameha', 228: 'bankoku', 229: 'maxKamehameha', // 龜仙人 (235 / 236 / 238 / 239)
  459: 'kishimeWhip', 462: 'ebiIce', 463: 'misoStretch', 464: 'misoWave', 465: 'misoBigWave', // 生化戰士 (469 / 472-475)
  586: 'willowWave', 587: 'photonStrike', 588: 'willowMouth', 589: 'gigantic', 590: 'planetGeyser', // 威洛博士 (596-600)
  // Z2 (src/z2a.js), by pattern: the Frieza soldiers' and officers' waves, blasts and beams with the nearest Z1 film
  331: 'foeWave', 332: 'pierce', 333: 'foeWave', 334: 'foeWave', 335: 'nappaBlast', 336: 'raditzWave', // 兵士 / 邱夷
  337: 'foeWave', 338: 'nappaMouth', 339: 'nappaBlast', 340: 'foeWave', 341: 'raditzBigWave', 342: 'nappaBlast', // 多多利亞 / 薩博
  343: 'raditzWave', 344: 'raditzBigWave', // 薩博(變身)
  121: 'vegetaWave', 123: 'vegetaBlast', 124: 'galickGun', // 貝吉塔 (party, CE24)
  141: 'energyWave', 142: 'mouthBeam', 143: 'makouhou', 144: 'kikouhou', // 青年 (the young Namekian)
};
// later chapters add the films of their moves (src/z2b.js: Vegeta, the Ginyu Force, Frieza …)
export function addMoves(more) { Object.assign(MOVES, more); }
export const moveFilm = (id) => MOVES[id]; // (src/combo-anime.js: a combo without a film of its own plays its members' moves)
// 拡散エネルギー波 hits every enemy: the battle plays one film per target, and in the original only the first one
// has the whole charge — the rest are just the beam falling on them. A film started right after the last one
// ended belongs to the same attack.
const SCATTER = 63, BLACK_HOLE = 330; // moves on everyone: the targets after the first get a shorter film
let scatterEnd = -1e9;
const GEYSER = 590; // プラネットゲイザー hits everyone too (690: @all_attack_count >= 2 skips the charge)
let geyserEnd = -1e9;
let blastEnd = -1e9; // 爆発波 (313 / 319) hits everyone the same way: only the first film has the charge

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
    if (r.done) {
      this.done = true;
      audio.seStop();
      if (this.skill === SCATTER || this.skill === BLACK_HOLE) scatterEnd = performance.now();
      if (MOVES[this.skill] === 'nappaBlast' || MOVES[this.skill] === 'vegetaBlast') blastEnd = performance.now(); // (also the Z2 爆発波)
      if (this.skill === GEYSER) geyserEnd = performance.now();
      this.resolve();
    }
  }

  * run() {
    if (this.skill != null && MOVES[this.skill] === 'selfDestruct') { // 404: no swoop, it rushes straight in
      yield* this.selfDestruct();
      yield* this.explode(17, 50);
    } else if (this.skill != null && MOVES[this.skill]) {
      let kind;
      if (this.skill === SCATTER && performance.now() - scatterEnd < 500) { // a further target of the same attack
        this.back.y = BACK_Y + 79 * 4;
        kind = yield* this.rainDown(27);
      } else if (this.skill === BLACK_HOLE && performance.now() - scatterEnd < 500) {
        kind = yield* this.blackHoleAgain();
      } else if (this.skill === GEYSER && performance.now() - geyserEnd < 500) {
        kind = yield* this.geyserAgain();
      } else {
        yield* this.swoopIn(); // 31
        yield* this.launch(); // 32
        kind = yield* this[MOVES[this.skill]]();
      }
      audio.seStop();
      if (kind === 'none') { /* 大猿変身: no hit */ } else if (!this.hit) yield* this.dodge();
      else if (kind === 'shock') yield* this.blownAway(); // 22
      else if (kind === 'small') yield* this.explode(11, 60); // 26
      else if (kind === 'down') yield* this.explode(17, 45, true); // 24
      else if (kind === 'psychic') yield* this.tremble(false); // 25
      else if (kind === 'psycho') yield* this.tremble(true); // 29
      else if (kind === 'big') yield* this.bigBoom(); // 43
      else if (kind === 'ice') yield* this.frozen(); // 70
      else if (kind === 'crush') yield* this.crushed(); // 71
      else if (kind === 'numb') yield* this.numb(); // 73
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

  // the cut to the defender: the attacker leaves the stage, the defender waits in the middle
  aim(dy = 0) {
    this.A.y = -200;
    this.G.x = this.p ? CENTER_ENEX + dy : CENTER_CHAX - dy; this.G.y = STD_Y + dy;
    this.pose(this.G, 0, false);
    this.effect(null); this.behind(null);
  }

  // the cut to the defender, then the beam flying across (effects 31-48); `ray` = [sheet, height, y] of a side beam
  // (top half flies left→right, bottom half right→left) or a draw(c, t) of its own
  * cut(ray, frames = 27, dy = 0) {
    this.aim(dy);
    yield;
    if (typeof ray === 'function') {
      this.effect(ray);
      yield* this.wait(frames);
      this.effect(null);
      return;
    }
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

  * explode(frame, end, down = false) { // 23 / 26: an explosion, then the defender is blown away (24: downwards)
    this.se('Z3 光線系ヒット');
    this.showHit();
    this.pose(this.G, frame);
    const ex = this.p ? 320 : 230;
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, BOOM, k * 96, 0, 96, 96, ex, 120); });
    for (let f = 1; f < end; f++) {
      if (down) {
        if (f >= 21 && f <= 34) this.vel(0, 0, 0, 20);
        if (f === 35) this.effect(null);
      } else {
        if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
        if (f === 40) this.effect(null);
      }
      yield;
    }
  }

  * tremble(psycho) { // 25 超能力 (no damage shown) / 29 サイコアタック (餃子 still clinging to its back)
    this.se('Z3 超能力');
    this.pose(this.G, 0, false);
    if (psycho) { this.showHit(); this.effect(this.clinging(22)); } else this.onHit();
    const x = this.G.x;
    for (let f = 1; f <= 60; f++) { this.G.x = x + (f % 2 ? -3 : 3); yield; }
    this.G.x = x;
    audio.seStop();
    this.effect(null);
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
  cycler(sheet, w, h, x, y, n = 3, stride = h) {
    return (c, t) => { const k = Math.floor(t / 5) % n; draw(c, sheet, 0, k * stride, w, h, x, y); };
  }
  // back 1: the shock-wave streaks behind the defender
  shockBack() {
    return (c, t) => { const k = Math.floor(t / 5) % 3; draw(c, BACKS.shock, 0, k * 180, 640, 180, 0, 80); };
  }
  // back 9: the 気功砲 column coming down on the defender
  kikouBack() {
    return this.cycler(BACKS.kikou, 384, 356, this.p ? 170 : 90, 0, 3, 360);
  }
  // the after-images left while vanishing at high speed (狼牙風風拳, サイコアタック): every 4th frame
  * vanish(y) {
    this.se('Z1 高速移動');
    const x = this.A.x;
    this.A.y = -200;
    this.effect((c, t) => { if (t % 4 === 0) spark(c, 0, 48, 64, 64, x + 20, y); });
    yield* this.wait(41);
    this.effect(null);
    this.se('Z1 逃げる');
    this.aim();
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
    this.behind(this.shockBack());
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

  * kamehameha(charge = 3, fire = 4) { // 105 かめはめ波 (162 / 172: 克林・亞姆茶 with poses 1 / 2)
    this.se('Z1 気を溜める');
    this.pose(this.A, charge, true);
    yield* this.wait(50);
    this.se('Z1 エネルギー波');
    this.pose(this.A, fire, true);
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

  // the plain "ball of ki, then a beam" moves: sound, pose, a growing ball at (x, y) for 44 frames, then the beam
  * simpleWave(frame, ball, x, y, ray) {
    this.se('Z1 エネルギー波');
    this.pose(this.A, frame, true);
    this.effect(this.ball(ball, x, y));
    yield* this.wait(44);
    yield* this.cut(ray);
  }

  // ---- 悟飯 ----
  * gohanMakouhou() { // 146 魔光砲(悟飯); as the Great Ape (192×192 sheets) the beam comes from his mouth
    if ((this.A.sheets.size || 96) === 192) return yield* this.apeMakouhou();
    yield* this.simpleWave(1, BALL.orange, 252, 130, RAY.small);
  }

  * apeMakouhou() { // anime 146, $oozaru_flag[5] (all.rb 73744): the ape's face, the charge, a ball at the mouth (effect 5), the huge wave (48)
    const face = (row) => (c) => draw(c, GOHAN_SP, 0, row, 96, 112, TEC_CENTER, 118);
    this.A.y = -200;
    this.behind(face(384));
    yield* this.wait(60);
    this.se('Z1 気を溜める');
    this.behind(face(496));
    yield* this.wait(120);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.effect(this.ball(BALL.orange, 250, 140));
    yield* this.wait(60);
    this.behind(null);
    yield* this.cut(RAY.huge, 27, -30);
  }

  * gohanApe() { // 151 大猿変身 (all.rb 73832): the full moon rises, his face flickers into the great ape's (no damage)
    const A = this.A, face = (row) => (c) => draw(c, GOHAN_SP, 0, row, 96, 112, TEC_CENTER, 118);
    this.se('Z1 満月');
    A.y = -120;
    this.behind((c, t) => {
      const f = Math.min(t + 1, 200), hk = f > 150 ? 300 : f * 2, h = Math.min(48, f * 2);
      draw(c, MOON, 48 * Math.min(10, Math.floor(f / 8)), 0, 48, h, 596 - hk, 354 - hk);
    });
    yield* this.wait(200);
    this.se('Z1 パワーアップ');
    for (let f = 201; f <= 265; f++) { // eight frames the face, eight frames himself
      const on = f <= 201 || Math.floor((f - 202) / 8) % 2 === 1;
      A.y = on ? -120 : STD_Y;
      this.behind(on ? face(384) : null);
      yield;
    }
    this.se('Z1 大猿');
    A.y = -200;
    this.behind(face(496));
    yield* this.wait(65);
    this.behind(face(384));
    yield* this.wait(60);
    return 'none';
  }

  * masenko() { // 147 魔閃光
    this.se('Z1 気を溜める3');
    this.pose(this.A, 2, true);
    this.behind(this.cycler(BACKS.flame3, 160, 160, 234, 112));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 3, true);
    this.effect(this.ball(BALL.orange, 252, 130));
    yield;
    this.behind(null);
    yield* this.wait(64);
    yield* this.cut(RAY.mid);
  }

  // ---- 克林 ----
  * krillinWave() { yield* this.simpleWave(9, BALL.orange, 240, 110, RAY.small); } // 161 エネルギー波(クリリン)
  * kameSmall() { yield* this.kamehameha(1, 2); } // 162 / 172 かめはめ波(クリリン・ヤムチャ)

  * scatterWave() { // 163 拡散エネルギー波: one big beam fired into the sky, then it rains down on the enemies
    this.se('Z1 気を溜める2');
    this.pose(this.A, 3, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.orange, 250, 114));
    yield* this.wait(64);
    this.effect(null); this.behind(null);
    yield;
    this.A.y = -200;
    yield;
    const [sheet, h, y] = RAY.big; // effect 33, flying off with nobody in its way
    this.effect((c, t) => {
      if (this.p) draw(c, sheet, 0, 0, 400, h, -400 + t * RAY_SPEED, y);
      else draw(c, sheet, 0, h, 400, h, SW - t * RAY_SPEED, y);
    });
    yield* this.wait(27);
    this.effect(null);
    yield* this.wait(6);
    this.A.y = STD_Y; // back on stage, the arm still raised
    this.pose(this.A, 5, true);
    yield* this.wait(44);
    audio.seStop();
    this.se('Z1 ブン');
    this.pose(this.A, 6, true);
    yield* this.wait(40);
    return yield* this.rainDown(27);
  }

  * rainDown(start) { // effect 37: the beam falls on the defender from above
    this.aim();
    this.effect((c, t) => draw(c, RAY_DOWN, 60, 0, 60, 400, 330, -600 + ((t + start) * RAY_SPEED) / 2));
    yield* this.wait(26);
    this.effect(null);
    return 'down';
  }

  * kienzan() { // 164 気円斬: the disc grows over the raised hand, then flies
    this.se('Z1 ザー');
    yield* this.wait(45);
    this.se('Z1 ブン');
    this.pose(this.A, 7, true);
    this.effect((c, t) => draw(c, KIENZAN, (t < 31 ? 0 : t < 41 ? 1 : t < 51 ? 2 : 3) * 128, 0, 128, 28, 252, 120));
    yield* this.wait(85);
    this.pose(this.A, 8, true);
    audio.seStop();
    this.se('Z1 気円斬');
    this.effect(null);
    yield* this.wait(39);
    yield* this.cut((c, t) => draw(c, KIENZAN, 128, 0, 128, 28, this.p ? -400 + t * RAY_SPEED : SW - t * RAY_SPEED, 150), 47);
  }

  // ---- 亞姆茶 ----
  * wolfFang() { // 171 狼牙風風拳: vanishes, then a flurry of blows on the shock-wave background (effect 39)
    this.pose(this.A, 0, true);
    yield* this.wait(30);
    yield* this.vanish(144);
    const sheet = this.A.sheets.normal;
    // frames of the normal sheet over time, and where they are drawn
    const ROWS = [[10, 14], [20, 13], [30, 12], [35, 0], [39, 3], [43, 1], [46, 2], [50, 4], [53, 2], [56, 1], [60, 2], [80, 16]];
    this.behind(this.shockBack());
    this.effect((c, t) => {
      const r = ROWS.find(([end]) => t <= end);
      const row = r ? r[1] : 2;
      const x = t >= 61 && t <= 80 ? CENTER_CHAX - (t - 60) * 8 : t >= 81 && t <= 84 ? 80 + (t - 80) * 16 : CENTER_CHAX;
      draw(c, sheet, 0, row * 96, 96, 96, x, STD_Y);
    });
    for (let t = 0; t < 92; t++) {
      if (t >= 36 && t < 85 && t % 5 === 0) this.se('Z3 打撃');
      yield;
    }
    this.behind(null);
    this.effect(null);
    return 'shock';
  }

  * sokidan() { // 173 繰気弾: the ball rises from the hand, he steers it, then it flies in
    this.se('Z1 気を溜める');
    this.pose(this.A, 3, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    audio.seStop();
    this.se('Z1 高速移動');
    yield;
    this.effect((c, t) => draw(c, SOKIDAN, (t < 51 ? 0 : t < 71 ? 1 : 2) * 128, 0, 128, 128, 230, 66));
    yield* this.wait(20);
    this.behind(null);
    for (const f of [4, 5, 6]) { this.pose(this.A, f, true); yield* this.wait(10); }
    this.se('Z1 エネルギー波');
    this.pose(this.A, 7, true);
    yield* this.wait(40);
    yield* this.cut((c, t) => draw(c, SOKIDAN, 256, 0, 128, 128, this.p ? -400 + t * RAY_SPEED : SW - t * RAY_SPEED, 120), 50);
  }

  // ---- 天津飯 ----
  * tienWave() { yield* this.simpleWave(1, BALL.orange, 230, 114, RAY.small); } // 181 エネルギー波(テンシンハン)

  // effects 12 / 13: 天津飯 splits in two, then four (special sheet rows 3-4); `last` draws the final pose
  fourClones(last) {
    const sheet = this.A.sheets.special, x0 = TEC_CENTER;
    return (c, t) => {
      const at = (row, ...xs) => { for (const d of xs) draw(c, sheet, 0, row * 96, 96, 96, x0 + d, STD_Y); };
      if (t <= 30) at(4, -2 * t, 2 * t);
      else if (t <= 59) at(3, -60, 60);
      else if (t <= 120) at(4, -60, 60, -60 - 2 * (t - 60), 60 + 2 * (t - 60));
      else last(c, t, at);
    };
  }

  * splitUp(last) { // 182 / 184 up to the four clones standing in a row (frame 150 of the move)
    this.pose(this.A, 3, true);
    yield* this.wait(30);
    this.A.y = -200;
    this.se('Z1 分身');
    this.effect(this.fourClones(last));
    yield* this.wait(59);
    this.se('Z1 分身');
    yield* this.wait(62);
  }

  * shishinFist() { // 182 四身の拳: four 天津飯 each fire a purple beam
    yield* this.splitUp((c, t, at) => {
      at(6, -60, 60, -180, 180);
      const k = t < 130 ? 0 : t < 140 ? 1 : t < 150 ? 2 : 3;
      for (let i = 0; i < 4; i++) draw(c, BALL.purple, k * 128, 0, 128, 128, 68 + 120 * i, 114);
    });
    this.se('Z1 エネルギー波2');
    yield* this.wait(40);
    const [sheet, h] = RAY.smallPurple; // effect 41
    yield* this.cut((c, t) => {
      if (!this.p) { draw(c, sheet, 0, h, 400, h, SW - t * RAY_SPEED, 150); return; }
      for (let i = 0; i < 4; i++) draw(c, sheet, 0, 0, 400, h, -400 + t * RAY_SPEED, 120 + 30 * i);
    }, 26);
  }

  * kikouhou() { // 183 気功砲: a long charge, then the blast comes down on the shock-wave background
    this.se('Z1 ザー');
    this.pose(this.A, 2, true);
    this.behind(this.cycler(BACKS.gather4, 640, 356, 0, 0, 3, 360));
    yield* this.wait(160);
    this.aim();
    this.behind(this.shockBack());
    yield* this.wait(61);
    this.behind(null);
  }

  * shishinKikouhou() { // 184 四身の拳・気功砲: four 天津飯 charge together, then the 気功砲 column crushes the enemy
    yield* this.splitUp((c, t, at) => {
      at(2, -60, 60, -180, 180);
      const k = Math.floor((t - 121) / 5) % 3;
      draw(c, BACKS.gatherFour, 0, k * 360, 640, 360, 0, 0);
    });
    this.se('Z1 ザー');
    this.se('Z1 気を溜める4');
    yield* this.wait(121);
    this.aim();
    yield;
    this.behind(this.kikouBack());
    yield* this.wait(26);
    this.behind(null);
    return 'down';
  }

  // ---- 餃子 ----
  * dodonpa() { // 191 どどんぱ
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    yield* this.wait(60);
    this.pose(this.A, 3, true);
    this.se('Z1 怪光線');
    yield* this.wait(9);
    this.effect(this.ball(BALL.orange, 240, 110));
    yield* this.wait(30);
    yield* this.cut(RAY.small);
  }

  * psychic() { // 192 超能力: no beam — the enemy is held and shaken
    this.se('Z1 気を溜める');
    this.pose(this.A, 1, true);
    this.behind(this.cycler(BACKS.psychic, 128, 160, 248, 110));
    yield* this.wait(125);
    this.aim();
    this.behind(this.kikouBack());
    yield* this.wait(27);
    this.behind(null);
    return 'psychic';
  }

  // effect 88: 餃子 flies in from the right and clings to the enemy's back (special sheet rows 4 / 5)
  clinging(start = 0) {
    const sheet = this.A.sheets.special;
    return (c, t) => {
      const f = t + start;
      if (f <= 21) draw(c, sheet, 0, 4 * 96, 96, 96, STD_ENEX + 60 - f * RAY_SPEED, STD_Y - 24);
      else draw(c, sheet, 0, 5 * 96, 96, 96, STD_ENEX + 74 - 21 * RAY_SPEED, STD_Y - 8);
    };
  }

  * psychoAttack() { // 193 サイコアタック
    this.pose(this.A, 0, true);
    yield* this.wait(30);
    yield* this.vanish(154);
    this.behind(this.shockBack());
    this.effect(this.clinging());
    const x = this.G.x;
    for (let t = 0; t < 62; t++) {
      if (t === 21) { this.se('Z1 強打'); this.G.x = x - 2 * this.dir; }
      if (t === 23) this.G.x = x + 2 * this.dir;
      if (t === 25) this.G.x = x;
      yield;
    }
    this.behind(null);
    this.effect(null);
    return 'psycho';
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

  // ---- 悟空 after King Kai's training ----
  // back 17 (気を溜める9): the red aura of 界王拳, 3 frames of 640×356 every 5
  kaiokenAura() { return (c, t) => draw(c, BACKS.kaioken, 0, (Math.floor(t / 5) % 3) * 378, 640, 356, 0, 0); }

  * kaioken() { // 106 界王拳: the aura, he vanishes, then a flurry on the defender (effect 49)
    this.se('Z1 気を溜める7');
    this.pose(this.A, 6, true);
    this.behind(this.kaiokenAura());
    yield* this.wait(89);
    this.behind(null);
    this.se('Z1 高速移動');
    this.A.y = -200;
    yield* this.wait(41);
    this.se('Z1 逃げる');
    this.aim();
    const sheet = this.A.sheets.normal, P = [[10, 14], [20, 13], [30, 12], [35, 0], [39, 1], [43, 2], [46, 1], [50, 2], [53, 3],
      [56, 4], [60, 3], [63, 1], [66, 2], [70, 1], [999, 2]];
    this.behind(this.shockBack());
    this.effect((c, t) => {
      const row = P.find(([end]) => t <= end)[1];
      if (t >= 36 && t % 4 === 0 && t < 85) audio.se('Z1 打撃', 80);
      const x = t >= 61 && t <= 80 ? CENTER_CHAX - (t - 60) * 8 : t >= 81 && t <= 84 ? 80 + (t - 80) * 16 : CENTER_CHAX;
      if (this.p) draw(c, sheet, 0, row * 96, 96, 96, x, STD_Y);
      else { c.save(); c.translate(SW, 0); c.scale(-1, 1); draw(c, sheet, 0, row * 96, 96, 96, x, STD_Y); c.restore(); }
    });
    yield* this.wait(63);
    this.effect(null); this.behind(null);
    return 'shock';
  }

  * kaiokenKamehameha() { // 107 界王拳・カメハメ波
    this.se('Z1 気を溜める7');
    this.pose(this.A, 6, true);
    this.behind(this.kaiokenAura());
    yield* this.wait(89);
    this.se('Z1 気を溜める');
    this.pose(this.A, 3, true);
    yield* this.wait(71);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.orange, 230, 100));
    yield* this.wait(59);
    this.behind(null);
    yield* this.cut(RAY.huge, 27, -30);
  }

  * genkidama() { // 118 元気弾: the hands go up, the ball grows overhead, then it comes down on the defender
    this.se('Z1 気を溜める(元気弾)');
    this.pose(this.A, 7, true);
    this.behind((c, t) => draw(c, BACKS.demonV, 0, (Math.floor(t / 5) % 3) * 480, 640, 356, 0, 0));
    yield* this.wait(119);
    this.se('Z1 ザー');
    this.behind(this.cycler(BACKS.gather4, 640, 356, 0, 0, 3, 360));
    yield* this.wait(100);
    this.pose(this.A, 8, true);
    this.behind(null);
    yield* this.wait(90);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 9, true);
    this.effect((c, t) => { const k = Math.min(5, Math.floor(t / 10)); draw(c, POWER_BALL, k * 128, 0, 128, 128, 230, 76); });
    yield* this.wait(48);
    this.aim();
    yield;
    this.behind(this.shockBack());
    this.effect((c, t) => {
      if (this.p) draw(c, POWER_BALL, 256, 0, 128, 128, -400 + t * RAY_SPEED + 270, 120);
      else draw(c, POWER_BALL, 256, 0, 128, 128, SW - t * RAY_SPEED - 270, 120);
    });
    yield* this.wait(50);
    this.effect(null); this.behind(null);
  }

  // ---- the Saiyans and the Saibamen ----
  * selfDestruct() { // 404 自爆: it vanishes (after-images), then clings to its target and blows up
    this.pose(this.A, 0, true);
    this.A.x = this.p ? STD_CHAX : STD_ENEX; this.A.y = STD_Y;
    this.G.x = this.p ? CENTER_ENEX : CENTER_CHAX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    yield* this.wait(30);
    this.se('Z1 高速移動');
    const ax = this.A.x;
    this.A.y = -200;
    this.effect((c, t) => { if (t <= 68 && t % 4 === 0) spark(c, 0, 48, 64, 64, ax + 16, 150); });
    yield* this.wait(70);
    this.effect(null);
    this.se('Z1 飛ぶ');
    const G = this.G;
    this.A.y = G.y - 48; this.A.x = this.p ? G.x - 64 : G.x + 64;
    for (const [n, fr] of [[7, 14], [8, 13], [8, 12]]) {
      this.pose(this.A, fr, true);
      yield* this.wait(n);
      this.A.y += 16; this.A.x += this.p ? 24 : -24;
    }
    this.A.y = -200;
  }

  * nappaWave() { // 412 エネルギー波(ナッパ)
    this.se('Z1 ゴー');
    this.pose(this.A, 1, true);
    this.behind(this.cycler(BACKS.nappa, 190, 178, 220, 100));
    yield* this.wait(30);
    this.pose(this.A, 2, true);
    yield* this.wait(29);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 3, true);
    this.effect(this.ball(BALL.foe, 238, 122));
    yield* this.wait(61);
    this.behind(null);
    yield* this.cut(RAY.foeMid);
  }

  * nappaBlast() { yield* this.blast(4, 5, 'Z1 ゴー', 50, 50); } // 413 爆発波(ナッパ)
  * vegetaBlast() { yield* this.blast(5, 6, 'Z1 気を溜める3', 100, 80, 'Z1 エネルギー波'); } // 419 爆発波(ベジータ)
  // the blast that hits everyone: the charge, then the shock streaks on each defender (only those for the next ones)
  * blast(f1, f2, se, n1, n2, se2) {
    if (performance.now() - blastEnd > 500) {
      this.se(se); this.se('Z1 ザー');
      this.pose(this.A, f1, true);
      this.behind(this.cycler(BACKS.flame, 128, 192, 250, 56));
      yield* this.wait(n1);
      if (se2) { audio.seStop(); this.se(se2); }
      this.pose(this.A, f2, true);
      if (se2) this.behind((c, t) => draw(c, BACKS.demonV, 0, (Math.floor(t / 5) % 3) * 480, 640, 356, 0, 0));
      yield* this.wait(n2);
    }
    this.aim();
    this.behind(this.shockBack());
    yield* this.wait(61);
    this.behind(null);
  }

  * nappaMouth() { // 414 口からエネルギー波
    this.se('Z1 気を溜める3');
    this.pose(this.A, 6, true);
    this.behind(this.cycler(BACKS.nappa, 190, 178, 220, 100));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 7, true);
    this.behind(this.cycler(BACKS.nappaMouth, 256, 256, 190, 60));
    this.effect(this.ball(BALL.orange, 236, 92));
    yield* this.wait(61);
    this.behind(null);
    yield* this.cut(RAY.mid);
  }

  * vegetaWave() { // 416 エネルギー波(ベジータ)
    this.se('Z1 エネルギー波');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.foe, 238, 122));
    yield* this.wait(44);
    yield* this.cut(RAY.foeBig);
  }

  * galickGun() { // 420 ギャリック砲
    this.se('Z1 気を溜める6'); this.se('Z1 ゴー');
    this.pose(this.A, 7, true);
    this.behind((c, t) => draw(c, BACKS.galick, 0, (Math.floor(t / 5) % 3) * 380, 640, 356, 0, 0));
    yield* this.wait(40);
    this.pose(this.A, 8, true);
    yield* this.wait(40);
    this.se('Z1 エネルギー波2');
    this.effect(this.ball(BALL.purple, 250, 130));
    yield* this.wait(64);
    this.behind(null);
    yield* this.cut(RAY.huge, 27, -30);
  }

  * vegetaApe() { // 473 大猿変身: the power ball goes up, he looks at it — then the great ape (no damage)
    this.se('Z1 気を溜める6');
    this.pose(this.A, 9, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(80);
    this.se('Z1 高速移動');
    this.behind(this.cycler(BACKS.flame, 128, 192, 250, 56));
    this.effect((c, t) => draw(c, POWER_BALL, 0, 0, 128, 128, 234, t <= 21 ? 100 - t : 80));
    yield* this.wait(104);
    this.behind(null);
    this.pose(this.A, 10, true);
    yield* this.wait(25);
    this.se('Z1 繰気弾');
    this.pose(this.A, 11, true);
    this.effect((c, t) => draw(c, POWER_BALL, 0, 0, 128, 128, 226 - t * 4, 88 - t * 4));
    yield* this.wait(55);
    this.pose(this.A, 12, true);
    this.behind((c, t) => draw(c, BACKS.handOne, 0, (Math.floor(t / 5) % 10) * 48, 40, 48, 266, 116));
    yield* this.wait(41);
    audio.seStop();
    this.effect(null); this.behind(null);
    this.se('Z1 大猿');
    for (let f = 0; f < 60; f++) { this.A.y = Math.floor(f / 6) % 2 ? -200 : STD_Y; yield; }
    this.A.y = STD_Y;
    return 'none';
  }

  * apeWave() { // 685 エネルギー波(大猿ベジータ): from the mouth
    this.se('Z1 気を溜める3');
    this.pose(this.A, 1, true);
    yield* this.wait(40);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.foe, 236, 110));
    yield* this.wait(50);
    yield* this.cut(RAY.foeBig);
  }

  // the Garlic Jr. henchmen and their men
  * gingerWave() { yield* this.simpleWave(1, BALL.orange, 240, 110, RAY.small); } // 407 エネルギー波(ジンジャー・ニッキー系)
  * sanshoWave() { yield* this.simpleWave(1, BALL.orange, 230, 104, RAY.small); } // 424 エネルギー波(サンショ系)

  * sanshoBigWave() { // 425 強力エネルギー波(サンショ系): a pink ball and a ringed beam
    this.se('Z1 気を溜める2');
    this.pose(this.A, 2, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 1, true);
    this.effect(this.ball(BALL.pink, 230, 104));
    yield* this.wait(65);
    yield* this.cut(RAY.circlePink);
  }

  * nikkiBigWave() { // 408 強力エネルギー波(ジンジャー・ニッキー系): a pink ball, then a pink beam
    this.se('Z1 気を溜める2');
    this.pose(this.A, 0, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.pink, 250, 114));
    yield* this.wait(64);
    yield* this.cut(RAY.midPink);
  }

  * swordAttack() { // 409 刀攻撃(ジンジャー・ニッキー系): draws the sword, dashes, and cuts through the defender (effect 46)
    this.se('Z1 気を溜める2');
    this.pose(this.A, 0, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    audio.seStop();
    this.se('Z1 刀');
    yield;
    this.pose(this.A, 3, true);
    yield* this.wait(28);
    this.behind(null);
    this.se('Z1 高速移動');
    yield;
    for (const k of [4, 5, 6]) { this.pose(this.A, k, true); yield* this.wait(10); }
    yield* this.wait(5);
    const sheet = this.A.sheets.special;
    this.aim();
    yield;
    this.behind(this.shockBack());
    this.effect((c, t) => draw(c, sheet, 0, (4 + Math.min(6, Math.floor(Math.max(0, t - 1) / 10))) * 96, 96, 96, CENTER_ENEX, STD_Y));
    yield* this.wait(55);
    this.se('Z1 刀攻撃');
    yield* this.wait(27);
    this.effect(null);
    this.behind(null);
    return 'shock';
  }

  // 卡里克 and 卡里克(巨大化)
  * garlicBall() { // 426 エネルギー弾(ガーリック): a pink ball rises from his hand (effect 10), then flies in (effect 40)
    this.se('Z1 高速移動');
    this.pose(this.A, 1, true);
    this.effect((c, t) => draw(c, SOKIDAN_PINK, (t < 51 ? 0 : 1) * 128, 0, 128, 128, 230, 66));
    yield* this.wait(29);
    this.se('Z1 エネルギー波');
    yield;
    this.pose(this.A, 2, true);
    yield* this.wait(31);
    yield* this.cut((c, t) => draw(c, SOKIDAN_PINK, 256, 0, 128, 128, this.p ? -400 + t * RAY_SPEED : SW - t * RAY_SPEED, 120));
  }

  * garlicBigWave() { // 428 強力エネルギー波(ガーリック): charges (back 4), a pink ball (effect 8), the pink beam (effect 32)
    this.se('Z1 気を溜める2');
    this.pose(this.A, 3, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 70));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.pink, 252, 130));
    yield* this.wait(65);
    yield* this.cut(RAY.midPink);
  }

  * giantWave() { // 429 エネルギー波(ガーリック巨大化): the demon backdrop (back 2), a ball (effect 15), the big beam (effect 43)
    this.se('Z1 ゴー');
    this.pose(this.A, 0, true);
    this.behind(this.cycler(BACKS.demonV, 640, 356, 0, 0, 3, 480));
    yield* this.wait(30);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 1, true);
    this.effect(this.ball(BALL.foe, 248, 112));
    yield* this.wait(55);
    yield* this.cut(RAY.foeBig);
  }

  * blackHole() { // 430 ブラックホール波: the black hole gathers (back 13) while he strains, then the shock behind the target (back 1)
    this.se('Z1 ゴー');
    this.se('Z1 ザー');
    this.pose(this.A, 2, true);
    this.behind(this.cycler(BACKS.blackHole, 640, 356, 0, 0, 3, 378));
    for (let f = 1; f <= 100; f++) { this.pose(this.A, f > 70 ? 4 : 2 + (Math.floor((f - 1) / 10) % 2), true); yield; }
    yield* this.blackHoleAgain(false);
  }
  * blackHoleAgain(sound = true) { // the targets after the first: only the shock behind each one
    if (sound) { this.se('Z1 ゴー'); this.se('Z1 ザー'); }
    this.aim();
    this.behind(this.shockBack());
    yield* this.wait(61);
    this.behind(null);
  }

  // ---------- the Willow chapter ----------
  // positions in the original's enemy-attacks frame (party on the left), mirrored when the party attacks
  mx(x) { return this.p ? SW - 96 - x : x; }
  // after-images every 4th frame while the attacker is away at high speed
  afterImages(x, y, sheet = SPARK, big = false) {
    return (c, t) => { if (t % 4 === 0) draw(c, sheet, 0, big ? 0 : 48, big ? 96 : 64, big ? 96 : 64, x, y); };
  }
  // back 1 behind the defender plus one-frame flashes: red every `red` frames, white every `white` (690)
  flashes(red, white, start = 0) {
    return (c, t) => {
      const f = t + start;
      if (f % red === 0) { c.fillStyle = '#f00'; c.fillRect(0, 0, SW, SH); } else if (f % white === 0) { c.fillStyle = '#fff'; c.fillRect(0, 0, SW, SH); }
    };
  }

  // ---- 龜仙人 ----
  * zanzouken() { // 325 残像拳: vanishes, after-images round the defender, then the real one strikes from one of three places
    yield* this.wait(30);
    this.se('Z1 高速移動');
    const ax = this.A.x;
    this.A.y = -200;
    this.effect(this.afterImages(ax + 20, 150));
    yield* this.wait(41);
    this.effect(null);
    // (written for the party attacking, unlike the enemy films below)
    const px = (x) => (this.p ? x : SW - 96 - x);
    this.G.x = px(CENTER_ENEX); this.G.y = STD_Y; this.pose(this.G, 0, false); // 71: both on stage
    this.A.y = STD_Y;
    this.behind(this.shockBack());
    const spot = (k) => px(CENTER_CHAX - 48 * k);
    for (let f = 72; f <= 249; f++) {
      if (f === 85) this.se('DB3 残像拳');
      this.A.x = spot(rand(3));
      yield;
    }
    audio.seStop();
    const k = rand(3);
    this.A.x = spot(k);
    if (k === 0) { // 251: two quick kicks where it stands
      this.se('DB3 SE041'); this.pose(this.A, 1, true); yield* this.wait(8);
      this.se('DB3 SE041'); this.pose(this.A, 2, true); yield* this.wait(8);
    } else if (k === 1) { // 601: back off, then dash in with a punch
      this.pose(this.A, 16, true);
      this.se('Z1 飛ぶ');
      for (let f = 0; f < 46; f++) { if (f < 10) this.vel(-8, 0, 0, 0); else if (f >= 40) this.vel(24, 0, 0, 0); yield; }
      this.se('Z1 強打'); this.pose(this.A, 4, true); yield* this.wait(10);
    } else { // 901: from the far one, a dash and a punch
      this.pose(this.A, 16, true);
      for (let f = 0; f < 6; f++) { this.vel(16, 0, 0, 0); yield; }
      this.se('Z1 強打'); this.pose(this.A, 3, true); yield* this.wait(8);
    }
    this.behind(null);
    return 'shock';
  }

  * kameKamehameha() { // 326 元祖かめはめ波
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    yield* this.wait(50);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 3, true);
    this.effect(this.ball(BALL.orange, 238, 124));
    yield* this.wait(39);
    this.effect(null);
    yield* this.wait(10);
    yield* this.cut(RAY.mid);
  }

  * bankoku() { // 328 萬國驚天掌: the green aura (back 4), a green ball (effect 16), the green current (effect 44) — it numbs
    yield* this.wait(30);
    this.se('DB3 気を溜める1');
    this.pose(this.A, 4, true);
    this.behind(this.cycler(BACKS.auraGreen, 160, 222, 234, 70));
    yield* this.wait(120);
    this.behind(null);
    this.pose(this.A, 5, true);
    audio.seStop();
    this.se('DB3 エネルギー波1');
    this.effect(this.ball(BALL.green, 249, 112));
    yield* this.wait(39);
    this.effect(null);
    yield* this.wait(10);
    yield* this.cut(RAY.liquidGreen);
    return 'numb';
  }

  * maxKamehameha() { // 329 MAXパワーかめはめ波: the muscles swell in the red aura (back 17), then the huge wave (effect 48)
    this.se('Z1 気を溜める7');
    this.pose(this.A, 6, true);
    this.behind(this.kaiokenAura());
    yield* this.wait(89);
    audio.seStop();
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    yield* this.wait(71);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 3, true);
    this.effect(this.ball(BALL.orange, 238, 124));
    yield* this.wait(59);
    this.effect(null); this.behind(null);
    yield* this.wait(10);
    yield* this.cut(RAY.huge, 27, -30);
  }

  // ---- the bio-warriors (キシーメ・エビフリャー・ミソカッツン) ----
  * kishimeWhip() { // 559 電磁ムチ: charges (back 4 green), vanishes, whips the defender and shocks it (back 1)
    const A = this.A, G = this.G;
    this.pose(A, 1, true);
    yield* this.wait(30);
    this.se('Z1 怪しい気');
    this.behind(this.cycler(BACKS.auraGreen, 160, 222, 234, 50));
    for (let f = 0; f < 120; f++) { this.pose(A, f % 8 < 4 ? 2 : 3, true); yield; }
    this.behind(null);
    this.se('Z1 高速移動');
    const ax = A.x;
    A.y = -200;
    this.effect(this.afterImages(ax + 20, 134));
    yield* this.wait(41);
    this.effect(null);
    this.se('Z1 逃げる');
    G.x = this.mx(CENTER_CHAX); G.y = STD_Y; this.pose(G, 0, false);
    A.x = this.mx(CENTER_ENEX); A.y = STD_Y + 20;
    this.behind(this.shockBack());
    let n = 0;
    for (const [a, b, len] of [[6, 9, 11], [5, 8, 11], [4, 7, 11]]) {
      if (a === 4) A.y = STD_Y;
      for (let f = 0; f < len; f++, n++) { this.pose(A, n % 8 < 4 ? a : b, true); yield; }
    }
    this.se('DB3 SE091');
    for (let f = 0; f < 96; f++, n++) { // 225-320: the current through the whip, the defender trembling
      this.pose(A, n % 8 < 4 ? 10 : 11, true);
      G.x = this.mx(CENTER_CHAX) - (f % 2 ? 4 : 0) * this.dir;
      yield;
    }
    audio.seStop();
    G.x = this.mx(CENTER_CHAX);
    A.y = -200;
    this.behind(null);
    return 'shock';
  }

  * ebiIce() { // 562 氷結攻撃: the blue aura, a blue ball (effect 16), the freezing liquid (effect 44) — it freezes
    this.se('Z1 怪しい気');
    this.behind(this.cycler(BACKS.auraBlue, 160, 222, 234, 70));
    for (const [fr, n] of [[1, 44], [2, 45], [3, 20]]) { this.pose(this.A, fr, true); yield* this.wait(n); }
    this.behind(null);
    audio.seStop();
    this.se('Z1 エネルギー波');
    this.effect(this.ball(BALL.blue, 238, 128));
    yield* this.wait(39);
    this.effect(null);
    yield* this.wait(10);
    yield* this.cut(RAY.liquidBlue);
    return 'ice';
  }

  * misoStretch() { // 563 皮伸び攻撃: vanishes, drops in, the defender kicks it away, and it falls on the defender from above
    const A = this.A, G = this.G;
    this.pose(A, 0, true);
    yield* this.wait(30);
    this.se('Z1 高速移動');
    const ax = A.x;
    A.y = -200;
    this.effect(this.afterImages(ax + 20, 134));
    yield* this.wait(61);
    this.effect(null);
    this.se('Z1 高速移動'); // 91: on the defender's stage, coming down from above
    G.x = this.mx(CENTER_CHAX); G.y = STD_Y; this.pose(G, 0, false);
    A.x = this.mx(CENTER_ENEX); A.y = -180; this.pose(A, 0, false);
    this.behind(this.shockBack());
    this.effect(this.afterImages(A.x + 20, 142));
    yield* this.wait(39);
    this.effect(null);
    A.y = STD_Y;
    yield* this.wait(50);
    this.pose(G, 16, false); // 181: backs away
    for (let f = 0; f < 41; f++) { G.x -= 4 * this.dir; yield; }
    yield* this.wait(9);
    this.pose(G, 3, false); // 231: kicks
    for (let f = 0; f < 11; f++) { if (f === 5) this.se('Z1 ブン'); G.x += 16 * this.dir; yield; }
    this.pose(A, 15, false);
    for (let f = 0; f < 4; f++) { G.x += 2 * this.dir; yield; }
    yield* this.wait(25);
    this.se('Z1 吹っ飛ぶ'); // 271: it springs back and knocks the defender off
    this.pose(A, 0, false); this.pose(G, 16, false);
    for (let f = 0; f < 30; f++) { G.x -= 16 * this.dir; yield; }
    this.se('Z1 飛ぶ'); // 301: up and away
    this.pose(A, 16, false);
    for (let f = 0; f < 15; f++) { A.y -= 16; yield; }
    G.x = this.mx(640); A.x = this.mx(CENTER_CHAX - 8); A.y = -270; // 316
    yield* this.wait(14);
    for (let f = 0; f < 24; f++) { G.x -= 16 * this.dir; A.y += 16; yield; } // 330: the defender comes back under it
    this.behind(null);
    return 'crush';
  }

  * misoWave() { yield* this.simpleWave(1, BALL.orange, 230, 104, RAY.small); } // 564 エネルギー波(ミソカッツン)

  * misoBigWave() { // 565 強力エネルギー波(ミソカッツン): aura (back 4), a pink ball (effect 18), the ringed beam (effect 47)
    this.se('Z1 気を溜める2');
    this.pose(this.A, 0, true);
    this.behind(this.cycler(BACKS.aura, 160, 222, 234, 60));
    yield* this.wait(60);
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.pink, 250, 104));
    yield* this.wait(64);
    this.behind(null);
    yield* this.cut(RAY.circlePink);
  }

  // ---- Dr. ウィロー (192×192 frames) ----
  * willowWave() { // 686 エネルギー波: a long eerie charge, a ball (effect 5), the big enemy beam (effect 43)
    this.se('Z1 怪しい気');
    this.pose(this.A, 1, true);
    yield* this.wait(120);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 2, true);
    this.effect(this.ball(BALL.orange, 212, 102));
    yield* this.wait(60);
    yield* this.cut(RAY.foeBig);
    return 'big';
  }

  * photonStrike() { // 687 フォトンストライク: two balls (effect 97), two big beams (effect 98)
    this.se('Z1 怪しい気'); this.se('Z1 気を溜める');
    this.pose(this.A, 3, true);
    yield* this.wait(120);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 4, true);
    const one = this.ball(BALL.orange, 212, 102), two = this.ball(BALL.orange, 288, 102);
    this.effect((c, t) => { one(c, t); two(c, t); });
    yield* this.wait(60);
    const [sheet, h, y] = RAY.foeBig;
    yield* this.cut((c, t) => {
      for (const d of [-44, 44]) {
        if (this.p) draw(c, sheet, 0, 0, 400, h, -400 + t * RAY_SPEED, y + d);
        else draw(c, sheet, 0, h, 400, h, SW - t * RAY_SPEED, y + d);
      }
    });
    return 'big';
  }

  * willowMouth() { // 688 口からエネルギー波: the demon backdrop (back 2), a ball at the mouth (effect 5), the huge wave (effect 48)
    this.se('Z1 怪しい気'); this.se('Z1 気を溜める3');
    this.pose(this.A, 6, true);
    this.A.x += 6 * -this.dir;
    this.behind(this.cycler(BACKS.demonV, 640, 356, 0, 0, 3, 480));
    yield* this.wait(120);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.pose(this.A, 7, true);
    this.effect(this.ball(BALL.orange, 254, 136));
    yield* this.wait(60);
    this.behind(null);
    yield* this.cut(RAY.huge);
    return 'big';
  }

  * gigantic() { // 689 ギガンティックボマー: the charge (back 15), he vanishes, and his whole body rushes across the stage
    this.se('Z1 怪しい気'); this.se('Z1 気を溜める');
    this.pose(this.A, 5, true);
    this.behind(this.cycler(BACKS.nappaMouth, 256, 256, 190, 60));
    yield* this.wait(121);
    this.behind(null);
    this.se('Z1 高速移動');
    const ax = this.A.x;
    this.A.y = -200;
    this.effect(this.afterImages(ax + 4, 134, AFTER_BIG, true));
    yield* this.wait(60);
    const rush = (from) => (c, t) => {
      const im = img(WILLOW_RUSH);
      if (!im.ok) return;
      const k = Math.floor(t / 2) % 2, x = 640 - 16 * (t + from);
      if (this.p) { c.save(); c.translate(SW, 0); c.scale(-1, 1); c.drawImage(im.im, 472 * k, 0, 472, 244, x, 40, 472, 244); c.restore(); }
      else c.drawImage(im.im, 472 * k, 0, 472, 244, x, 40, 472, 244);
    };
    this.se('DB3 エネルギー波2');
    this.effect(rush(0));
    yield* this.wait(100);
    this.aim(); // 281: on the defender
    this.effect(rush(0));
    yield* this.wait(24);
    this.effect(null);
    return 'big';
  }

  * planetGeyser() { // 690 プラネットゲイザー: the charge (back 16) with red and white flashes, then the ground erupts under everyone
    this.se('Z1 ゴー'); this.se('Z1 ザー'); this.se('Z1 怪しい気');
    this.pose(this.A, 5, true);
    this.behind(this.cycler(BACKS.galick, 640, 356, 0, 0, 3, 380));
    yield* this.wait(121);
    audio.seStop();
    this.se('Z1 エネルギー波');
    this.pose(this.A, 4, true);
    this.effect(this.flashes(30, 15, 121));
    yield* this.wait(60);
    this.aim();
    this.se('Z1 ゴー'); this.se('Z1 ザー'); this.se('Z1 エネルギー波');
    this.behind(this.shockBack());
    this.effect(this.flashes(12, 6, 182));
    yield* this.wait(61);
    this.effect(null); this.behind(null);
    return 'big';
  }
  * geyserAgain() { // the targets after the first: only the eruption under each one
    this.se('Z1 ゴー'); this.se('Z1 ザー'); this.se('Z1 エネルギー波');
    this.aim();
    this.behind(this.shockBack());
    this.effect(this.flashes(30, 15));
    yield* this.wait(61);
    this.effect(null); this.behind(null);
    return 'big';
  }

  // ---- the damage films these moves end with ----
  * bigBoom() { // 43 爆発系Z2大: the big explosion (effect 104), the defender blown away
    this.se('Z1 爆発1');
    this.showHit();
    this.pose(this.G, 17);
    const ex = (this.p ? 298 : 204) - 16;
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 4) draw(c, BOOM_BIG, k * 158, 0, 158, 160, ex, 104); });
    for (let f = 1; f < 60; f++) {
      if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (f === 40) this.effect(null);
      yield;
    }
  }

  * frozen() { // 70 氷結: the ice closes round the defender (effect 94)
    this.se('DB3 キラーン');
    this.showHit();
    this.pose(this.G, 16);
    this.effect((c, t) => draw(c, ICE, (t < 8 ? 0 : t < 16 ? 1 : 2) * 96, 0, 96, 96, 230, 120));
    yield* this.wait(100);
    this.effect(null);
  }

  * crushed() { // 71 吹っ飛び 縦: pressed down out of the stage
    this.se('Z3 跳ね返し');
    this.showHit();
    this.pose(this.G, 17);
    for (let f = 1; f < 25; f++) { if (f <= 14) this.vel(0, 0, 0, 20); yield; }
  }

  * numb() { // 73 痺れ: the defender shakes
    this.showHit();
    this.pose(this.G, 0, false);
    this.se('DB3 SE091');
    const x = this.G.x;
    for (let f = 1; f <= 100; f++) { this.G.x = x + (f % 2 ? -6 : 6); yield; }
    this.G.x = x;
    audio.seStop();
  }

  // ---------- drawing ----------
  // the fighters and effects on a transparent stage; the battle draws the background and the fade around it
  render() {
    const c = this.c;
    c.clearRect(0, 0, SW, SH);
    if (this.bfx) this.bfx.draw(c, this.bfx.f);
    for (const o of [this.R, this.L]) {
      if (o.y < -96 || o.y > SH) continue;
      const z = o.sheets.size || 96; // the Great Ape: 192×192 frames, standing on the same ground
      draw(c, o.sp ? o.sheets.special : o.sheets.normal, 0, o.frame * z, z, z, Math.round(o.x - (z - 96) / 2), Math.round(o.y - (z - 96)));
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
  'Z1 怪光線', 'Z1 ザー', 'Z1 貫光線', 'Z1 パワーアップ', 'Z1 大猿', 'Z1 ブン', 'Z1 気円斬', 'Z1 逃げる', 'Z1 分身', 'Z1 気を溜める4',
  'Z1 強打', 'Z3 超能力', 'Z1 刀', 'Z1 刀攻撃', 'Z1 気を溜める7', 'Z1 気を溜める(元気弾)', 'Z1 ゴー', 'Z1 気を溜める6', 'Z1 繰気弾',
  'Z1 飛ぶ', 'DB3 残像拳', 'DB3 SE041', 'DB3 気を溜める1', 'DB3 エネルギー波1', 'DB3 エネルギー波2', 'DB3 SE091', 'DB3 キラーン',
  'Z1 怪しい気', 'Z1 吹っ飛ぶ', 'Z1 爆発1', 'Z1 満月'];
// for the S-combo films (src/combo-anime.js)
export { draw, spark, BALL, RAY, BACKS, MAKANKO_BALL, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED };
