// Field menu entries of the original that the party menu (src/partymenu.js) does not cover, after 140_Field_Main.rb:
//   概況  Scene_Story_So_Far — the recap for variable 43 (also played when a save is loaded, unless 跳過概況 is on)
//   情報  var41 41 — the fortune teller, then Scene_Db_battle_history (戰鬥記錄) or Scene_Db_enemy_history (敵人情報)
//   設定  Scene_Db_Option — the options this version can honour (battle BGM, encounters, encounter sound, battle
//         speed, fast messages, skip the opening / the recap); kept per device like the original's ini settings
//   地圖  the top-level 地图 command: the camera leaves the player and the map can be looked over by dragging
// and the Dragon Radar (Scene_Dragon_Radar): item card 1, through items.js fieldCards.
//
// Records kept for 戰鬥記錄 (state.stats, the original's variables 202-223): time, wins, inns, training, cardSquares,
// goldGot, goldSpent, cardBuy, cardSell, chaMax [actor, enemy, damage], eneMax [enemy, actor, damage];
// state.foeKills[enemy] ($ene_defeat_num), state.foeSeen[enemy] ($ene_enc_history_flag),
// state.foeScouted[enemy] ($ene_sco_history_flag: HP and drops shown), state.cardUses[item] ($card_run_num).
import { view, img, audio, say, choose, textSpeed } from './core.js?v=20261101-2323';
import { Battle, battleOpts } from './battle.js?v=20261101-2323';
import { fieldCards } from './items.js?v=20261101-2323';
import { holds } from './field.js?v=20261101-2323';

const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_ERR = 'Z3 エラー';
const FOE_FACES = 'Graphics/Pictures/Z1_顔敵.PNG', FACES = 'Graphics/Pictures/Z1_顔味方.PNG', CARDS = 'Graphics/Pictures/カード関係.PNG';
const SEA = 'Graphics/Pictures/Z1_背景_スクロール_海.PNG', GOKU_GOHAN = 'Graphics/Pictures/Z1_イベント_ゴクウとゴハン.PNG';
const RADAR = 'Graphics/Pictures/ドラゴンレーダー.PNG', BALL = 'Graphics/Pictures/ドラゴンレーダー_ドラゴンボール.PNG';

// ---------- options (Scene_Db_Option) ----------
const OPT_KEY = 'dbz-portrait-options';
export const options = { bgm: 0, enc: 1, encSe: 0, battleFast: 0, quickGo: 0, fastMsg: 0, skipOp: 0, skipRecap: 0 };
try { Object.assign(options, JSON.parse(localStorage.getItem(OPT_KEY)) || {}); } catch (e) { /* first run */ }
const saveOptions = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify(options)); } catch (e) { /* private mode */ } };
textSpeed.instant = !!options.fastMsg;
battleOpts.quick = !!options.quickGo;

// 戰鬥BGM (set_battle_bgm_name): 0 默認 follows the story (Z1 戦闘2 from the Sansho area on), 1 隨機, 8-11 the Z1 songs
const BATTLE_BGM = { 8: ['Z1 戦闘1', 'DBZ 強襲！サイヤ人！『サイヤ人編』'], 9: ['Z1 戦闘2', 'DBZ 強襲！サイヤ人！『ガーリック編』'],
  10: ['Z1 戦闘ボス1(中ボス)', 'DBZ 強襲！サイヤ人！『サイヤ人(ボス)』'], 11: ['Z1 戦闘ボス2(ベジータ)', 'DBZ 強襲！サイヤ人！『ラスト』'] };
const ENC_SE = ['Z1 敵発見', 'Z3 敵発見', 'ZSSD 敵発見(GXSCC音源Ver)', 'GBZ2 戦闘開始']; // set_encount_se
let game = null;
export function setFieldGame(g) {
  game = g;
  startClock();
  for (const p of g.world.fieldPictures || []) img(p); // warm the radar / recap / fortune-teller art
}

// set_battle_bgm_name 0 (默認): the song of the part of the story (variable 43)
const storyBattleBgm = (v) => (v >= 21 && v <= 50 ? 'Z2 戦闘1' : v >= 3 ? 'Z1 戦闘2' : 'Z1 戦闘1'); // (Z2: 21-50)

// the battle starts its music as 'Z1 戦闘1' (normal fights) and the encounter sound as 'Z1 敵発見': swap in the choice
const playBgm = audio.playBgm.bind(audio), playSe = audio.se.bind(audio);
audio.playBgm = (name, vol) => {
  const b = game && game.scene instanceof Battle ? game.scene : null;
  if (b && (name === 'Z1 戦闘1' || b.eventBgm)) { // an event battle without music of its own plays the story's default
    let no = b.eventBgm ? 0 : options.bgm;
    if (no === 1) no = 8 + Math.floor(Math.random() * 4);
    name = no ? BATTLE_BGM[no][0] : storyBattleBgm(((game.state.var || {})[43]) || 0);
  }
  return playBgm(name, vol);
};
audio.se = (name, vol, pitch) => playSe(name === 'Z1 敵発見' ? ENC_SE[options.encSe] : name, vol, pitch);
// 戰鬥速度 高速化: the battle film always runs as if tapped
Object.defineProperty(Battle.prototype, 'fast', {
  get() { return this._fast || !!options.battleFast; },
  set(v) { this._fast = v; },
  configurable: true,
});
// 遇敵 少／普通／多 (Field_Main encounter: battle_enc 1.5 / 1 / 0.5)
export const encounterSteps = (n) => Math.max(1, Math.round(n * [1.5, 1, 0.5][options.enc]));

// ---------- records ----------
const stats = (s) => (s.stats = s.stats || {});
const bump = (s, k, n = 1) => { const t = stats(s); t[k] = (t[k] || 0) + n; };
export { bump as bumpStat };
function startClock() {
  if (startClock.on) return;
  startClock.on = true;
  setInterval(() => { if (game && game.state && !document.hidden) bump(game.state, 'time'); }, 1000);
}
// the largest hit each way (variables 203/204/214 and 207/208/216)
const play = Battle.prototype.play;
Battle.prototype.play = function (m, f, playerAttacks, skill, dmg, target) {
  const t = stats(this.game.state);
  const k = playerAttacks ? 'chaMax' : 'eneMax';
  if (dmg > ((t[k] || [])[2] || 0)) t[k] = playerAttacks ? [m.id, f.id, dmg] : [f.id, m.id, dmg];
  return play.call(this, m, f, playerAttacks, skill, dmg, target);
};
// after every battle (main.js startBattle)
export function battleTally(g, battle, result) {
  const s = g.state;
  s.foeSeen = s.foeSeen || {};
  s.foeKills = s.foeKills || {};
  for (const f of battle.foes) {
    s.foeSeen[f.id] = true;
    if (f.hp <= 0) s.foeKills[f.id] = (s.foeKills[f.id] || 0) + 1;
  }
  if (result === 'win') { bump(s, 'wins'); bump(s, 'goldGot', battle.foes.reduce((n, f) => n + f.gold, 0)); }
}
// a field spot was used (main.js interact): inns (event 11) and card squares
export function spotTally(s, poi) {
  if (poi.event === 11) bump(s, 'inns');
  if (poi.effect === 'shop') bump(s, 'cardSquares');
}

// ---------- shared bits ----------
export const el = (tag, cls, ...kids) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) e.append(k);
  return e;
};
export function sprite(sheet, sx, sy, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const im = img(sheet);
  const paint = () => im.ok && c.getContext('2d').drawImage(im.im, sx, sy, w, h, 0, 0, w, h);
  if (im.ok) paint(); else im.p.then(paint);
  return c;
}
export function overlay(cls = '') {
  const root = el('div', 'fm ' + cls);
  document.getElementById('app').appendChild(root);
  root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
  return root;
}
export const button = (label, fn, cls = 'btn') => { const b = el('button', cls, label); b.onclick = fn; return b; };
// waits for a tap anywhere on `root` (the original's input_loop_run)
export const tap = (root) => new Promise((res) => {
  const h = (e) => { if (e.target.closest('button')) return; root.removeEventListener('click', h); res(); };
  root.addEventListener('click', h);
});

// ---------- field menu entries ----------
const ENTRIES = { recap: '概況', info: '情報', option: '設定', map: '地圖' };
export function fieldExtraHtml() {
  return `<div class="pm-grid">${Object.entries(ENTRIES).map(([k, n]) => `<button class="btn" data-f="${k}">${n}</button>`).join('')}</div>`;
}
export function openFieldEntry(key, g) {
  audio.se(SE_OK);
  return { recap: () => storySoFar(g), info: () => fortuneTeller(g), option: () => openOptions(g), map: () => mapView(g) }[key]();
}

// ---------- 概況 (Scene_Story_So_Far) ----------
// Z2 on: the 概況 is a story scene of its own (game.storyScenes, src/z2a.js) for the numbers in world.story.soFarScenes
const recapScene = (g) => g.storyScenes && (g.world.story.soFarScenes || []).includes((g.state.var || {})[43] || 0);
export function hasRecap(g) { return !!g.world.story.soFar[(g.state.var || {})[43] || 0] || recapScene(g); }
export function storySoFar(g) {
  if (recapScene(g)) return g.storyScenes(g).then(() => { if (g.field) g.field.enter(); });
  const text = g.world.story.soFar[(g.state.var || {})[43] || 0];
  if (!text) { audio.se(SE_ERR); return Promise.resolve(); }
  audio.playBgm('Z1 あらすじ');
  const root = overlay('fm-recap');
  const cv = el('canvas');
  cv.width = 512; cv.height = 128;
  const msg = el('div', 'win fm-msg');
  root.append(el('div', 'win fm-title', '前情提要'), cv, msg);
  // the original shows the lines in its 4-line message window, a page at a time
  const lines = text.split('\n'), pages = [];
  for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4).join('\n'));
  let scroll = 0, chara = 0, shake = 0, talking = true, raf = 0;
  return new Promise((done) => {
    const frame = () => { // put_story_scene: the sea scrolls, Goku carrying Gohan flies in, waits, then flies off
      const c = cv.getContext('2d'), sea = img(SEA), ev = img(GOKU_GOHAN);
      if (sea.ok) c.drawImage(sea.im, 512 - Math.floor(scroll) * 4, 0, 512, 128, 0, 0, 512, 128);
      shake = shake < 8 ? shake + 1 : 1;
      if (ev.ok) c.drawImage(ev.im, 560 - chara, 14 + (shake <= 4 ? 2 : 0));
      scroll += 0.5;
      if (scroll === 128) scroll = 0;
      if (216 <= 560 - chara) chara += 4; else if (!talking) chara += 6;
      if (!talking && chara > 900) { cancelAnimationFrame(raf); root.remove(); done(); return; }
      raf = requestAnimationFrame(frame);
    };
    frame();
    (async () => {
      for (const p of pages) { msg.textContent = p; await tap(root); audio.se(SE_OK); }
      msg.hidden = true;
      talking = false;
    })();
    root.append(button('略過', () => { cancelAnimationFrame(raf); root.remove(); done(); }, 'btn fm-skip'));
  }).then(() => { if (g.field) g.field.enter(); });
}

// ---------- 情報 (var41 41: the fortune teller) ----------
async function fortuneTeller(g) {
  const s = g.state, f = g.world.fortune;
  audio.playBgm('DB2 イベント04');
  if (!s.sw[32]) { await say(f.first); s.sw[32] = true; }
  for (;;) {
    await say([f.ask], true);
    const k = await choose(f.choice);
    if (k === 0) await battleHistory(g);
    else if (k === 1) await enemyHistory(g);
    else break;
  }
  g.field.enter();
}

function screen(title, build) {
  const root = overlay('fm-screen');
  return new Promise((done) => {
    const render = () => {
      root.innerHTML = '';
      root.append(el('div', 'win fm-head', title), ...build(render));
      root.append(el('div', 'fm-bar', button('返回', () => { audio.se(SE_OK); root.remove(); done(); })));
    };
    render();
  });
}
const nameOfActor = (w, id) => (w.actors[id] || {}).name || '？';
const nameOfFoe = (w, id) => ((w.enemies[id] || w.bestiary.find((b) => b.id === id)) || {}).name || '？';
const top = (obj, n) => Object.entries(obj || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n);
// the rank shown next to each of the top entries (ties share 1st / 2nd, like the original)
const ranks = (list) => list.map(([, v], z) => (v === list[0][1] ? 1 : list[1] && v === list[1][1] ? 2 : z + 1));
// whose move a skill is (Scene_Db_battle_history ace_tec)
const MOVE_OWNER = [[30, '悟空'], [45, '比克'], [60, '悟飯'], [70, '克林'], [80, '雅木茶'], [90, '天津飯'], [100, '餃子']];

let historyPage = 1;
function battleHistory(g) {
  const w = g.world, s = g.state, t = stats(s);
  return screen('戰鬥記錄', (render) => {
    const box = el('div', 'win fm-rows');
    const row = (k, v) => box.append(el('div', 'fm-row', el('span', '', k), el('b', '', String(v))));
    if (historyPage === 1) {
      const sec = t.time || 0;
      row('遊玩時間', [sec / 3600, (sec / 60) % 60, sec % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':'));
      row('戰鬥勝利回數', t.wins || 0);
      row('擊破數', Object.values(s.defeats || {}).reduce((a, b) => a + b, 0));
      row('我方最大傷害', t.chaMax ? `${nameOfActor(w, t.chaMax[0])} 對 ${nameOfFoe(w, t.chaMax[1])} 造成傷害 ${t.chaMax[2]}` : '');
      row('敵方最大傷害', t.eneMax ? `${nameOfFoe(w, t.eneMax[0])} 對 ${nameOfActor(w, t.eneMax[1])} 造成傷害 ${t.eneMax[2]}` : '');
      row('移動量', `${s.steps || 0}格`);
      row('住宿回數', `${t.inns || 0}回`);
      row('修行回數', `${t.training || 0}回`);
      row('卡片使用回數', `${t.cardSquares || 0}回`);
      row('卡片購買回數', `${t.cardBuy || 0}回`);
      row('卡片販賣回數', `${t.cardSell || 0}回`);
      row('獲得的信用點', t.goldGot || 0);
      row('使用的信用點', t.goldSpent || 0);
    } else {
      const rankRow = (label, list, cell) => {
        box.append(el('div', 'fm-gname', label));
        const line = el('div', 'fm-rank');
        const rk = ranks(list);
        list.forEach((e, z) => line.append(cell(e, rk[z])));
        if (!list.length) line.append(el('span', 'fm-none', '－'));
        box.append(line);
      };
      rankRow('擊破數排名', top(s.defeats, 3), ([id, v], r) => el('div', 'fm-ace', el('span', '', `${r}位`), sprite(FACES, 0, 64 * (id - 3), 64, 64), el('b', '', String(v))));
      rankRow('卡片使用排名', top(s.cardUses, 3), ([id, v], r) => el('div', 'fm-ace', el('span', '', `${r}位`), el('i', '', ((w.items || {})[id] || {}).name || `卡片${id}`), el('b', '', String(v))));
      const moves = top(Object.fromEntries(Object.entries(s.skillLv || {}).filter(([id]) => !(w.skills[id] || {}).combo)), 5);
      box.append(el('div', 'fm-gname', '必殺技使用排名'));
      const rk = ranks(moves);
      moves.forEach(([id, v], z) => box.append(el('div', 'fm-row', el('span', '', `${rk[z]}位 ${v}回：${(MOVE_OWNER.find(([max]) => id <= max) || [0, ''])[1]}`), el('b', '', (w.skills[id] || {}).name || ''))));
      if (!moves.length) box.append(el('div', 'fm-row', el('span', 'fm-none', '－')));
      const combos = top(Object.fromEntries(Object.entries(s.skillLv || {}).filter(([id]) => (w.skills[id] || {}).combo)), 5);
      box.append(el('div', 'fm-gname', '組合技使用排名'));
      const rc = ranks(combos);
      combos.forEach(([id, v], z) => box.append(el('div', 'fm-row', el('span', '', `${rc[z]}位 ${v}回：${w.skills[id].name}`))));
      if (!combos.length) box.append(el('div', 'fm-row', el('span', 'fm-none', '－')));
    }
    const pager = el('div', 'fm-pager', button('◀', () => { audio.se(SE_MOVE); historyPage = 3 - historyPage; render(); }),
      el('span', '', `${historyPage}／2`), button('▶', () => { audio.se(SE_MOVE); historyPage = 3 - historyPage; render(); }));
    return [box, pager];
  });
}

let foeCursor = 0;
function enemyHistory(g) {
  const w = g.world, s = g.state, list = w.bestiary;
  const UNKNOWN = '？？？？？？？？';
  return screen('敵人情報', (render) => {
    const e = list[foeCursor], seen = !!(s.foeSeen || {})[e.id], scouted = !!(s.foeScouted || {})[e.id];
    const det = el('div', 'win fm-foe');
    const art = el('div', 'fm-foe-art');
    const faceBox = el('div', 'fm-black');
    if (seen) faceBox.append(sprite(FOE_FACES, 0, 64 * e.id, 64, 64));
    const school = el('div', 'fm-school', sprite(CARDS, 0, 192, 64, 32));
    school.append(seen ? sprite(CARDS, 32 * e.school, 64, 32, 32) : sprite(CARDS, 320, 0, 32, 32));
    const big = el('div', 'fm-black fm-big');
    if (seen && w.enemies[e.id]) big.append(sprite(w.enemies[e.id].portrait, 0, 0, 96, 96));
    art.append(el('div', '', faceBox, school), big);
    const rows = el('div', 'fm-rows');
    const row = (k, v) => rows.append(el('div', 'fm-row', el('span', '', k), el('b', '', String(v))));
    const drop = (k) => (e.drops[k] == null ? '無' : scouted || ((s.foeDrops || {})[e.id] || []).includes(e.drops[k]) ? ((w.items || {})[e.drops[k]] || {}).name || UNKNOWN : UNKNOWN);
    row('ＨＰ', scouted ? e.maxhp : UNKNOWN);
    row('卡片掉落', drop(0));
    row('', drop(1));
    row('經驗值', seen ? e.exp : UNKNOWN);
    row('ＣＡＰ', seen ? e.gold : UNKNOWN);
    row('ＳＰ', seen ? e.sp : UNKNOWN);
    row('擊破數', seen ? (s.foeKills || {})[e.id] || 0 : UNKNOWN);
    det.append(el('div', 'fm-foe-name', seen ? e.name : UNKNOWN), art, rows);
    const pick = el('div', 'win fm-foe-list');
    list.forEach((x, k) => {
      const b = button(`${k + 1}：${(s.foeSeen || {})[x.id] ? x.name : UNKNOWN}`, () => { audio.se(SE_MOVE); foeCursor = k; render(); }, 'fm-pick' + (k === foeCursor ? ' on' : ''));
      pick.append(b);
    });
    requestAnimationFrame(() => { const on = pick.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); });
    return [det, pick];
  });
}

// ---------- 設定 (Scene_Db_Option) ----------
const OPTION_ROWS = [
  ['bgm', '戰鬥ＢＧＭ', [[0, '默認'], [1, '隨機'], ...Object.entries(BATTLE_BGM).map(([k, v]) => [Number(k), v[1]])], '設定通常戰鬥的BGM'],
  ['enc', '遇敵', [[0, '少'], [1, '普通'], [2, '多']], '設定遇敵頻率'],
  ['encSe', '遇敵音樂', [[0, 'DBZ 強襲！サイヤ人！'], [1, 'DBZ3 烈戦人造人間'], [2, 'DBZ 超サイヤ伝説'], [3, 'DBZ 悟空激闘伝']], '設定遇敵音'],
  ['battleFast', '戰鬥速度', [[0, '默認值'], [1, '高速化']], '設定戰鬥動畫的速度'],
  ['quickGo', '選完直接出招', [[0, '關閉'], [1, '打開']], '全員選好卡片後不用按「出招！」，直接開始（和原版一樣）'],
  ['fastMsg', '消息高速化', [[0, '無效'], [1, '有效']], '訊息一次全部顯示'],
  ['skipOp', '跳過ＯＰ', [[0, '關閉'], [1, '打開']], '啟動時不播放片頭動畫'],
  ['skipRecap', '跳過概況', [[0, '關閉'], [1, '打開']], '讀取存檔時不顯示前情提要'],
];
function openOptions(g) {
  let help = '';
  return screen('設定', (render) => {
    const box = el('div', 'win fm-rows fm-opts');
    for (const [key, label, values, desc] of OPTION_ROWS) {
      const i = values.findIndex(([v]) => v === options[key]);
      const step = (d) => {
        audio.se(SE_MOVE);
        options[key] = values[(i + d + values.length) % values.length][0];
        saveOptions();
        textSpeed.instant = !!options.fastMsg;
        battleOpts.quick = !!options.quickGo;
        help = desc;
        if (key === 'encSe') audio.se('Z1 敵発見');
        render();
      };
      box.append(el('div', 'fm-gname', label), el('div', 'fm-step', button('◀', () => step(-1), ''), el('b', '', values[Math.max(0, i)][1]), button('▶', () => step(1), '')));
    }
    return [box, el('div', 'win fm-help', help || '用 ◀ ▶ 變更設定（自動保存在這台裝置上）')];
  });
}

// ---------- 地圖 (Field_Main $CursorState 2: the map can be scrolled freely) ----------
function mapView(g) {
  const f = g.field, s = g.state;
  f.cam = { x: s.x, y: s.y };
  const root = overlay('fm-mapview');
  root.append(el('div', 'win fm-maphint', '地圖：拖曳畫面查看整張地圖'), el('div', 'fm-bar', button('返回', () => close())));
  let last = null, done;
  root.addEventListener('pointerdown', (e) => { last = [e.clientX, e.clientY]; });
  root.addEventListener('pointermove', (e) => {
    if (!last) return;
    const k = 1 / (view.cssPerPx || 1);
    f.cam.x = Math.max(0, Math.min(f.map.w * 32, f.cam.x - (e.clientX - last[0]) * k));
    f.cam.y = Math.max(0, Math.min(f.map.h * 32, f.cam.y - (e.clientY - last[1]) * k));
    last = [e.clientX, e.clientY];
  });
  root.addEventListener('pointerup', () => { last = null; });
  const close = () => { audio.se(SE_OK); f.cam = null; root.remove(); done(); };
  return new Promise((res) => { done = res; });
}

// ---------- Dragon Radar (Scene_Dragon_Radar) ----------
export function openRadar(g) {
  const s = g.state, targets = (g.world.radar || {})[s.map] || [];
  audio.playBgm('Z2 ドラゴンレーダー');
  const root = overlay('fm-radar');
  const cv = el('canvas');
  cv.width = 116; cv.height = 116;
  root.append(el('div', 'fm-radar-strip', cv, el('div', 'fm-radar-hint', '點雷達切換範圍')), el('div', 'fm-bar', button('返回', () => close())));
  let mode = 0, rate = 1, done;
  const draw = () => {
    const c = cv.getContext('2d'), r = img(RADAR), b = img(BALL);
    c.clearRect(0, 0, 116, 116);
    if (r.ok) c.drawImage(r.im, 0, mode * 116, 116, 116, 0, 0, 116, 116);
    const px = Math.floor(s.x / 32), py = Math.floor(s.y / 32);
    for (const t of targets) { // output_ball: within 25 squares × the zoom (Manhattan distance); Ruby's / floors
      if (t.when && !holds(s, t.when)) continue; // {x, y, when}: shown on some pages only (the Z2 maps)
      const [x, y] = Array.isArray(t) ? t : [t.x, t.y];
      if (Math.abs(x - px) + Math.abs(y - py) < 25 * rate && b.ok)
        c.drawImage(b.im, 0, 0, 8, 8, 51 + Math.floor(((x - px) * 2) / rate), 55 + Math.floor(((y - py) * 2) / rate), 8, 8);
    }
  };
  Promise.all([img(RADAR).p, img(BALL).p]).then(draw);
  cv.onclick = () => { // C: two frames of the zoom animation, then the next range (3 ranges)
    audio.se(SE_OK);
    mode++; draw();
    setTimeout(() => { mode++; rate++; if (mode === 6) { mode = 0; rate = 1; } draw(); }, 170);
  };
  const close = () => { audio.se(SE_OK); root.remove(); g.field.enter(); done(); };
  return new Promise((res) => { done = res; });
}

fieldCards[1] = ({ game: g }) => openRadar(g).then(() => false); // item card 1 (from Bulma); never spent

const css = document.createElement('style');
css.textContent = `
.fm { position: absolute; inset: 0; z-index: 46; background: #9040f0; display: flex; flex-direction: column; gap: 4px;
  padding: calc(var(--safe-t) + 4px) 4px calc(var(--safe-b) + 4px); overflow-y: auto; touch-action: pan-y; color: var(--ink); }
.fm .win { border-width: 8px; border-image-width: 8px; padding: 4px 8px; }
.fm canvas { image-rendering: pixelated; flex: none; }
.fm-head { font-size: 18px; color: #d0480c; }
.fm-bar { display: flex; gap: 6px; margin-top: auto; }
.fm-bar .btn { margin: 0; text-align: center; flex: 1; }
.fm-rows { font-size: 16px; display: grid; gap: 3px; }
.fm-row { display: flex; gap: 8px; align-items: baseline; }
.fm-row span { flex: none; min-width: 7em; }
.fm-row b { font-weight: 400; flex: 1; text-align: right; }
.fm-gname { margin-top: 6px; color: #d0480c; }
.fm-gname:first-child { margin-top: 0; }
.fm-rank { display: flex; gap: 8px; padding-left: 8px; }
.fm-ace { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 80px; }
.fm-ace canvas { width: 48px; height: 48px; background: #000; }
.fm-ace i { font-style: normal; font-size: 14px; text-align: center; }
.fm-none { color: #8a6a44; }
.fm-pager { display: flex; align-items: center; justify-content: center; gap: 16px; color: #fff; font-size: 18px; }
.fm-pager button, .fm-step button { width: 44px; height: 36px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid #c8642a; }
.fm-foe-name { font-size: 18px; }
.fm-foe-art { display: flex; gap: 10px; margin: 4px 0; }
.fm-black { background: #000; width: 64px; height: 64px; }
.fm-big { width: 96px; height: 96px; }
.fm-school { position: relative; width: 64px; height: 32px; }
.fm-school canvas:last-child { position: absolute; left: 16px; top: 0; }
.fm-foe-list { flex: 1; min-height: 120px; overflow-y: auto; overflow-x: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2px 6px; align-content: start; }
.fm-pick { text-align: left; padding: 4px 6px; font-size: 15px; white-space: nowrap; overflow: hidden; min-width: 0; color: var(--ink); background: #fff0d0; border: 2px solid transparent; }
.fm-pick.on { border-color: #f83800; }
.fm-step { display: flex; align-items: center; gap: 6px; padding-left: 12px; }
.fm-step b { flex: 1; text-align: center; font-weight: 400; color: #d0480c; font-size: 15px; }
.fm-help { font-size: 15px; min-height: 2.6em; }
.fm-recap { align-items: center; justify-content: center; gap: 10px; }
.fm-recap canvas { width: 100%; max-width: 512px; aspect-ratio: 4 / 1; }
.fm-title { font-size: 22px; padding: 6px 28px !important; }
.fm-msg { align-self: stretch; min-height: 7.5em; font-size: 17px; line-height: 1.6; white-space: pre-wrap; }
.fm-skip { position: absolute; right: 8px; top: calc(var(--safe-t) + 8px); width: auto; margin: 0; font-size: 15px; }
.fm-mapview, .fm-radar { background: transparent; touch-action: none; }
.fm-maphint { font-size: 15px; text-align: center; }
.fm-radar-strip { margin-top: auto; background: #000; display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
.fm-radar-strip canvas { width: 232px; height: 232px; }
.fm-radar-hint { color: #fff; font-size: 13px; margin-top: 4px; }
.fm-radar .fm-bar { margin-top: 0; }
`;
document.head.appendChild(css);
