// Boot, game state, scene switching, story beats, HUD, menu, save/load.
import { TEST, showTestMenu, startTestBoost, isQaJump, qaSave } from './testmode.js?v=20261108-0709'; // 測試模式 (index.html?test)
import { view, img, loadImages, audio, say, setFaces, toast, sleep, input, assetUrl, VERSION, fetchRetry, warmImages } from './core.js?v=20261108-0709';
import { tileSheetPaths } from './tiles.js?v=20261108-0709';
import { Field, fieldImages, nextEncounterSteps, holds } from './field.js?v=20261108-0709';
import { ANIME_IMAGES } from './anime.js?v=20261108-0709';
import { Battle, battleImages, newHand, rollEncounter, setCardGame } from './battle.js?v=20261108-0709';
import { baseMember, levelUp } from './party.js?v=20261108-0709';
import { runEvent } from './events.js?v=20261108-0709';
import { playOpening, playStory, openingImages } from './opening.js?v=20261108-0709'; // the original's title animation and opening story
import { rollArea, chapterGoal, afterRaditz, resumeChapter, chapterSpot, chapterBoss } from './chapter2.js?v=20261108-0709';
import { fieldMenuHtml, openEntry } from './partymenu.js?v=20261108-0709'; // 隊伍・卡牌・組合技・作戰
import { setItemsWorld, bubbles } from './items.js?v=20261108-0709'; // item cards (its 卡牌 menu entry registers itself)
import { setGrowthWorld } from './growth.js?v=20261108-0709'; // skill cards and the other growth cards
import { cardSquare, compo } from './cardgames.js?v=20261108-0709'; // card squares (shop / lottery / memory), 合成
import { fieldExtraHtml, openFieldEntry, setFieldGame, encounterSteps, battleTally, spotTally, storySoFar, hasRecap, options, warmPart } from './fieldmenu.js?v=20261108-0709'; // 概況・情報・設定・地圖, records, options
import { training } from './training.js?v=20261108-0709'; // training squares
import { chapter3Goal, startChapter3, resumeChapter3, chapter3Spot, isChapter3Map, chapter3Boss } from './chapter3.js?v=20261108-0709';
import { chapter4Goal, startChapter4, resumeChapter4, chapter4Spot, isChapter4Map, chapter4Boss } from './chapter4.js?v=20261108-0709';
import { playEvent, setCutsceneWorld, raditzOutcome } from './cutscene.js?v=20261108-0709'; // story scenes staged like the original
import { chapter5Goal, startChapter5, resumeChapter5, isChapter5Map, chapter5Boss, devChapter5 } from './chapter5.js?v=20261108-0709';
import { chapter6Goal, startChapter6, resumeChapter6, chapter6Spot, isChapter6Map, chapter6Boss, devChapter6 } from './chapter6.js?v=20261108-0709'; // King Kai, the Saiyans, the end of Z1
import { willowGoal, startWillow, resumeWillow, willowSpot, isWillowMap, willowBoss, devWillow } from './willow.js?v=20261108-0709'; // after Z1: the Willow chapter, up to the hand-over to Z2
import { z2aGoal, startZ2a, resumeZ2a, z2aSpot, storyScenes, z2aBackdrop, devZ2a } from './z2a.js?v=20261108-0709'; // Z2 first half: Namek, Goku's training, the Grand Elder
import { applyEra } from './era.js?v=20261108-0709'; // the Z2 art while variable 40 is 1
import { syncCostume } from './costume.js?v=20261108-0709'; // 換裝: the pictures follow the clothes' variables
import { z2bGoal, startZ2Ginyu, startZ2b, resumeZ2b, z2bSpot, isZ2bMap, z2bBoss, devZ2b } from './z2b.js?v=20261108-0709'; // Z2 second half: the Ginyu Force, Frieza
import { startZ3, resumeZ3, z3Spot, isZ3Map, z3Boss, z3Goal, z3Backdrop, z3BackdropAt, devZ3 } from './z3.js?v=20261108-0709'; // Z3 (the chapters below register themselves there)
import './z3a.js?v=20261108-0709';
import './z3b.js?v=20261108-0709';
import './z3c.js?v=20261108-0709';
import './z3d.js?v=20261108-0709';
import './z3e.js?v=20261108-0709';
import './z3train.js?v=20261108-0709'; // the training mini-games (its ?dev=z3pair / z3gravity)
import './z4a.js?v=20261108-0709'; // Z4 (セル編): its chapters register in src/z3.js too
import './z4b.js?v=20261108-0709';
import './z4c.js?v=20261108-0709';
import './z4d.js?v=20261108-0709';
import './z4e.js?v=20261108-0709';
import { afterZ4 } from './z4f.js?v=20261108-0709';
import { trGoal, trBackdrop } from './timeroom.js?v=20261108-0709'; // 時之間 (registers its spots in src/z3.js too)
import './tr_z1.js?v=20261108-0709'; // 時之間 phase 2: the areas (docs/timeroom-plan.md)
import './tr_z2.js?v=20261108-0709';
import './tr_z3.js?v=20261108-0709';
import './tr_z4.js?v=20261108-0709';
import './tr_bardock.js?v=20261108-0709';
// cards and training squares (docs/cards-plan.md)
import './training_more.js?v=20261108-0709';
import './cards_square.js?v=20261108-0709';
import './cards_a.js?v=20261108-0709';
import { favLoad } from './cards_b.js?v=20261108-0709';
import './cards_story.js?v=20261108-0709';
import './skills_a.js?v=20261108-0709';
import './skills_b.js?v=20261108-0709';
import './skills_c.js?v=20261108-0709';
import './skills_d.js?v=20261108-0709'; // 大工程 skc: the skill cards' passive skills (docs/skc.md)
import './flg.js?v=20261108-0709'; // ?dev=flg… test battles for the move flags (docs/batch2-plan.md flg)
import './grw.js?v=20261108-0709'; // batch 2 grw: CE64, 地球育ちのサイヤ人 at S-combos, dev jumps ?dev=grw…
// 時之間 phase 3 / ZG: the stories (docs/zg-plan.md)
import './tr_future.js?v=20261108-0709';
import './zg_broly.js?v=20261108-0709';
import './zg_bojack.js?v=20261108-0709';
import './zg_a.js?v=20261108-0709';
import './zg_b.js?v=20261108-0709';
import './zg_c.js?v=20261108-0709';
import './zg_recap.js?v=20261108-0709'; // ZG 的概況 (前情提要: src/fieldmenu.js)
import './combo_dev.js?v=20261108-0709'; // ?dev=cmb…: S-combo / ひらめき tests (src/combo.js)
import './combo_z2.js?v=20261108-0709'; // the S-combo films of Z2 and later, part cmb (docs/anim-f-cmb.md; ?dev=cmbxb…)
import './combo_z3a.js?v=20261108-0709'; // the S-combo films of anime 28xx (docs/anim-f-plan.md cmc; ?dev=cmc…)
import './combo_z3b.js?v=20261108-0709'; // S-combo films of the Z3 switch, anime 29xx (docs/anim-f-plan.md cmd)
import './sys.js?v=20261108-0709'; // 第二批 sys: 神龍的願望, the shop's added cards, Z3 / Z4 的概況 (docs/sys.md)
import './viz.js?v=20261108-0709'; // the battle's skill names, the cover scene, the Great Ape's face (docs/batch2-plan.md viz)
import './cos.js?v=20261108-0709'; // ?dev=cos…: 換裝 and the DB3 staff roll (docs/costume.md)
import './anime_goku_gohan.js?v=20261108-0709'; // 悟空・悟飯's move films, ?dev=anga… (docs/anim-ab-plan.md anga)
import './anime_piccolo_vegeta.js?v=20261108-0709'; // 比克・貝吉塔's Z3 move films (docs/anim-ab-plan.md anpv; after the chapters' addMoves)
import './anime_zfighters.js?v=20261108-0709'; // the Z fighters' Z3 move films (docs/anim-ab-plan.md anzb; ?dev=anzb…)
import './anime_bardock.js?v=20261108-0709'; // 巴達克・超巴達克's move films (docs/anim-cd-plan.md ancb; ?dev=ancb…)
import './anime_bardock_crew.js?v=20261108-0709'; // バーダック一味's move films (docs/anim-cd-plan.md ancc; ?dev=ancc…)
import './anime_future.js?v=20261108-0709'; // 特蘭克斯・未來悟飯・龜仙人's Z3 move films (docs/anim-cd-plan.md andt; ?dev=andt…)
import './anime_androids.js?v=20261108-0709'; // 人造人 18・17・16號's Z3 move films (docs/anim-cd-plan.md anda; ?dev=anda)
import './anime_foes_z2.js?v=20261108-0709'; // the Z2 enemies' move films (docs/anim-e-plan.md aen1; ?dev=aen1)
import './anime_foes_movie.js?v=20261108-0709'; // the movie / ZG enemies' move films (docs/anim-e-plan.md aen3; ?dev=aen3…)
import './anime_foes_common.js?v=20261108-0709'; // the enemies' shared move films (docs/anim-e-plan.md, aen3's common file)
import './anime_foes_z34.js?v=20261108-0709'; // the Z3 / Z4 enemies' move films (docs/anim-e-plan.md aen2; ?dev=aen2…)
import './anime_z3base.js?v=20261108-0709'; // the first moves' Z3 films (元気弾, 魔閃光, 気功砲 …)
import './anime_z2base.js?v=20261108-0709'; // the first moves' Z2 / Z3 films (the party's 11xx, the Z2 enemies' 14xx)
import './anime_foes_zg.js?v=20261108-0709'; // the 「強」 rematches' and the later ZG enemies' move films (docs/anim-e-plan.md aen4; ?dev=aen4…)
import { lapLabel, setLapGame, canLap, syncLap, lapScreen, nextLapState } from './laps.js?v=20261108-0709'; // 第二輪 (docs/laps-plan.md; ?dev=lap…)
import './laps_rules.js?v=20261108-0709';
import './laps_arena.js?v=20261108-0709';
import './combo_os.js?v=20261108-0709'; // the OS / FOS / ダブルエクスプロージョン / サイヤンアタック combo films (docs/anim-f-plan.md cma; ?dev=cma…)

// testing in a hidden browser pane (no animation frames there): ?timer drives every frame with timers instead
if (new URLSearchParams(location.search).has('timer')) window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);

const SAVE_KEY = TEST ? 'dbz-portrait-test-save' : 'dbz-portrait-save-v1'; // 測試模式 keeps its own slots (src/testmode.js)
const AUTO_KEY = TEST ? 'dbz-portrait-test-autosave' : 'dbz-portrait-autosave-v1'; // the original's Save_Auto.rvdata: after each normal battle won
// three save slots (the first is the old single save, so it carries over); the story's own saves go to the slot in use
const SLOTS = [SAVE_KEY, `${SAVE_KEY}-2`, `${SAVE_KEY}-3`];
const SLOT_KEY = `${SAVE_KEY}-slot`;
let slot = Math.min(2, Math.max(0, Number(localStorage.getItem(SLOT_KEY)) || 0));
const curKey = () => SLOTS[slot];
function useSlot(k) { slot = k; try { localStorage.setItem(SLOT_KEY, String(k)); } catch (e) { /* private mode */ } }
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
      party: w.party.map((id) => baseMember(w, id)),
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
    if (b && b.flag && this.state.flags[b.flag]) return; // (already beaten: never fall through to another chapter's boss)
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
    if (this.preload) await this.preload; // (the move films' pictures, fetched in the background since the title)
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
  warmPart(game);
  const g = trGoal(game.world, s) ?? z3Goal(game.world, s) ?? z2bGoal(game.world, s) ?? z2aGoal(game.world, s) ?? willowGoal(game.world, s) ?? chapter6Goal(game.world, s) ?? chapter5Goal(game.world, s) ?? chapter4Goal(game.world, s) ?? chapter3Goal(game.world, s) ?? chapterGoal(game.world, s) ?? (s.flags.bossDone ? '' : '目標：飛往右上方救回悟飯（建議練到 Lv6 以上）');
  // no goal written for this point of the story (or only the area's / chapter's name): the story spots open here now
  const loose = g === '時之間' || (g || '').startsWith('概況：') || (!g && s.flags.z3 !== 'done');
  hud.querySelector('.goal').textContent = loose ? spotsGoal(game.world, s) || g : g;
}
// the places on this map the story can go on from, as their buttons say (the card shops, inns and the like left out)
const TR_DOORS = new Set(['party', 'go', 'area', 'leave', 'info', 'practice', 'arena']);
const EVERYDAY = new Set(['卡片商店', '修行', '進入旅館', '隊伍變更', '界王修行', '巴布魯斯修行', '古雷格利修行', '重力修行', '回到時之間', '時之間']);
function spotsGoal(world, s) {
  const labels = [];
  for (const p of (world.pois || {})[s.map] || []) {
    if (!p.label || EVERYDAY.has(p.label) || labels.includes(p.label) || p.label.startsWith('回')) continue;
    if (p.chapter === 'tr' && TR_DOORS.has(p.page)) continue; // the time room's own doors and counters
    if ((p.gone && (s.sw || {})[p.gone]) || (p.when && !holds(s, p.when))) continue;
    labels.push(p.label);
  }
  return labels.length ? `目標：${labels.slice(0, 3).join('、')}` : '';
}
game.renderHud = renderHud;

// ---------- menu ----------
const menu = document.getElementById('menu');
function openMenu() {
  if (game.busy) return;
  game.field.paused = true;
  game.field.leave();
  const has = !!latest();
  menu.innerHTML = `<div class="box"><h2>選單</h2>${fieldMenuHtml()}${fieldExtraHtml()}
    <button class="btn" data-a="compo">合成<small>請卡林大人把兩張卡片合成一張</small></button>
    <button class="btn" data-a="save">存檔<small>存到三個存檔位置之一（目前用：存檔 ${slot + 1}）</small></button>
    <button class="btn" data-a="load" ${has ? '' : 'disabled'}>讀檔<small>${has ? '選一個存檔讀取' : '還沒有存檔'}</small></button>
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
    if (act === 'save' || act === 'load') {
      menu.hidden = true;
      pickSlot(act, (key) => {
        if (act === 'save') { useSlot(SLOTS.indexOf(key)); save(); toast(`已存到存檔 ${slot + 1}`); }
        else if (load(key)) { toast('已讀檔'); recap(); return; }
        game.field.paused = false; game.field.enter();
      }, () => { game.field.paused = false; game.field.enter(); });
      return;
    }
    if (act === 'heal') { for (const m of game.state.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; } renderHud(); toast('全員回復了'); }
    menu.hidden = true;
    game.field.paused = false;
    game.field.enter();
  };
}

function save(silent, key = curKey()) {
  game.state.savedAt = Date.now();
  try { localStorage.setItem(key, JSON.stringify(game.state)); } catch (e) { if (!silent) toast('無法存檔'); }
}
// the save written last: the manual one or the auto-save
function newest() {
  const at = (k) => { try { return (JSON.parse(localStorage.getItem(k)) || {}).savedAt || 0; } catch (e) { return 0; } };
  return localStorage.getItem(AUTO_KEY) && at(AUTO_KEY) > at(curKey()) ? AUTO_KEY : curKey();
}
// the newest of every slot and the auto-save (the title's 繼續遊戲)
function latest() {
  const at = (k) => { try { return (JSON.parse(localStorage.getItem(k)) || {}).savedAt || 0; } catch (e) { return 0; } };
  return [...SLOTS, AUTO_KEY].filter((k) => localStorage.getItem(k)).sort((a, b) => at(b) - at(a))[0] || null;
}
function load(key = curKey()) {
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (!s) return false;
    if (SLOTS.includes(key)) useSlot(SLOTS.indexOf(key));
    game.state = s;
    s.sw = s.sw || {};
    s.var = s.var || { 42: 3 };
    favLoad(s); // variable 228 = 20 (set_start_val)
    for (const m of [...(s.party || []), ...Object.values(s.bench || {})]) if (m && m.id === 5 && !m.cdaApe && !m.skills.includes(47)) { m.skills.push(47); m.skills.sort((a, b) => a - b); } // 魔閃光: CE9 teaches it unless he is the Great Ape; older saves never got it
    afterZ4(game); // (a save from the end of Z4: src/z4f.js)
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
// a save's part of the story: its line on the title, and the original's title picture for it (Scene_Title
// create_title_graphic: Title / Title2 / Title3 / Title3_2 before perfect Cell, 3_3 after, 3_4 cleared / TitleG)
function savePart(s) {
  const z = String((s.flags && s.flags.z3) || '');
  if (/^(tr|zg)/.test(z)) return ['ZG・時之間', 'TitleG'];
  if (z === 'done') return ['Z4 之後', 'Title3_4'];
  if (/^z4[ab]/.test(z)) return ['Z4', 'Title3_2'];
  if (/^z4/.test(z)) return ['Z4', 'Title3_3'];
  if (/^z3/.test(z)) return ['Z3', 'Title3'];
  return (s.var && s.var[40]) >= 1 ? ['Z2', 'Title2'] : ['Z1', 'Title'];
}
function saveInfo(key) {
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (!s || !s.party || !s.party.length) return '';
    const m = s.party[0];
    return `${lapLabel(s)}${savePart(s)[0]}　${m.name || ''} Lv${m.level || 1}${s.party.length > 1 ? ` 等 ${s.party.length} 人` : ''}`;
  } catch (e) { return ''; }
}
function savePic(key) { try { const s = JSON.parse(localStorage.getItem(key)); return s && s.party ? savePart(s)[1] : 'Title'; } catch (e) { return 'Title'; } }
// 篇章選擇: each part from its start (the same hand-over states the chapters' ?dev jumps build), with the original's
// title picture for it
const PARTS = [
  { k: 'z1', no: 'Z1', name: '強襲！賽亞人', pic: 'Title', info: '拉蒂茲來襲，從頭開始' },
  { k: 'z2', no: 'Z2', name: '激神弗利薩！！', pic: 'Title2', info: '前往那美克星' },
  { k: 'z3', no: 'Z3', name: '烈戰人造人間', pic: 'Title3', info: '集龍珠、古拉、人造人間' },
  { k: 'z4', no: 'Z4', name: '激戰沙魯遊戲！！', pic: 'Title3_2', info: '沙魯誕生的秘密' },
  { k: 'zga', no: 'ZG', name: '外傳 賽亞人絕滅計畫', pic: 'TitleG', info: '巴達克一夥、毀滅瓦斯' },
];
function startPart(k) {
  title.hidden = true;
  if (k === 'z2') return devZ2a(game, 'z2');
  devZ3(game, k);
}
const title = document.getElementById('title');
// notes: lines under the subtitle (after Z1: what the original opens next)
function showTitle(sub, notes) {
  if (game.field) { game.field.leave(); game.field.paused = true; }
  hud.hidden = true;
  audio.playBgm(game.world.titleBgm);
  const last = latest(), main = last ? saveInfo(last) : '', many = [...SLOTS, AUTO_KEY].filter((k) => localStorage.getItem(k)).length > 1;
  // the one big button is what most people want: carry on when there is a save, a new game when there isn't
  const card = (a, label, info, big) => `<button class="tb${big ? ' big' : ''}" data-a="${a}"><span class="tl">${label}</span>${info ? `<span class="ti">${info}</span>` : ''}</button>`;
  title.innerHTML = `<div class="t-stars"></div>
    <img class="t-art" src="${assetUrl(`Graphics/System/${main ? savePic(last) : 'Title'}.png`)}" alt="DRAGON BALL Z">
    <div class="sub">${sub || '重製版・Z1～Z4・時之間・ZG'}</div>
    ${notes ? `<div class="note unlocks">接下來開放：<br>${notes.join('<br>')}</div>` : ''}
    <div class="actions">
      ${main ? card('cont', '繼續遊戲', main, true) : card('new', '新的開始', '從 Z1 拉蒂茲篇開始冒險', true)}
      <div class="t-row">
        ${main ? card('new', '新的開始', '') : ''}
        ${card('parts', '選擇篇章', '')}
        ${many ? card('load', '讀取存檔', '') : ''}
      </div>
      ${lapSaves().length ? `<div class="t-row">${card('lap', '進入下一輪', '')}</div>` : ''}
    </div>
    <div class="note">下半部拖曳移動・點對話框繼續　版本 ${VERSION}<br>原作：ドラゴンボールZ RPG（同人作品）</div>`;
  title.hidden = false;
  title.onclick = async (e) => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    audio.unlock();
    if (a.dataset.a === 'parts') return showParts();
    if (a.dataset.a === 'lap') { const ks = lapSaves(); return ks.length > 1 ? pickSlot('lap', (key) => enterLap(key)) : enterLap(ks[0]); }
    if (a.dataset.a === 'load') return pickSlot('load', (key) => { title.hidden = true; if (load(key)) recap(); });
    if (a.dataset.a === 'new' && !a.dataset.sure) return pickSlot('new', (key) => { useSlot(SLOTS.indexOf(key)); a.dataset.sure = 1; a.click(); });
    title.hidden = true;
    if (a.dataset.a === 'cont') { if (load(last)) recap(); return; }
    if (a.dataset.a === 'new') await playStory(game.world); // the opening story, then the field
    await beginStory(game.newState());
  };
}
async function beginStory(state) {
  game.state = state;
  startField();
  game.field.paused = true;
  game.busy = true;
  await runEvent(game.world.story.intro, game.state);
  game.busy = false;
  game.field.paused = false;
  save(true);
}
// 第二輪: the original's X key on the load screen (all.rb 39213) is a button here. Where the new round goes (the save it
// comes from stays as it is), the ten items (src/laps.js), then the opening story from the start.
const lapSaves = () => [...SLOTS, AUTO_KEY].filter((k) => { try { return canLap(JSON.parse(localStorage.getItem(k))); } catch (e) { return false; } });
function enterLap(from, back = () => {}) {
  pickSlot('lapnew', (key) => lapScreen((picks) => startLap(from, key, picks), () => enterLap(from, back)), back, from);
}
async function startLap(from, key, picks) {
  const state = nextLapState(game, JSON.parse(localStorage.getItem(from)), picks);
  useSlot(SLOTS.indexOf(key));
  title.hidden = true;
  hud.hidden = true;
  actBtn.hidden = true;
  if (game.field) game.field.leave();
  game.scene = null;
  game.busy = true;
  await playStory(game.world);
  await beginStory(state);
}

// 篇章選擇 over the title: one card per part with its original title picture; back returns to the title
function showParts() {
  const el = document.createElement('div');
  el.className = 't-parts';
  el.innerHTML = `<div class="tp-head">選擇篇章</div><div class="tp-note">從各篇的開頭開始，等級與隊伍和照順序玩到那裡差不多</div>
    ${PARTS.map((p) => `<button class="tp" data-k="${p.k}"><img src="${assetUrl(`Graphics/System/${p.pic}.png`)}" alt=""><span class="tp-bar"><span class="tp-no">${p.no}</span><span class="tp-txt"><span class="tp-name">${p.name}</span><span class="tp-info">${p.info}</span></span></span></button>`).join('')}
    <button class="tb tp-back" data-k="back"><span class="tl">返回</span></button>`;
  el.onclick = (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-k]');
    if (!b) return;
    if (b.dataset.k === 'back') { el.remove(); return; }
    pickSlot('new', (key) => {
      useSlot(SLOTS.indexOf(key));
      el.remove();
      if (b.dataset.k === 'z1') { const n = title.querySelector('[data-a=new]'); n.dataset.sure = 1; n.click(); } else startPart(b.dataset.k);
    });
  };
  title.appendChild(el);
}
// the three slots (and, to load, the auto-save): what each holds; saving over one, or starting a new game in it,
// asks first. mode: 'save' | 'load' | 'new' | 'lap' (the saves a next round can start from) | 'lapnew' (where it goes:
// not over `from`); pick(key) when chosen, back() when closed
function pickSlot(mode, pick, back = () => {}, from = null) {
  const el = document.createElement('div');
  el.className = 'slots';
  const when = (k) => { try { const t = (JSON.parse(localStorage.getItem(k)) || {}).savedAt; if (!t) return ''; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch (e) { return ''; } };
  const keys = mode === 'load' ? [...SLOTS, AUTO_KEY] : mode === 'lap' ? lapSaves() : SLOTS, laps = mode === 'load' ? lapSaves() : [];
  const row = (k) => {
    const info = saveInfo(k), name = k === AUTO_KEY ? '自動存檔' : `存檔 ${SLOTS.indexOf(k) + 1}`;
    const off = (mode === 'load' && !info) || k === from;
    return `<button class="sl${info ? '' : ' empty'}${SLOTS[slot] === k && mode !== 'load' && mode !== 'lap' ? ' cur' : ''}" data-k="${k}" ${off ? 'disabled' : ''}>
      <span class="sl-no">${name}</span><span class="sl-info">${k === from ? `（原存檔）${info}` : info || '（空）'}</span><span class="sl-at">${when(k)}</span></button>${laps.includes(k) ? `<button class="lapa-go" data-lap="${k}">進入下一輪</button>` : ''}`;
  };
  el.innerHTML = `<div class="panel"><div class="sl-head">${{ save: '存到哪裡？', load: '讀取哪個存檔？', new: '新的冒險存在哪裡？', lap: '從哪個存檔進入下一輪？', lapnew: '下一輪存在哪裡？' }[mode]}</div>
    ${keys.map(row).join('')}<button class="btn ghost" data-k="back">返回</button></div>`;
  el.onclick = (e) => {
    e.stopPropagation();
    const go = e.target.closest('[data-lap]');
    if (go) { el.remove(); enterLap(go.dataset.lap, back); return; }
    const b = e.target.closest('[data-k]');
    if (!b) { if (e.target === el) { el.remove(); back(); } return; }
    const k = b.dataset.k;
    if (k === 'back') { el.remove(); back(); return; }
    if (mode !== 'load' && mode !== 'lap' && localStorage.getItem(k) && !b.dataset.sure) { // a second tap on the same slot to overwrite it
      el.querySelectorAll('.sl').forEach((x) => { delete x.dataset.sure; x.classList.remove('ask'); });
      b.dataset.sure = 1; b.classList.add('ask');
      b.querySelector('.sl-at').textContent = '再點一次覆蓋';
      return;
    }
    el.remove();
    pick(k);
  };
  document.getElementById('app').appendChild(el);
}

// ---------- main loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  syncCostume(game);
  syncLap(game);
  try {
    if (game.scene) {
      game.scene.update(dt);
      game.scene.draw();
      game.syncAct();
    }
  } catch (e) { console.error(e); } // (logged; the next frame still comes, so one bad draw doesn't freeze the game)
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
  await window.__upright; // (index.html: portrait only)
  view.resize();
  window.addEventListener('resize', () => view.resize());
  const B = window.__boot || { set() {}, ready: async () => {}, done() {} }; // the dragon-ball loading screen (index.html)
  B.set(0.3);
  game.world = await (await fetchRetry('data/world.json?v=20261108-0709')).json();
  B.set(0.45);
  setCutsceneWorld(game.world);
  setFaces(game.world.faces);
  setItemsWorld(game.world);
  setGrowthWorld(game.world);
  const faceSheets = new Set(Object.values(game.world.faces).map((f) => f[0]));
  // what the map, the menus, the first battle and the opening need; the move films' 200-odd pictures come after the title
  const films = new Set(ANIME_IMAGES);
  const first = [...new Set([...tileSheetPaths, ...fieldImages, ...battleImages(game.world).filter((p) => !films.has(p)), FACES, ...faceSheets, ...openingImages()])];
  let got = 0;
  await Promise.all(first.map((p) => img(p).p.then(() => B.set(0.45 + (0.55 * ++got) / first.length))));
  const later = () => { if (!game.preload) game.preload = warmImages([...films]).then(() => { game.preload = null; }); };
  setFieldGame(game);
  setLapGame(game);
  setCardGame(game); // the card schools change from 概況 11 on
  startTestBoost(game); // 測試模式 (?test): Lv 99, full cards, no encounters
  const dev0 = new URLSearchParams(location.search).get('dev');
  if (dev0 || TEST) { B.done(); later(); }
  if (showTestMenu()) { requestAnimationFrame(frame); return; }
  const dev = new URLSearchParams(location.search).get('dev'); // ?dev=ch6 / ch6earth / ch6vegeta: jump to chapter 6
  if (isQaJump()) { title.hidden = true; localStorage.setItem(AUTO_KEY, JSON.stringify(await qaSave())); if (load(AUTO_KEY)) { requestAnimationFrame(frame); return; } title.hidden = false; } // (src/testmode.js)
  if (dev && dev.startsWith('ch6')) { title.hidden = true; devChapter6(game, dev); requestAnimationFrame(frame); return; }
  if (dev && ['z2ginyu', 'z2frieza', 'z2last', 'z2turles'].includes(dev)) { title.hidden = true; devZ2b(game, dev); requestAnimationFrame(frame); return; } // Z2 second half
  if (dev && dev.startsWith('willow')) { title.hidden = true; devWillow(game, dev); requestAnimationFrame(frame); return; } // ?dev=willow / willow51 / willowboss
  if (dev && /^(lap|z3|z4|tr|zg|csq|cda|cdb|cst|tac|pas|etf|ovw|flg|cmb|cma|cmc|cmd|grw|sys|viz|skc|cos|anga|anpv|anzb|ancb|ancc|andt|anda|aen1|aen2|aen3|aen4)/.test(dev)) { title.hidden = true; if (devZ3(game, dev)) { requestAnimationFrame(frame); return; } title.hidden = false; } // Z3 (src/z3*.js)
  if (dev && dev.startsWith('z2')) { title.hidden = true; devZ2a(game, dev); requestAnimationFrame(frame); return; } // ?dev=z2 / z2b / z2c / z2d
  if (!options.skipOp) {
    B.onTap = () => audio.unlock(); // (inside the tap itself: iOS plays sound only after a gesture)
    await B.ready(); // all seven balls: 「點一下開始」
    later();
    const op = playOpening(true); // the title animation, like the original plays before its title screen
    B.done();
    await op;
  } else { B.done(); later(); }
  showTitle();
  if (new URLSearchParams(location.search).get('dev') === 'ch5') { title.hidden = true; devChapter5(game); } // testing: start at the Garlic area
  requestAnimationFrame(frame);
}
boot().then(() => { try { sessionStorage.removeItem('dbz-reload'); } catch (e) { /* private mode */ } }, (e) => { console.error(e); if (window.__boot && window.__boot.fail) window.__boot.fail(); });
