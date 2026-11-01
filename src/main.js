// Boot, game state, scene switching, story beats, HUD, menu, save/load.
import { view, img, loadImages, audio, say, setFaces, toast, sleep, input, assetUrl, VERSION } from './core.js?v=20261101-2006';
import { tileSheetPaths } from './tiles.js?v=20261101-2006';
import { Field, fieldImages, nextEncounterSteps } from './field.js?v=20261101-2006';
import { Battle, battleImages, newHand, rollEncounter, setCardGame } from './battle.js?v=20261101-2006';
import { makeMember, levelUp } from './party.js?v=20261101-2006';
import { runEvent } from './events.js?v=20261101-2006';
import { playOpening, playStory } from './opening.js?v=20261101-2006'; // the original's title animation and opening story
import { rollArea, chapterGoal, afterRaditz, resumeChapter, chapterSpot, chapterBoss } from './chapter2.js?v=20261101-2006';
import { fieldMenuHtml, openEntry } from './partymenu.js?v=20261101-2006'; // 隊伍・卡牌・組合技・作戰
import { setItemsWorld, bubbles } from './items.js?v=20261101-2006'; // item cards (its 卡牌 menu entry registers itself)
import { setGrowthWorld } from './growth.js?v=20261101-2006'; // skill cards and the other growth cards
import { cardSquare, compo } from './cardgames.js?v=20261101-2006'; // card squares (shop / lottery / memory), 合成
import { fieldExtraHtml, openFieldEntry, setFieldGame, encounterSteps, battleTally, spotTally, storySoFar, hasRecap, options } from './fieldmenu.js?v=20261101-2006'; // 概況・情報・設定・地圖, records, options
import { training } from './training.js?v=20261101-2006'; // training squares
import { chapter3Goal, startChapter3, resumeChapter3, chapter3Spot, isChapter3Map, chapter3Boss } from './chapter3.js?v=20261101-2006';
import { playEvent, setCutsceneWorld, raditzOutcome } from './cutscene.js?v=20261101-2006'; // story scenes staged like the original
import { chapter6Goal, startChapter6, resumeChapter6, chapter6Spot, isChapter6Map, chapter6Boss, devChapter6 } from './chapter6.js?v=20261101-2006'; // King Kai, the Saiyans, the end of Z1

// testing in a hidden browser pane (no animation frames there): ?timer drives every frame with timers instead
if (new URLSearchParams(location.search).has('timer')) window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);

const SAVE_KEY = 'dbz-portrait-save-v1';
const AUTO_KEY = 'dbz-portrait-autosave-v1'; // the original's Save_Auto.rvdata: after each normal battle won
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // the party screen's 64×64 faces; row = actor id - 3; columns: normal, hurt, KO

const game = {
  world: null,
  state: null,
  scene: null,
  field: null,
  busy: false,

  newState() {
    const w = this.world;
    return {
      map: '1', x: w.start.x * 32 + 16, y: w.start.y * 32 + 16, travel: 0,
      steps: 0, nextEnc: nextEncounterSteps(),
      party: w.party.map((id) => makeMember(w, id)),
      hand: newHand(w),
      zeni: 0,
      flags: {},
      sw: {}, // the original's switches and variables, for its events (src/events.js)
      var: { 42: 3 }, // 42 = the character leading on the map (3 = 悟空)
    };
  },

  async onStep() {
    const s = this.state;
    s.steps++;
    if (this.busy || bubbles(s) || --s.nextEnc > 0) return; // バブルス card keeps enemies away
    s.nextEnc = encounterSteps(nextEncounterSteps());
    const foes = rollArea(this.world, s) || rollEncounter(this.world);
    if (foes.length && await this.startBattle(foes, false)) save(true, AUTO_KEY); // all.rb:47000
  },

  // the "examine / enter" button appears while standing next to a building
  onNear(poi) {
    if (poi) actBtn.textContent = poi.label;
    actBtn.onclick = () => poi && this.interact(poi);
  },
  // shown whenever the player stands by a building and nothing else is going on
  syncAct() {
    const near = this.scene === this.field && this.field && !this.field.paused && this.field.near;
    const hide = !near || this.busy;
    if (actBtn.hidden !== hide) actBtn.hidden = hide;
  },

  async interact(poi) {
    if (this.busy) return;
    this.busy = true;
    actBtn.hidden = true;
    this.field.paused = true;
    input.dx = input.dy = 0;
    const s = this.state;
    if (poi.chapter) { await (chapter6Spot(this, poi) || chapter3Spot(this, poi) || chapterSpot(this, poi)); renderHud(); this.busy = false; this.field.paused = false; return; }
    spotTally(s, poi);
    if (['training', 'shop'].includes(poi.effect)) this.field.spent = poi; // once per visit (src/field.js)
    if (poi.effect === 'training') { await training(this); renderHud(); this.busy = false; this.field.paused = false; return; }
    if (poi.fight) { // Pumpkin / Broccoli: their lines, then the fight
      audio.playBgm(poi.bgm);
      await runEvent(this.world.events[poi.event], s);
      this.busy = false;
      await this.startBattle([poi.fight], true, { eventBgm: true }); // an event battle: no escape, the default music
      this.field.paused = false;
      return;
    }
    if (poi.event) await runEvent(this.world.events[poi.event], s);
    else if (poi.lines) await say(poi.lines);
    if (poi.effect === 'rest') for (const m of s.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; }
    if (poi.effect === 'ki') for (const m of s.party) m.ki = m.maxki;
    if (poi.effect === 'shop') await cardSquare(this); // a Z mark: the original's card square (also saves)
    if (poi.effect === 'rest' || poi.effect === 'save' || poi.effect === 'shop') { save(true); toast('已存檔'); }
    renderHud();
    this.busy = false;
    this.field.paused = false;
  },

  async onBoss(b) {
    if (isChapter6Map(this.state)) return chapter6Boss(this, b);
    if (isChapter3Map(this.state)) return chapter3Boss(this);
    if (this.state.map !== '1') return chapterBoss(this);
    if (this.busy) return;
    this.busy = true;
    this.field.paused = true;
    input.dx = input.dy = 0;
    await playEvent(this.world.story.boss, this.state);
    this.busy = false;
    const won = await this.startBattle([this.world.boss.enemy], true);
    if (won) {
      this.state.flags.bossDone = true;
      raditzOutcome(this.state);
      await playEvent(this.world.story.ending, this.state);
      save(true);
      await afterRaditz(this); // chapter 2 (src/chapter2.js)
    }
  },

  async startBattle(enemyIds, boss, opts) {
    this.busy = true;
    this.field.leave();
    this.field.paused = true;
    hud.hidden = true;
    audio.se('Z1 敵発見', 80);
    const flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:25;opacity:1;transition:opacity .35s';
    document.getElementById('app').appendChild(flash);
    await sleep(60);
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 400);
    const battle = new Battle(this.world, this, enemyIds, boss, opts);
    Object.assign(battle, opts); // e.g. eventBgm (src/fieldmenu.js), bgm, loseOk, foeHp (src/chapter6.js)
    this.scene = battle;
    this.lastBattle = battle;
    const result = await battle.run();
    battleTally(this, battle, result);
    this.scene = this.field;
    hud.hidden = false;
    renderHud();
    this.field.paused = false;
    this.field.enter();
    this.busy = false;
    if (result === 'lose' && !(opts && opts.loseOk)) {
      await say([['', '悟空們被打倒了……'], ['', '回到最後的存檔。']]);
      if (!load(newest())) restart();
    }
    return result === 'win';
  },
};
window.__game = game;

// ---------- HUD ----------
const hud = document.getElementById('hud');
const actBtn = document.getElementById('act');
// the same face as the party / battle screens, shown at a whole number of device pixels per art pixel (crisp)
function faceCanvas(m) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const dpr = window.devicePixelRatio || 1;
  const css = (64 * Math.max(1, Math.round((36 * dpr) / 64))) / dpr; // about 36 CSS px
  c.style.width = c.style.height = `${css}px`;
  const col = m.hp <= 0 || m.ko ? 2 : m.hp * 4 < m.maxhp ? 1 : 0; // normal / hurt / KO, like the battle screen
  const f = img(FACES);
  const paint = () => { if (f.ok) c.getContext('2d').drawImage(f.im, 64 * col, 64 * (m.id - 3), 64, 64, 0, 0, 64, 64); };
  if (f.ok) paint(); else f.p.then(paint);
  return c;
}
export { faceCanvas };
function renderHud() {
  const s = game.state;
  hud.classList.toggle('many', s.party.length > 3);
  hud.innerHTML = '<div class="party"></div><button class="menu-btn" aria-label="選單">☰</button><div class="goal"></div>';
  const party = hud.querySelector('.party');
  for (const m of s.party) {
    const el = document.createElement('div');
    el.className = 'pcard';
    el.appendChild(faceCanvas(m));
    el.insertAdjacentHTML('beforeend', `<div><div class="nm">${m.name} <span class="lv">Lv${m.level}</span></div>
      <div class="bar"><i style="width:${(100 * m.hp / m.maxhp) | 0}%"></i></div>
      <div class="bar ki"><i style="width:${(100 * m.ki / m.maxki) | 0}%"></i></div></div>`);
    party.appendChild(el);
  }
  hud.querySelector('.menu-btn').onclick = openMenu;
  hud.querySelector('.goal').textContent = chapter6Goal(game.world, s) ?? chapter3Goal(game.world, s) ?? chapterGoal(game.world, s) ?? (s.flags.bossDone ? '' : '目標：飛往右上方救回悟飯（建議練到 Lv6 以上）');
}
game.renderHud = renderHud;

// ---------- menu ----------
const menu = document.getElementById('menu');
function openMenu() {
  if (game.busy) return;
  game.field.paused = true;
  game.field.leave();
  const has = !!localStorage.getItem(SAVE_KEY);
  menu.innerHTML = `<div class="box"><h2>選單</h2>${fieldMenuHtml()}${fieldExtraHtml()}
    <button class="btn" data-a="compo">合成<small>請卡林大人把兩張卡片合成一張</small></button>
    <button class="btn" data-a="save">存檔<small>隨時記錄目前的位置與狀態</small></button>
    <button class="btn" data-a="load" ${has ? '' : 'disabled'}>讀檔<small>${has ? '回到上次存檔的地方' : '還沒有存檔'}</small></button>
    <button class="btn" data-a="heal">休息<small>回復全員 HP・KI（測試用）</small></button>
    <button class="btn ghost" data-a="close">關閉</button>
    <div class="ver">版本 ${VERSION}</div></div>`;
  menu.hidden = false;
  menu.onclick = (e) => {
    const m = e.target.closest('[data-m]');
    if (m) { // a screen from src/partymenu.js; back to the map when it closes, like the original
      menu.hidden = true;
      openEntry(m.dataset.m, { game, battle: null }).then(() => { renderHud(); game.field.paused = false; game.field.enter(); });
      return;
    }
    const f = e.target.closest('[data-f]');
    if (f) { // src/fieldmenu.js; back to the map when it closes
      menu.hidden = true;
      game.busy = true;
      Promise.resolve().then(() => openFieldEntry(f.dataset.f, game)).finally(() => { game.busy = false; renderHud(); game.field.paused = false; game.field.enter(); });
      return;
    }
    const a = e.target.closest('[data-a]');
    if (!a && e.target !== menu) return;
    const act = a ? a.dataset.a : 'close';
    if (act === 'compo') { menu.hidden = true; game.busy = true; compo(game).then(() => { game.busy = false; game.field.paused = false; renderHud(); }); return; }
    if (act === 'save') { save(); toast('已存檔'); }
    if (act === 'load') { if (load()) { toast('已讀檔'); recap(); } }
    if (act === 'heal') { for (const m of game.state.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; } renderHud(); toast('全員回復了'); }
    menu.hidden = true;
    game.field.paused = false;
    game.field.enter();
  };
}

function save(silent, key = SAVE_KEY) {
  game.state.savedAt = Date.now();
  try { localStorage.setItem(key, JSON.stringify(game.state)); } catch (e) { if (!silent) toast('無法存檔'); }
}
// the save written last: the manual one or the auto-save
function newest() {
  const at = (k) => { try { return (JSON.parse(localStorage.getItem(k)) || {}).savedAt || 0; } catch (e) { return 0; } };
  return localStorage.getItem(AUTO_KEY) && at(AUTO_KEY) > at(SAVE_KEY) ? AUTO_KEY : SAVE_KEY;
}
function load(key = SAVE_KEY) {
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (!s) return false;
    game.state = s;
    s.sw = s.sw || {};
    s.var = s.var || { 42: 3 };
    startField();
    resumeChapter(game);
    resumeChapter3(game);
    resumeChapter6(game);
    return true;
  } catch (e) { return false; }
}
// 概況 when a save is loaded (do_load → Scene_Story_So_Far), unless 跳過概況 is on or the next chapter starts
function recap() {
  if (options.skipRecap || game.busy || !hasRecap(game)) return;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  storySoFar(game).then(() => { game.busy = false; game.field.paused = false; });
}
function restart() { game.state = game.newState(); startField(); }

function startField() {
  if (game.field) game.field.leave();
  game.field = new Field(game.world, game);
  game.scene = game.field;
  game.field.enter();
  hud.hidden = false;
  renderHud();
}

Object.assign(game, { startField, save, showTitle: (sub, notes) => showTitle(sub, notes), nextChapter: startChapter3 }); // for src/chapter2.js, src/chapter3.js
Object.assign(game, { startChapter6 }); // chapter 5 (the Garlic area) ends with game.startChapter6(game)

// ---------- title ----------
const title = document.getElementById('title');
// notes: lines under the subtitle (after Z1: what the original opens next)
function showTitle(sub, notes) {
  if (game.field) { game.field.leave(); game.field.paused = true; }
  hud.hidden = true;
  audio.playBgm(game.world.titleBgm);
  const has = !!localStorage.getItem(SAVE_KEY);
  title.innerHTML = `<img src="${assetUrl('Graphics/System/Title.png')}" alt="">
    <div class="sub">${sub || '重製版・Z1 拉蒂茲篇～貝吉塔篇'}</div>
    ${notes ? `<div class="note unlocks">原版接下來開放：<br>${notes.join('<br>')}<br>（本版尚未製作）</div>` : ''}
    <div class="actions">
      <button class="btn" data-a="new">新的開始</button>
      ${has ? '<button class="btn" data-a="cont">繼續遊戲</button>' : ''}
      ${localStorage.getItem(AUTO_KEY) ? '<button class="btn" data-a="auto">自動存檔</button>' : ''}
    </div>
    <div class="note">拖曳畫面下半部移動・點擊對話框繼續<br>原作：ドラゴンボールZ RPG（同人作品）<br>版本 ${VERSION}</div>`;
  title.hidden = false;
  title.onclick = async (e) => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    audio.unlock();
    title.hidden = true;
    if (a.dataset.a === 'cont' || a.dataset.a === 'auto') { if (load(a.dataset.a === 'auto' ? AUTO_KEY : SAVE_KEY)) recap(); return; }
    if (a.dataset.a === 'new') await playStory(game.world); // the opening story, then the field
    game.state = game.newState();
    startField();
    game.field.paused = true;
    game.busy = true;
    await runEvent(game.world.story.intro, game.state);
    game.busy = false;
    game.field.paused = false;
    save(true);
  };
}

// ---------- main loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (game.scene) {
    game.scene.update(dt);
    game.scene.draw();
    game.syncAct();
  }
  requestAnimationFrame(frame);
}

// a phone may still hold an old copy of the page; if the server has a newer version, reload once with
// a new URL so the browser can't hand back the cached one
async function ensureLatest() {
  try {
    const { v } = await (await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })).json();
    if (v && VERSION !== 'dev' && v !== VERSION && sessionStorage.getItem('dbz-reloaded') !== v) {
      sessionStorage.setItem('dbz-reloaded', v);
      location.replace(`${location.pathname}?v=${v}`);
      return false;
    }
  } catch (e) { /* offline: just run what we have */ }
  return true;
}

async function boot() {
  if (!(await ensureLatest())) return;
  view.resize();
  window.addEventListener('resize', () => view.resize());
  game.world = await (await fetch('data/world.json?v=20261101-2006')).json();
  setCutsceneWorld(game.world);
  setFaces(game.world.faces);
  setItemsWorld(game.world);
  setGrowthWorld(game.world);
  const faceSheets = new Set(Object.values(game.world.faces).map((f) => f[0]));
  await loadImages([...tileSheetPaths, ...fieldImages, ...battleImages(game.world), FACES, ...faceSheets]);
  setFieldGame(game);
  setCardGame(game); // the card schools change from 概況 11 on
  const dev = new URLSearchParams(location.search).get('dev'); // ?dev=ch6 / ch6earth / ch6vegeta: jump to chapter 6
  if (dev && dev.startsWith('ch6')) { title.hidden = true; devChapter6(game, dev); requestAnimationFrame(frame); return; }
  if (!options.skipOp) await playOpening(); // the title animation, like the original plays before its title screen
  showTitle();
  requestAnimationFrame(frame);
}
boot();
