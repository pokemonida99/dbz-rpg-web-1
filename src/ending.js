// The end of Z1, staged like the original (src/chapter6.js):
//  - playShenron(): map 117 Z1 シェンロン呼び出し — a parallel event shows the 550 pictures Z1_syenron/…_0000-0549 one
//    per frame over the music 'Z1 神龍', with the summoning sound at frame 50. Here the pictures are one animated WebP
//    (assets/film/shenron.webp, made by tools/copy_assets.py) shown full width.
//  - playZ1Ending(): Title_Anime z1_ed (all.rb 167746) — space, a glint, Vegeta's pod rising away from Earth, then
//    Frieza's face, until a tap. Drawn at its 640×480 size and fitted to the screen width, like the title animation.
// Both have the 略過 button of the other story scenes.
import { audio, loadImages, assetUrl } from './core.js?v=20261102-2217';
import { overlay, blt } from './opening.js?v=20261102-2217';

const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const FPS = 60;

export async function playShenron(world) {
  const sh = world.chapter6.shenron;
  const ui = overlay();
  ui.dlg.hidden = true;
  const im = new Image();
  im.alt = '';
  im.style.cssText = 'position:absolute;left:0;right:0;top:50%;width:100%;transform:translateY(-50%);image-rendering:pixelated;opacity:0;transition:opacity .5s';
  const loaded = new Promise((res) => { im.onload = res; im.onerror = res; });
  im.src = assetUrl(sh.film.replace(/^assets\//, ''));
  await Promise.race([loaded, ui.wait(600)]);
  if (!ui.skipped) {
    audio.playBgm(sh.bgm);
    ui.el.appendChild(im);
    requestAnimationFrame(() => { im.style.opacity = '1'; }); // Graphics.fadein(30)
    await ui.wait(sh.seAt);
    if (!ui.skipped) audio.se(sh.se, 80);
    await ui.wait(sh.frames - sh.seAt);
  }
  if (ui.skipped) audio.seStop();
  ui.close();
}

// z1_ed, frame by frame: one pass of its loop (picks the pictures for frame f, draws when `c` is given, f + 1)
class Z1Ed {
  constructor(P) {
    this.P = P;
    this.f = 0; // @animeframe
    this.bf = 0; // @backframe
    this.ff = 0; // @frizaframe
    this.back = P.ed[0];
    this.pod = null; // `picture`: kept from pass to pass like the original's local variable
    this.frieza = P.frieza[0];
  }

  frame(c) {
    const { P, f } = this;
    if (f === 8) this.back = P.ed[1];
    else if (f > 8) {
      if (this.bf === 0) this.back = P.ed[2];
      else if (this.bf === 16) this.back = P.ed[3];
      else if (this.bf === 32) { this.back = P.ed[2]; this.bf = 0; }
      this.bf++;
    }
    const k = f - 16; // hikaru_strat
    if (k >= 0 && k <= 12 && k % 4 === 0) this.pod = P.hikaru[k / 4]; // the glint
    else if (k >= 16 && k <= 88 && k % 8 === 0) { // the pod, big to small as it leaves
      if (k === 16) audio.se('Z1 落下', 80);
      this.pod = P.ship[9 - (k - 16) / 8];
    } else if (k === 112) this.pod = null;
    if (f > 200) {
      if (this.ff === 0) this.frieza = P.frieza[0];
      else if (this.ff === 480) this.frieza = P.frieza[1];
      else if (this.ff === 510) { this.frieza = P.frieza[0]; this.ff = 0; }
      this.ff++;
    }
    if (c) {
      c.fillStyle = '#000';
      c.fillRect(0, 0, 640, 480);
      blt(c, this.back, 0, 0, 640, 480);
      if (this.pod && f <= 200) {
        if (k < 17) blt(c, this.pod, 296, 310, 44, 44);
        else blt(c, this.pod, 256, 270 - (k - 16) * 4, 130, 110);
      }
      if (f > 200) blt(c, this.frieza, 0, 0, 640, 320);
    }
    this.f++;
  }
}

export async function playZ1Ending(world) {
  const names = world.chapter6.ending.pictures;
  const P = {
    ed: names.slice(0, 4).map(pic), frieza: names.slice(4).map(pic),
    hikaru: [1, 2, 3, 4].map((i) => pic(`z1_ophikaru${i}`)), ship: Array.from({ length: 10 }, (_, i) => pic(`z1_utyuusen${i + 1}`)),
  };
  const ui = overlay();
  ui.dlg.hidden = true;
  await loadImages([...P.ed, ...P.frieza, ...P.hikaru, ...P.ship]);
  const anime = new Z1Ed(P);
  const buf = document.createElement('canvas');
  buf.width = 640; buf.height = 480;
  const bc = buf.getContext('2d');
  const tap = document.createElement('div');
  tap.className = 'tap';
  tap.style.top = 'auto';
  tap.style.bottom = 'calc(var(--safe-b, 0px) + 18%)';
  tap.textContent = '點一下繼續';
  tap.hidden = true;
  ui.el.appendChild(tap);
  let ended = false;
  ui.onTap = () => { if (anime.f > 200) ended = true; }; // Input::C once Frieza is up
  const show = () => {
    const c = ui.fit();
    const W = c.canvas.width, H = c.canvas.height;
    const s = W / 640, dh = Math.round(480 * s);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    c.drawImage(buf, 0, Math.round((H - dh) / 2), W, dh);
  };
  // fade in (Graphics.fadein(30)), then one picture a frame until the tap
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0;background:#000;pointer-events:none;transition:opacity .5s;z-index:1';
  ui.el.appendChild(fade);
  anime.frame(bc);
  show();
  requestAnimationFrame(() => { fade.style.opacity = '0'; });
  let t0 = performance.now();
  while (!ended && !ui.skipped) {
    await ui.wait(1);
    const due = Math.floor(((performance.now() - t0) * FPS) / 1000);
    if (due - anime.f > 30) t0 = performance.now() - (anime.f * 1000) / FPS; // a stall (hidden tab): don't race
    while (anime.f < due - 1) anime.frame(null);
    anime.frame(bc);
    show();
    if (anime.f > 200) tap.hidden = false;
  }
  fade.style.opacity = '1'; // Graphics.fadeout(30)
  await new Promise((r) => setTimeout(r, 500));
  ui.close();
}
