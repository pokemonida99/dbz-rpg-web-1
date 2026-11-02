// Card battle, following the original rules (docs/battle-rules.md), drawn on the canvas with the original
// battle-screen art so it looks like the classic version, stacked for a portrait phone:
//   status window  — TN, faces, LV / HP / KI in the original digits
//   stage          — choosing: enemy faces on the ground strip; fighting: the classic one-on-one battle film
//                    for each action (src/anime.js)
//   lower area     — message window; choosing: buttons + the six cards; fighting: the original duel bar
//                    (party face, HP/KI, both cards, enemy face)
// Choosing (touch): the highlighted member takes the card you tap; one that allows a special move opens the move
// window over the stage. Tapping outside the window / anything but an enemy while targeting cancels that card.
// A picked card wears its member's face: tap it (or the face above) to pick again for that member; 返回 undoes the
// last pick. With everyone picked a big 出招！ starts the turn (or right away with 設定「選完直接出招」).
import { view, img, loadImages, audio, sleep, rand } from './core.js?v=20261102-1935';
import { levelUp, EXP_RATE } from './party.js?v=20261102-1935';
import { Duel, ANIME_IMAGES, SW, SH, BACK_Y } from './anime.js?v=20261102-1935';
import { commandButtons, autoSkill, autoTarget, tally } from './partymenu.js?v=20261102-1935'; // command row, 作戰, counters
import * as items from './items.js?v=20261102-1935'; // item cards: effects that touch the battle rules
import { tryCombo, announceCombos, comboHints, hasCombos, HINT_TEXT } from './combo.js?v=20261102-1935'; // 組合技
import * as growth from './growth.js?v=20261102-1935'; // passive skills, proficiency, KO, SP / ZP / EXP pool
import { superSaiyan, moveTransforms, afterBattle as ssAfterBattle } from './supersaiyan.js?v=20261102-1935'; // 超サイヤ人

export const SCHOOL = ['必', '龜', '神', '界', '魔', '惑', '基', '悟', '超'];
const HAND = 6;
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64; row = actor id - 3; columns: normal, hurt, KO
const FOE_FACES = 'Graphics/Pictures/Z1_顔敵.PNG'; // 64×64; row = enemy id; columns: normal, hurt
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // 16×16 cells: row 0 black digits + "/", row 1 HPKILV, row 2 white digits
const FRAME_IMG = 'ui/frame.png'; // the Z1 window border (8px corners)
const ICONS = 'Graphics/Pictures/アイコン.PNG'; // 16×16 cursors: Z1 ▼ = cell 12, its blink frame = cell 14 (set_tate_cursor_blink)
// the original's cursor sounds (139_Public.rb $BGM_CursorOn / $BGM_CursorMove / $BGM_Error)
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_ERR = 'Z3 エラー';
const PURPLE = '#9040f0', CREAM = '#ffd8a0', INK = '#301808', RUST = '#d0480c';
const FONT = 'Cubic11, system-ui, sans-serif';
// portrait battle backgrounds made for this version (pixel art in the style of the Z1 field strip), 400×600;
// one is picked per battle and kept for the whole fight. Film row 0 sits on image row BACKDROP_TOP.
const BACKDROPS = ['bg/battle_night.png', 'bg/battle_dusk.png', 'bg/battle_day.png'];
const BACKDROP_TOP = 205;
// 設定「選完直接出招」(src/fieldmenu.js keeps it in sync): resolve as soon as everyone has picked, like the original
export const battleOpts = { quick: false };
// rules other modules add (src/cards_a.js: the skill cards' passive skills, 月亮和尾巴's Great Ape); each is optional:
//   cardFor(b, m, cd) → cd   kiCost(b, m, skill, ki, cd) → ki   power(b, m, skill, P) → P   dealt(b, m, skill, d) → d
//   taken(b, m, d) → d   act(b, i, skill) → true if it took the action   hit(b, m, foe, dmg)   hurt(b, m, foe, skill, dmg)
//   recover(b)   end(b)
export const battleHooks = {};

export function battleImages(world) {
  const sheets = new Set([...BACKDROPS, CARDS, FACES, FOE_FACES, DIGITS, FRAME_IMG, ICONS, ...ANIME_IMAGES]);
  for (const a of Object.values(world.actors)) { sheets.add(a.sprite); sheets.add(a.special); }
  for (const [id, e] of Object.entries(world.enemies)) if (+id < 30) { sheets.add(e.sprite); sheets.add(e.portrait); } // later parts' enemies load when met
  return [...sheets];
}

// ---------- cards ----------
// Early Z1 player cards: school 必/龜/神/魔 at 1/4 each; enemies also roll 惑 (1/5 each). From 概況 11 on (the Saiyans,
// variable 43 ≥ 11) 界 takes the place of 神 (createcardval_chk, all.rb 12325).
let cardGame = null;
export function setCardGame(g) { cardGame = g; }
const era = () => ((cardGame && cardGame.state && cardGame.state.var && cardGame.state.var[40]) || 0); // 1: Z2
const late = () => ((cardGame && cardGame.state && cardGame.state.var && cardGame.state.var[43]) || 0) >= 11;
// Z2 (variable 40 = 1, create_card_i all.rb 20730): rand($cardi_max) without 神・基・悟 for the party (without 神・悟
// for enemies), and without 界 once Goku is a Super Saiyan; $cardi_max is 7, 9 from the Super Saiyan battle on (超)
function z2Schools(foe) {
  const s = cardGame && cardGame.state;
  if (!s || !s.var || !s.var[40]) return null;
  if (s.var[40] >= 2) return z3Schools(s, foe);
  const no = foe ? [2, 7] : [2, 6, 7];
  if (s.ss && s.ss[1]) no.push(3);
  const v43 = s.var[43] || 0; // the party: 41 Z2 たった一人の最終決戦, 143-149 ZG バーダック一味編 — without 亀・界・魔・超・造
  if (!foe && (v43 === 41 || (v43 >= 143 && v43 <= 149))) no.push(1, 3, 4, 8, 9);
  return Array.from({ length: s.cardiMax || 7 }, (_, i) => i).filter((i) => !no.includes(i));
}
// Z3 (variable 40 = 2, $cardi_max = 10, create_card_i all.rb 20768-20830). Party: without 神・ギニュー・悟・造 (造 is
// back when an android — class 9 — is in the party), without 界 while Goku is a Super Saiyan, without 超 while no one
// is; a party of one rolls 必, its own school and one more (the original's list trick, kept as it is). Enemies: without
// 神・界・ギニュー・悟, and 造 too before the androids (variable 43 58-96). (The Z4 / ZG area rules are not here yet.)
function z3Schools(s, foe) {
  const max = s.cardiMax || 10;
  const all = Array.from({ length: max }, (_, i) => i);
  const v43 = s.var[43] || 0;
  if (foe) {
    const no = [2, 3, 6, 7];
    if (!(v43 >= 58 && v43 <= 96)) no.push(9);
    return all.filter((i) => !no.includes(i));
  }
  const party = s.party || [];
  let no = party.some((m) => m.school === 9) ? [2, 6, 7] : [2, 6, 7, 9];
  if (s.ss && s.ss[1]) no.push(3);
  if (!s.ss || !Object.values(s.ss).some(Boolean)) no.push(8);
  if (v43 >= 143 && v43 <= 149) no.push(1, 3, 4, 9); // ZG バーダック一味編: without 亀・界・魔・造
  if (party.length === 1) {
    no = [2, 6, 7];
    if (!s.sw[435]) no.push(9);
    for (let x = 1; x <= max; x++) if (party[0].school !== x) no.push(x);
    no.splice(rand(no.length - 1 - 2) + 2, 1); // noncardi.delete_at(rand(size-1-2)+2)
  }
  return all.filter((i) => !no.includes(i));
}
const pick = (a) => a[rand(a.length)];
// enemies who change form in battle (all.rb 53470 @ene_tec_oozaru): the move → who becomes whom; each move once a battle
// ($battle_begi_oozaru_run / $battle_tare_oozaru_run / $battle_sura_big_run, chk_scombo_flag 140335). The Great Apes
// (ape) turn back when their tail is cut (68895); a later part can add its own: FOE_FORMS[skill] = { …, film sheets }
export const FOE_FORMS = {
  373: { to: { 12: 26 }, ape: true, say: '變成了大猿！' }, // ベジータ
  644: { to: { 59: 70, 233: 222 }, ape: true, say: '變成了大猿！' }, // ターレス (Z2 / ZG(強))
  645: { to: { 60: 71, 255: 223 }, say: '巨大化了！' }, // スラッグ (Z2 / ZG(強))
};
export function newCard() { return { a: rand(8), g: rand(8), s: pick(z2Schools(false) || (late() ? [0, 1, 3, 4] : [0, 1, 2, 4])) }; }
export const enemyCard = () => ({ a: rand(8), g: rand(8), s: pick(z2Schools(true) || (late() ? [0, 1, 3, 4, 5] : [0, 1, 2, 4, 5])) });
export function newHand() { return Array.from({ length: HAND }, newCard); }
// 「氣」 (school 16, the 時之間's 戦闘練習): it becomes the school of whoever plays it (all.rb 48888)
export const KI_CARD = 16;
const ownSchool = (cd, m) => cd.s === m.school || cd.s === KI_CARD;

export function rollEncounter(world) {
  const pool = world.encounters['1'];
  const n = rand(3) + 1;
  return Array.from({ length: n }, () => pool[rand(pool.length)]);
}

// ---------- damage (docs/battle-rules.md §4) ----------
// P = the move's power with proficiency (growth.power)
function playerDamage(b, m, skill, card, foe, foeCard, P) {
  let d = Math.floor(((m.atk + P) * 8 * (card.a + 7 + rand(2) + 1)) / Math.floor((foe.def * (foeCard.g + 7)) / 3));
  if (m.school === 8) d = Math.floor(d * 1.3); // class 9 (超サイヤ人)
  if (card.s === m.school || items.powerUp(m)) d = Math.floor(d * 1.3);
  d = growth.dealt(b, m, skill, d, { card, foe, foeCard }); // passive skills (set_damage_add)
  if (battleHooks.dealt) d = battleHooks.dealt(b, m, skill, d);
  if (skill && skill.noDamage) d = 0;
  if (b.foesEvade) return -1; // switch 18 敵必ず回避 (an event battle: src/z3c.js, Mecha Frieza)
  const avoid = Math.trunc((foe.agi * 1.2 + foeCard.g) / 3 - (m.agi * 1.1 + card.a) / 3);
  if (avoid > 0 && rand(100) + 1 < avoid) return -1;
  return b.dmgRate ? Math.trunc(d * b.dmgRate) : d; // variable 81 味方攻撃ダメージn倍 (an event battle: src/z3.js fight)
}
function enemyDamage(b, foe, skill, card, m, guardCard) {
  const P = skill ? Math.trunc((foe.atk * skill.power) / 100) - foe.atk : 0;
  let d = Math.floor(((foe.atk + P) * 8 * (card.a + 7 + rand(2) + 1)) / Math.floor((m.def * (guardCard.g + 7)) / 3));
  if (card.s === foe.school) d = Math.floor(d * 1.2);
  if (m.school === 8) d = Math.floor(d * 0.85); // the defender is of class 9 (超サイヤ人)
  if (items.guardUp(m)) d = Math.floor(d * 0.7);
  d = growth.taken(b, m, d, { card: guardCard, foe, foeCard: card }); // passive skills (set_damage_add)
  if (battleHooks.taken) d = battleHooks.taken(b, m, d);
  if (items.evades(m)) return -1;
  const avoid = growth.ext('avoid', Math.trunc((m.agi * 1.2 + guardCard.g) / 3 - (foe.agi * 1.1 + card.a) / 3), b, m, foe); // (殘像拳: src/cards_b.js)
  return avoid > 0 && rand(100) + 1 < avoid ? -1 : b.foeRate ? Math.trunc(d * b.foeRate) : d; // variable 82 敵攻撃ダメージn倍 (src/z3e.js)
}

// ---------- drawing helpers (original art) ----------
function win(c, x, y, w, h, fill = CREAM) {
  c.fillStyle = fill;
  c.fillRect(x + 3, y + 3, w - 6, h - 6);
  const f = img(FRAME_IMG);
  if (!f.ok) return;
  const k = 8, im = f.im;
  c.drawImage(im, 0, 0, k, k, x, y, k, k);
  c.drawImage(im, 64 - k, 0, k, k, x + w - k, y, k, k);
  c.drawImage(im, 0, 64 - k, k, k, x, y + h - k, k, k);
  c.drawImage(im, 64 - k, 64 - k, k, k, x + w - k, y + h - k, k, k);
  c.drawImage(im, k, 0, 64 - 2 * k, k, x + k, y, w - 2 * k, k);
  c.drawImage(im, k, 64 - k, 64 - 2 * k, k, x + k, y + h - k, w - 2 * k, k);
  c.drawImage(im, 0, k, k, 64 - 2 * k, x, y + k, k, h - 2 * k);
  c.drawImage(im, 64 - k, k, k, 64 - 2 * k, x + w - k, y + k, k, h - 2 * k);
}
// a number in the original 16px digits, right-aligned at rx; row 0 = black, row 2 = white
function num(c, n, rx, y, row = 0) {
  const d = img(DIGITS);
  if (!d.ok) return;
  const s = String(Math.max(0, Math.floor(n)));
  for (let i = 0; i < s.length; i++) c.drawImage(d.im, 16 * Number(s[i]), 16 * row, 16, 16, rx - 16 * (s.length - i), y, 16, 16);
}
const LETTER = { H: 0, P: 1, K: 2, I: 3, L: 4, V: 5 };
function word(c, w, x, y) {
  const d = img(DIGITS);
  if (!d.ok) return;
  [...w].forEach((ch, i) => c.drawImage(d.im, 16 * LETTER[ch], 16, 16, 16, x + 16 * i, y, 16, 16));
}
function slash(c, x, y) { const d = img(DIGITS); if (d.ok) c.drawImage(d.im, 160, 0, 16, 16, x, y, 16, 16); }
// the original Z1 card (010_Share.rb set_card_frame): 64×96 frame, attack ball, guard numeral, school glyph
function card(c, cd, x, y) {
  const s = img(CARDS);
  if (!s.ok) return;
  c.drawImage(s.im, era() >= 1 ? 448 : 0, 96, 64, 96, x, y, 64, 96); // the Z2 card face
  c.drawImage(s.im, 32 * cd.a, 0, 32, 32, x + 2, y + 2, 32, 32);
  c.drawImage(s.im, 32 * cd.g, 32, 32, 32, x + 30, y + 62, 32, 32);
  c.drawImage(s.im, 32 * cd.s, 64, 32, 32, x + 16, y + 32, 32, 32);
}
// "[神]" school tag under a face
function tag(c, school, x, y) {
  const s = img(CARDS);
  if (!s.ok) return;
  c.drawImage(s.im, 0, 192, 64, 32, x, y, 64, 32);
  c.drawImage(s.im, 32 * school, 64, 32, 32, x + 16, y, 32, 32);
}
// from Z2 on the Z2 face sheet is drawn: src/era.js aliases the Z1 picture to it (core.js img)
function face(c, m, x, y, size = 64) {
  const f = img(FACES);
  if (!f.ok) return;
  const col = m.ko || m.hp <= 0 ? 2 : m.hp * 4 < m.maxhp ? 1 : 0;
  c.drawImage(f.im, 64 * col, 64 * (m.id - 3), 64, 64, x, y, size, size);
}
function foeFace(c, f, x, y) {
  const im = img(f.face ? f.face[0] : FOE_FACES); // face: [sheet, row] (the Z2 enemies: Z2_顔敵)
  if (!im.ok) return;
  c.drawImage(im.im, f.hp * 4 < f.maxhp ? 64 : 0, 64 * (f.face ? f.face[1] : f.id), 64, 64, x, y, 64, 64);
}
function text(c, s, x, y, color = INK, size = 16, align = 'left') {
  c.font = `${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'top';
  c.fillStyle = color;
  c.fillText(s, x, y);
}
function cursor(c, x, y) { // the original's blinking ▼ (アイコン.PNG), centred on x, top at y
  const blink = Math.floor(performance.now() / 270) % 2;
  const im = img(ICONS);
  if (im.ok) { c.drawImage(im.im, 16 * (blink ? 14 : 12), 0, 16, 16, x - 8, y - 4, 16, 16); return; }
  if (blink) return;
  c.fillStyle = '#f83800';
  c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.fill();
}
// the chosen one glows: `paint` is drawn again on top, added (lighter), with a slow pulse — no frame, like the
// original, whose only marker is the blinking ▼ (set_tate_cursor_blink)
function glow(c, paint) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(performance.now() / 160));
  paint();
  c.restore();
}

export class Battle {
  constructor(world, game, enemyIds, boss, opts = {}) {
    this.world = world;
    this.game = game;
    this.boss = boss;
    this.party = game.state.party;
    this.hand = game.state.hand;
    // foeHp: HP to start with (King Kai's, kept between tries in variable 52)
    this.foes = enemyIds.map((id, i) => ({ ...world.enemies[id], id, slot: i, hp: (opts.foeHp && opts.foeHp[i]) || world.enemies[id].maxhp }));
    this.plans = []; // filled by startPlanning; drawn (card owners) from the first frame, before planning starts
    this.anim = null; // the Duel being played
    this.backdrop = (game.backdrop && game.backdrop()) || BACKDROPS[rand(BACKDROPS.length)]; // game.backdrop: by the map (src/z2a.js)
    this.phase = 'plan'; // plan | fight | result
    this.mode = 'card'; // while planning: card | move | target | ready
    this.history = []; // members in the order they picked (返回)
    this.turn = 1;
    this.msg = [];
    this.buttons = [];
    this.duel = null;
    this.hits = [];
    this.el = document.getElementById('battle');
    items.battleFx(this);
  }

  // ---------- layout (art pixels; one art pixel is about one CSS pixel on a phone) ----------
  measure() {
    const p = this.el.querySelector('.safe').getBoundingClientRect();
    const safeT = parseFloat(getComputedStyle(this.el.querySelector('.safe')).paddingTop) / view.cssPerPx || 0;
    const safeB = (p.height - parseFloat(getComputedStyle(this.el.querySelector('.safe')).paddingTop)) / view.cssPerPx || 0;
    const W = view.w, H = view.h;
    const L = {};
    L.status = { x: 4, y: Math.round(safeT) + 4, w: W - 8, h: 190 };
    L.cardsY = Math.round(H - safeB - 100);
    L.btnY = L.cardsY - 44;
    L.msg = { x: 4, y: L.btnY - 64, w: W - 8, h: 62 };
    L.stage = { y: L.status.y + L.status.h + 4, h: 0 };
    L.stage.h = L.msg.y - 4 - L.stage.y;
    this.L = L;
    const n = this.foes.length;
    // choosing: the enemies' faces sit on the strip drawn mid-stage (two rows when they don't fit in one)
    const per = n * 72 - 8 > W - 8 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / per);
    // two rows on a short stage (e.g. 375×667): pack them, with the name and HP bar right under each face
    const tight = rows > 1 && L.stage.h < 132 * rows + 16, pitch = tight ? 92 : 132;
    this.foes.forEach((f, i) => {
      const r = Math.floor(i / per), k = i % per, m = Math.min(per, n - r * per);
      f.fx = Math.round(W / 2 - (m * 72 - 8) / 2 + k * 72);
      f.fy = Math.round(L.stage.y + L.stage.h / 2 - 32 - ((rows - 1) * pitch) / 2 + r * pitch - (tight ? 8 : 0));
      f.labY = tight ? 66 : 92; f.barY = tight ? 84 : 112;
    });
  }

  say(...lines) { this.msg = lines; }

  // ---------- canvas ----------
  // the battle film runs at the original's 60 frames a second (×3 after a tap)
  update(dt) {
    if (!this.anim) { this.acc = 0; return; }
    this.acc = Math.min(0.25, (this.acc || 0) + dt);
    while (this.acc >= 1 / 60 && this.anim) {
      this.acc -= 1 / 60;
      for (let k = 0; k < (this.fast ? 3 : 1) && this.anim; k++) this.anim.step();
    }
  }

  draw() {
    if (!this.L) return;
    const c = view.begin();
    const { L } = this;
    const W = view.w, now = performance.now();
    this.hits = [];
    c.fillStyle = PURPLE;
    c.fillRect(0, 0, W, view.h);
    this.drawStatus(c);
    // stage: this battle's background; choosing → the enemies' faces, fighting → the battle film
    this.drawFilm(c);
    if (this.phase !== 'fight') this.drawLineup(c);
    // message window
    win(c, L.msg.x, L.msg.y, L.msg.w, L.msg.h);
    this.msg.slice(0, 2).forEach((s, i) => text(c, s, L.msg.x + 12, L.msg.y + 10 + i * 22, INK, 17));
    if (this.cont && Math.floor(now / 400) % 2) text(c, '▼', L.msg.x + L.msg.w - 22, L.msg.y + L.msg.h - 22, RUST, 14);
    if (this.cont) this.hit(0, L.msg.y, W, view.h - L.msg.y, this.cont);
    if (this.phase === 'fight' && this.duel) this.drawDuel(c);
    else this.drawHand(c);
    if (this.mode === 'move' && this.phase === 'plan') this.drawMoves(c);
  }

  // later = on top; tag: 'modal' (the move window, enemies and buttons while targeting) or { card: k }
  hit(x, y, w, h, fn, tag) { this.hits.unshift({ x, y, w, h, fn, tag }); }

  onTap(e) {
    if (this.phase === 'fight' && this.anim && !this.cont) { this.fast = true; return; } // tap to speed the film up
    const r = view.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / view.cssPerPx, y = (e.clientY - r.top) / view.cssPerPx;
    const st = this.L && this.L.status;
    if (this.pages() > 1 && st && y >= st.y && y < st.y + st.h && !e.fromSwipe) { // more than six: a swipe here turns the page
      this.swipe = { x0: e.clientX, y0: e.clientY, e: { clientX: e.clientX, clientY: e.clientY, fromSwipe: true } };
      return;
    }
    const h = this.hits.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    audio.unlock();
    if (this.phase === 'plan' && (this.mode === 'move' || this.mode === 'target') && !(h && h.tag === 'modal')) {
      // the move window / targeting is open: another free card takes over, anything else cancels this card
      const k = h && h.tag && h.tag.card;
      const other = k != null && k !== this.pending.card && this.owner(k) == null;
      this.cancelPending();
      if (other) this.onCard(k);
      return;
    }
    if (h) h.fn();
  }

  // desktop keys: Enter / Z / Space = continue or 出招！, X / Escape = cancel or 返回, 1-6 = that card
  onKey(e) {
    if (document.querySelector('.pm, #cards, .combo-list') || this.el.hidden) return; // a menu screen is open
    const ok = ['Enter', 'Space', 'KeyZ'].includes(e.code), back = ['KeyX', 'Escape', 'Backspace'].includes(e.code);
    const n = /^(Digit|Numpad)([1-6])$/.exec(e.code);
    const lr = { ArrowLeft: -1, ArrowRight: 1 }[e.code];
    if (lr && this.phase === 'plan' && this.mode === 'target') { e.preventDefault(); this.aimStep(lr); return; }
    if (!ok && !back && !n) return;
    e.preventDefault();
    audio.unlock();
    if (this.phase === 'fight' && this.anim && !this.cont) { this.fast = true; return; }
    if (this.cont) { if (ok) this.cont(); return; }
    if (this.phase !== 'plan') return;
    if (n) { if (this.mode === 'move' || this.mode === 'target') this.cancelPending(); this.tapCard(Number(n[2]) - 1); return; }
    if (ok && this.mode === 'ready') this.go();
    else if (ok && this.mode === 'move') { audio.se(SE_OK); this.chooseTarget(); } // 普通攻擊
    else if (ok && this.mode === 'target') this.aimAt(this.aim);
    else if (back && (this.mode === 'move' || this.mode === 'target')) this.cancelPending();
    else if (back && this.buttons.some((b) => b[0] === '隊伍')) this.resume(); // close the 菜單 row
    else if (back) this.undo();
  }

  // more than six members: the status window shows six at a time (like the original's pages), swipe / ◀▶ to turn
  pages() { return Math.ceil(this.party.length / 6); }
  turnPage(d) {
    const p = Math.max(0, Math.min(this.pages() - 1, (this.page || 0) + d));
    if (p !== (this.page || 0)) { this.page = p; audio.se(SE_MOVE); }
  }

  drawStatus(c) {
    if (this.pages() > 1 && this.phase === 'plan' && this.cur != null && this.cur !== this.pageFor) { // follow the one choosing
      this.pageFor = this.cur;
      this.page = Math.floor(this.cur / 6);
    }
    const { x, y, w, h } = this.L.status;
    win(c, x, y, w, h);
    // TN (turn) column and the HP / KI labels, like the original
    word(c, 'HP', x + 10, y + 116); word(c, 'KI', x + 10, y + 152);
    text(c, 'TN', x + 12, y + 10, INK, 16);
    num(c, this.turn, x + 44, y + 30);
    const colW = Math.min(124, (w - 64) / Math.max(2, this.party.length));
    if (colW < 66) { this.drawStatusNarrow(c); return; }
    this.party.forEach((m, i) => {
      const cx = x + 56 + i * colW;
      text(c, m.name, cx + 32, y + 8, INK, 18, 'center');
      face(c, m, cx, y + 28);
      if (this.phase === 'plan' && this.cur === i) {
        c.strokeStyle = '#f83800'; c.lineWidth = 3; c.strokeRect(cx - 1.5, y + 26.5, 67, 67);
      }
      const plan = this.plans && this.plans[i];
      if (this.phase === 'plan' && plan) {
        c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(cx, y + 74, 64, 18);
        text(c, plan.skill ? plan.skill.name : '攻擊', cx + 32, y + 76, '#fff', 12, 'center');
      }
      word(c, 'LV', cx, y + 96); num(c, m.level, cx + 64, y + 96);
      num(c, m.hp, cx + 64, y + 116); slash(c, cx, y + 132); num(c, m.maxhp, cx + 64, y + 132);
      num(c, m.ki, cx + 64, y + 152); slash(c, cx, y + 168); num(c, m.maxki, cx + 64, y + 168);
      this.hit(cx, y + 20, colW, h - 20, () => this.onFighterTap(i));
    });
  }

  // five or six in the party (the Garlic area): columns narrower than a face — smaller faces, the level as text,
  // the numbers right-aligned in each column
  drawStatusNarrow(c) {
    const { x, y, w, h } = this.L.status;
    const paged = this.pages() > 1, page = paged ? Math.min(this.page || 0, this.pages() - 1) : 0;
    const shown = this.party.map((m, i) => [m, i]).slice(page * 6, page * 6 + 6);
    const colW = (w - 48) / (paged ? 6 : this.party.length); // the columns start right after the HP / KI labels
    const fs = Math.min(48, Math.floor(colW) - 6);
    if (paged) { // which page, and the original's ◀ ▶ cursors (tap them, or swipe)
      const dots = Array.from({ length: this.pages() }, (_, k) => (k === page ? '●' : '○')).join('');
      text(c, dots, x + 24, y + 54, '#7a5230', 10, 'center'); // under the turn number
      const blink = Math.floor(performance.now() / 400) % 2;
      if (page > 0) { if (blink) text(c, '◀', x + 10, y + 52, RUST, 14, 'center'); this.hit(x, y + 40, 26, 40, () => this.turnPage(-1)); }
      if (page < this.pages() - 1) { if (blink) text(c, '▶', x + w - 8, y + 52, RUST, 14, 'center'); this.hit(x + w - 18, y + 40, 18, 40, () => this.turnPage(1)); }
    }
    shown.forEach(([m, i], col) => {
      const cx = Math.round(x + 44 + col * colW), mid = cx + colW / 2, fx = Math.round(mid - fs / 2), rx = Math.round(cx + colW - 2);
      text(c, m.name, mid, y + 10, INK, Math.min(15, Math.floor(colW / 3.6)), 'center');
      face(c, m, fx, y + 30, fs);
      if (this.phase === 'plan' && this.cur === i) {
        c.strokeStyle = '#f83800'; c.lineWidth = 3; c.strokeRect(fx - 1.5, y + 28.5, fs + 3, fs + 3);
      }
      const plan = this.plans && this.plans[i];
      if (this.phase === 'plan' && plan) {
        c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(fx, y + 30 + fs - 14, fs, 14);
        text(c, plan.skill ? plan.skill.name : '攻擊', mid, y + 30 + fs - 13, '#fff', 10, 'center');
      }
      text(c, `Lv${m.level}`, mid, y + 82, '#7a5230', 14, 'center');
      const sl = (n, yy) => { if (rx - 16 * String(n).length - cx >= 16) slash(c, cx, yy); }; // the slash only where it fits
      num(c, m.hp, rx, y + 116); sl(m.maxhp, y + 132); num(c, m.maxhp, rx, y + 132);
      num(c, m.ki, rx, y + 152); sl(m.maxki, y + 168); num(c, m.maxki, rx, y + 168);
      this.hit(cx, y + 20, colW, h - 20, () => this.onFighterTap(i));
    });
  }

  // choosing: the enemies' faces on the ground strip (tap one to target it while targeting)
  drawLineup(c) {
    for (const f of this.foes) {
      if (f.hp <= 0) continue;
      c.fillStyle = '#000';
      c.fillRect(f.fx - 2, f.fy - 2, 68, 68);
      foeFace(c, f, f.fx, f.fy);
      text(c, f.name, f.fx + 32, f.fy + f.labY, '#fff', f.name.length > 5 ? 11 : 14, 'center'); // 卡里克(巨大化) fits its 72 px column
      c.fillStyle = '#402010'; c.fillRect(f.fx + 4, f.fy + f.barY, 56, 4);
      c.fillStyle = '#58d858'; c.fillRect(f.fx + 4, f.fy + f.barY, (56 * f.hp) / f.maxhp, 4);
      if (items.scouted() && f.card) { // スカウター: this turn's enemy card and HP
        c.save(); c.translate(f.fx + 16, f.fy + 122); c.scale(0.5, 0.5); card(c, f.card, 0, 0); c.restore();
        text(c, `HP ${f.hp}`, f.fx + 32, f.fy + 174, '#fff', 12, 'center');
      }
      if (items.stopCount(f)) text(c, '停', f.fx + 56, f.fy + 2, '#ff5050', 16, 'center'); // じいちゃん
      if ((this.mode === 'target' || this.mode === 'move') && this.aim === f.slot) { // the current target
        glow(c, () => foeFace(c, f, f.fx, f.fy));
        cursor(c, f.fx + 32, f.fy - 18);
      }
      if (this.mode === 'target') this.hit(f.fx - 6, f.fy - 20, 76, 130, () => this.aimAt(f.slot), 'modal');
    }
    if (this.mode === 'target') {
      c.fillStyle = 'rgba(0,0,0,.6)';
      c.fillRect(0, this.L.stage.y + 8, view.w, 26);
      text(c, '點敵人決定目標（點其他地方取消）', view.w / 2, this.L.stage.y + 12, '#ffd8a0', 16, 'center');
    }
    // everyone has picked: a big 出招！ above the enemies when there's room (the button row has one too)
    const room = (this.foes[0] ? this.foes[0].fy - 20 : this.L.stage.y + this.L.stage.h) - this.L.stage.y;
    if (this.mode === 'ready' && this.phase === 'plan' && room >= 84) {
      const bw = 200, bh = 64, bx = Math.round((view.w - bw) / 2), by = Math.round(this.L.stage.y + (room - bh) / 2);
      win(c, bx, by, bw, bh, '#ffe070');
      text(c, '出招！', bx + bw / 2, by + 16, RUST, 30, 'center');
      this.hit(bx, by, bw, bh, () => this.go());
    }
  }

  drawHand(c) {
    const { L } = this;
    const W = view.w;
    // buttons row
    const n = this.buttons.length;
    if (n) { // [label, fn, weight]: 出招！ is drawn wider and bolder
      const gap = 6, units = this.buttons.reduce((t, b) => t + (b[2] || 1), 0), u = (W - 8 - gap * (n - 1)) / units;
      let bx = 4;
      this.buttons.forEach(([label, fn, wt = 1]) => {
        const bw = u * wt + gap * (wt - 1);
        win(c, bx, L.btnY, bw, 40, wt > 1 ? '#ffe070' : CREAM);
        text(c, label, bx + bw / 2, L.btnY + (wt > 1 ? 8 : 11), wt > 1 ? RUST : INK, wt > 1 ? 22 : 18, 'center');
        this.hit(bx, L.btnY, bw, 40, fn, this.mode === 'target' ? 'modal' : undefined);
        bx += bw + gap;
      });
    }
    // the six cards
    const m = this.phase === 'plan' && this.cur != null ? this.party[this.cur] : null;
    const step = Math.min(66, (W - 8 - 64) / (HAND - 1)), x0 = Math.round((W - step * (HAND - 1) - 64) / 2);
    this.hand.forEach((cd, k) => {
      const owner = this.phase === 'plan' ? this.owner(k) : null; // the member who picked this card
      const x = Math.round(x0 + k * step);
      const special = m && owner == null && (ownSchool(cd, m) || cd.s === 0) && m.skills.length;
      const picked = this.pending && this.pending.card === k;
      const y = L.cardsY + (picked ? -10 : special ? -4 : 0);
      if (owner != null) c.globalAlpha = 0.45;
      card(c, cd, x, y);
      c.globalAlpha = 1;
      if (owner != null) { // whose card: a small face badge
        const bx = x + 64 - 34, by = y + 2;
        c.fillStyle = '#fff'; c.fillRect(bx - 2, by - 2, 36, 36);
        c.save(); c.translate(bx, by); c.scale(0.5, 0.5); face(c, this.party[owner], 0, 0); c.restore();
      }
      if (picked) glow(c, () => card(c, cd, x, y)); // raised and glowing (a ▼ above would sit on the buttons)
      else if (special && ownSchool(cd, m)) { c.strokeStyle = '#ffd27a'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, 66, 98); }
      if (this.phase === 'plan' && !this.cont) this.hit(x, y, step, 100, () => this.tapCard(k), { card: k });
    });
  }

  // move window over the stage
  drawMoves(c) {
    const { L } = this;
    const m = this.party[this.cur];
    const skills = m.skills.map((sid) => this.world.skills[sid]);
    const hints = skills.map((s) => comboHints(this, this.cur, s.id)); // S-combos (src/combo.js)
    const rowH = hints.some((x) => x.length) ? 46 : 30, h = 46 + skills.length * rowH + 50;
    const x = 10, w = view.w - 20, y = Math.max(L.stage.y + 4, L.msg.y - 4 - h);
    win(c, x, y, w, h);
    this.hit(x, y, w, h, () => {}, 'modal'); // taps on the window itself don't cancel
    text(c, `${m.name} 的招式`, x + 14, y + 12, RUST, 18);
    const aimed = this.foes[this.aim];
    if (aimed && aimed.hp > 0 && this.foes.filter((f) => f.hp > 0).length > 1) { // the target it will go to (framed below too)
      const fx = x + Math.round(w / 2) - 4, fy = y + 6;
      text(c, '目標', fx - 6, y + 14, '#7a5230', 13, 'right');
      c.save(); c.translate(fx, fy); c.scale(0.4375, 0.4375); foeFace(c, aimed, 0, 0); c.restore();
      glow(c, () => { c.translate(fx, fy); c.scale(0.4375, 0.4375); foeFace(c, aimed, 0, 0); });
    }
    word(c, 'KI', x + w - 96, y + 12); num(c, m.ki, x + w - 14, y + 12);
    skills.forEach((s, i) => {
      const ry = y + 40 + i * rowH;
      let ki = growth.kiCost(this.world, m, s); // passive skills (get_mp_cost)
      if (battleHooks.kiCost) ki = battleHooks.kiCost(this, m, s, ki, this.hand[this.pending.card]);
      ki = items.kiNeed(m, ki); // 必殺技 card
      const ok = m.ki >= ki;
      text(c, s.name + (s.all ? '（全體）' : ''), x + 30, ry + 6, ok ? INK : '#a08060', 18);
      text(c, `KI ${ki}`, x + w - 14, ry + 8, ok ? '#7a5230' : '#c0a080', 14, 'right');
      hints[i].forEach((t, k) => text(c, `組合技 ${t.name}（${t.need}）${this.pending.solo ? '不使用' : HINT_TEXT[t.st]}`,
        x + 30, ry + 27 + k * 14, t.st === 'ok' && !this.pending.solo ? RUST : '#a08060', 12));
      if (ok) this.hit(x, ry, w, rowH, () => { audio.se(SE_OK); this.pending.skill = s; this.chooseTarget(); }, 'modal');
      else this.hit(x, ry, w, rowH, () => audio.se(SE_ERR), 'modal');
    });
    const btns = [['普通攻擊', () => { audio.se(SE_OK); this.chooseTarget(); }], ['取消', () => this.cancelPending()]];
    if (hasCombos(this, this.cur)) btns.push([this.pending.solo ? '組合技：關' : '組合技：開', () => { audio.se(SE_MOVE); this.pending.solo = !this.pending.solo; }]);
    const by = y + h - 46, bw = (w - 10 - 10 * btns.length) / btns.length;
    btns
      .forEach(([label, fn], i) => {
        const bx = x + 10 + i * (bw + 10);
        win(c, bx, by, bw, 36, '#fff0d0');
        text(c, label, bx + bw / 2, by + 9, INK, 17, 'center');
        this.hit(bx, by, bw, 36, fn, 'modal');
      });
  }

  // the original fighting bar: party face + school, HP/KI, the two cards, enemy face + school
  drawDuel(c) {
    const { L } = this;
    const { m, mc, f, fc } = this.duel;
    const W = view.w, y = L.btnY + 4;
    const gap = Math.max(2, (W - 8 - 64 - 92 - 64 - 64 - 64) / 4);
    let x = 4;
    face(c, m, x, y); tag(c, m.school, x, y + 64);
    x += 64 + gap;
    c.fillStyle = CREAM; c.fillRect(x, y, 92, 96);
    word(c, 'HP', x + 2, y + 8); num(c, m.hp, x + 90, y + 8); slash(c, x + 22, y + 26); num(c, m.maxhp, x + 90, y + 26);
    word(c, 'KI', x + 2, y + 52); num(c, m.ki, x + 90, y + 52); slash(c, x + 22, y + 70); num(c, m.maxki, x + 90, y + 70);
    x += 92 + gap;
    card(c, mc, x, y);
    x += 64 + gap;
    card(c, fc, x, y);
    x = W - 4 - 64;
    foeFace(c, f, x, y); tag(c, f.school, x, y + 64);
  }

  // the 640×356 film stage, cropped to the phone: centred across, and when the stage is short the top of the
  // sky goes first (the fighters stand at y 120-216, the ground at 256-356)
  // The background is drawn on the main canvas behind it, lined up with the film (its ground under the fighters)
  // and sinking with the film's ground while a special move rises.
  drawFilm(c) {
    const { stage } = this.L;
    const W = view.w;
    const sw = Math.min(SW, W), sx = Math.round((SW - sw) / 2), dx = Math.round((W - sw) / 2);
    let sy = 0, sh = SH, dy = stage.y + Math.floor((stage.h - SH) / 2);
    if (stage.h < SH) { sh = Math.round(stage.h); sy = Math.floor((SH - sh) * 0.6); dy = stage.y; }
    c.save();
    c.beginPath(); c.rect(0, stage.y, W, stage.h); c.clip();
    const bd = img(this.backdrop);
    if (bd.ok) {
      // wider than the picture (e.g. a 430-wide phone): scale it up to cover the whole width, nearest-neighbour
      const k = Math.max(1, W / bd.im.width), bw = Math.ceil(bd.im.width * k), bh = Math.ceil(bd.im.height * k);
      const bx = Math.round((W - bw) / 2);
      const lift = Math.max(0, Math.min(50, Math.round((SH - stage.h) / 3))); // short screens: ground nearer the feet
      const by = Math.round(dy - sy - BACKDROP_TOP * k - lift + (this.anim ? this.anim.back.y - BACK_Y : 0));
      if (by > stage.y) c.drawImage(bd.im, 0, 0, bd.im.width, 1, bx, stage.y, bw, by - stage.y + 1); // sky above the picture
      c.drawImage(bd.im, 0, 0, bd.im.width, bd.im.height, bx, by, bw, bh);
    }
    if (this.anim) {
      c.drawImage(this.anim.render(), sx, sy, sw, sh, dx, dy, sw, sh);
      if (this.anim.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.anim.fade})`; c.fillRect(0, stage.y, W, stage.h); }
    }
    c.restore();
  }

  // ---------- planning ----------
  able(m) { return !m.ko; } // KO'd members stay out until healed to full (growth.recover)

  startPlanning() {
    this.phase = 'plan';
    this.fast = false;
    this.duel = null;
    this.plans = this.party.map(() => null);
    this.history = [];
    for (const f of this.foes) if (f.hp > 0) f.card = enemyCard(); // §2.1: enemy cards are dealt at turn start
    growth.turnStart(this);
    this.cur = null;
    this.resume();
  }

  // the member a hand card is picked by (index), or null
  owner(k) { const i = this.plans.findIndex((p) => p && p.card === k); return i < 0 ? null : i; }
  // (a party bigger than the hand: once every card is picked, the others sit this turn out, like the original's
  // $cardset_cha_no — each card is one member's)
  nextFree() {
    if (this.plans.filter(Boolean).length >= this.hand.length) return -1;
    return this.party.findIndex((m, i) => this.able(m) && !this.plans[i]);
  }

  // back to choosing: the current member if still free, else the next one, else 出招！
  resume() {
    this.pending = null;
    if (this.cur == null || !this.able(this.party[this.cur]) || this.plans[this.cur]) this.cur = this.nextFree();
    if (this.cur < 0) { this.cur = null; this.ready(); return; }
    this.promptCard();
  }

  promptCard() {
    const m = this.party[this.cur];
    this.mode = 'card';
    this.pending = null;
    this.say(`${m.name}：點一張卡出招。`, this.practice ? '「氣」的卡會變成自己的流派，可以使用必殺技。' : `${SCHOOL[m.school]}流或「必」的卡可以使用必殺技。`);
    this.buttons = commandButtons(this); // 自動・菜單・(返回)・逃跑 (src/partymenu.js)
  }

  // everyone able has picked
  ready() {
    if (battleOpts.quick) { this.go(); return; }
    this.mode = 'ready';
    this.say('全員準備好了！', '按「出招！」開始；點卡片或頭像可重選');
    this.buttons = [['出招！', () => this.go(), 2], ['返回', () => this.undo()]];
  }

  go() {
    if (this.phase !== 'plan' || this.nextFree() >= 0) return;
    audio.se(SE_OK);
    this.cur = null;
    this.resolveTurn();
  }

  // un-pick one member (their card / face tapped, or 返回); the others keep their picks
  unpick(i) {
    this.plans[i] = null;
    this.history = this.history.filter((j) => j !== i);
    this.cur = i;
    audio.se(SE_MOVE);
    this.promptCard();
  }
  undo() { if (this.history.length) this.unpick(this.history[this.history.length - 1]); }

  // the move window or targeting is closed without picking: back to cards for the same member
  cancelPending() {
    audio.se(SE_MOVE);
    this.pending = null;
    this.aim = null;
    if (this.cur == null) { this.resume(); return; }
    this.promptCard();
  }

  onFighterTap(i) {
    if (this.phase !== 'plan' || this.cont || !this.able(this.party[i])) return;
    if (this.plans[i]) { this.unpick(i); return; }
    this.cur = i;
    this.promptCard();
  }

  tapCard(k) {
    const j = this.owner(k);
    if (j != null) { this.unpick(j); return; }
    if (this.cur == null) { audio.se(SE_ERR); return; } // 出招！ is up: tap a picked card or face to change it
    this.onCard(k);
  }

  onCard(k) {
    const m = this.party[this.cur];
    const cd = this.hand[k];
    if (cd.s === KI_CARD || (cd.s === 0 && growth.ext('pick', false, this, m, cd))) cd.s = m.school; // 「氣」; 「必」 for the favourite character (src/cards_b.js)
    this.pending = { card: k, skill: null };
    audio.se(SE_OK);
    const alive = this.foes.filter((f) => f.hp > 0);
    if (this.aim == null || !alive.some((f) => f.slot === this.aim)) this.aim = autoTarget(this.game.state, m, this.foes); // framed already
    if ((cd.s === m.school || cd.s === 0) && m.skills.length) {
      this.mode = 'move';
      this.buttons = [];
      this.say(`${m.name}：選一個招式。`, '點視窗外面可以取消這張卡。');
      return;
    }
    this.chooseTarget();
  }

  chooseTarget() {
    const alive = this.foes.filter((f) => f.hp > 0);
    if (alive.length === 1 || (this.pending.skill && this.pending.skill.all)) { this.commit(alive[0].slot); return; }
    this.mode = 'target';
    this.say(`${this.party[this.cur].name}：點選要攻擊的敵人。`);
    this.buttons = [
      ['打 HP 最少的', () => this.aimAt(alive.reduce((a, b) => (b.hp < a.hp ? b : a)).slot)],
      ['取消', () => this.cancelPending()],
    ];
  }

  // a tapped enemy: the frame jumps there, then the pick is made (a moment later, so the frame shows)
  aimAt(slot) {
    if (this.aiming) return;
    this.aim = slot;
    audio.se(SE_OK);
    this.aiming = true;
    setTimeout(() => { this.aiming = false; if (this.mode === 'target' && this.pending) this.commit(slot); }, 180);
  }
  // keys: move the frame to the next enemy alive
  aimStep(d) {
    const alive = this.foes.filter((f) => f.hp > 0).map((f) => f.slot);
    const i = alive.indexOf(this.aim);
    this.aim = alive[(i + d + alive.length) % alive.length];
    audio.se(SE_MOVE);
  }

  commit(target) {
    this.plans[this.cur] = { ...this.pending, target };
    this.history.push(this.cur);
    this.pending = null;
    this.aim = null;
    this.resume();
  }

  // the battle menu (src/partymenu.js) may reorder the party (隊伍) or change the hand / KO state (卡牌):
  // keep each member's pick across it
  async keepPlans(fn) {
    const by = new Map(this.party.map((m, i) => [m, this.plans[i]]));
    const hist = this.history.map((i) => this.party[i]);
    const cur = this.cur != null ? this.party[this.cur] : null;
    const r = await fn();
    this.plans = this.party.map((m) => (this.able(m) && by.get(m)) || null);
    this.history = hist.map((m) => this.party.indexOf(m)).filter((i) => i >= 0 && this.plans[i]);
    const k = cur ? this.party.indexOf(cur) : -1; // (筋斗雲 may have swapped that member out: src/cards_story.js)
    this.cur = k >= 0 ? k : null;
    return r;
  }

  // Auto mode (§2.3): own-school card first, then 必; the move and the target follow 作戰 (src/partymenu.js).
  autoPlan() {
    const usedCards = new Set(this.plans.filter(Boolean).map((p) => p.card));
    this.party.forEach((m, i) => {
      if (!this.able(m) || this.plans[i]) return;
      const free = this.hand.map((c, k) => k).filter((k) => !usedCards.has(k));
      if (!free.length) return; // more members than cards: the rest sit out
      let k = free.find((x) => this.hand[x].s === m.school);
      if (k == null) k = free.find((x) => this.hand[x].s === KI_CARD);
      if (k != null && this.hand[k].s === KI_CARD) this.hand[k].s = m.school; // 「氣」
      if (k == null) k = free.find((x) => this.hand[x].s === 0);
      if (k != null && this.hand[k].s === 0 && growth.ext('pick', false, this, m, this.hand[k])) this.hand[k].s = m.school; // (喜歡的角色)
      let skill = null;
      if (k != null) skill = autoSkill(this.world, this.game.state, m); // 作戰 (src/partymenu.js)
      else k = free[rand(free.length)];
      usedCards.add(k);
      this.plans[i] = { card: k, skill, target: autoTarget(this.game.state, m, this.foes) };
    });
    this.cur = null;
    this.resolveTurn();
  }

  // ---------- resolution (§2.4) ----------
  async resolveTurn() {
    this.phase = 'fight';
    this.mode = 'card';
    this.buttons = [];
    this.acted = new Set(); // members already done this turn (S-combo partners)
    const order = [];
    this.party.forEach((m, i) => { const p = this.plans[i]; if (p) this.hand[p.card] = growth.cardFor(this.world, m, this.hand[p.card]); }); // ミラクル全開パワー, ムダのない動き
    if (battleHooks.cardFor) this.party.forEach((m, i) => { const p = this.plans[i]; if (p) this.hand[p.card] = battleHooks.cardFor(this, m, this.hand[p.card]); });
    this.party.forEach((m, i) => { const p = this.plans[i]; if (p) order.push({ kind: 'p', i, key: this.hand[p.card].a + this.hand[p.card].g, r: Math.random() }); });
    for (const f of this.foes) if (f.hp > 0) { order.push({ kind: 'e', f, key: f.card.a + f.card.g, r: Math.random() }); }
    order.sort((a, b) => b.key - a.key || a.r - b.r);
    order.splice(0, order.length, ...items.firstMovers(this, order));
    await sleep(300);
    this.chain = 0; // our actions in a row ($cha_biattack_count: 連擊, src/cards_b.js)
    for (const o of order) {
      if (this.over()) break;
      this.chain = o.kind === 'p' ? this.chain + 1 : 0;
      if (o.kind === 'p') await this.playerAct(o.i);
      else if (!items.foeStopped(o.f)) for (let n = 0; n < this.attacks(o.f) && o.f.hp > 0 && !this.over(); n++) { if (n > 0) o.f.card = enemyCard(); await this.enemyAct(o.f); }
    }
    this.plans.forEach((p, i) => { if (p) this.hand[p.card] = this.practice ? { a: 7, g: 7, s: KI_CARD } : growth.regenCard(this.world, this.party[i], newCard()); }); // used cards are regenerated in place (§1.6), 一か八か; 戦闘練習: always Z and 「氣」
    items.endTurn(this);
    if (this.over()) return;
    if (this.practice) await this.practiceRecord();
    for (const f of this.foes) if (f.regen && f.hp > 0 && f.hp < f.maxhp) f.hp = Math.min(f.maxhp, f.hp + Math.floor((f.regen / 100) * f.maxhp)); // *PARAM_HPRECOVER
    growth.recover(this); // recovery from the second turn on, KO'd members back only at full HP (§4.6)
    if (battleHooks.recover) battleHooks.recover(this);
    await announceCombos(this);
    await sleep(400);
    this.turn++;
    this.startPlanning();
  }

  // 戦闘練習 (switch 1305, chk_damage_counter): the damage of the turn (variable 425) and the best so far (424 / 426)
  async practiceRecord() {
    const p = this.practice, d = p.dmg || 0;
    p.dmg = 0;
    if (d > p.best.dmg) Object.assign(p.best, { dmg: d, turn: this.turn });
    audio.se('Z3 アイテム取得', 80);
    this.say(`這回合的紀錄：${d}`, `開始前的紀錄：${p.old}`);
    await new Promise((res) => { this.cont = res; setTimeout(res, 2400); });
    this.cont = null;
  }

  over() { return this.foes.every((f) => f.hp <= 0) || this.party.every((m) => m.ko) || this.stopped(); }

  // an event battle that ends early (stopWhen, src/z2b.js: Frieza's last form when someone first falls → 'break')
  stopped() { return !!(this.stopWhen && this.stopWhen(this)); }

  // attacks a turn ($data_enemies.eva), plus the event battle's switches (all.rb 140508): alone = one more for the
  // last one standing (25), hp40 / hp30 / hp50 = one more at 40 / 30 / 50 % HP or less (27 / 26 / 29), two = two or
  // fewer standing (28)
  attacks(f) {
    let n = f.eva;
    if (this.alone && this.foes.filter((x) => x.hp > 0).length === 1) n++;
    if (this.hp30 && (f.hp * 100) / f.maxhp <= 30) n++;
    if (this.hp40 && (f.hp * 100) / f.maxhp <= 40) n++;
    if (this.two && this.foes.filter((x) => x.hp > 0).length <= 2) n++; // 28
    if (this.hp50 && (f.hp * 100) / f.maxhp <= 50) n++; // 29
    return n;
  }

  // play one action as a battle film; the damage lands (HP, duel bar) when the hit shows on screen
  play(m, f, playerAttacks, skill, dmg, target) {
    const actor = this.world.actors[m.id];
    this.anim = new Duel({
      party: { normal: m.sprite || actor.sprite, special: m.special || actor.special, size: m.spriteSize }, // m.sprite: Z2 battle suits, the Great Ape (192×192)
      foe: { normal: f.portrait, special: f.sprite, size: f.size },
      playerAttacks, skill, ray: actor.ray, hit: dmg >= 0, damage: Math.max(0, dmg), margin: Math.max(0, (SW - view.w) / 2),
      onHit: () => {
        if (dmg < 0) return;
        if (playerAttacks && this.practice) { this.practice.dmg = (this.practice.dmg || 0) + dmg; return; } // the dummy loses no HP
        target.hp = Math.max(0, target.hp - dmg);
        if (!playerAttacks) audio.se('Z1 ダメージ', 70);
        if (!playerAttacks && battleHooks.hurt) battleHooks.hurt(this, target, f, this.world.skills[skill] || null, dmg);
        if (!playerAttacks && target.hp <= 0) growth.knockOut(target, this.turn);
      },
    });
    if (!this.fast && !this.msg[1]) this.msg = [this.msg[0], '（點一下畫面可以加速）'];
    return this.anim.finished.then(() => { this.anim = null; });
  }

  async playerAct(i) {
    const m = this.party[i];
    const p = this.plans[i];
    if (m.ko || this.acted.has(i)) return;
    if (await tryCombo(this, i)) return;
    let foe = this.foes[p.target];
    if (!foe || foe.hp <= 0) foe = this.foes.filter((f) => f.hp > 0).reduce((a, b) => (b.hp < a.hp ? b : a));
    const cd = this.hand[p.card];
    let skill = p.skill;
    let base = skill ? growth.kiCost(this.world, m, skill) : 0; // passive skills (get_mp_cost)
    if (skill && battleHooks.kiCost) base = battleHooks.kiCost(this, m, skill, base, cd);
    if (skill && m.ki < items.kiNeed(m, base)) skill = null;
    const targets = skill && skill.all ? this.foes.filter((f) => f.hp > 0) : [foe];
    if (skill) items.payKi(m, base);
    if (battleHooks.act && await battleHooks.act(this, i, skill)) return;
    if (skill && skill.ss && moveTransforms(m)) { // 超サイヤ人變身: no attack; this member becomes a Super Saiyan
      this.say(`${m.name} 的${skill.name}！`);
      audio.se('Z3 変身', 80);
      await sleep(900);
      const to = superSaiyan(this.world, this.game.state, moveTransforms(m), true);
      if (to) { audio.se('Z1 パワーアップ', 80); this.say(`${to.name} 變成了超級賽亞人！`); await sleep(1200); }
      if (!this.practice) tally(this.game.state, m, skill, 0);
      return;
    }
    const alive = targets.filter((t) => t.hp > 0).length;
    for (const t of targets) {
      t.card = t.card || enemyCard();
      this.duel = { m, mc: cd, f: t, fc: t.card };
      this.say(`${m.name} 的${skill ? skill.name : '攻擊'}！`, ownSchool(cd, m) ? '流派一致，威力 ×1.3！' : '');
      let P = growth.power(this.game.state, m, skill);
      if (battleHooks.power) P = battleHooks.power(this, m, skill, P);
      const dmg = playerDamage(this, m, skill && { noDamage: skill.noDamage }, cd, t, t.card, P);
      await this.play(m, t, true, skill ? skill.id : null, dmg, t);
      if (dmg >= 0) growth.onHit(this, m, t, cd); // かなしばり, the skill cards' hit effects
      if (dmg >= 0 && battleHooks.hit) battleHooks.hit(this, m, t, dmg);
      if (dmg >= 0 && skill && skill.tail && t.hp > 0 && t.apeOf) { // 尻尾切る: the Great Ape is himself again (all.rb 68895)
        this.transform(t, t.apeOf);
        this.say(`${t.name} 的尾巴被切斷，變回原狀了！`);
        await sleep(900);
      }
    }
    if (!this.practice) tally(this.game.state, m, skill, alive - targets.filter((t) => t.hp > 0).length); // use counts, KOs (not while practising)
  }

  async enemyAct(f) {
    if (growth.foeStopped(f)) return; // stopped by かなしばり
    const targets = this.party.filter((m, i) => !m.ko && this.plans[i]);
    if (!targets.length) return;
    const cd = f.card;
    let skill = null;
    const yamcha = targets.find((m) => m.id === 7);
    if ((cd.s === 0 || cd.s === f.school) && f.actions.length) {
      const ok = f.actions.filter((a) => (a.cond === 0 || (a.cond === 2 && (f.hp * 100) / f.maxhp <= a.param))
        && (a.skill !== 304 || yamcha) // 自爆: only at Yamcha, while he is in the fight (chk_scombo_flag 304)
        && (!FOE_FORMS[a.skill] || (!(this.formsDone || []).includes(a.skill) && this.world.enemies[FOE_FORMS[a.skill].to[f.id]]))); // 大猿変身 / 巨大化: once a battle
      if (ok.length) skill = this.world.skills[ok[rand(ok.length)].skill];
    }
    if (skill && FOE_FORMS[skill.id]) { // 大猿変身 / 巨大化: no damage; he becomes the other enemy, HP as it is
      const form = FOE_FORMS[skill.id], from = f.id, to = form.to[from], e = this.world.enemies[to], name = f.name;
      const m = targets[rand(targets.length)];
      this.duel = { m, mc: this.hand[this.plans[this.party.indexOf(m)].card], f, fc: cd };
      this.say(`${f.name} 的${skill.name}！`);
      (this.formsDone = this.formsDone || []).push(skill.id);
      await loadImages([e.sprite, e.portrait, ...(e.face || []).slice(0, 1)]);
      const film = this.play(m, f, false, skill.id, -1, m);
      this.anim.form = { normal: e.portrait, special: e.sprite, size: e.size }; // (the films that show the new form)
      await film;
      this.transform(f, to);
      if (form.ape) f.apeOf = from;
      this.say(`${name} ${form.say}`);
      await sleep(1200);
      return;
    }
    // a move on the whole party (卡里克's 黑洞波) hits everyone standing, one film each; 自爆 goes at Yamcha
    const hit = skill && skill.all ? targets : [skill && skill.selfDestruct ? yamcha : targets[rand(targets.length)]];
    if (hit.length === 1 && !(skill && skill.selfDestruct)) { // 掩護 (src/cards_b.js): someone else takes a single attack
      const one = hit[0], c = growth.ext('cover', one, this, f);
      if (c && c !== one) { this.cover = c; this.say(`${c.name} 掩護了 ${one.name}！`); audio.se('Z1 逃げる', 80); await sleep(900); hit[0] = c; }
    }
    for (const m of hit) {
      if (m.ko) continue;
      const guard = this.hand[this.plans[this.party.indexOf(m)].card];
      this.duel = { m, mc: guard, f, fc: cd };
      this.say(`${f.name} 的${skill ? skill.name : '攻擊'}！`);
      const dmg = enemyDamage(this, f, skill && { power: skill.power }, cd, m, guard);
      await this.play(m, f, false, skill ? skill.id : null, dmg, m);
      if (dmg >= 0) growth.ext('hurt', null, this, m, f); // (不屈的鬥志: src/cards_b.js)
    }
    this.cover = null;
    if (skill && skill.selfDestruct) { // the Saibaman is gone too (all.rb 68975)
      f.hp = 0;
      this.say(`${f.name} 自爆了！`);
      await sleep(900);
    }
  }

  // an enemy becomes another (the Great Ape and back, 巨大化), keeping its HP, slot and card
  transform(f, id) {
    const e = this.world.enemies[id];
    const keep = { hp: f.hp, slot: f.slot, card: f.card, fx: f.fx, fy: f.fy };
    for (const k of ['regen', 'size', 'apeOf']) delete f[k];
    Object.assign(f, e, { id }, keep);
  }

  // ---------- result ----------
  async rewards() {
    this.phase = 'result';
    this.duel = null;
    this.buttons = [];
    await announceCombos(this);
    // a 時之間 boss (src/timeroom.js trBattle): no EXP (switch 124), its own shared EXP / CAP (variables 306 / 317)
    const tr = this.trReward;
    const exp = tr ? 0 : items.expGain(this.game.state, this.foes.reduce((s, f) => s + f.exp, 0)) * EXP_RATE;
    this.game.state.zeni += items.capGain(this.game.state, tr && tr.cap ? tr.cap : this.foes.reduce((s, f) => s + f.gold, 0));
    growth.beforeExp(this, tr ? tr.shared || 0 : exp); // shared EXP pool, ZP
    const ups = [];
    for (const m of this.party) {
      m.exp += growth.expFor(this.world, m, exp); // サイヤ人の血
      if (levelUp(this.world, m)) ups.push(`${m.name} 升到 LV ${m.level}`);
    }
    this.say('打倒敵人了！', tr ? `獲得 ${tr.shared || 0} 點共有經驗值！` : `獲得 ${exp} 點經驗值`);
    await new Promise((res) => { this.cont = res; });
    if (ups.length) {
      audio.se('Z1 レベルアップ', 80);
      this.say(...ups.length > 1 ? [`${ups.join('、')}！`] : [`${ups[0]}！`]);
      await new Promise((res) => { this.cont = res; });
    }
    await items.afterBattle(this);
    for (const pg of growth.afterBattle(this)) { // SP, 追加技能 learned, 固有技能 for the new levels
      if (pg.se) audio.se(pg.se, 80);
      this.say(...pg.lines);
      await new Promise((res) => { this.cont = res; });
    }
    this.cont = null;
  }

  async run() {
    this.el.innerHTML = '<div class="safe"></div>';
    this.el.hidden = false;
    this.measure();
    const onTap = (e) => this.onTap(e);
    this.el.addEventListener('pointerdown', onTap);
    const onUp = (e) => { // the end of a touch on the status window: a swipe turns the page, a tap is a tap
      const sw = this.swipe;
      this.swipe = null;
      if (!sw) return;
      const dx = e.clientX - sw.x0, dy = e.clientY - sw.y0;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) this.turnPage(dx < 0 ? 1 : -1);
      else this.onTap(sw.e);
    };
    this.el.addEventListener('pointerup', onUp);
    const onResize = () => this.measure();
    window.addEventListener('resize', onResize);
    const onKey = (e) => this.onKey(e);
    window.addEventListener('keydown', onKey);
    await document.fonts.load(`16px ${FONT}`).catch(() => {});
    audio.playBgm(this.bgm || (this.boss ? 'Z1 戦闘ボス1(中ボス)' : 'Z1 戦闘1')); // bgm: an event battle's own music
    this.say(`${this.foes.map((f) => f.name).join('、')} 出現了！`);
    await sleep(700);
    const result = await new Promise((res) => {
      this.done = res;
      const watch = () => {
        if (this.foes.every((f) => f.hp <= 0)) res('win');
        else if (this.party.every((m) => m.ko)) res('lose');
        else if (this.stopped()) res('break');
        else setTimeout(watch, 200);
      };
      watch();
      this.startPlanning();
    });
    if (result === 'win') { audio.stopBgm(); audio.se('GBZ1 ファンファーレ1', 80); await this.rewards(); }
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onKey);
    this.el.removeEventListener('pointerdown', onTap);
    this.el.removeEventListener('pointerup', onUp);
    this.el.hidden = true;
    this.el.innerHTML = '';
    items.battleEnd();
    if (battleHooks.end) battleHooks.end(this);
    ssAfterBattle(this.world, this.game.state);
    // KO'd members stay KO'd after the fight (the original's $chadead), until an inn or their HP is full again
    return result;
  }
}
