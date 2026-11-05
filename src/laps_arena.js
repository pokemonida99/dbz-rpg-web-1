// 第二輪的覺醒頭目（鬥技場等級 70～91），docs/laps-plan.md 第 1 節。分工 C 的檔案（docs/laps-c.md）。
// The moves of the 周回 bosses (enemies 256-280) that had no film of their own, on the enemies' shared stage (src/anime_foes_common.js):
//   392 / 397 / 577 超能力 → 402 / 407 / 587 → 2492 (all.rb 124693), damage 25 (65694: also 565 → 575, played as its own film)
//   432 / 438 / 443 太陽拳 → 442 / 448 / 453 → 2532 (126612), damage 30 (66057)
//   583 リベンジャーチャージ → 593 → 2683 (130725), no damage pattern (66717)
//   374 エネルギー波 → 384: 2431 in the Z3 switch (65679), 達列斯(覺醒) (the Z2 達列斯 keeps its own: feFallback)
// and the jumps: ?dev=lapc (second round, in front of the arena, ranks 1-69 cleared), lapc75 (ranks to 74 cleared),
// lapcfirst (the same save on a first round: ranks 70 and on stay shut), lapcfirst68 (rank 68 to play, for the way to Arale).
import { Duel } from './anime.js?v=20261104-0742';
import { feRegister, feFilms, feFallback, foeId } from './anime_foes_common.js?v=20261104-0742';
import { registerZ3 } from './z3.js?v=20261104-0742';
import { devState } from './zg_bojack.js?v=20261104-0742';

const pic = (n) => `Graphics/Pictures/${n}`;
const SUN = { 1: pic('Z3_必殺技_カットイン_太陽拳(セル第１形態).png'), 2: pic('Z3_必殺技_カットイン_太陽拳(セル第２形態).png'),
  3: pic('Z3_必殺技_カットイン_太陽拳(セル完全体).png') };
const sunOf = (id) => (id === 128 || id === 268 ? SUN[2] : id === 129 || id === 135 || id === 269 ? SUN[3] : SUN[1]);
// hatchiyack_charge/hatchiyack_charge_1-520: 268×304, only the frames that differ are on disk
const chargeFrame = (n) => `Graphics/Pictures/hatchiyack_charge/hatchiyack_charge_${n}.png`;
const chargeNo = (n) => (n <= 128 ? 1 : n <= 136 ? 129 : n >= 162 && n <= 192 ? 162 : n >= 209 && n <= 262 ? 209 : n >= 369 ? 369 : n);
const CHARGE_NOS = () => [...new Set(Array.from({ length: 520 }, (_, k) => chargeNo(k + 1)))];

const again = (z) => { z.tec = true; z.cut = true; z.cutFlag = true; z.mirror = true; };
feFilms({
  lapcPsychic: { cut: true, no: 1, again },
  lapcSun: { pics: () => Object.values(SUN), again: (z) => { z.tec = true; } },
  lapcCharge: { no: 1, pics: () => CHARGE_NOS().map(chargeFrame) },
});
feRegister({ 392: 'lapcPsychic', 397: 'lapcPsychic', 577: 'lapcPsychic', 432: 'lapcSun', 438: 'lapcSun', 443: 'lapcSun', 583: 'lapcCharge',
  374: 'feWave' });

const own = (d) => !d.p && foeId(d) >= 101; // (the Z3 switch; an earlier enemy plays the skill's film from before)
Object.assign(Duel.prototype, {
  * lapcPsychic() { // 2492 超能力: he strains with his hand out, then the member in the side strips — and it shakes (25)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    if (z.again) { // @all_attack_count >= 2
      for (let f = 0; f <= 27; f++) { if (f === 0) z.displayOut(); yield* z.out(); }
      return yield* z.damage(25);
    }
    for (let f = 0; f <= 146; f++) {
      if (f === 0) {
        z.se('Z1 気を溜める');
        if (z.id === 172) { z.pose(11); this.A.x += 4; } else z.pose(2);
        z.color = 0;
      } else if (f === 109) { z.seStop(); z.fxReset(); } else if (f === 119) { z.displayOut(); z.tecNo = 1; }
      yield* z.out();
    }
    return yield* z.damage(25);
  },

  * lapcSun() { // 2532 太陽拳: his cut-in slides in over the stage with three white flashes, then three more on the member (30)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), sheet = sunOf(z.id), flashAt = (f, s) => (f >= s && f <= s + 2) || (f >= s + 10 && f <= s + 12) || (f >= s + 20 && f <= s + 22);
    if (z.again) { // @all_attack_count >= 2
      for (let f = 0; f <= 41; f++) {
        if (f === 0) { z.se('Z2 吹っ飛ぶ'); z.displayOut(); } else if (flashAt(f, 11)) z.fill('#fff');
        yield* z.out();
      }
      return yield* this.lapcHit30(z);
    }
    for (let f = 0; f <= 151; f++) {
      if (f === 1) z.fxReset();
      else if (f >= 2 && f <= 90) {
        if (f <= 22) {
          this.A.x += 32;
          z.back(sheet, 0, 0, 640, 64, -640 + 32 * (f - 2), 146);
        } else z.back(sheet, 0, 0, 640, 64, 0, 146);
        if (f === 22) z.se('Z2 吹っ飛ぶ');
        if (flashAt(f, 22)) z.over((c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 640, 356); });
      } else if (f === 101) z.displayOut();
      else if (flashAt(f, 111)) z.over((c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 640, 356); });
      yield* z.out();
    }
    return yield* this.lapcHit30(z);
  },
  * lapcHit30(z) { // damage 30 太陽拳系 (71987): the member blown back, the damage (none: element 11) shown
    z.U = []; z.O = []; z.format();
    if (!this.hit) return 'miss';
    z.se('Z1 吹っ飛ぶ');
    this.showHit();
    z.gpose(16);
    for (let f = 0; f < 60; f++) {
      z.U = []; z.O = [];
      if (f <= 19) this.G.x -= 20;
      yield;
    }
    return 'none';
  },

  * lapcCharge() { // 2683 リベンジャーチャージ: 520 frames of his close-up, nothing happens to the member
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f <= 520; f++) {
      if (f === 0) { z.color = 3; this.A.y = -200; } else {
        if (f === 162) z.se('ZG SE053');
        z.back(chargeFrame(chargeNo(f)), 0, 0, 268, 304, 186, 52);
      }
      yield* z.out();
    }
    z.U = []; z.O = []; z.format();
    return 'none';
  },
});
// sounds these films play beyond src/anime_foes_common.js's, for tools/copy_assets.py
export const LAPC_SOUNDS = ['Z1 気を溜める', 'Z2 吹っ飛ぶ', 'Z1 吹っ飛ぶ', 'ZG SE053', 'Z3 超能力'];

// ---------- development ----------
function dev(game, step) {
  const m = /^lapc(first)?(\d+)?$/.exec(step);
  if (!m) return false;
  devState(game, 'zgarena');
  const s = game.state, n = Number(m[2]) || 70, a = s.flags.arena = { open: [], clear: [], first: [] };
  for (let x = 0; x < n - 1; x++) { a.open[x] = true; a.clear[x] = 1; }
  if (n <= 69) a.open[n - 1] = true; // (ranks 70 and on: left to set_btl_arena_fight_rank's conditions)
  s.sw[849] = true; // オゾット変身撃破 (ZG cleared)
  s.sw[852] = n > 69; // アラレと会った
  s.sw[586] = true; // Z外伝クリア
  s.sw[600] = true; // ブウ撃破 (page 7211: zgbj:90041 gives card 168 only with it)
  s.sw[480] = true; // (the arena's first-time explanation)
  if (!m[1]) { s.laps = 1; s.sw[860] = true; }
  for (const x of [...s.party, ...Object.values(s.bench || {})]) if (x) { x.level = 99; x.exp = game.world.actors[x.id].exp[99]; x.maxLv = 99; }
  return true;
}
registerZ3('lapc', { dev });
