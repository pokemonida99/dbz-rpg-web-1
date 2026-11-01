// Field: free flight over the map, random encounters, the boss marker.
import { view, img, input, audio, rand } from './core.js?v=20261101-1909';
import { renderMap } from './tiles.js?v=20261101-1909';

const SPEED = 150; // art pixels per second (~4.7 tiles/s)
const FLY = 'Graphics/Characters/chara_fly1.png'; // 48×48 frames, Goku = character 0
const BOSS = 'Graphics/Characters/enemy1.png'; // 32×32 frames, Raditz = character 0
export const fieldImages = [FLY, BOSS];

export class Field {
  constructor(world, game) {
    this.world = world;
    this.game = game;
    this.map = world.maps[game.state.map];
    this.layers = renderMap(this.map, world.passages);
    this.anim = 0;
    this.dir = 0; // 0 down 1 left 2 right 3 up (VX sheet row order)
    this.paused = false;
    this.pois = world.pois[game.state.map] || [];
    this.near = null; // the interactive spot the player is next to
  }

  walkable(px, py) {
    const tx = Math.floor(px / 32), ty = Math.floor(py / 32);
    if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return false;
    const id = this.map.layers[0][tx + ty * this.map.w];
    return id > 0 && (!this.map.road || this.map.road.includes(id)); // road maps: only the path's tiles (world.maps[id].road)
  }

  update(dt) {
    if (this.paused) return;
    const s = this.game.state;
    const { dx, dy } = input;
    const mag = Math.min(1, Math.hypot(dx, dy));
    if (mag > 0.05) {
      const step = SPEED * dt * (0.35 + 0.65 * mag);
      const l = Math.hypot(dx, dy);
      const nx = s.x + (dx / l) * step, ny = s.y + (dy / l) * step;
      // slide along edges instead of stopping dead
      if (this.walkable(nx, s.y)) s.x = nx;
      if (this.walkable(s.x, ny)) s.y = ny;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
      this.anim += dt * 6;
      s.travel += step;
      if (s.travel >= 32) {
        s.travel -= 32;
        this.game.onStep();
      }
    } else {
      this.anim += dt * 2; // idle hover
    }
    // nearest interactive spot within reach
    let near = null, nd = 44;
    for (const p of this.pois) {
      if (p.gone && s.sw[p.gone]) continue; // a beaten Pumpkin / Broccoli
      const d = Math.hypot(s.x - (p.x * 32 + 16), s.y - (p.y * 32 + 16));
      if (d < nd) { nd = d; near = p; }
    }
    if (near !== this.near) { this.near = near; this.game.onNear(near); }
    // boss marker
    const b = this.boss();
    if (b && Math.hypot(s.x - (b.x * 32 + 16), s.y - (b.y * 32 + 16)) < 44) this.game.onBoss();
  }

  draw() {
    const c = view.begin();
    const s = this.game.state;
    const W = this.map.w * 32, H = this.map.h * 32;
    // camera follows, clamped to the map (centred if the map is smaller than the screen)
    let cx = s.x - view.w / 2, cy = s.y - view.h * 0.45;
    if (this.cam) { cx = this.cam.x - view.w / 2; cy = this.cam.y - view.h / 2; } // 地圖 (src/fieldmenu.js mapView)
    cx = W <= view.w ? (W - view.w) / 2 : Math.max(0, Math.min(W - view.w, cx));
    cy = H <= view.h ? (H - view.h) / 2 : Math.max(0, Math.min(H - view.h, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    c.fillStyle = '#000';
    c.fillRect(0, 0, view.w, view.h);
    c.drawImage(this.layers.ground, -cx, -cy);

    const b = this.boss();
    const bi = img(BOSS);
    if (b && bi.ok) {
      const f = Math.floor(this.anim) % 3, k = b.index || 0; // enemy1.png: 4 characters a row, 3×4 frames each
      c.drawImage(bi.im, ((k % 4) * 3 + f) * 32, Math.floor(k / 4) * 128, 32, 32, b.x * 32 - cx, b.y * 32 - cy, 32, 32);
    }
    const fi = img(FLY);
    if (fi.ok) {
      const pat = [0, 1, 2, 1][Math.floor(this.anim) % 4];
      const bob = Math.round(Math.sin(this.anim * 1.3) * 1.5);
      const k = ((s.var && s.var[42]) || 3) - 3; // the leading character (actor id - 3), 4 a row like the VX sheets
      c.drawImage(fi.im, ((k % 4) * 3 + pat) * 48, (Math.floor(k / 4) * 4 + this.dir) * 48, 48, 48, Math.round(s.x - 24 - cx), Math.round(s.y - 36 - cy + bob), 48, 48);
    }
    c.drawImage(this.layers.upper, -cx, -cy);
    if (this.near) { // "!" over the player's head
      const bx = Math.round(s.x - cx), by = Math.round(s.y - 46 - cy + Math.sin(this.anim * 3) * 2);
      c.fillStyle = '#fff';
      c.fillRect(bx - 8, by - 10, 16, 18);
      c.fillStyle = '#d0480c';
      c.fillRect(bx - 2, by - 7, 4, 8);
      c.fillRect(bx - 2, by + 3, 4, 3);
    }
  }

  // the boss standing on this map, until beaten (world.bosses, by map; flag = the state.flags entry set on a win)
  boss() {
    const s = this.game.state;
    const b = (this.world.bosses || { 1: { ...this.world.boss, flag: 'bossDone' } })[s.map];
    return b && !s.flags[b.flag] ? b : null;
  }

  enter() {
    input.stickEnabled = true;
    audio.playBgm(this.map.bgm);
  }

  leave() {
    this.near = null;
    this.game.onNear(null);
    input.stickEnabled = false;
    input.dx = input.dy = 0;
  }
}

export const nextEncounterSteps = () => 12 + rand(14);
