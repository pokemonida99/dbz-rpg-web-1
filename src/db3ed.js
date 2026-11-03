// The DB3 staff roll (Z_db3ed.db3ed, all.rb 23873), after 「恭喜你們全等級優勝！！」 in the arena (Map007 event 19, page
// 90901): 28 card backs (7 × 4 at (96 + 64x, 48 + 96y) of the 640×480 screen) to 「DB3 エンディング」; every 16 frames one of
// the ten middle cards (x 1-5, y 1-2, never the same twice running) turns for 24 frames — first the 27 party characters
// by set_character_face (their clothes: src/costume.js), then the enemies of get_ene_history_list as update_eneput_flag
// lets it show them (world.db3ed.foes, tools/build_costume.py), Arale last. The last card stays five times as long, and
// a tap (Input::C) then — 「Z3 アタリ」 — is what leads to 「遇見阿拉蕾」 (page 90911); returns whether it was pressed.
import { img, audio, assetUrl, loadImages } from './core.js?v=20261104-0727';

const PIC = 'Graphics/Pictures/';
const PARTY = [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 15, 12, 19, 17, 20, 25, 26, 21, 22, 23, 16, 32, 27, 28, 29, 30]; // @chano (超サイヤ人も混み)
const SHOWN = { // update_eneput_flag: the switches that let each group of enemies show (860: cleared once, a second round)
  base: () => true, z3: (sw) => sw[119] || sw[860], z4: (sw) => sw[431] || sw[860], post: (sw) => (sw[570] && sw[459]) || sw[860],
  zg: (sw) => sw[599] || sw[850] || sw[586] || sw[860], gaiden: (sw) => sw[586] || sw[860],
};
// set_ene_str_no: Z1_顔敵 below 31, Z2_顔敵 below 101 (row id − 30), Z3_顔敵 (row id − 100)
const foeFace = (id) => (id < 31 ? [PIC + 'Z1_顔敵.PNG', id] : id < 101 ? [PIC + 'Z2_顔敵.PNG', id - 30] : [PIC + 'Z3_顔敵.PNG', id - 100]);
// set_card_frame 1 (14062): the back of the era's cards in カード関係
function backRect(s) {
  const v = s.var || {}, e = v[40] || 0;
  if (e < 2) return [64, 96];
  if (v[43] >= 151 && v[43] <= 200) return [704, 96];
  return s.sw[431] ? [384, 272] : [576, 96];
}

export function db3ed(game) {
  const s = game.state, w = game.world.db3ed, sw = s.sw || {};
  const list = [...PARTY.map((id) => ({ face: [PIC + 'Z1_顔味方.PNG', id - 3] })), // (the era's sheet in its clothes: src/costume.js)
    ...w.foes.filter(([, g]) => SHOWN[g](sw)).map(([id]) => ({ face: foeFace(id) }))];
  const cards = new Image(); // カード関係 as it is (the eras' aliases redraw parts of it)
  cards.src = assetUrl(PIC + 'カード関係.PNG');
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;z-index:80;background:#000;display:flex;align-items:center;justify-content:center;touch-action:none';
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 480;
  cv.style.cssText = 'width:100%;max-width:640px;image-rendering:pixelated';
  root.append(cv);
  document.getElementById('app').appendChild(root);
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const [bx, by] = backRect(s), pos = (k) => [96 + 64 * (k % 7), 48 + 96 * Math.floor(k / 7)];
  let shown = null, n = 0, putFrames = 24, last = false, pressed = false, done = false;
  const tap = (e) => {
    if (e) e.preventDefault();
    if (last && !pressed) { audio.se('Z3 アタリ'); pressed = true; } // (C at other times does nothing)
  };
  const key = (e) => { if (['Enter', ' ', 'z', 'Z'].includes(e.key)) tap(e); };
  root.addEventListener('pointerdown', tap);
  window.addEventListener('keydown', key);
  audio.playBgm(w.bgm);
  const draw = () => {
    c.fillStyle = '#000';
    c.fillRect(0, 0, 640, 480);
    if (!cards.complete || !cards.naturalWidth) return;
    for (let k = 0; k < 28; k++) {
      const [x, y] = pos(k);
      if (shown && shown.k === k) {
        c.drawImage(cards, 448, 272, 64, 96, x, y, 64, 96); // the card filled with the window colour, the face on it
        c.fillStyle = w.back;
        c.fillRect(x + 2, y + 4, 60, 88); c.fillRect(x + 4, y + 2, 56, 2); c.fillRect(x + 4, y + 92, 56, 2);
        const f = img(shown.face[0]);
        if (f.ok) c.drawImage(f.im, 0, 64 * shown.face[1], 64, 64, x, y + 16, 64, 64);
      } else c.drawImage(cards, bx, by, 64, 96, x, y, 64, 96);
    }
  };
  return new Promise((res) => {
    let frame = 0, start = performance.now(), count = 0, putting = false;
    const step = () => { // one frame of the original's loop
      frame++; count++;
      if (n === list.length && !last) { last = true; putFrames *= 5; } // アラレ表示中
      if (!putting && count === 16) {
        putting = true; count = 0;
        let k;
        do k = 1 + Math.floor(Math.random() * 5) + (1 + Math.floor(Math.random() * 2)) * 7; while (shown && k === shown.k);
        shown = { k, face: list[n].face };
        n++;
      } else if (putting && count === putFrames) {
        putting = false; count = 0;
        shown = null;
        if (n === list.length) done = true;
      }
    };
    const tick = (t) => {
      const want = Math.floor(((t || performance.now()) - start) * 0.06); // 60 frames a second, whatever the display
      while (frame < want && !done) step();
      draw();
      if (!done) { requestAnimationFrame(tick); return; }
      root.removeEventListener('pointerdown', tap);
      window.removeEventListener('keydown', key);
      root.remove();
      res(pressed);
    };
    loadImages([...new Set(list.map((x) => x.face[0]))]).then(() => { start = performance.now(); requestAnimationFrame(tick); });
  });
}
