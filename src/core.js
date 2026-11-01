// Shared runtime: canvas scaling, assets, input, audio, dialogue, toast.

export const VERSION = '20261101-1534'; // stamped by tools/bump.py on each deploy
export const ASSET_ROOT = 'assets/';
export const assetUrl = (p) => (ASSET_ROOT + p).split('/').map(encodeURIComponent).join('/');

// ---------- canvas: whole device pixels per art pixel so the pixel art stays crisp ----------
export const view = {
  canvas: document.getElementById('view'),
  ctx: null,
  w: 0, h: 0, scale: 1, // logical (art) pixels and device pixels per art pixel
  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const devW = Math.round(r.width * dpr), devH = Math.round(r.height * dpr);
    // aim for ~11-12 tiles across a phone screen
    this.scale = Math.max(1, Math.floor(devW / 360));
    c.width = devW;
    c.height = devH;
    this.w = devW / this.scale;
    this.h = devH / this.scale;
    this.ctx = c.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.cssPerPx = r.width / this.w;
  },
  begin() {
    const x = this.ctx;
    x.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    x.imageSmoothingEnabled = false;
    return x;
  },
};

// ---------- images ----------
const images = new Map();
export function img(path) {
  let e = images.get(path);
  if (!e) {
    const im = new Image();
    e = { im, ok: false, p: new Promise((res) => { im.onload = () => { e.ok = true; res(im); }; im.onerror = () => res(null); }) };
    im.src = assetUrl(path);
    images.set(path, e);
  }
  return e;
}
export const loadImages = (paths) => Promise.all(paths.map((p) => img(p).p));

// ---------- input: keyboard + one virtual stick + "confirm" taps ----------
export const input = {
  dx: 0, dy: 0, // movement vector, -1..1
  keys: new Set(),
  confirmQueued: false,
  stickTouch: null,
  stickEnabled: false,
  takeConfirm() { const c = this.confirmQueued; this.confirmQueued = false; return c; },
};
const stickEl = document.getElementById('stick');
const KEY_DIR = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
function keyVector() {
  let x = 0, y = 0;
  for (const k of input.keys) { const d = KEY_DIR[k]; if (d) { x += d[0]; y += d[1]; } }
  const l = Math.hypot(x, y);
  return l ? [x / l, y / l] : [0, 0];
}
window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (KEY_DIR[e.code]) { input.keys.add(e.code); [input.dx, input.dy] = keyVector(); e.preventDefault(); }
  if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') { input.confirmQueued = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  if (KEY_DIR[e.code]) { input.keys.delete(e.code); [input.dx, input.dy] = keyVector(); }
});
const appEl = document.getElementById('app');
appEl.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (!input.stickEnabled || input.stickTouch || e.target !== view.canvas) return;
  input.stickTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
  const r = appEl.getBoundingClientRect();
  stickEl.style.left = `${e.clientX - r.left}px`;
  stickEl.style.top = `${e.clientY - r.top}px`;
  stickEl.firstElementChild.style.transform = '';
  stickEl.hidden = false;
});
appEl.addEventListener('pointermove', (e) => {
  const t = input.stickTouch;
  if (!t || t.id !== e.pointerId) return;
  let dx = e.clientX - t.x, dy = e.clientY - t.y;
  const l = Math.hypot(dx, dy), max = 46;
  if (l > max) { dx *= max / l; dy *= max / l; }
  stickEl.firstElementChild.style.transform = `translate(${dx}px, ${dy}px)`;
  const dead = 8;
  if (l < dead) { input.dx = 0; input.dy = 0; } else { input.dx = dx / max; input.dy = dy / max; }
});
const endStick = (e) => {
  const t = input.stickTouch;
  if (!t || t.id !== e.pointerId) return;
  input.stickTouch = null;
  stickEl.hidden = true;
  [input.dx, input.dy] = keyVector();
};
appEl.addEventListener('pointerup', endStick);
appEl.addEventListener('pointercancel', endStick);
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
// iOS Safari still rubber-bands the page despite overflow:hidden; the game never scrolls, so stop it
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// ---------- audio (Web Audio; iOS needs a gesture before it will play) ----------
export const audio = {
  ctx: null, bufs: new Map(), bgm: null, bgmName: '',
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      if (this.wantBgm) this.playBgm(...this.wantBgm);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  buf(path) {
    let p = this.bufs.get(path);
    if (!p) {
      p = fetch(assetUrl(path)).then((r) => r.arrayBuffer()).then((b) => this.ctx.decodeAudioData(b)).catch(() => null);
      this.bufs.set(path, p);
    }
    return p;
  },
  async playBgm(name, vol = 70) {
    this.wantBgm = [name, vol];
    if (!this.ctx || this.bgmName === name) return;
    this.stopBgm();
    this.bgmName = name;
    const b = await this.buf(`Audio/BGM/${name}.ogg`);
    if (!b || this.bgmName !== name) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = Math.pow(vol / 100, 2);
    src.connect(g).connect(this.master);
    src.start();
    this.bgm = { src, g };
  },
  stopBgm() {
    if (this.bgm) { try { this.bgm.src.stop(); } catch (e) { /* stopped */ } }
    this.bgm = null;
    this.bgmName = '';
    this.wantBgm = null;
  },
  async se(name, vol = 80, pitch = 100) {
    if (!this.ctx) return;
    const b = await this.buf(`Audio/SE/${name}.ogg`);
    if (!b) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = pitch / 100;
    const g = this.ctx.createGain();
    g.gain.value = Math.pow(vol / 100, 2);
    src.connect(g).connect(this.master);
    src.start();
  },
};

// ---------- dialogue box: say(lines) resolves when the player has read them all ----------
const dlg = document.getElementById('dialog');
const dlgWho = dlg.querySelector('.who'), dlgText = dlg.querySelector('.text');
let dlgAdvance = null;
dlg.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (dlgAdvance) dlgAdvance(); });
window.addEventListener('keydown', (e) => {
  if (!dlg.hidden && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ')) { e.stopImmediatePropagation(); if (dlgAdvance) dlgAdvance(); }
}, true);

// lines: [[who, text], ...] or plain strings (narration)
export async function say(lines) {
  dlg.hidden = false;
  for (const line of lines) {
    const [who, text] = Array.isArray(line) ? line : ['', line];
    dlgWho.textContent = who;
    dlgText.textContent = '';
    dlg.classList.add('busy');
    // type the text out quickly; a tap shows it all at once
    let i = 0, skip = false;
    dlgAdvance = () => { skip = true; };
    await new Promise((res) => {
      const step = () => {
        if (skip) i = text.length; else i += 2;
        dlgText.textContent = text.slice(0, i);
        if (i >= text.length) res(); else setTimeout(step, 22);
      };
      step();
    });
    dlg.classList.remove('busy');
    await new Promise((res) => { dlgAdvance = res; });
  }
  dlgAdvance = null;
  dlg.hidden = true;
}

let toastTimer = 0;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (n) => Math.floor(Math.random() * n);
