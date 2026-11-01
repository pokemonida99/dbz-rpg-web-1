// Chapter 2 (蛇道・桑修篇): what follows Raditz in the original, driven by world.chapter2 (tools/build_chapter2.py).
//   after Raditz → the other world, Garlic Jr., Karin Tower → team split (north / east / west pairs)
//   → Snake Way (map 5, Goku alone) → King Kai → the north pair in the Sansho area (map 8) → 桑修 → end of chapter.
// state.flags.ch2 tracks the step: 'snake' → 'north' → 'done'. Members not in the party wait in state.bench.
import { img, audio, rand, input, sleep } from './core.js?v=20261101-2242';
import { playScenes } from './cutscene.js?v=20261101-2242';
import { makeMember } from './party.js?v=20261101-2242';

const FACE_PARTY = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64, one row per actor (actor id - 3)

// ---------- hooks called from main.js ----------

// random encounter for the current map: world.areas[map] = { pool, n: [min, max] } (140_Field_Main.rb encounter)
export function rollArea(world, s) {
  const a = world.areas && world.areas[s.map];
  if (!a) return a === null ? [] : null; // null: a map without encounters (King Kai's planet)
  const [lo, hi] = a.alone && s.party.length === 1 ? a.alone : a.n; // alone: fewer for a party of one (Z2 Namek)
  const pool = a.late && (s.var[43] || 0) === a.late.var43 ? a.late.pool : a.pool; // late: another set at that 概況
  const n = lo + rand(hi - lo + 1);
  return Array.from({ length: n }, () => pool[rand(pool.length)]);
}

export function chapterGoal(world, s) {
  const c = world.chapter2;
  if (!c || !s.flags.ch2) return s.map === '1' && s.flags.bossDone ? '' : undefined;
  if (s.flags.ch2 === 'done') return '';
  return c.goals[s.map];
}

// after the Raditz battle is won and the chapter 1 ending has played
export async function afterRaditz(game) {
  const c = game.world.chapter2, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  await card('第一章　完', 1800);
  await card(c.title, 2200);
  await scenes(c.otherWorld, s);
  const teams = await chooseTeams(game.world);
  // everyone gathers at Karin Tower (all_charecter_recovery); the six on Earth start from their initial level
  s.bench = s.bench || {};
  for (const m of s.party) s.bench[m.id] = m;
  for (const id of c.team.members) if (!s.bench[id]) s.bench[id] = makeMember(game.world, id);
  for (const m of Object.values(s.bench)) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; }
  s.teams = teams;
  teams.flat().forEach((id, k) => { s.var[45 + k] = id; }); // variables 45-50, like Scene_Team_Divide
  await scenes(c.karin, s);
  setParty(s, c.snake.party);
  moveTo(s, c.snake);
  s.flags.ch2 = 'snake';
  enterMap(game);
}

// a saved game from before this chapter existed, stopped right after Raditz
export function resumeChapter(game) {
  const s = game.state;
  if (game.world.chapter2 && s.map === '1' && s.flags.bossDone && !s.flags.ch2) afterRaditz(game);
}

// field spots with `chapter` set (the end of Snake Way)
export async function chapterSpot(game, poi) {
  const c = game.world.chapter2, s = game.state;
  if (poi.chapter !== 'kaio') return;
  const north = s.teams[0];
  // 143_Event_Main.rb z1field 85/86: the north pair takes over; Piccolo + Gohan get their own scene
  s.sw[50] = north.includes(4) && north.includes(5);
  await scenes(c.kaio, s);
  s.var[43] = (s.var[43] || 0) + 1;
  setParty(s, north);
  moveTo(s, c.north);
  s.flags.ch2 = 'north';
  enterMap(game);
}

// the boss of a chapter-2 map (桑修)
export async function chapterBoss(game) {
  const c = game.world.chapter2, s = game.state, b = game.world.bosses[s.map];
  if (game.busy) return;
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  await scenes(c.before, s);
  game.busy = false;
  const won = await game.startBattle([b.enemy], true);
  if (!won) return;
  game.busy = true;
  game.field.paused = true;
  s.flags[b.flag] = true;
  await scenes(c.after, s);
  s.flags.ch2 = 'done';
  game.save(true);
  game.busy = false;
  await card('第二章　完', 2000);
  if (game.nextChapter) return game.nextChapter(game); // chapter 3 (src/chapter3.js)
  game.showTitle('第二章　完');
}

// ---------- helpers (also used by src/chapter3.js) ----------

// staged like the original, with the scene pictures and faces (src/cutscene.js)
export const scenes = (list, s) => playScenes(list, s);

export function setParty(s, ids) {
  for (const m of s.party) s.bench[m.id] = m;
  s.party = ids.map((id) => s.bench[id]);
  for (const id of ids) delete s.bench[id];
  s.var[42] = ids[0]; // the character shown on the map
}

export function moveTo(s, at) {
  s.map = at.map;
  s.x = at.x * 32 + 16;
  s.y = at.y * 32 + 16;
  s.travel = 0;
}

export function enterMap(game) {
  game.startField();
  game.busy = false;
  game.field.paused = false;
  game.save(true);
}

// black screen with a line of text (chapter titles)
export function card(text, ms) {
  const el = document.createElement('div');
  el.className = 'ch2-card';
  el.textContent = text;
  document.getElementById('app').appendChild(el);
  return new Promise((res) => {
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      el.classList.add('out');
      setTimeout(() => { el.remove(); res(); }, 400);
    };
    el.addEventListener('pointerdown', end);
    sleep(ms).then(end);
  });
}

function face(sheet, row, size = 48) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  c.style.width = c.style.height = size + 'px';
  const im = img(sheet);
  const paint = () => im.ok && c.getContext('2d').drawImage(im.im, 0, row * 64, 64, 64, 0, 0, 64, 64);
  if (im.ok) paint(); else im.p.then(paint);
  return c;
}

// Scene_Team_Divide: pick the six in order — north, north, east, east, west, west — then confirm
function chooseTeams(world) {
  const t = world.chapter2.team;
  const el = document.createElement('div');
  el.className = 'ch2-team';
  el.innerHTML = `<div class="panel"><div class="head"></div><div class="slots"></div><div class="roster"></div>
    <div class="ask" hidden>${t.ok}<button class="btn" data-a="yes">是</button><button class="btn" data-a="no">否</button></div></div>`;
  el.querySelector('.head').append(face(...t.face, 56), Object.assign(document.createElement('div'), { textContent: t.ask }));
  document.getElementById('app').appendChild(el);
  const picked = [];
  const name = (id) => world.actors[id].name;
  const render = () => {
    el.querySelector('.slots').innerHTML = t.sides.map((side, k) =>
      `<div>${side}・・・<b>${[picked[2 * k], picked[2 * k + 1]].map((id) => (id ? name(id) : '　　')).join('，')}</b></div>`).join('');
    for (const b of el.querySelectorAll('.roster button')) b.disabled = picked.includes(+b.dataset.id);
    el.querySelector('.ask').hidden = picked.length < t.members.length;
    el.querySelector('.roster').hidden = picked.length >= t.members.length;
  };
  const roster = el.querySelector('.roster');
  for (const id of t.members) {
    const b = document.createElement('button');
    b.className = 'mem';
    b.dataset.id = id;
    b.append(face(FACE_PARTY, id - 3), Object.assign(document.createElement('span'), { textContent: name(id) }));
    roster.appendChild(b);
  }
  const undo = document.createElement('button');
  undo.className = 'mem undo';
  undo.textContent = '取消';
  roster.appendChild(undo);
  render();
  return new Promise((res) => {
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      audio.se('Z1 打撃', 40);
      if (b.dataset.a === 'yes') { el.remove(); res([picked.slice(0, 2), picked.slice(2, 4), picked.slice(4, 6)]); return; }
      if (b.dataset.a === 'no' || b === undo) picked.pop();
      else if (b.dataset.id) picked.push(+b.dataset.id);
      render();
    });
  });
}

const css = document.createElement('style');
css.textContent = `
#hud .goal { text-shadow: 0 0 2px #000, 0 1px 2px #000, 0 0 4px #000; } /* readable on the snowfield of map 8 */
.ch2-card { position: absolute; inset: 0; z-index: 55; background: #000; color: var(--gold); display: flex; align-items: center;
  justify-content: center; font-size: 24px; letter-spacing: .1em; animation: ch2in .5s ease-out; transition: opacity .4s; }
.ch2-card.out { opacity: 0; }
@keyframes ch2in { from { opacity: 0; } }
.ch2-team { position: absolute; inset: 0; z-index: 45; background: rgba(0,0,0,.75); display: flex; align-items: center; justify-content: center; }
.ch2-team .panel { width: min(92%, 380px); }
.ch2-team .head { display: flex; gap: 10px; align-items: center; font-size: 18px; margin-bottom: 6px; }
.ch2-team canvas { image-rendering: pixelated; background: #000; }
.ch2-team .slots { font-size: 18px; line-height: 1.7; margin: 4px 0 8px; }
.ch2-team .slots b { color: #d0480c; font-weight: 400; }
.ch2-team .roster { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.ch2-team .mem { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 0; font-size: 14px; color: var(--ink);
  border: 8px solid transparent; border-image: url("assets/ui/frame.png") 8 / 8px stretch; background: var(--cream) padding-box; }
.ch2-team .mem:disabled { opacity: .3; }
.ch2-team .mem.undo { justify-content: center; font-size: 16px; }
.ch2-team .ask { font-size: 18px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ch2-team .ask .btn { width: auto; flex: 1; text-align: center; margin: 0; }
`;
document.head.appendChild(css);
