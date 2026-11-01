// Field: free flight over the map, random encounters, the boss marker.
import { view, img, input, audio, rand } from './core.js?v=20261101-2130';
import { renderMap } from './tiles.js?v=20261101-2130';

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
    this.look = { x: 0, y: 0 }; // camera lead on road maps
    if (this.map.road != null || this.map.path) this.setupRoad(game.state);
  }

  // ---------- road maps (Snake Way, King Kai's planet): the player keeps to the road / squares ----------
  // The road is the passable tiles of one layer (world.maps[id].road = layer index), or the ground tiles listed in
  // world.maps[id].path (the training squares). Movement goes tile centre to tile centre along it; at a bend the
  // player turns by itself, at a fork the stick decides.
  setupRoad(s) {
    const { w, h, layers } = this.map, pas = this.world.passages;
    this.open = new Uint8Array(w * h);
    if (this.map.path) { for (let i = 0; i < w * h; i++) if (this.map.path.includes(layers[0][i])) this.open[i] = 1; }
    else { const L = layers[this.map.road]; for (let i = 0; i < w * h; i++) if (L[i] && !(pas[L[i]] & 1)) this.open[i] = 1; }
    if (this.map.oneWay) { // one-way roads (Snake Way): tiles closer to the start than the furthest reached are shut
      const [sx, sy] = this.map.oneWay;
      this.dist = new Int32Array(w * h).fill(-1);
      const q = [sx + sy * w];
      this.dist[q[0]] = 0;
      for (let k = 0; k < q.length; k++) {
        const i = q[k], x = i % w, y = Math.floor(i / w);
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const j = x + a + (y + b) * w;
          if (x + a >= 0 && x + a < w && y + b >= 0 && y + b < h && this.open[j] && this.dist[j] < 0) { this.dist[j] = this.dist[i] + 1; q.push(j); }
        }
      }
      this.far = 0;
    }
    if (!this.isOpen(Math.floor(s.x / 32), Math.floor(s.y / 32))) { // e.g. an old save made while flying freely
      let best = null, bd = Infinity;
      for (let i = 0; i < w * h; i++) {
        if (!this.open[i]) continue;
        const d = Math.hypot((i % w) * 32 + 16 - s.x, Math.floor(i / w) * 32 + 16 - s.y);
        if (d < bd) { bd = d; best = i; }
      }
      if (best != null) { s.x = (best % w) * 32 + 16; s.y = Math.floor(best / w) * 32 + 16; }
    }
    if (this.dist) this.far = Math.max(0, this.dist[Math.floor(s.x / 32) + Math.floor(s.y / 32) * w]); // the position is the progress
  }

  isOpen(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return false;
    const i = tx + ty * this.map.w;
    return this.open[i] === 1 && (!this.dist || this.dist[i] >= this.far);
  }

  // moves up to `step` px along the road; returns the distance moved
  roadMove(s, dx, dy, step) {
    let moved = 0;
    for (let guard = 0; guard < 4 && step - moved > 0.01; guard++) {
      const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32);
      const cx = tx * 32 + 16, cy = ty * 32 + 16;
      // candidate directions: the stick's main axis, then its other axis, then the only way on at a bend
      const want = Math.abs(dx) >= Math.abs(dy) ? [[Math.sign(dx), 0], [0, Math.sign(dy)]] : [[0, Math.sign(dy)], [Math.sign(dx), 0]];
      let cand = want.filter(([a, b]) => a || b);
      // where the road only goes on one way (a bend), keep following it unless the stick points back the way we came;
      // once following, holding the stick the same way keeps following the road (it may wind back towards the stick)
      const back = this.went || [0, 0];
      const exits = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => this.isOpen(tx + a, ty + b) && !(a === -back[0] && b === -back[1]));
      const l = Math.hypot(dx, dy) || 1;
      const f = this.follow;
      if (f && f[0] * dx / l + f[1] * dy / l < 0.9) this.follow = null;
      if (this.follow && (back[0] || back[1])) cand = [back, ...exits.length === 1 ? [exits[0]] : [], ...cand];
      else if (exits.length === 1 && -(dx * back[0] + dy * back[1]) / l < 0.7) cand.push(exits[0]);
      let go = null;
      for (const [a, b] of cand) {
        const along = a ? (s.x - cx) * a : (s.y - cy) * b; // how far past the centre in that direction
        if (this.isOpen(tx + a, ty + b) || along < -0.5) { go = [a, b]; break; }
      }
      if (!go) break;
      if (!want.some(([a, b]) => a === go[0] && b === go[1]) && !this.follow) this.follow = [dx / l, dy / l];
      const [a, b] = go;
      const rest = step - moved;
      // first line up with the centre across the way we go, then move along it
      const off = a ? s.y - cy : s.x - cx;
      const fix = Math.min(Math.abs(off), rest);
      if (a) s.y -= Math.sign(off) * fix; else s.x -= Math.sign(off) * fix;
      moved += fix;
      let r = step - moved;
      if (r <= 0.01) break;
      if (!this.isOpen(tx + a, ty + b)) r = Math.min(r, -(a ? (s.x - cx) * a : (s.y - cy) * b)); // stop at the centre
      else r = Math.min(r, 32); // one tile at a time, then look again
      if (r <= 0.01) break;
      s.x += a * r;
      s.y += b * r;
      moved += r;
      this.dir = a ? (a < 0 ? 1 : 2) : (b < 0 ? 3 : 0);
      this.went = go;
    }
    return moved;
  }

  walkable(px, py) {
    const tx = Math.floor(px / 32), ty = Math.floor(py / 32);
    if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return false;
    const id = this.map.layers[0][tx + ty * this.map.w];
    return id > 0 && (!this.map.path || this.map.path.includes(id)); // path maps (King Kai's planet): only these ground tiles
  }

  update(dt) {
    if (this.paused) return;
    const s = this.game.state;
    const { dx, dy } = input;
    const mag = Math.min(1, Math.hypot(dx, dy));
    if (mag > 0.05) {
      let step = SPEED * dt * (0.35 + 0.65 * mag);
      if (this.open) {
        step = this.roadMove(s, dx, dy, step);
        if (this.dist) this.far = Math.max(this.far, this.dist[Math.floor(s.x / 32) + Math.floor(s.y / 32) * this.map.w]);
      } else {
        const l = Math.hypot(dx, dy);
        const nx = s.x + (dx / l) * step, ny = s.y + (dy / l) * step;
        // slide along edges instead of stopping dead
        if (this.walkable(nx, s.y)) s.x = nx;
        if (this.walkable(s.x, ny)) s.y = ny;
        this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);
      }
      this.anim += dt * 6;
      s.travel += step;
      if (s.travel >= 32) {
        s.travel -= 32;
        this.game.onStep();
      }
    } else {
      this.anim += dt * 2; // idle hover
      this.follow = null;
    }
    if (this.open) { // road maps: the camera leads a little in the direction of travel
      const [lx, ly] = [[0, 1], [-1, 0], [1, 0], [0, -1]][this.dir];
      const k = Math.min(1, dt * 2.5);
      this.look.x += (lx * 60 - this.look.x) * k;
      this.look.y += (ly * 90 - this.look.y) * k;
    }
    // nearest interactive spot within reach
    let near = null, nd = 44;
    if (this.spent && Math.hypot(s.x - (this.spent.x * 32 + 16), s.y - (this.spent.y * 32 + 16)) >= 44) this.spent = null;
    for (const p of this.pois) {
      if (p.gone && s.sw[p.gone]) continue; // a beaten Pumpkin / Broccoli
      if (p === this.spent) continue; // a card / training square works once per visit, like landing on it
      const d = Math.hypot(s.x - (p.x * 32 + 16), s.y - (p.y * 32 + 16));
      if (d < nd) { nd = d; near = p; }
    }
    if (near !== this.near) { this.near = near; this.game.onNear(near); }
    // boss markers
    for (const b of this.bossList()) {
      if (Math.hypot(s.x - (b.x * 32 + 16), s.y - (b.y * 32 + 16)) < 44 && (!b.after || s.flags[b.after])) { this.game.onBoss(b); break; }
    }
  }

  draw() {
    const c = view.begin();
    const s = this.game.state;
    const W = this.map.w * 32, H = this.map.h * 32;
    // camera follows, clamped to the map (centred if the map is smaller than the screen)
    let cx = s.x + this.look.x - view.w / 2, cy = s.y + this.look.y - view.h * 0.45;
    if (this.cam) { cx = this.cam.x - view.w / 2; cy = this.cam.y - view.h / 2; } // 地圖 (src/fieldmenu.js mapView)
    cx = W <= view.w ? (W - view.w) / 2 : Math.max(0, Math.min(W - view.w, cx));
    cy = H <= view.h ? (H - view.h) / 2 : Math.max(-this.hudPad(), Math.min(H - view.h, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    c.fillStyle = '#000';
    c.fillRect(0, 0, view.w, view.h);
    c.drawImage(this.layers.ground, -cx, -cy);

    for (const b of this.bossList()) {
      const bi = img(b.sheet || BOSS); // (b.sheet: another enemy sheet, e.g. enemy5.png for the Willow fortress)
      if (!bi.ok) continue;
      const f = Math.floor(this.anim) % 3, k = b.index || 0; // enemy1.png: 4 characters a row, 3×4 frames each
      c.drawImage(bi.im, ((k % 4) * 3 + f) * 32, Math.floor(k / 4) * 128, 32, 32, b.x * 32 - cx, b.y * 32 - cy, 32, 32);
    }
    const fi = img(FLY);
    if (fi.ok) {
      const pat = [0, 1, 2, 1][Math.floor(this.anim) % 4];
      const bob = Math.round(Math.sin(this.anim * 1.3) * 1.5);
      const k = ((s.var && s.var[42]) || 3) - 3; // the leading character (actor id - 3), 4 a row like the VX sheets
      c.drawImage(fi.im, ((k % 4) * 3 + pat) * 48, (Math.floor(k / 4) * 4 + this.dir) * 48, 48, 48, Math.round(s.x - 24 - cx), Math.round(s.y - (this.map.path ? 28 : 36) - cy + bob), 48, 48); // on the squares: standing on them
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

  // how far the HUD's faces reach down the screen (art px): the camera may go that far above the map's top edge, so
  // the top rows stay in sight under three rows of faces (seven to nine members); measured now and then
  hudPad() {
    if (this.padAt && performance.now() - this.padAt < 500) return this.pad;
    this.padAt = performance.now();
    const p = document.querySelector('#hud:not([hidden]) .party');
    this.pad = p ? Math.max(0, Math.round(p.getBoundingClientRect().bottom / view.cssPerPx)) : 0;
    return this.pad;
  }

  // the bosses standing on this map, until beaten (world.bosses, by map: one or a list; flag = the state.flags entry
  // set on a win; after = a flag needed before this one can be fought)
  bossList() {
    const s = this.game.state;
    const b = (this.world.bosses || { 1: { ...this.world.boss, flag: 'bossDone' } })[s.map];
    return (Array.isArray(b) ? b : b ? [b] : []).filter((x) => !s.flags[x.flag]);
  }
  boss() { return this.bossList()[0] || null; }
  bosses() { return this.bossList(); } // (the name chapter 6 uses)

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
