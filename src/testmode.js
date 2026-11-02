// 測試模式 (index.html?test): a page of jump points for testing by hand, and while it is on: every member at Lv 99,
// every card at its maximum, no random encounters on the maps. It keeps its own save slots (src/main.js), so the
// player's real saves are never touched. ?test alone shows the list; a pick reloads as ?test&dev=… (the dev jumps).
import { applyLevel } from './party.js?v=20261103-0433';
import { cardState, maxOf } from './items.js?v=20261103-0433';

const params = new URLSearchParams(location.search);
export const TEST = params.has('test');

const LIST = [
  ['Z1', [['new', '第一章 拉蒂茲篇（新的開始）'], ['ch5', '第五章 卡里克篇'], ['ch6', '第六章 界王修行'], ['ch6earth', '第六章 迎擊賽亞人'],
    ['ch6vegeta', '第六章 只剩貝吉塔'], ['willow', '威洛篇'], ['willowboss', '威洛篇 頭目前']]],
  ['Z2', [['z2', '前往那美克星'], ['z2b', '悟空出擊'], ['z2c', '悟飯一行回到那美克星'], ['z2d', '大長老'], ['z2ginyu', '基紐特戰隊'],
    ['z2frieza', '弗利薩（第二型態前）'], ['z2last', '弗利薩最終型態前'], ['z2turles', '達列斯・史拉格支線']]],
  ['Z3', [['z3', '第一章 集龍珠'], ['z3b', '第二章 魔凶星篇'], ['z3c', '第三章 弗利薩復仇'], ['z3d', '第四章 古拉來襲'], ['z3e', '第五章 人造人間']]],
  ['Z4', [['z4', '第一章 賽魯誕生的秘密'], ['z4b', '第二章 悄悄接近的賽魯'], ['z4c', '第三章 貝吉塔父子出擊'], ['z4d', '第四章 金屬古拉'],
    ['z4e', '第五章 人造人間 13 號'], ['z4f', '第六章 賽魯遊戲']]],
  ['時之間', [['tr', '大廳'], ['trz1', 'Z1 區域'], ['trz2', 'Z2 區域'], ['trz3', 'Z3 區域'], ['trz4', 'Z4 區域'], ['trbd', '巴達克篇'],
    ['trfuture', '絕望的反抗']]],
  ['ZG', [['zga', '本編 巴達克一夥篇'], ['zgb', '本編 毀滅瓦斯・西之都'], ['zgc', '本編 克恩星・暗黑行星'], ['zgbroly', '熱戰烈戰超激戰'],
    ['zgbojack', '銀河危機']]],
];

// ?test without a jump: the list instead of the title screen (returns true when it took over)
export function showTestMenu() {
  if (!TEST || params.has('dev') || params.has('new')) return false;
  const el = document.createElement('div');
  el.className = 'tm';
  el.innerHTML = `<div class="tm-head">測試模式</div>
    <div class="tm-note">全員 Lv99・卡片全滿・地圖上不遇敵。存檔另外放，不會蓋掉正式存檔。</div>
    ${LIST.map(([era, rows]) => `<div class="tm-era">${era}</div><div class="tm-grid">${rows.map(([k, label]) =>
    `<button class="btn" data-k="${k}">${label}</button>`).join('')}</div>`).join('')}
    <button class="btn tm-exit" data-k="exit">離開測試模式</button>`;
  el.onclick = (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const k = b.dataset.k;
    location.search = k === 'exit' ? '' : k === 'new' ? '?test&new' : `?test&dev=${k}&timer`;
  };
  document.getElementById('app').appendChild(el);
  return true;
}

// while testing: everyone who is (or later joins) below Lv 99 goes up to it, and the cards stay full
export function startTestBoost(game) {
  if (!TEST) return;
  const badge = document.createElement('button');
  badge.className = 'tm-badge';
  badge.textContent = '測試';
  badge.onclick = () => { location.search = '?test'; };
  document.getElementById('app').appendChild(badge);
  setInterval(() => {
    const s = game.state, w = game.world;
    if (!s || !s.party || !s.party.length) return;
    for (const m of [...s.party, ...Object.values(s.bench || {})]) {
      if (!m || m.level >= 99 || !w.actors[m.id]) continue;
      const exp = w.actors[m.id].exp;
      m.level = Math.min(99, exp.length - 1);
      m.exp = exp[m.level];
      m.maxLv = Math.max(m.maxLv || 0, m.level);
      applyLevel(w, m);
      m.hp = m.maxhp; m.ki = m.maxki;
    }
    cardState(s);
    for (const [id, it] of Object.entries(w.items)) if ((s.cards[id] || 0) < maxOf(s, it)) s.cards[id] = maxOf(s, it);
    if ((s.zeni || 0) < 99999) s.zeni = 99999;
    if (game.renderHud && game.scene === game.field) game.renderHud();
  }, 1500);
}

const css = document.createElement('style');
css.textContent = `
.tm { position: absolute; inset: 0; z-index: 60; overflow-y: auto; background: #9040f0; color: var(--ink);
  padding: calc(var(--safe-t) + 8px) 10px calc(var(--safe-b) + 12px); touch-action: pan-y; }
.tm-head { font-size: 22px; color: #fff; text-align: center; margin: 4px 0 6px; }
.tm-note { font-size: 13px; color: #ffe; text-align: center; margin-bottom: 8px; }
.tm-era { color: #ffe070; font-size: 16px; margin: 10px 2px 4px; }
.tm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.tm-grid .btn { margin: 0; font-size: 14px; padding: 8px 4px; text-align: center; }
.tm-exit { display: block; width: 100%; margin: 16px 0 0; text-align: center; }
.tm-badge { position: absolute; right: 6px; bottom: calc(var(--safe-b) + 6px); z-index: 55; font-size: 12px; padding: 3px 8px;
  background: #c00; color: #fff; border: 2px solid #fff; border-radius: 4px; opacity: .85; }
`;
document.head.appendChild(css);
