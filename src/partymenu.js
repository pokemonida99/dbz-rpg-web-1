// Party screens, tactics and the battle command menu, after the original:
//   battle command (101_Scene_Db_Battle.rb output_menu / window_key_state, $WinState 0 → 8 / 5):
//     戰鬥 → 自動・手動　　菜單 → 隊伍・卡牌・組合技・作戰　　逃跑
//   隊伍 (100_Scene_Db_Status.rb, from the battle menu and the field menu): each member's face, school, LV / HP / KI,
//     攻擊力・防禦力・速度・經驗・NEXT (or 擊破數・通常攻擊次數), the special moves with KI cost or use count;
//     tap a member, then 換順序 and another member to swap places — party[0] leads on the map (var 42)
//   作戰 (103_Scene_Db_Tactics_Menu.rb, $cha_tactics): per-character settings that 自動 follows
//     (set_auto_btl / set_auto_tec, 101_Scene_Db_Battle.rb:2940-3230)
// Swapping active and waiting members (Scene_Db_Member_change) only exists in Z3 (時の間) and for an item card,
// so it is not offered here; in Z1 only the active party ($partyc) earns EXP (get_sinario_full_party is empty).
//
// Other screens plug into the menu through `menuEntries` (卡牌 = remake-cards, 組合技 = remake-combo):
//   menuEntries.card = async ({ game, battle }) => { … }   // battle is null when opened from the field menu
// In battle the command menu comes back when the promise resolves, unless it resolves to 'stay'
// (the entry has moved the battle on by itself, e.g. started the turn).
import { img, audio, rand } from './core.js?v=20261101-1711';

const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64; row = actor id - 3; columns: normal, hurt, KO
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // 16×16: row 0 black digits + "/", row 1 HPKILV…NO, row 3 white-on-purple
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_ERR = 'Z3 エラー', SE_RUN = 'Z1 逃げる'; // 139_Public.rb $BGM_*

// ---------- saved per game: tactics and the counters the status screen shows ----------
// state.tactics[actor] = $cha_tactics[0..8][actor]; state.skillLv[skill] = $cha_skill_level (use count, by skill id,
// what S-combos check); state.atkLv[actor] = $cha_normal_attack_level; state.defeats[actor] = $cha_defeat_num
const TACTICS_DEFAULT = { target: 0, tec: 0, nonki: 0, kiheri: 0, kiPct: 1, tecId: 0 };
export function tactics(state, m) {
  state.tactics = state.tactics || {};
  // set_cha_tactics_nil_to_zero: all 0 except "KI below N%" = 1; the chosen move must be one the character knows
  const t = (state.tactics[m.id] = state.tactics[m.id] || {});
  for (const [k, v] of Object.entries(TACTICS_DEFAULT)) if (t[k] == null) t[k] = v;
  if (!m.skills.includes(t.tecId)) t.tecId = m.skills[0] || 0;
  return t;
}

// after one player action (102_Scene_Db_Battle_Anime.rb:88135 / 88224, 010_Share.rb cha_defeat_num_add)
export function tally(state, m, skill, defeated) {
  const add = (k, id, n = 1) => { state[k] = state[k] || {}; state[k][id] = Math.min(99999, (state[k][id] || 0) + n); };
  if (skill) add('skillLv', skill.id); else add('atkLv', m.id);
  if (defeated) add('defeats', m.id, defeated);
}

// ---------- 自動 (set_auto_tec / set_auto_btl) ----------
// Skill element flags (Skills.element_set in the original database): 27 = 小技, 28 = 大技 (a few are both).
const SMALL = new Set([1, 2, 5, 31, 33, 34, 35, 46, 47, 61, 62, 63, 71, 72, 81, 82, 83, 91, 92, 93]);
const BIG = new Set([29, 36, 47, 63, 64, 73, 83, 84, 92, 93]);

// the special move 自動 picks for a member whose card allows one (null = no move: a normal attack)
export function autoSkill(world, state, m) {
  const skills = m.skills.map((id) => world.skills[id]).filter(Boolean);
  if (!skills.length) return null;
  const t = tactics(state, m);
  for (let loop = 1; loop < 2000; loop++) {
    const pick = skills[rand(skills.length)];
    let min = pick.ki; // the cheapest move this setting could use; below it the KI is short
    if (t.tec === 3) for (const s of skills) if (BIG.has(s.id)) min = Math.min(min, s.ki);
    if (t.tec === 4) min = Math.min(min, world.skills[t.tecId].ki);
    let set = t.tec;
    if (m.ki < min || loop > 50) set = t.nonki === 0 ? 1 : 2; // short of KI: 不使用KI or 小技能
    if (t.kiheri === 1 && t.kiPct >= Math.floor((m.ki * 100) / m.maxki)) set = 1;
    let s = pick;
    if (set === 1 && pick.ki !== 0) continue;
    if (set === 2 && !SMALL.has(pick.id)) continue;
    if (set === 3 && !BIG.has(pick.id)) continue;
    if (set === 4) s = world.skills[t.tecId];
    if (m.ki < s.ki) continue;
    return s;
  }
  return null;
}

// the enemy 自動 attacks: 0 弱小的 = the lowest HP now, 1 強大的 = the highest max HP (alive)
export function autoTarget(state, m, foes) {
  const alive = foes.filter((f) => f.hp > 0);
  const t = tactics(state, m);
  return (t.target === 1 ? alive.reduce((a, b) => (b.maxhp > a.maxhp ? b : a)) : alive.reduce((a, b) => (b.hp < a.hp ? b : a))).slot;
}

// ---------- battle command menu ----------
export const menuEntries = {
  party: (ctx) => openParty(ctx),
  card: null, // 卡牌 — remake-cards
  combo: null, // 組合技 — remake-combo
  tactics: (ctx) => openTactics(ctx),
};
const ENTRY_NAMES = { party: '隊伍', card: '卡牌', combo: '組合技', tactics: '作戰' };

// $WinState 0: 戰鬥・菜單・逃跑 (planning starts over from the first member)
export function battleCommand(b) {
  b.mode = 'command';
  b.pending = null;
  b.plans = b.party.map(() => null);
  b.cur = null;
  b.say('要怎麼做？');
  b.buttons = [
    ['戰鬥', () => { audio.se(SE_OK); fightMenu(b); }],
    ['菜單', () => { audio.se(SE_OK); battleMenu(b); }],
    ['逃跑', () => {
      if (b.boss) { audio.se(SE_ERR); b.say('這場戰鬥不能逃跑！'); return; }
      audio.se(SE_RUN);
      b.done('escape');
    }],
  ];
}

// $WinState 8: 自動・手動
function fightMenu(b) {
  b.say('戰鬥：自動或手動？', '自動會照「作戰」的設定出牌。');
  b.buttons = [
    ['自動', () => { audio.se(SE_OK); b.autoPlan(); }],
    ['手動', () => { audio.se(SE_OK); b.cur = b.party.findIndex((m) => b.able(m)); b.promptCard(); }],
    ['返回', () => battleCommand(b)],
  ];
}

// $WinState 5: 隊伍・卡牌・組合技・作戰
function battleMenu(b) {
  b.say('菜單');
  b.buttons = [...Object.keys(ENTRY_NAMES).map((k) => [ENTRY_NAMES[k], async () => {
    if (!menuEntries[k]) { audio.se(SE_ERR); b.say(`${ENTRY_NAMES[k]}：準備中`); return; }
    audio.se(SE_OK);
    b.buttons = [];
    const r = await menuEntries[k]({ game: b.game, battle: b });
    if (r !== 'stay') battleCommand(b);
  }]), ['返回', () => battleCommand(b)]];
}

// ---------- field menu (140_Field_Main.rb: 隊伍・卡牌・記錄・概況・組合技・作戰・…) ----------
export function fieldMenuHtml() {
  return `<div class="pm-grid">${Object.keys(ENTRY_NAMES).map((k) =>
    `<button class="btn" data-m="${k}" ${menuEntries[k] ? '' : 'disabled'}>${ENTRY_NAMES[k]}${menuEntries[k] ? '' : '<small>準備中</small>'}</button>`).join('')}</div>`;
}
export function openEntry(key, ctx) { return menuEntries[key] ? menuEntries[key](ctx) : Promise.resolve(); }

// ---------- drawing bits (the original's art, as small canvases) ----------
function sprite(sheet, sx, sy, w, h, cw = w, ch = h) {
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const im = img(sheet);
  const paint = (fn) => { if (im.ok) fn(c.getContext('2d'), im.im); else im.p.then(() => im.ok && fn(c.getContext('2d'), im.im)); };
  if (w) paint((g, i) => g.drawImage(i, sx, sy, w, h, 0, 0, w, h));
  c.paint = paint;
  return c;
}
const faceOf = (m, size = 64) => {
  const col = m.hp <= 0 ? 2 : m.hp * 4 < m.maxhp ? 1 : 0;
  const c = sprite(FACES, 64 * col, 64 * (m.id - 3), 64, 64);
  c.style.width = c.style.height = size + 'px';
  c.className = 'pm-face';
  return c;
};
function schoolTag(school) { // "[神]" under the face
  const c = sprite(CARDS, 0, 192, 64, 32);
  c.paint((g, i) => g.drawImage(i, 32 * school, 64, 32, 32, 16, 0, 32, 32));
  return c;
}
// a number in the original 16px digits (row 0 black, row 3 white on purple)
function digits(n, row = 0) {
  const s = String(Math.max(0, Math.floor(n)));
  const c = sprite(DIGITS, 0, 0, 0, 0, 16 * s.length, 16);
  c.paint((g, i) => { for (let k = 0; k < s.length; k++) g.drawImage(i, 16 * Number(s[k]), 16 * row, 16, 16, 16 * k, 0, 16, 16); });
  c.className = 'pm-num';
  return c;
}
const LETTER = { H: 0, P: 1, K: 2, I: 3, L: 4, V: 5, N: 8, O: 9 };
function word(w) {
  const c = sprite(DIGITS, 0, 0, 0, 0, 16 * w.length, 16);
  c.paint((g, i) => [...w].forEach((ch, k) => g.drawImage(i, 16 * LETTER[ch], 16, 16, 16, 16 * k, 0, 16, 16)));
  c.className = 'pm-num';
  return c;
}
const slash = () => Object.assign(sprite(DIGITS, 160, 0, 16, 16), { className: 'pm-num' });
const el = (tag, cls, ...kids) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) e.append(k);
  return e;
};

// the overlay shared by 隊伍 and 作戰: party list on top, the screen's own windows below, 返回 at the bottom
function screen(title, game, battle, body) {
  const s = game.state;
  const root = el('div', 'pm');
  document.getElementById('app').appendChild(root);
  let cur = 0, swapFrom = null;
  const done = new Promise((res) => { root.close = () => { audio.se(SE_OK); root.remove(); res(); }; });
  const render = () => {
    const party = s.party;
    cur = Math.min(cur, party.length - 1);
    root.innerHTML = '';
    const list = el('div', 'win pm-list');
    const head = el('div', 'pm-head', word('NO'), el('span', '', title));
    list.append(head);
    const row = el('div', 'pm-members');
    party.forEach((m, i) => {
      const b = el('button', 'pm-mem' + (i === cur ? ' on' : '') + (swapFrom === i ? ' from' : ''), digits(i + 1, 3), faceOf(m, 44), el('span', '', m.name));
      b.onclick = () => {
        if (swapFrom != null) { // 並び替え: the two swap places (Scene_Db_Status update, $window_state 1)
          if (swapFrom !== i) {
            [party[swapFrom], party[i]] = [party[i], party[swapFrom]];
            s.var[42] = party[0].id; // the character shown on the map
          }
          audio.se(SE_OK);
          cur = i;
          swapFrom = null;
        } else { audio.se(SE_MOVE); cur = i; }
        render();
      };
      row.append(b);
    });
    list.append(row);
    if (swapFrom != null) list.append(el('div', 'pm-hint', `要和誰交換位置？（${party[swapFrom].name}）`));
    root.append(list, ...body(party[cur], render, { battle }));
    const bar = el('div', 'pm-bar');
    if (title === '隊伍' && party.length > 1) {
      const sw = el('button', 'btn', swapFrom == null ? '換順序' : '取消');
      sw.onclick = () => { audio.se(SE_OK); swapFrom = swapFrom == null ? cur : null; render(); };
      bar.append(sw);
    }
    const back = el('button', 'btn', '返回');
    back.onclick = () => root.close();
    bar.append(back);
    root.append(bar);
  };
  render();
  root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
  return done;
}

// ---------- 隊伍 (Scene_Db_Status) ----------
let showUses = false, showRecord = false; // X: KI消耗 ⇄ 使用回數, Y: 能力 ⇄ 記錄 (kept between visits, like the original)
export function openParty({ game, battle }) {
  const world = game.world, s = game.state;
  return screen('隊伍', game, battle, (m, render) => {
    const st = el('div', 'win pm-stat');
    const left = el('div', 'pm-left', faceOf(m), schoolTag(m.school));
    const curve = world.actors[m.id].exp;
    const next = m.level >= 99 ? 0 : curve[m.level + 1] - m.exp;
    const nums = el('div', 'pm-nums',
      el('div', '', word('LV'), el('i'), digits(m.level)),
      el('div', '', word('HP'), el('i'), digits(m.hp)), el('div', '', slash(), el('i'), digits(m.maxhp)),
      el('div', '', word('KI'), el('i'), digits(m.ki)), el('div', '', slash(), el('i'), digits(m.maxki)));
    const rows = showRecord
      ? [['擊破數', (s.defeats || {})[m.id] || 0], ['通常攻擊次數', (s.atkLv || {})[m.id] || 0]]
      : [['攻擊力', m.atk], ['防禦力', m.def], ['速度', m.agi], ['經驗', m.exp], ['NEXT', next]];
    const tbl = el('div', 'pm-rows');
    for (const [k, v] of rows) tbl.append(el('div', '', el('span', '', k), digits(v)));
    st.append(el('div', 'pm-top', left, nums), tbl);

    const tec = el('div', 'win pm-tec');
    tec.append(el('div', 'pm-th', el('span', '', '必殺技'), el('span', '', showUses ? '使用回數' : 'KI消耗')));
    for (const id of m.skills) {
      const k = world.skills[id];
      tec.append(el('div', 'pm-tr', el('span', '', k.name), digits(showUses ? (s.skillLv || {})[id] || 0 : k.ki)));
    }
    if (!m.skills.length) tec.append(el('div', 'pm-tr', el('span', '', '（沒有必殺技）')));
    const tog = el('div', 'pm-tog');
    const t1 = el('button', 'btn', showUses ? '看 KI 消耗' : '看使用回數');
    t1.onclick = () => { audio.se(SE_MOVE); showUses = !showUses; render(); };
    const t2 = el('button', 'btn', showRecord ? '看能力' : '看戰績');
    t2.onclick = () => { audio.se(SE_MOVE); showRecord = !showRecord; render(); };
    tog.append(t1, t2);
    return [st, tec, tog];
  });
}

// ---------- 作戰 (Scene_Db_Tactics_Menu) ----------
// option texts from output_status (the Chinese edition), in Traditional characters
export function openTactics({ game, battle }) {
  const world = game.world, s = game.state;
  return screen('作戰', game, battle, (m, render) => {
    const t = tactics(s, m);
    const box = el('div', 'win pm-tac');
    const opt = (key, value, label) => {
      const b = el('button', 'pm-opt' + (t[key] === value ? ' on' : ''), label);
      b.onclick = () => { audio.se(SE_MOVE); t[key] = value; render(); };
      return b;
    };
    // ◀ value ▶ stepper (the specified move / the KI percentage), live only while its option is chosen;
    // `big` adds «» for steps of 5 (the original's left / right)
    const stepper = (live, text, step, big) => {
      const w = el('span', 'pm-step' + (live ? '' : ' off'));
      const btn = (label, d) => {
        const b = el('button', '', label);
        b.onclick = () => { if (live) { audio.se(SE_MOVE); step(d); render(); } };
        return b;
      };
      if (big) w.append(btn('«', -5));
      w.append(btn('◀', -1), el('b', '', text), btn('▶', 1));
      if (big) w.append(btn('»', 5));
      return w;
    };
    const group = (name, ...lines) => {
      box.append(el('div', 'pm-gname', name));
      for (const line of lines) box.append(el('div', 'pm-line', ...line));
    };
    group('・優先攻擊的敵人', [opt('target', 0, '弱小的'), opt('target', 1, '強大的')]);
    const ix = m.skills.indexOf(t.tecId);
    group('・技能的選擇',
      [opt('tec', 0, '自動'), opt('tec', 1, '不使用KI')],
      [opt('tec', 2, '小技能'), opt('tec', 3, '大技能')],
      [opt('tec', 4, '使用指定的招式：')],
      m.skills.length ? [stepper(t.tec === 4, world.skills[t.tecId].name, (d) => { t.tecId = m.skills[(ix + d + m.skills.length) % m.skills.length]; })] : []);
    group('・指定的招式／KI不足時', [opt('nonki', 0, 'KI不使用'), opt('nonki', 1, '小技能')]);
    group('・KI的消費', [opt('kiheri', 0, '不介意')], [opt('kiheri', 1, `${t.kiPct}％以下不使用KI`)],
      [stepper(t.kiheri === 1, `${t.kiPct}％`, (d) => { t.kiPct = ((((t.kiPct - 1 + d) % 99) + 99) % 99) + 1; }, true)]);
    if (!m.skills.length) box.append(el('div', 'pm-hint', `${m.name}沒有必殺技，自動時只會普通攻擊。`));
    return [box];
  });
}

const css = document.createElement('style');
css.textContent = `
.pm { position: absolute; inset: 0; z-index: 46; background: #9040f0; display: flex; flex-direction: column; gap: 4px;
  padding: calc(var(--safe-t) + 4px) 4px calc(var(--safe-b) + 4px); overflow-y: auto; touch-action: pan-y; color: var(--ink); }
.pm .win { border-width: 8px; border-image-width: 8px; padding: 4px 6px; }
.pm canvas { image-rendering: pixelated; flex: none; }
.pm .pm-num { height: 16px; }
.pm-head { display: flex; align-items: center; gap: 8px; font-size: 18px; color: #d0480c; }
.pm-members { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 4px; margin-top: 4px; }
.pm-mem { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 3px 0; font-size: 15px; color: var(--ink);
  background: #fff0d0; border: 2px solid transparent; position: relative; }
.pm-mem > canvas:first-child { position: absolute; left: 2px; top: 2px; }
.pm-mem .pm-face { background: #000; }
.pm-mem.on { border-color: #f83800; }
.pm-mem.from { background: #ffd27a; }
.pm-hint { font-size: 15px; color: #d0480c; margin-top: 4px; }
.pm-stat .pm-top { display: flex; gap: 12px; }
.pm-left { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pm-left .pm-face { background: #000; }
.pm-nums { flex: 1; display: grid; grid-template-columns: 1fr; gap: 2px; align-content: start; max-width: 190px; }
.pm-nums > div, .pm-rows > div, .pm-tr { display: flex; align-items: center; }
.pm-nums i { flex: 1; }
.pm-rows { margin-top: 6px; display: grid; gap: 2px; font-size: 17px; }
.pm-rows > div span, .pm-tr span { flex: 1; }
.pm-tec { font-size: 17px; }
.pm-th { display: flex; justify-content: space-between; color: #d0480c; margin-bottom: 2px; }
.pm-tr { min-height: 24px; }
.pm-tog, .pm-bar { display: flex; gap: 6px; }
.pm-tog .btn, .pm-bar .btn { margin: 0; text-align: center; flex: 1; }
.pm-bar { margin-top: auto; }
.pm-tac { font-size: 17px; }
.pm-gname { margin-top: 6px; }
.pm-gname:first-child { margin-top: 0; }
.pm-line { display: flex; gap: 6px; padding-left: 16px; margin-top: 4px; }
.pm-opt { flex: 1; text-align: left; padding: 4px 6px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid transparent; }
.pm-opt::before { content: "▶"; color: #d0480c; font-size: 12px; margin-right: 4px; visibility: hidden; }
.pm-opt.on { border-color: #f83800; }
.pm-opt.on::before { visibility: visible; }
.pm-step { flex: 1; display: flex; align-items: center; gap: 6px; }
.pm-step b { flex: 1; text-align: center; font-weight: 400; color: #d0480c; }
.pm-step button { width: 36px; height: 32px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid #c8642a; }
.pm-step.off { opacity: .4; }
#menu .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6px; }
#menu .pm-grid .btn { text-align: center; }
`;
document.head.appendChild(css);
