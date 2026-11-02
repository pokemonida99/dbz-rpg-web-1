// The card square (Z mark) and card composition, following the original:
//   cardSquare  145_Event_Check.rb chk_card: a Z mark is the card shop, the card lottery or the concentration game,
//               one of the three at random (Map007 event 1 pages 21 / 22 / 23)
//   lottery     108_Scene_Db_Card_lot.rb: six face-down cards in two rows, linked column by column; pick one per
//               column from the left — two the same wins one card, three the same wins two
//   memory      109_Scene_Db_Card_Concentration.rb (爺爺's 神經衰弱): four pairs face down, two misses and it ends;
//               every pair found is a card
//   compo       合成 from the field menu (140_Field_Main.rb menu 7 → Map007 event 1 page 45, 卡林大人):
//               two cards in, a recipe (world.cardCompo, _card_compo.rvdata) makes a new one; a recipe made once is
//               remembered and can be picked from the recipe list (128_Scene_Db_card_compo_recipe.rb)
// The goods and prizes follow the part of the story (variable 44, set by chk_card: see eraOf): the shop sells
// Scene_Shop's z1～zG_cardlist (world.csq.shop) up to that part, the lottery and concentration draw from
// create_get_card's card_id_z1～zg (world.csq.lot). Uses the card screen's overlay and helpers (src/items.js).
import { img, audio, rand, toast, sleep } from './core.js?v=20261102-1935';
import { cardState, gainCard, lose, maxOf, trim, iconCanvas, overlay, h, button, openShop } from './items.js?v=20261102-1935';

const MG = 'Graphics/Pictures/カードミニゲーム素材1.png'; // (0,0,96,120) the lottery's link, (0,120,64,96) a card back
const CARDS = 'Graphics/Pictures/カード関係.PNG'; // (64,96,64,96) the Z1 card frame (back side)
const ICONS = 'ui/item_cards.png';
const KARIN = 'Graphics/Pictures/ZD_カリン様.PNG'; // 96×80 poses: 0 normal, 2 pleased, 3 puzzled
const SE_OK = 'Z3 決定', SE_ERR = 'Z3 エラー';

const CSS = `
#cards .mg { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; overflow: hidden; }
#cards .mg.top { justify-content: flex-start; }
#cards .mg canvas { image-rendering: pixelated; max-width: 100%; touch-action: manipulation; }
#cards .msg { min-height: 84px; font-size: 15px; line-height: 1.45; white-space: pre-line; }
#cards .acts .btn { flex: 1; }
#cards .karin { display: flex; align-items: flex-end; justify-content: center; gap: 10px; min-height: 96px; }
#cards .karin canvas { image-rendering: pixelated; }
#cards .slot { width: 56px; height: 56px; border: 2px dashed #b08850; display: flex; align-items: center; justify-content: center; }
#cards .slot canvas { width: 52px; height: 52px; }
#cards .plus { font-size: 20px; color: #7a5230; padding-bottom: 18px; }
#cards .flash { animation: compoflash .35s 3; }
@keyframes compoflash { 50% { filter: brightness(3); } }
#cards .rl { flex: 1; min-height: 0; width: 100%; overflow-y: auto; touch-action: pan-y; }
#cards .rl:empty { display: none; }
#cards .rl .tabs button { flex: 1; justify-content: center; padding: 4px; font-size: 15px; border: 2px solid #b08850; background: #fbe6bf; border-radius: 4px; }
#cards .rl .tabs button.on { background: #d0480c; color: #fff; border-color: #d0480c; }
#cards .rl .tabs { position: sticky; top: 0; background: var(--cream); padding-bottom: 4px; z-index: 1; }
#cards .rl .nm { flex: 1; min-width: 0; font-size: 12px; letter-spacing: -.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#cards .rl button { display: flex; align-items: center; gap: 4px; width: 100%; padding: 3px 2px; border: 0; border-bottom: 1px solid #e0c090;
  background: none; text-align: left; font-size: 13px; color: var(--ink); }
#cards .rl button.off { color: #a08868; }
#cards .rl button.off canvas { opacity: .45; }
#cards .rl canvas { width: 28px; height: 28px; image-rendering: pixelated; flex: none; }
#cards .rl .n { color: #7a5230; min-width: 18px; }
#cards .rl .n.max { color: #ff7830; }
#cards .rl .arrow { color: #d0480c; padding: 0 1px; }
#cards .rl button { gap: 2px; }
`;

// a window like the original's: a title, a stage, the message window and the buttons under it
function frame(title) {
  if (!document.getElementById('cardgames-css')) {
    const st = document.createElement('style');
    st.id = 'cardgames-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = overlay();
  const head = h('div', 'cw head', title);
  const stage = h('div', 'cw mg');
  const msg = h('div', 'cw msg');
  const acts = h('div', 'acts');
  el.append(head, stage, msg, acts);
  const ui = {
    el, stage, msg, acts,
    say(text) { msg.textContent = text; },
    // buttons; resolves with the index tapped
    choose(labels) {
      acts.innerHTML = '';
      return new Promise((res) => labels.forEach((l, i) => acts.appendChild(button(l, () => { audio.se(SE_OK, 70); acts.innerHTML = ''; res(i); }))));
    },
    next() { return ui.choose(['▼ 繼續']); },
    close() { el.remove(); },
  };
  return ui;
}

// set_card_frame 1 (all.rb 14062): the back of a card — Z1 / Z2, Z3, Z4 (switch 431), ZG (variable 43 151-200)
let backAt = [64, 96];
const backOf = (s) => {
  const v40 = s.var[40] || 0, v43 = s.var[43] || 0;
  if (v40 < 2) return [64, 96];
  if (v43 >= 151 && v43 <= 200) return [704, 96];
  return s.sw[431] ? [384, 272] : [576, 96];
};
function cardBack(c, x, y) {
  const mg = img(MG), cs = img(CARDS);
  if (mg.ok) c.drawImage(mg.im, 0, 120, 64, 96, x, y, 64, 96);
  if (cs.ok) c.drawImage(cs.im, backAt[0], backAt[1], 64, 96, x, y, 64, 96);
}
function cardFace(world, c, id, x, y) {
  const s = img(ICONS), it = world.items[id];
  if (s.ok && it) c.drawImage(s.im, 64 * (it.icon % 10), 64 * Math.floor(it.icon / 10), 64, 64, x, y + 16, 64, 64);
}
// create_get_card(variable 44): card_id_z1 plus the later lists; rand(size - 1) never picks the last one (kept)
const LOT_TIERS = { 0: 1, 10: 1, 1: 2, 20: 2, 2: 3, 30: 3, 3: 4, 40: 4, 4: 5, 50: 5, 5: 5 };
export function prizePool(world, v44) {
  const lot = (world.csq && world.csq.lot) || { z1: world.cardLottery.concat(197) };
  return ['z1', 'z2', 'z3', 'z4', 'zg'].slice(0, LOT_TIERS[v44] || 1).flatMap((k) => lot[k] || []);
}
const prize = (world, s) => { const p = prizePool(world, s.var[44] || 0); return p[rand(p.length - 1)]; };
// Map007 event 1 page 21: variable 44 → variable 230 → Scene_Shop's lists (command_302, all.rb 31668) plus the cards
// added after a boss or an arena rank; sorted by the Items' speed like the original
const SHOP_TIERS = { 0: 1, 10: 2, 1: 2, 20: 3, 2: 3, 30: 4, 3: 4, 40: 5, 4: 5, 50: 6, 5: 6 };
export function shopGoods(world, s) {
  const c = world.csq;
  if (!c) return world.cardShop;
  const ids = ['z1', 'z2', 'z3', 'z4', 'zG', 'zGadd'].slice(0, SHOP_TIERS[s.var[44] || 0] || 1).flatMap((k) => c.shop[k] || []);
  const arena = (s.flags && s.flags.arena && s.flags.arena.clear) || [];
  for (const [id, q] of c.bonus) {
    const ok = q.sw ? q.sw.some((n) => s.sw[n]) : q.arena != null ? (arena[q.arena] || 0) > 0
      : (s.var[40] || 0) >= q.v40 && ((s.defeats || {})[q.defeats[0]] || 0) >= q.defeats[1] && !ids.includes(id);
    if (ok) ids.push(id);
  }
  return [...new Set(ids)].filter((id) => world.items[id]).sort((a, b) => world.items[a].order - world.items[b].order);
}
const loaded = () => Promise.all([MG, CARDS, ICONS, KARIN].map((p) => img(p).p));
const names = (world, ids) => ids.map((id) => world.items[id].name).join('　');

// ---------- the card square ----------
// chk_card (all.rb 186483): one of the three at random, unless a card forced one (switches 866 shop, 867 concentration,
// 868 lottery: cards 198 / 199 / 200, src/cards_square.js); then the part of the story for the goods (variable 44, left
// as it is when a カード特殊 square has set it): variable 40, +1 in Z4 (switch 431), +1 in ZG (variable 43 151-199)
export function eraOf(s) {
  let v = s.var[40] || 0;
  if (s.sw[431]) v++;
  const v43 = s.var[43] || 0;
  if (v43 >= 151 && v43 <= 199) v++;
  return v;
}
// poi.v44: a 「カード特殊」 square sets variable 44 first (10 / 20: the shop has the next part's goods too; tools/build_sys.py)
export async function cardSquare(game, poi) {
  const s = cardState(game.state);
  if (poi && poi.v44) s.var[44] = poi.v44;
  s.sw = s.sw || {};
  s.var[223] = (s.var[223] || 0) + 1; // times stopped on a card square
  let n = rand(3);
  if (s.sw[866]) n = 0;
  if (s.sw[867]) n = 2;
  if (s.sw[868]) n = 1;
  s.sw[866] = s.sw[867] = s.sw[868] = false;
  if (!s.var[44]) s.var[44] = eraOf(s);
  backAt = backOf(s);
  try {
    if (n === 0) { audio.playBgm('DB3 メニュー'); await openShop(game); } // the goods: shopGoods (src/cards_square.js shopHooks)
    else if (n === 1) await lottery(game);
    else await memory(game);
  } finally { s.var[44] = 0; } // (the scenes' terminate / page 21's last command)
  game.field.enter(); // the map's music again
}

// ---------- カードスピードくじ (connect-the-cards lottery) ----------
export async function lottery(game) {
  const world = game.world, s = cardState(game.state);
  await loaded();
  audio.playBgm('Z1 ミニゲーム');
  const ui = frame('卡片連線抽獎');
  const a = prize(world, s), b = prize(world, s);
  const hide = Array.from({ length: 6 }, () => (rand(2) ? b : a)); // 0-2 top row, 3-5 bottom row
  const open = hide.map(() => false);
  const cv = document.createElement('canvas');
  cv.width = 384; cv.height = 208;
  ui.stage.appendChild(cv);
  let col = -1, blink = 0;
  const draw = () => {
    const c = cv.getContext('2d');
    c.fillStyle = '#f6d7a0'; c.fillRect(0, 0, 384, 208);
    const mg = img(MG);
    if (mg.ok) { c.drawImage(mg.im, 0, 0, 96, 120, 64, 44, 96, 120); c.drawImage(mg.im, 0, 0, 96, 120, 224, 44, 96, 120); }
    for (let k = 0; k < 6; k++) {
      const x = 160 * (k % 3), y = 112 * Math.floor(k / 3);
      if (col < 0) { c.fillStyle = '#000'; c.fillRect(x, y, 64, 96); continue; }
      cardBack(c, x, y);
      if (open[k]) cardFace(world, c, hide[k], x, y);
    }
  };
  const timer = setInterval(() => { blink++; draw(); if (col >= 0 && col < 3 && blink % 2) { const c = cv.getContext('2d'); c.fillStyle = '#f83800'; for (const y of [0, 112]) { c.fillRect(160 * col, y, 64, 3); } } }, 300);
  draw();
  ui.say('幫助卡的連線抽獎！\n從左邊開始抽獎\n２張一樣的就算中獎！　３張一樣的是大獎！\n越好的獎可以獲得越多的幫助卡哦！');
  await ui.next();
  col = 0;
  let last = null, result = '';
  while (!result) {
    ui.say(col === 0 ? '請選擇一張卡吧！' : '請選擇下一張卡！');
    draw();
    const k = await new Promise((res) => {
      cv.onclick = (e) => {
        const r = cv.getBoundingClientRect();
        const x = ((e.clientX - r.left) * 384) / r.width, y = ((e.clientY - r.top) * 208) / r.height;
        if (x < 160 * col || x > 160 * col + 64) return;
        res(col + (y >= 104 ? 3 : 0));
      };
    });
    cv.onclick = null;
    audio.se(SE_OK, 70);
    open[k] = true;
    draw();
    ui.say(world.items[hide[k]].name);
    await sleep(1000);
    col++;
    if (col >= 2 && last === hide[k]) {
      if (col === 3) {
        audio.se('Z1 ピンポン', 80);
        gainCard(world, s, last, 2);
        result = `中大獎了！\n獲得２張${world.items[last].name}卡！`;
      }
    } else if (col >= 2) {
      if (col === 2) { audio.se('Z1 ブザー', 80); result = '沒中獎！'; }
      else { audio.se('Z1 ピンポン', 80); gainCard(world, s, last, 1); result = `中獎了！\n獲得1張${world.items[last].name}卡！`; }
    }
    last = hide[k];
  }
  col = 3;
  ui.say(result);
  await ui.next();
  clearInterval(timer);
  audio.se('Z1 出る', 70);
  ui.close();
}

// ---------- カード神経衰弱 (爺爺's memory game) ----------
const MISSES = 2; // ERR_NUM
export async function memory(game) {
  const world = game.world, s = cardState(game.state);
  await loaded();
  audio.playBgm('DB3 ミニゲーム');
  const ui = frame('卡片神經衰弱');
  const ids = Array.from({ length: 4 }, () => prize(world, s));
  const hide = [];
  ids.forEach((id) => { for (let z = 0; z < 2;) { const y = rand(8); if (hide[y] == null) { hide[y] = id; z++; } } });
  const open = hide.map(() => false), gone = hide.map(() => false);
  const grandpa = iconCanvas(world.items[30], 64); // 顔カード row 24 = じいちゃん
  ui.stage.appendChild(grandpa);
  const cv = document.createElement('canvas');
  cv.width = 4 * 78 - 14; cv.height = 2 * 106 - 10;
  ui.stage.appendChild(cv);
  const pos = (k) => [78 * (k % 4), 106 * Math.floor(k / 4)];
  const draw = () => {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    hide.forEach((id, k) => {
      if (gone[k]) return;
      const [x, y] = pos(k);
      cardBack(c, x, y);
      if (open[k]) cardFace(world, c, id, x, y);
    });
  };
  draw();
  const got = [];
  let misses = 0, first = null;
  ui.say(`爺爺「靠你的好記性，才能得到強大的同伴相助！\n　　　還有${MISSES}回抽不中就結束了！」`);
  while (misses < MISSES && gone.includes(false)) {
    const k = await new Promise((res) => {
      cv.onclick = (e) => {
        const r = cv.getBoundingClientRect();
        const x = ((e.clientX - r.left) * cv.width) / r.width, y = ((e.clientY - r.top) * cv.height) / r.height;
        const i = hide.findIndex((_, j) => { const [px, py] = pos(j); return x >= px && x < px + 64 && y >= py && y < py + 96; });
        if (i >= 0 && !open[i] && !gone[i]) res(i);
      };
    });
    cv.onclick = null;
    audio.se(SE_OK, 70);
    open[k] = true;
    draw();
    if (first == null) { first = k; ui.say(`爺爺「${world.items[hide[k]].name}」`); continue; }
    if (hide[first] === hide[k]) {
      audio.se('Z1 ピンポン', 80);
      await sleep(330);
      gone[first] = gone[k] = true;
      got.push(hide[k]);
      ui.say('爺爺「幹得漂亮！」');
    } else {
      audio.se('Z1 ブザー', 80);
      misses++;
      ui.say('爺爺「可惜！　猜錯了！」');
      await ui.next();
      if (misses < MISSES) { open[first] = open[k] = false; ui.say(`爺爺「還有${MISSES - misses}回！　加油吧！！」`); }
    }
    first = null;
    draw();
  }
  if (!gone.includes(false)) { ui.say('爺爺「這真厲害！」'); await ui.next(); }
  if (got.length) {
    for (const id of got) gainCard(world, s, id);
    audio.se('Z1 アイテム取得', 80);
    ui.say(`爺爺「獲得以下幫助卡！」\n${names(world, got)}`);
    await ui.next();
  }
  audio.se('Z1 出る', 70);
  ui.close();
}

// ---------- カード合成 (卡林大人) ----------
// state.recipes: {recipe index: true} ($get_card_compo_recipe); state.sw[34]: the explanation has been heard
export async function compo(game) {
  const world = game.world, s = cardState(game.state);
  s.recipes = s.recipes || {};
  trim(world, s);
  await loaded();
  audio.playBgm('ZD イベント3');
  const ui = frame('卡片合成');
  const karin = document.createElement('canvas');
  karin.width = 96; karin.height = 80;
  const pose = (row) => { const k = img(KARIN), c = karin.getContext('2d'); c.clearRect(0, 0, 96, 80); if (k.ok) c.drawImage(k.im, 0, 80 * row, 96, 80, 0, 0, 96, 80); };
  pose(0);
  const row = h('div', 'karin');
  const slots = [h('div', 'slot'), h('div', 'slot'), h('div', 'slot')];
  row.append(karin, slots[0], h('div', 'plus', '＋'), slots[1], h('div', 'plus', '→'), slots[2]);
  ui.stage.appendChild(row);
  const body = h('div', 'rl');
  ui.stage.appendChild(body);
  ui.stage.classList.add('top');
  const show = (k, id) => { slots[k].innerHTML = ''; if (id != null) slots[k].appendChild(iconCanvas(world.items[id], 52)); };
  const clear = () => { [0, 1, 2].forEach((k) => show(k, null)); body.innerHTML = ''; };
  const talk = async (text, row = 0) => { pose(row); ui.say(`卡林大人「${text}」`); await ui.next(); };
  const ask = async (text, opts) => { pose(0); ui.say(`卡林大人「${text}」`); return ui.choose(opts); };

  if (!s.sw[34]) { // common event 269
    for (const t of ['在這裡，你可以把手上的卡片合成！\n　　　不同的組合可以做出不同的卡片！',
      '合成成功一次之後\n　　　就會把它記錄到配方當中\n　　　下一次就可以很簡單地從配方合成！',
      '從配方中可以看到卡片兩邊的持有數！\n　　　如果合成的卡片達到了持有數上限\n　　　持有數的顏色就會變成橙色，一目了然！',
      '配方合成有兩個模式\n　　　分別為配方一覽和想要製作的卡片\n　　　可以用上方的切換按鈕切換模式']) await talk(t);
    s.sw[34] = true;
  }

  // the owned cards to pick from (Scene_Db_Card call_state 4: any card the original lets you compose — not element 9)
  const pick = (text) => new Promise((res) => {
    pose(0);
    ui.say(`卡林大人「${text}」`);
    body.innerHTML = '';
    const list = Object.keys(s.cards).map(Number).filter((id) => world.items[id] && world.items[id].compo)
      .sort((x, y) => world.items[x].order - world.items[y].order);
    if (!list.length) body.appendChild(h('div', 'empty', '沒有可以合成的卡片。'));
    for (const id of list) {
      const b = h('button');
      b.append(iconCanvas(world.items[id], 28), h('span', 'nm', world.items[id].name), h('span', 'n', `×${s.cards[id]}`));
      b.onclick = () => { audio.se(SE_OK, 70); body.innerHTML = ''; ui.acts.innerHTML = ''; res(id); };
      body.appendChild(b);
    }
    ui.acts.innerHTML = '';
    ui.acts.appendChild(button('取消', () => { audio.se(SE_OK, 70); body.innerHTML = ''; ui.acts.innerHTML = ''; res(null); }));
  });

  const find = (x, y) => world.cardCompo.findIndex(([p, q]) => (p === x && q === y) || (p === y && q === x));
  // after both cards are taken: the composition itself (chk_card_compo … card_compo_get); returns nothing
  const make = async (x, y, fromRecipe) => {
    const r = find(x, y);
    const isNew = r >= 0 && !s.recipes[r];
    if (r >= 0) { pose(2); ui.say(`卡林大人「${fromRecipe ? '就用這個配方吧！' : '這張卡是什麼呢？\n　　　嗯……………………………………'}」`); }
    else { pose(3); ui.say('卡林大人「這個組合是…」'); }
    await ui.next();
    audio.se('Z2 カードアップ', 80);
    row.classList.add('flash');
    await sleep(1100);
    row.classList.remove('flash');
    const out = r >= 0 ? world.cardCompo[r][2] : x; // no recipe: the cards come back (card_compo_restore)
    show(2, out);
    if (isNew) {
      s.recipes[r] = true;
      await talk(`哦！　居然是「${world.items[out].name}」的卡呢！\n　　　這第一次見到呢　把這個添加到配方吧！`, 2);
    } else if (r >= 0 && out === 15) await talk('我的卡做好了！\n　　　好好珍惜吧！');
    else if (r >= 0) await talk(`哦　「${world.items[out].name}」的卡做好了！`);
    else { gainCard(world, s, x); gainCard(world, s, y); await talk('那張卡好像不能合成……'); }
    if (r >= 0) { gainCard(world, s, out); audio.se('Z1 アイテム取得', 80); }
    clear();
  };

  const manual = async () => {
    for (;;) {
      clear();
      const x = await pick('選擇第一張卡！');
      if (x == null) { if ((await ask('停止合成嗎？', ['是', '否'])) === 0) return false; continue; }
      lose(s, x); show(0, x);
      const y = await pick('選擇第二張卡！');
      if (y == null) { gainCard(world, s, x); continue; }
      lose(s, y); show(1, y);
      if ((await ask('要合成這張卡嗎？', ['是', '否'])) === 1) { gainCard(world, s, x); gainCard(world, s, y); continue; }
      await make(x, y, false);
      return true;
    }
  };

  // the recipe screen: 配方一覽 (every recipe, ??? until made once) or 想做的卡 (the cards known recipes make)
  let mode = 0;
  const can = (r) => { const [x, y] = world.cardCompo[r]; return x === y ? (s.cards[x] || 0) >= 2 : (s.cards[x] || 0) >= 1 && (s.cards[y] || 0) >= 1; };
  const recipeRow = (r) => {
    const [x, y, out] = world.cardCompo[r];
    const b = h('button', s.recipes[r] && can(r) ? '' : 'off');
    if (!s.recipes[r]) { b.append(h('span', null, '？？？？？？？？？　：？')); return b; }
    const n = (id, full) => { const e = h('span', `n${(s.cards[id] || 0) >= maxOf(s, world.items[id]) && full ? ' max' : ''}`, String(s.cards[id] || 0)); return e; };
    b.append(iconCanvas(world.items[x], 28), h('span', 'nm', world.items[x].name), n(x, true), h('span', 'arrow', '＋'),
      iconCanvas(world.items[y], 28), h('span', 'nm', world.items[y].name), n(y, true), h('span', 'arrow', '→'),
      iconCanvas(world.items[out], 28), h('span', 'nm', world.items[out].name), n(out, true));
    return b;
  };
  const recipes = () => new Promise((res) => {
    const render = (only) => {
      body.innerHTML = '';
      ui.acts.innerHTML = '';
      const tabs = h('div', 'tabs');
      [['配方一覽', 0], ['想做的卡', 1]].forEach(([l, m]) => tabs.appendChild(button(l, () => { mode = m; render(null); }, m === mode ? 'on' : '')));
      body.appendChild(tabs);
      let rows = world.cardCompo.map((_, r) => r);
      if (mode === 1 && only == null) { // the cards known recipes make, in card order
        const outs = [...new Set(rows.filter((r) => s.recipes[r]).map((r) => world.cardCompo[r][2]))].sort((p, q) => world.items[p].order - world.items[q].order);
        if (!outs.length) body.appendChild(h('div', 'empty', '還沒有配方。'));
        for (const out of outs) {
          const b = h('button');
          b.append(iconCanvas(world.items[out], 28), h('span', 'nm', world.items[out].name), h('span', 'n', String(s.cards[out] || 0)));
          b.onclick = () => { audio.se(SE_OK, 70); render(out); };
          body.appendChild(b);
        }
      } else {
        if (only != null) rows = rows.filter((r) => s.recipes[r] && world.cardCompo[r][2] === only);
        for (const r of rows) {
          const b = recipeRow(r);
          b.onclick = () => {
            if (!s.recipes[r] || !can(r)) { audio.se(SE_ERR, 70); return; }
            audio.se(SE_OK, 70);
            res(r);
          };
          body.appendChild(b);
        }
      }
      ui.acts.appendChild(button(only != null ? '返回' : '取消', () => { audio.se(SE_OK, 70); if (only != null) render(null); else res(null); }));
    };
    pose(0);
    ui.say('卡林大人「要用哪個配方呢？」');
    render(null);
  });
  const byRecipe = async () => {
    for (;;) {
      clear();
      const r = await recipes();
      if (r == null) { clear(); if ((await ask('要停止嗎？', ['是', '否'])) === 0) return false; continue; }
      const [x, y] = world.cardCompo[r];
      clear(); show(0, x); show(1, y);
      if ((await ask('要合成這張卡嗎？', ['是', '否'])) === 1) continue;
      lose(s, x); lose(s, y);
      await make(x, y, true);
      return true;
    }
  };

  const start = () => ask('要合成卡片嗎？', ['自己選擇合成', '配方合成', '離開']);
  let choice = await start();
  while (choice !== 2) {
    if (choice === 0 && !(await manual())) { choice = await start(); continue; } // stopped: back to the first question
    if (choice === 1 && !(await byRecipe())) break;
    if ((await ask('還繼續嗎？', ['是', '否'])) === 1) break;
    if (choice === 0) choice = await start(); // the recipe list comes straight back after a recipe
  }
  await talk('歡迎再來！');
  ui.close();
  game.field.enter();
}
