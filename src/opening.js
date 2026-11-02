// The original's opening, frame for frame:
//  - playOpening(): the title animation played before the title screen (142_Title_Anime.rb z1_op: sky, clouds,
//    the Dragon Ball, space, Raditz's pod, the scouter), drawn at its 640×480 size and fitted to the screen width.
//  - playStory(world): the Z1 opening story on a new game (Map007 event 1 with 143_Event_Main.rb z1opening 1-15:
//    the pod landing, Raditz meeting Piccolo, Goku at the Kame House), with the original text in full
//    (world.opening, built by tools/opening_data.py) and the speaker's face in the dialogue box.
// Both draw on their own layer above everything else and have a 略過 (skip) button, like the classic version.
import { img, loadImages, audio } from './core.js?v=20261102-2217';

const pic = (n) => `Graphics/Pictures/${n}`;
const FPS = 60;

// ---------- shared overlay: canvas, skip button, dialogue box ----------
const CSS = `
#opening { position: absolute; inset: 0; z-index: 55; background: #000; touch-action: none; }
#opening canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#opening .skip { position: absolute; top: calc(var(--safe-t) + 10px); right: 10px; z-index: 2; padding: 6px 12px; font-size: 14px;
  color: #eee; background: rgba(20,20,28,.85); border: 1px solid #555; border-radius: 6px; }
#opening .tap { position: absolute; left: 0; right: 0; top: 50%; text-align: center; color: var(--gold); font-size: 18px;
  letter-spacing: .1em; animation: blink 1.2s steps(2) infinite; }
#opening .dlg { position: absolute; left: 6px; right: 6px; min-height: 154px; padding: 6px 8px 10px 80px; z-index: 1;
  border: 12px solid transparent; border-image: url("../assets/ui/frame.png") 8 / 12px stretch; background: var(--cream) padding-box; color: var(--ink); }
#opening .dlg.no-face { padding-left: 8px; }
#opening.shake .dlg, #opening.shake > canvas { animation: dlg-shake .12s steps(2) infinite; }
@keyframes dlg-shake { 0% { transform: translate(-3px, 1px); } 50% { transform: translate(3px, -1px); } 100% { transform: translate(-3px, 1px); } }
#opening .dlg .face { position: absolute; left: 2px; top: 4px; width: 64px; height: 64px; image-rendering: pixelated; }
#opening .dlg.no-face .face { display: none; }
#opening .dlg .who { font-size: 16px; color: #d0480c; min-height: 1.2em; }
#opening .dlg .text { font-size: 19px; line-height: 1.6; white-space: pre-wrap; margin-top: 2px; }
#opening .dlg .next { position: absolute; right: 12px; bottom: 6px; color: var(--rust); animation: blink 1s steps(2) infinite; }
#opening .dlg.busy .next { visibility: hidden; }
`;

export function overlay() {
  if (!document.getElementById('opening-css')) {
    const st = document.createElement('style');
    st.id = 'opening-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.id = 'opening';
  el.innerHTML = `<canvas></canvas><button class="skip">略過 ▶▶</button>
    <div class="dlg" hidden><canvas class="face" width="64" height="64"></canvas><div class="who"></div><div class="text"></div><div class="next">▼</div></div>`;
  document.getElementById('app').appendChild(el);
  const ui = {
    el, canvas: el.querySelector('canvas'), skipBtn: el.querySelector('.skip'), dlg: el.querySelector('.dlg'),
    skipped: false, onSkip: [], onTap: null,
    skip() {
      if (this.skipped) return;
      this.skipped = true;
      for (const f of this.onSkip.splice(0)) f();
    },
    // resolves after n frames of 1/60 s, or at once when skipped
    wait(frames) {
      return new Promise((res) => {
        if (this.skipped) return res();
        const t = setTimeout(res, (frames * 1000) / FPS);
        this.onSkip.push(() => { clearTimeout(t); res(); });
      });
    },
    // device-pixel canvas the size of the layer
    fit() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      this.cssW = r.width;
      return this.canvas.getContext('2d');
    },
    close() { el.remove(); },
  };
  ui.skipBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); ui.skip(); });
  el.addEventListener('pointerdown', () => { audio.unlock(); if (ui.onTap) ui.onTap(); });
  // keys: Enter / Space / Z like a tap, Esc skips; ui.onKey can be swapped (the title animation ends on Enter)
  ui.onKey = (e) => {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') { audio.unlock(); if (ui.onTap) ui.onTap(); return true; }
    if (e.code === 'Escape') { ui.skip(); return true; }
    return false;
  };
  const key = (e) => { if (ui.onKey(e)) { e.preventDefault(); e.stopImmediatePropagation(); } };
  window.addEventListener('keydown', key, true);
  const close = ui.close;
  ui.close = () => { window.removeEventListener('keydown', key, true); close.call(ui); };
  return ui;
}

// ---------- title animation (z1_op) ----------
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const OP = {
  nami: range(3, (i) => pic(`z1_opnami${i}.png`)),
  kumo: pic('z1_opkumo.png'),
  hikaru: range(4, (i) => pic(`z1_ophikaru${i}.PNG`)),
  db: range(7, (i) => pic(i === 7 ? 'z1_opdb7.png' : `z1_opdb${i}.PNG`)),
  uchu: range(18, (i) => pic(`z1_oputyuu${i}.PNG`)),
  ship: range(10, (i) => pic(`z1_utyuusen${i}.PNG`)),
};
const OP_END = 2380;

class TitleAnime {
  constructor() {
    this.f = 0; // @animeframe
    this.nf = 0; // @namiframe: waves, later the scouter blink
    this.color = 'rgb(96,160,255)';
    this.nami = OP.nami[0]; this.namiy = 395;
    this.kumoy = 394;
    this.pic = OP.hikaru[0]; this.rw = 44; this.rh = 44;
    this.picx = 640 / 2 - 63; this.picy = 480 / 2 - 55;
    this.back = OP.uchu[0];
  }

  // what one pass of the z1_op loop draws, before it advances
  draw(c) {
    const f = this.f;
    if (f < 522) { c.fillStyle = this.color; c.fillRect(0, 0, 640, 480); } else blt(c, this.back, 0, 0, 640, 480);
    if (f >= 167) blt(c, OP.kumo, 0, this.kumoy, 640, 345);
    if (f >= 347 && f <= 362) blt(c, this.pic, 640 / 2 - 22, 480 / 2 - 22, this.rw, this.rh);
    if ((f >= 375 && f <= 586) || (f >= 626 && f <= 767)) blt(c, this.pic, this.picx, this.picy, this.rw, this.rh);
    if (f < 480) blt(c, this.nami, 0, this.namiy, 640, 85);
  }

  // the rest of the loop: frame counters, then z1_op_picture_control
  tick() {
    if (this.f < 480 || this.f >= 1026) this.nf++; else this.nf = 13;
    const f = ++this.f;
    const setPic = (p, w, h) => { this.pic = p; if (w) { this.rw = w; this.rh = h; } };
    const move = (dx, dy) => { this.picx += dx; this.picy += dy; };
    if (f >= 167 && f <= 326) this.kumoy -= 2;
    else if (f >= 347 && f <= 359 && (f - 347) % 4 === 0) setPic(OP.hikaru[(f - 347) / 4]);
    else if (f >= 375 && f <= 399 && (f - 375) % 4 === 0) setPic(OP.db[(f - 375) / 4], 126, 110);
    else if (f >= 408 && f <= 480) { this.namiy += 6; this.kumoy += 6; }
    else if (f === 488) this.color = 'rgb(64,96,248)';
    else if (f === 492) this.color = 'rgb(32,0,176)';
    else if (f === 496) this.color = 'rgb(0,0,0)';
    else if (f >= 522 && f <= 538 && (f - 522) % 4 === 0) this.back = OP.uchu[(f - 522) / 4];
    else if (f >= 540 && f <= 586) this.picy -= 6;
    else if (f === 626) { setPic(OP.ship[0], 130, 110); this.picx = 624; this.picy = -80; }
    else if (f >= 627 && f <= 678) {
      // the pod tumbles: frames 2-4, then back to 1
      if (f >= 652) setPic(OP.ship[f <= 656 ? 1 : f <= 660 ? 2 : f <= 665 ? 3 : 0]);
      move(-4, 3);
    } else if ([679, 700, 718, 731, 740, 744].includes(f)) { setPic(OP.ship[[679, 700, 718, 731, 740, 744].indexOf(f) + 4]); move(-12, 5); }
    else if (f >= 680 && f <= 717) move(-4, 3);
    else if (f >= 719 && f <= 751) move(-5, 3);
    else if (f === 752) { move(32, 32); setPic(OP.hikaru[0]); }
    else if (f === 756 || f === 760 || f === 764) setPic(OP.hikaru[(f - 752) / 4]);
    else if (f >= 872 && f <= 884 && (f - 872) % 4 === 0) this.back = OP.uchu[5 + (f - 872) / 4];
    else if (f >= 919 && f <= 931 && (f - 919) % 4 === 0) this.back = OP.uchu[9 + (f - 919) / 4];
    else if (f >= 994 && f <= 1018 && (f - 994) % 8 === 0) this.back = OP.uchu[13 + (f - 994) / 8];
    else if (f === 1026) this.nf = 0;

    if (f < 480) {
      if (this.nf === 0 || this.nf === 12) { this.nami = OP.nami[0]; this.nf = 0; }
      else if (this.nf === 4) this.nami = OP.nami[1];
      else if (this.nf === 8) this.nami = OP.nami[2];
    } else if (f >= 1026) { // the scouter lens blinks under the title
      if (this.nf === 0 || this.nf === 32) { this.back = OP.uchu[12]; this.nf = 0; }
      else if (this.nf === 16) this.back = OP.uchu[17];
    }
  }
}

// Bitmap#blt: the source rect is cut to the picture's size
export function blt(c, path, x, y, w, h, sx = 0, sy = 0) {
  const e = img(path);
  if (!e.ok) return;
  const sw = Math.min(w, e.im.width - sx), sh = Math.min(h, e.im.height - sy);
  if (sw > 0 && sh > 0) c.drawImage(e.im, sx, sy, sw, sh, x, y, sw, sh);
}

// Plays the title animation; resolves when it ends or is skipped. The browser needs a tap before it can play
// the music, so it waits for one first.
export async function playOpening() {
  const ui = overlay();
  const all = [...OP.nami, OP.kumo, ...OP.hikaru, ...OP.db, ...OP.uchu, ...OP.ship];
  const loading = loadImages(all);
  const tap = document.createElement('div');
  tap.className = 'tap';
  tap.textContent = '點一下開始';
  ui.el.appendChild(tap);
  await new Promise((res) => { ui.onTap = res; ui.onSkip.push(res); });
  tap.remove();
  if (ui.skipped) { ui.close(); return; }
  await loading;
  audio.playBgm('Z1 オープニング');
  const anime = new TitleAnime();
  const buf = document.createElement('canvas');
  buf.width = 640; buf.height = 480;
  const bc = buf.getContext('2d');
  ui.onTap = null; // like the original, Enter ends it; a stray tap on a phone shouldn't
  const onKey = ui.onKey;
  ui.onKey = (e) => { if (e.code === 'Enter') { ui.skip(); return true; } return onKey(e); };
  await new Promise((res) => {
    const t0 = performance.now();
    ui.onSkip.push(res);
    const frame = (t) => {
      if (ui.skipped) return;
      const due = Math.min(OP_END, Math.floor(((t - t0) * FPS) / 1000));
      // catch up on frames the browser skipped; only the last one needs drawing
      while (anime.f < due) { if (due - anime.f === 1) anime.draw(bc); anime.tick(); }
      const c = ui.fit();
      const W = c.canvas.width, H = c.canvas.height;
      const s = W / 640, dh = Math.round(480 * s);
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.drawImage(buf, 0, Math.round((H - dh) / 2), W, dh);
      if (anime.f >= OP_END) res(); else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  ui.close();
}

// ---------- the opening story (z1opening) ----------
// positions are the original's 640×480 screen: the scene window is 192×128 at (224,46) (scrolling scenes 512×128
// at (64,46)), the stranger's face at (288,78), the party's faces under the message window
export const SCROLL_X = 64, SCENE_X = 224, SCENE_Y = 46, ENE = [288, 78], PLAY_X = 288;
const BG = (n) => pic(`Z1_背景_${n}.PNG`), EV = (n) => pic(`Z1_イベント_${n}.PNG`);
const FACE_PARTY = pic('Z1_顔味方.PNG'), FACE_EVENT = pic('Z1_顔イベント.PNG'), FACE_FOE = pic('Z1_顔敵.PNG');
const STORY_PICS = [BG('スクロール_山'), BG('スクロール_海'), BG('スクロール_空'), BG('山'), BG('山_スカウター1'), BG('山_スカウター2'),
  BG('平野'), BG('平野_スカウター1'), BG('平野_スカウター2'), BG('カメハウス'), BG('海'), EV('宇宙船'), EV('ラディッツ'),
  EV('ゴクウとゴハン'), EV('ラディッツとゴハン'), EV('ゴクウとピッコロ'), FACE_PARTY, FACE_EVENT, FACE_FOE];

export class Stage {
  constructor(ui) {
    this.ui = ui;
    this.sprites = [];
    this.fade = 0; // black over everything, 0..1
    this.flash = 0; // white, 0..1
    this.running = true;
    const loop = () => { if (!this.running) return; this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // add_chr: a picture (or the part `src` of it) at the original screen position; `face` = a party face, shown
  // under the scene here since the message box sits at the bottom
  // size: [w, h] to draw it at (src/cutscene.js: the dragon balls at half size), or 'full' for a 640×480 picture that
  // fills the width above the message box (z1field 135, Shenron)
  add(path, x, y, src = [0, 0, 512, 128], face = false, line = 0, size = null) { this.sprites.push({ path, x, y, src, face, line, size }); }
  se(name) { audio.se(name, 80); }
  clear() { this.sprites = []; }
  scrollBg(name, x) { this.add(BG(name), SCROLL_X, SCENE_Y, [x, 0, 512, 128]); }
  bg(name) { this.add(BG(name), SCENE_X, SCENE_Y, [0, 0, 192, 128]); }
  stranger() { this.add(FACE_FOE, ENE[0], ENE[1], [0, 64 * 10, 64, 64]); }
  enemyFace(sheet, row) { this.add(sheet, ENE[0], ENE[1], [0, 64 * row, 64, 64]); }
  // line: a second row of faces (src/cutscene.js, when more than three are on screen)
  party(sheet, row, dx, line = 0) { this.add(sheet, PLAY_X + dx, 0, [0, 64 * row, 64, 64], true, line); }
  // the faces under the scene are drawn faceSize big (src/cutscene.js: 48 when more than six, four a row)
  get faceSize() { return this.fs || 64; }
  set faceSize(v) { this.fs = v; }

  layout() {
    const ui = this.ui;
    const c = ui.fit();
    // whole device pixels per art pixel, as big as lets the 192-wide scene fill most of the width
    const scale = Math.max(1, Math.floor(c.canvas.width / 230));
    const w = c.canvas.width / scale, h = c.canvas.height / scale;
    const px = ui.cssW / w; // css px per art px
    this.dlgH = Math.max(this.dlgH || 190, ui.dlg.offsetHeight); // css px; kept so the scene doesn't jump
    const dlgH = this.dlgH / px;
    // scene, the party's faces, then the message box, centred as one block
    const lines = Math.max(0, ...this.sprites.map((s) => s.line || 0));
    // a short phone with many rows of faces (ZG's everyone, four or five rows): smaller faces rather than a message
    // box running off the bottom
    let fz = this.faceSize;
    while (fz > 32 && 128 + 10 + fz + (fz + 4) * lines + 12 + dlgH > h - 44 / px - 10) fz -= 4;
    this.fz = fz;
    const rows = fz + (fz + 4) * lines; // the faces under the scene
    const block = 128 + 10 + rows + 12 + dlgH;
    const top = Math.max(44 / px + 10, Math.round((h - block) / 2));
    ui.dlg.style.top = `${(top + 128 + 10 + rows + 12) * px}px`;
    return { c, scale, w, h, top, ox: Math.round(w / 2 - 320) };
  }

  draw() {
    const { c, scale, w, h, top, ox } = this.layout();
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    const oy = top - SCENE_Y;
    for (const s of this.sprites) {
      const [sx, sy, sw, sh] = s.src;
      if (s.face) {
        const fz = this.fz, fy = top + 128 + 10 + (fz + 4) * s.line;
        if (fz === 64) blt(c, s.path, s.x + ox, fy, sw, sh, sx, sy);
        else { const e = img(s.path); if (e.ok) c.drawImage(e.im, sx, sy, sw, sh, PLAY_X + ((s.x - PLAY_X) * fz) / 64 + ox + (64 - fz) / 2, fy, fz, fz); }
        continue;
      }
      if (s.size === 'screen') { // a picture placed on the original's 640×480 screen (show picture), scaled to the width
        const e = img(s.path), k = w / 640, z = s.zoom || 1; // zoom / blend 'add': a picture shown at 200 %, additive (src/zg_c.js)
        const y0 = this.ui.dlg.hidden ? Math.round((h - 480 * k) / 2) : top + 64 - 240 * k; // mid-screen while the message box is closed
        if (e.ok) {
          c.globalAlpha = s.op == null ? 1 : s.op / 255;
          if (s.blend === 'add') c.globalCompositeOperation = 'lighter';
          c.drawImage(e.im, sx, sy, sw, sh, s.x * k, y0 + s.y * k, sw * k * z, sh * k * z);
          c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
        }
        continue;
      }
      if (s.size === 'full') { // as wide as the screen, its middle on the scene window
        const e = img(s.path), fw = w, fh = Math.round((w * sh) / sw);
        if (e.ok) c.drawImage(e.im, sx, sy, sw, sh, 0, Math.max(0, Math.round(top + 64 - fh / 2)), fw, fh);
        continue;
      }
      c.save();
      c.beginPath();
      c.rect(SCROLL_X + ox, top, 512, 128); // nothing shows outside the scene window
      c.clip();
      if (s.op != null) c.globalAlpha = s.op / 255; // (a sprite fading: src/z3e.js 1384)
      if (s.size) { const e = img(s.path); if (e.ok) c.drawImage(e.im, sx, sy, sw, sh, s.x + ox, s.y + oy, s.size[0], s.size[1]); }
      else blt(c, s.path, s.x + ox, s.y + oy, sw, sh, sx, sy);
      c.restore();
    }
    if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash})`; c.fillRect(0, 0, w, h); }
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, w, h); }
  }

  // n frames of an animation: `each(i)` sets up frame i (like the original's loop + Graphics.update)
  async animate(n, each, hold = 1) {
    for (let i = 0; i < n && !this.ui.skipped; i++) {
      this.clear();
      each(i);
      await this.ui.wait(hold);
    }
  }

  // $eve.z1opening n
  async scene(n) {
    this.clear();
    const se = (name) => audio.se(name, 80);
    switch (n) {
      case 1:
        audio.playBgm('Z1 イベント2');
        this.scrollBg('スクロール_山', 0);
        break;
      case 2: // the pod falls past the mountains
        se('Z1 宇宙船落下');
        await this.animate(36, (x) => {
          this.scrollBg('スクロール_山', 0);
          this.add(EV('宇宙船'), SCROLL_X + 320 - x * 6, x * 4, [0, 0, 48, 36]);
        });
        this.clear();
        break;
      case 3:
        se('Z1 高速移動');
        this.bg('山');
        this.stranger();
        break;
      case 4: case 8: { // the scouter reads a power level
        const where = n === 4 ? '山' : '平野';
        await this.animate(12, (x) => {
          se('Z1 スカウター音');
          this.bg(`${where}_スカウター${(x % 2) + 1}`);
          if (n === 8) this.party(FACE_PARTY, 1, 0);
        }, 6);
        break;
      }
      case 5: case 9: // Raditz flies off over the mountains
        se('Z1 飛ぶ');
        await this.animate(101, (x) => {
          this.scrollBg('スクロール_山', 512 - x * 4);
          this.add(EV('ラディッツ'), SCROLL_X + 224, SCENE_Y + 20, [0, 0, 64, 56]);
        });
        break;
      case 6:
        se('Z1 吹っ飛ぶ');
        this.bg('平野');
        this.party(FACE_PARTY, 1, 0);
        break;
      case 7:
        se('Z1 飛ぶ');
        this.bg('平野');
        this.stranger();
        this.party(FACE_PARTY, 1, 0);
        break;
      case 10: // fade out and in, then Goku and Gohan fly over the sea
        await this.fadeTo(1, 30);
        this.clear();
        await this.fadeTo(0, 30);
        audio.playBgm('Z1 イベント1');
        await this.animate(101, (x) => {
          this.party(FACE_PARTY, 0, -32);
          this.party(FACE_EVENT, 0, 32);
          this.scrollBg('スクロール_海', 512 - x * 4);
          this.add(EV('ゴクウとゴハン'), SCROLL_X + 208, SCENE_Y + 14, [0, 0, 96, 66]);
        });
        break;
      case 11:
        this.party(FACE_PARTY, 0, -32);
        this.party(FACE_EVENT, 0, 32);
        this.bg('カメハウス');
        this.enemyFace(FACE_EVENT, 1);
        break;
      case 12:
        audio.playBgm('Z1 イベント2');
        se('Z1 ダメージ');
        this.party(FACE_PARTY, 0, -64);
        this.party(FACE_EVENT, 0, 0);
        this.party(FACE_EVENT, 1, 64);
        this.bg('海');
        this.stranger();
        break;
      case 13: // Raditz takes Gohan away
        se('Z1 飛ぶ');
        await this.animate(101, (x) => {
          this.party(FACE_PARTY, 0, -64);
          this.party(FACE_EVENT, 1, 64);
          this.scrollBg('スクロール_山', 512 - x * 4);
          this.add(EV('ラディッツとゴハン'), SCROLL_X + 224, SCENE_Y + 20, [0, 0, 64, 56]);
        });
        break;
      case 14:
        se('Z1 ダメージ');
        this.party(FACE_PARTY, 0, -64);
        this.party(FACE_EVENT, 1, 64);
        this.bg('カメハウス');
        this.enemyFace(FACE_PARTY, 1);
        break;
      case 15: // Goku and Piccolo set off together
        audio.playBgm('Z1 フィールド1');
        await this.animate(101, (x) => {
          this.party(FACE_PARTY, 0, -32);
          this.party(FACE_PARTY, 1, 32);
          this.scrollBg('スクロール_空', 512 - x * 4);
          this.add(EV('ゴクウとピッコロ'), SCROLL_X + 192, SCENE_Y + 10, [0, 0, 128, 80]);
        });
        break;
    }
  }

  async fadeTo(v, frames) {
    const from = this.fade;
    for (let i = 1; i <= frames && !this.ui.skipped; i++) { this.fade = from + ((v - from) * i) / frames; await this.ui.wait(1); }
    this.fade = v;
  }

  // the screen flash (white, fading out over `frames`), waiting for it like the event does
  async doFlash(frames) {
    for (let i = frames; i > 0 && !this.ui.skipped; i--) { this.flash = i / frames; await this.ui.wait(1); }
    this.flash = 0;
  }
}

// one message box: the face of whoever speaks, then the text typed out (\| waits 1 s, \. a quarter second, as in
// the original); a tap shows the rest at once, the next tap goes on
// (faceOf: whose face, when not the speaker's — the events' third field)
export async function say(ui, faces, [who, text, faceOf]) {
  const d = ui.dlg;
  const face = faces[faceOf || who];
  d.classList.toggle('no-face', !face);
  if (face) {
    const fc = d.querySelector('.face').getContext('2d');
    fc.clearRect(0, 0, 64, 64);
    const e = img(face[0]);
    const paint = () => e.ok && fc.drawImage(e.im, 64 * (face[2] || 0), face[1] * 64, 64, 64, 0, 0, 64, 64);
    if (e.ok) paint(); else e.p.then(paint);
  }
  d.querySelector('.who').textContent = who;
  const auto = text.includes('\\^'); // 「\^」: closes by itself once the text (and its waits) is out
  if (auto) text = text.replace(/\\\^/g, '');
  const out = d.querySelector('.text');
  out.textContent = '';
  d.hidden = false;
  d.classList.add('busy');
  let rush = false;
  ui.onTap = () => { rush = true; };
  let shown = '';
  for (let i = 0; i < text.length && !ui.skipped; i++) {
    if (text[i] === '\\' && (text[i + 1] === '|' || text[i + 1] === '.')) {
      if (!rush) await pause(ui, text[i + 1] === '|' ? 60 : 15, () => rush);
      i++;
      continue;
    }
    shown += text[i];
    out.textContent = shown;
    if (!rush) await pause(ui, 1, () => rush);
  }
  d.classList.remove('busy');
  if (!ui.skipped && !auto) await new Promise((res) => { ui.onTap = res; ui.onSkip.push(res); });
  ui.onTap = null;
}

// waits n frames, cut short by a tap (`done()`) or the skip button
async function pause(ui, frames, done) {
  for (let k = 0; k < frames && !done() && !ui.skipped; k += 3) await ui.wait(Math.min(3, frames - k));
}

// Plays the opening story of a new game; resolves when it ends or is skipped.
export async function playStory(world) {
  const { story, faces } = world.opening;
  const ui = overlay();
  await loadImages(STORY_PICS);
  const stage = new Stage(ui);
  for (const n of story) {
    if (ui.skipped) break;
    if (n.say) { await say(ui, faces, n.say); continue; }
    if (n.se) { audio.se(n.se, 80); continue; }
    ui.dlg.hidden = true;
    if (n.scene) await stage.scene(n.scene);
    else if (n.wait) await ui.wait(n.wait);
    else if (n.flash) await stage.doFlash(n.flash);
  }
  if (ui.skipped) audio.seStop();
  stage.running = false;
  ui.close();
}

