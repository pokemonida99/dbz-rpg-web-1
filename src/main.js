// Boot, game state, scene switching, story beats, HUD, menu, save/load.
import { TEST, showTestMenu, startTestBoost } from './testmode.js?v=20261103-0801'; // 測試模式 (index.html?test)
import { view, img, loadImages, audio, say, setFaces, toast, sleep, input, assetUrl, VERSION } from './core.js?v=20261103-0801';
import { tileSheetPaths } from './tiles.js?v=20261103-0801';
import { Field, fieldImages, nextEncounterSteps } from './field.js?v=20261103-0801';
import { Battle, battleImages, newHand, rollEncounter, setCardGame } from './battle.js?v=20261103-0801';
import { makeMember, levelUp } from './party.js?v=20261103-0801';
import { runEvent } from './events.js?v=20261103-0801';
import { playOpening, playStory } from './opening.js?v=20261103-0801'; // the original's title animation and opening story
import { rollArea, chapterGoal, afterRaditz, resumeChapter, chapterSpot, chapterBoss } from './chapter2.js?v=20261103-0801';
import { fieldMenuHtml, openEntry } from './partymenu.js?v=20261103-0801'; // 隊伍・卡牌・組合技・作戰
import { setItemsWorld, bubbles } from './items.js?v=20261103-0801'; // item cards (its 卡牌 menu entry registers itself)
import { setGrowthWorld } from './growth.js?v=20261103-0801'; // skill cards and the other growth cards
import { cardSquare, compo } from './cardgames.js?v=20261103-0801'; // card squares (shop / lottery / memory), 合成
import { fieldExtraHtml, openFieldEntry, setFieldGame, encounterSteps, battleTally, spotTally, storySoFar, hasRecap, options } from './fieldmenu.js?v=20261103-0801'; // 概況・情報・設定・地圖, records, options
import { training } from './training.js?v=20261103-0801'; // training squares
import { chapter3Goal, startChapter3, resumeChapter3, chapter3Spot, isChapter3Map, chapter3Boss } from './chapter3.js?v=20261103-0801';
import { chapter4Goal, startChapter4, resumeChapter4, chapter4Spot, isChapter4Map, chapter4Boss } from './chapter4.js?v=20261103-0801';
import { playEvent, setCutsceneWorld, raditzOutcome } from './cutscene.js?v=20261103-0801'; // story scenes staged like the original
import { chapter5Goal, startChapter5, resumeChapter5, isChapter5Map, chapter5Boss, devChapter5 } from './chapter5.js?v=20261103-0801';
import { chapter6Goal, startChapter6, resumeChapter6, chapter6Spot, isChapter6Map, chapter6Boss, devChapter6 } from './chapter6.js?v=20261103-0801'; // King Kai, the Saiyans, the end of Z1
import { willowGoal, startWillow, resumeWillow, willowSpot, isWillowMap, willowBoss, devWillow } from './willow.js?v=20261103-0801'; // after Z1: the Willow chapter, up to the hand-over to Z2
import { z2aGoal, startZ2a, resumeZ2a, z2aSpot, storyScenes, z2aBackdrop, devZ2a } from './z2a.js?v=20261103-0801'; // Z2 first half: Namek, Goku's training, the Grand Elder
import { applyEra } from './era.js?v=20261103-0801'; // the Z2 art while variable 40 is 1
import { syncCostume } from './costume.js?v=20261103-0801'; // 換裝: the pictures follow the clothes' variables
import { z2bGoal, startZ2Ginyu, startZ2b, resumeZ2b, z2bSpot, isZ2bMap, z2bBoss, devZ2b } from './z2b.js?v=20261103-0801'; // Z2 second half: the Ginyu Force, Frieza
import { startZ3, resumeZ3, z3Spot, isZ3Map, z3Boss, z3Goal, z3Backdrop, z3BackdropAt, devZ3 } from './z3.js?v=20261103-0801'; // Z3 (the chapters below register themselves there)
import './z3a.js?v=20261103-0801';
import './z3b.js?v=20261103-0801';
import './z3c.js?v=20261103-0801';
import './z3d.js?v=20261103-0801';
import './z3e.js?v=20261103-0801';
import './z3train.js?v=20261103-0801'; // the training mini-games (its ?dev=z3pair / z3gravity)
import './z4a.js?v=20261103-0801'; // Z4 (セル編): its chapters register in src/z3.js too
import './z4b.js?v=20261103-0801';
import './z4c.js?v=20261103-0801';
import './z4d.js?v=20261103-0801';
import './z4e.js?v=20261103-0801';
import './z4f.js?v=20261103-0801';
import { trGoal, trBackdrop } from './timeroom.js?v=20261103-0801'; // 時之間 (registers its spots in src/z3.js too)
import './tr_z1.js?v=20261103-0801'; // 時之間 phase 2: the areas (docs/timeroom-plan.md)
import './tr_z2.js?v=20261103-0801';
import './tr_z3.js?v=20261103-0801';
import './tr_z4.js?v=20261103-0801';
import './tr_bardock.js?v=20261103-0801';
// cards and training squares (docs/cards-plan.md)
import './training_more.js?v=20261103-0801';
import './cards_square.js?v=20261103-0801';
import './cards_a.js?v=20261103-0801';
import { favLoad } from './cards_b.js?v=20261103-0801';
import './cards_story.js?v=20261103-0801';
import './skills_a.js?v=20261103-0801';
import './skills_b.js?v=20261103-0801';
import './skills_c.js?v=20261103-0801';
import './skills_d.js?v=20261103-0801'; // 大工程 skc: the skill cards' passive skills (docs/skc.md)
import './flg.js?v=20261103-0801'; // ?dev=flg… test battles for the move flags (docs/batch2-plan.md flg)
import './grw.js?v=20261103-0801'; // batch 2 grw: CE64, 地球育ちのサイヤ人 at S-combos, dev jumps ?dev=grw…
// 時之間 phase 3 / ZG: the stories (docs/zg-plan.md)
import './tr_future.js?v=20261103-0801';
import './zg_broly.js?v=20261103-0801';
import './zg_bojack.js?v=20261103-0801';
import './zg_a.js?v=20261103-0801';
import './zg_b.js?v=20261103-0801';
import './zg_c.js?v=20261103-0801';
import './zg_recap.js?v=20261103-0801'; // ZG 的概況 (前情提要: src/fieldmenu.js)
import './combo_dev.js?v=20261103-0801'; // ?dev=cmb…: S-combo / ひらめき tests (src/combo.js)
import './sys.js?v=20261103-0801'; // 第二批 sys: 神龍的願望, the shop's added cards, Z3 / Z4 的概況 (docs/sys.md)
import './viz.js?v=20261103-0801'; // the battle's skill names, the cover scene, the Great Ape's face (docs/batch2-plan.md viz)
import './cos.js?v=20261103-0801'; // ?dev=cos…: 換裝 and the DB3 staff roll (docs/costume.md)
import './anime_goku_gohan.js?v=20261103-0801'; // 悟空・悟飯's move films, ?dev=anga… (docs/anim-ab-plan.md anga)
import './anime_piccolo_vegeta.js?v=20261103-0801'; // 比克・貝吉塔's Z3 move films (docs/anim-ab-plan.md anpv; after the chapters' addMoves)
import './anime_zfighters.js?v=20261103-0801'; // the Z fighters' Z3 move films (docs/anim-ab-plan.md anzb; ?dev=anzb…)
import './anime_bardock.js?v=20261103-0801'; // 巴達克・超巴達克's move films (docs/anim-cd-plan.md ancb; ?dev=ancb…)
import './anime_bardock_crew.js?v=20261103-0801'; // バーダック一味's move films (docs/anim-cd-plan.md ancc; ?dev=ancc…)
import './anime_future.js?v=20261103-0801'; // 特蘭克斯・未來悟飯・龜仙人's Z3 move films (docs/anim-cd-plan.md andt; ?dev=andt…)
import './anime_androids.js?v=20261103-0801'; // 人造人 18・17・16號's Z3 move films (docs/anim-cd-plan.md anda; ?dev=anda)

// testing in a hidden browser pane (no animation frames there): ?timer drives every frame with timers instead
if (new URLSearchParams(location.search).has('timer')) window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);

const SAVE_KEY = TEST ? 'dbz-portrait-test-save' : 'dbz-portrait-save-v1'; // 測試模式 keeps its own slots (src/testmode.js)
const AUTO_KEY = TEST ? 'dbz-portrait-test-autosave' : 'dbz-portrait-autosave-v1'; // the original's Save_Auto.rvdata: after each normal battle won
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
    if (TEST || this.busy || bubbles(s) || --s.nextEnc > 0) return; // バブルス card keeps enemies away; 測試模式: none at all
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
    if (poi.chapter) { await (z3Spot(this, poi) || z2bSpot(this, poi) || z2aSpot(this, poi) || willowSpot(this, poi) || chapter6Spot(this, poi) || chapter4Spot(this, poi) || chapter3Spot(this, poi) || chapterSpot(this, poi)); renderHud(); this.busy = false; this.field.paused = false; return; }
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
    if (poi.effect === 'shop') await cardSquare(this, poi); // a Z mark: the original's card square (also saves; poi.v44: カード特殊)
    if (poi.effect === 'rest' || poi.effect === 'save' || poi.effect === 'shop') { save(true); toast('已存檔'); }
    renderHud();
    this.busy = false;
    this.field.paused = false;
  },

  async onBoss(b) {
    if (isZ3Map(this.state)) return z3Boss(this, b);
    if (isZ2bMap(this.state)) return z2bBoss(this, b);
    if (isWillowMap(this.state)) return willowBoss(this, b);
    if (isChapter6Map(this.state)) return chapter6Boss(this, b);
    if (isChapter5Map(this.state)) return chapter5Boss(this, b);
    if (isChapter4Map(this.state)) return chapter4Boss(this);
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
    await loadImages(enemyIds.flatMap((id) => [this.world.enemies[id].sprite, this.world.enemies[id].portrait, ...(this.world.enemies[id].face || []).slice(0, 1)]));
    const battle = new Battle(this.world, this, enemyIds, boss, opts);
    Object.assign(battle, opts); // e.g. eventBgm (src/fieldmenu.js), bgm, loseOk, foeHp (src/chapter5.js, src/chapter6.js)
    this.scene = battle;
    this.lastBattle = battle;
    const result = await battle.run();
    this.lastResult = result; // 'win' | 'lose' | 'break' (an event battle stopped: src/z2b.js)
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

  // Scene_Gameover from a mini-game (the gravity training): back to the last save
  async gameOver() {
    await say([['', '悟空們被打倒了……'], ['', '回到最後的存檔。']]);
    this.busy = false;
    if (!load(newest())) restart();
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
  const f = img(FACES); // from Z2 on src/era.js aliases it to the Z2 sheet
  const paint = () => { if (f.ok) c.getContext('2d').drawImage(f.im, 64 * col, 64 * (m.id - 3), 64, 64, 0, 0, 64, 64); };
  if (f.ok) paint(); else f.p.then(paint);
  return c;
}
export { faceCanvas };
function renderHud() {
  const s = game.state;
  hud.classList.toggle('many', s.party.length > 3);
  hud.classList.toggle('rows3', s.party.length > 6); // seven to nine (the Willow chapter): the goal goes under a third row
  hud.innerHTML = '<div class="party"></div><button class="menu-btn" aria-label="選單">☰</button><div class="goal"></div>';
  const party = hud.querySelector('.party');
  party.classList.toggle('many', s.party.length > 3); // all six (src/style.css)
  hud.classList.toggle('many', s.party.length > 3);
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
  hud.querySelector('.goal').textContent = trGoal(game.world, s) ?? z3Goal(game.world, s) ?? z2bGoal(game.world, s) ?? z2aGoal(game.world, s) ?? willowGoal(game.world, s) ?? chapter6Goal(game.world, s) ?? chapter5Goal(game.world, s) ?? chapter4Goal(game.world, s) ?? chapter3Goal(game.world, s) ?? chapterGoal(game.world, s) ?? (s.flags.bossDone ? '' : '目標：飛往右上方救回悟飯（建議練到 Lv6 以上）');
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
    favLoad(s); // variable 228 = 20 (set_start_val)
    startField();
    resumeChapter(game);
    resumeZ3(game) || resumeZ2b(game) || resumeChapter3(game) || resumeChapter4(game) || resumeChapter5(game) || resumeChapter6(game) || resumeWillow(game) || resumeZ2a(game);
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
  applyEra(game); // the Z1 / Z2 pictures for the part of the story of this save
  if (game.field) game.field.leave();
  game.field = new Field(game.world, game);
  game.scene = game.field;
  game.field.enter();
  hud.hidden = false;
  renderHud();
}

// the chapter that follows, by name (a later part calls game.nextChapter('ch6') …); false when it isn't there
const CHAPTERS = { ch4: startChapter4, ch5: startChapter5, ch6: startChapter6, willow: startWillow };
const nextChapter = (k) => (typeof k !== 'string' ? startChapter3(game) : CHAPTERS[k] ? CHAPTERS[k](game) : false);
// battle backgrounds where no chapter picks one (set_battle_map, all.rb 165938): a strip of Z1_戦闘_背景 (scenario progress
// 0, tools/build_z1bg.py) / Z2_戦闘_背景 (1) / Z3_戦闘_背景 (2+, src/z3.js) under a black sky, by the ground tile under the
// player; a Z1 tile with no rule keeps the last one, like $Battle_MapID
function z1Backdrop(game) {
  const s = game.state, m = s && game.world.maps[s.map];
  if (!m) return null;
  const t = m.layers[0][Math.floor(s.y / 32) * m.w + Math.floor(s.x / 32)], era = (s.var && s.var[40]) || 0;
  if (era === 1) return `bg/z2_battle_${(game.world.z2a && game.world.z2a.backdrops[t]) ?? 0}.png`; // scenario progress 1: else 0
  if (era >= 2) return z3BackdropAt(game);
  let row = null;
  if (t === 1537 || t === 1545) row = 0; // the first field
  else if ((t >= 1576 && t <= 1579) || (t >= 1584 && t <= 1586) || (t >= 1592 && t <= 1594)) row = 5; // Snake Way
  else if (t === 1538 || t === 1546) row = Math.random() < 0.5 ? 2 : 6; // the Sansho area, the Willow snowfield
  else if (t === 1539 || t === 1547) row = 3; // the Nikki area
  else if (t === 1540 || t === 1548) row = 4; // the Ginger area
  else if (t === 1541 || t === 1549) row = 7; // the Garlic area
  else if (t === 1542) row = Number(s.map) !== 65 ? 8 : 11; // the Vegeta area (variable 13: the map)
  else if (t >= 1560 && t <= 1574) row = 1; // the sea
  else if (t === 1556) row = 10; // the Willow area
  if (row != null) s.z1Bd = row;
  return `bg/z1_battle_${s.z1Bd || 0}.png`;
}

Object.assign(game, { startZ2a, storyScenes, backdrop: () => trBackdrop(game) || z3Backdrop(game) || z2aBackdrop(game) || z1Backdrop(game), startZ3: () => startZ3(game) }); // Z2 (src/z2a.js); the Willow chapter calls game.startZ2a
Object.assign(game, { startField, save, renderHud: () => renderHud(), showTitle: (sub, notes) => showTitle(sub, notes), nextChapter, startChapter4, startChapter5, startChapter6, startWillow, devChapter5: () => devChapter5(game), devChapter6: () => devChapter6(game), startZ2Ginyu: () => startZ2Ginyu(game), startZ2b: () => startZ2b(game) }); // for src/chapter*.js

// ---------- title ----------
const title = document.getElementById('title');
// notes: lines under the subtitle (after Z1: what the original opens next)
function showTitle(sub, notes) {
  if (game.field) { game.field.leave(); game.field.paused = true; }
  hud.hidden = true;
  audio.playBgm(game.world.titleBgm);
  const has = !!localStorage.getItem(SAVE_KEY);
  title.innerHTML = `<img src="${assetUrl('Graphics/System/Title.png')}" alt="">
    <div class="sub">${sub || '重製版・Z1～Z4'}</div>
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
  syncCostume(game);
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
  game.world = await (await fetch('data/world.json?v=20261103-0801')).json();
  setCutsceneWorld(game.world);
  setFaces(game.world.faces);
  setItemsWorld(game.world);
  setGrowthWorld(game.world);
  const faceSheets = new Set(Object.values(game.world.faces).map((f) => f[0]));
  await loadImages([...tileSheetPaths, ...fieldImages, ...battleImages(game.world), FACES, ...faceSheets]);
  setFieldGame(game);
  setCardGame(game); // the card schools change from 概況 11 on
  startTestBoost(game); // 測試模式 (?test): Lv 99, full cards, no encounters
  if (showTestMenu()) { requestAnimationFrame(frame); return; }
  const dev = new URLSearchParams(location.search).get('dev'); // ?dev=ch6 / ch6earth / ch6vegeta: jump to chapter 6
  if (dev && dev.startsWith('ch6')) { title.hidden = true; devChapter6(game, dev); requestAnimationFrame(frame); return; }
  if (dev && ['z2ginyu', 'z2frieza', 'z2last', 'z2turles'].includes(dev)) { title.hidden = true; devZ2b(game, dev); requestAnimationFrame(frame); return; } // Z2 second half
  if (dev && dev.startsWith('willow')) { title.hidden = true; devWillow(game, dev); requestAnimationFrame(frame); return; } // ?dev=willow / willow51 / willowboss
  if (dev && /^(z3|z4|tr|zg|csq|cda|cdb|cst|tac|pas|etf|ovw|flg|cmb|grw|sys|viz|skc|cos|anga|anpv|anzb|ancb|ancc|andt|anda)/.test(dev)) { title.hidden = true; if (devZ3(game, dev)) { requestAnimationFrame(frame); return; } title.hidden = false; } // Z3 (src/z3*.js)
  if (dev && dev.startsWith('z2')) { title.hidden = true; devZ2a(game, dev); requestAnimationFrame(frame); return; } // ?dev=z2 / z2b / z2c / z2d
  if (!options.skipOp) await playOpening(); // the title animation, like the original plays before its title screen
  showTitle();
  if (new URLSearchParams(location.search).get('dev') === 'ch5') { title.hidden = true; devChapter5(game); } // testing: start at the Garlic area
  requestAnimationFrame(frame);
}
boot();
