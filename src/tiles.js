// RPG Maker VX tilemap drawing (A1–A5 autotiles and B–E sheets), rendered once into layer canvases.
import { img } from './core.js?v=20261104-0709';

const FLOOR = [
  [[2,4],[1,4],[2,3],[1,3]],[[2,0],[1,4],[2,3],[1,3]],[[2,4],[3,0],[2,3],[1,3]],[[2,0],[3,0],[2,3],[1,3]],
  [[2,4],[1,4],[2,3],[3,1]],[[2,0],[1,4],[2,3],[3,1]],[[2,4],[3,0],[2,3],[3,1]],[[2,0],[3,0],[2,3],[3,1]],
  [[2,4],[1,4],[2,1],[1,3]],[[2,0],[1,4],[2,1],[1,3]],[[2,4],[3,0],[2,1],[1,3]],[[2,0],[3,0],[2,1],[1,3]],
  [[2,4],[1,4],[2,1],[3,1]],[[2,0],[1,4],[2,1],[3,1]],[[2,4],[3,0],[2,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],
  [[0,4],[1,4],[0,3],[1,3]],[[0,4],[3,0],[0,3],[1,3]],[[0,4],[1,4],[0,3],[3,1]],[[0,4],[3,0],[0,3],[3,1]],
  [[2,2],[1,2],[2,3],[1,3]],[[2,2],[1,2],[2,3],[3,1]],[[2,2],[1,2],[2,1],[1,3]],[[2,2],[1,2],[2,1],[3,1]],
  [[2,4],[3,4],[2,3],[3,3]],[[2,4],[3,4],[2,1],[3,3]],[[2,0],[3,4],[2,3],[3,3]],[[2,0],[3,4],[2,1],[3,3]],
  [[2,4],[1,4],[2,5],[1,5]],[[2,0],[1,4],[2,5],[1,5]],[[2,4],[3,0],[2,5],[1,5]],[[2,0],[3,0],[2,5],[1,5]],
  [[0,4],[3,4],[0,3],[3,3]],[[2,2],[1,2],[2,5],[1,5]],[[0,2],[1,2],[0,3],[1,3]],[[0,2],[1,2],[0,3],[3,1]],
  [[2,2],[3,2],[2,3],[3,3]],[[2,2],[3,2],[2,1],[3,3]],[[2,4],[3,4],[2,5],[3,5]],[[2,0],[3,4],[2,5],[3,5]],
  [[0,4],[1,4],[0,5],[1,5]],[[0,4],[3,0],[0,5],[1,5]],[[0,2],[3,2],[0,3],[3,3]],[[0,2],[1,2],[0,5],[1,5]],
  [[0,4],[3,4],[0,5],[3,5]],[[2,2],[3,2],[2,5],[3,5]],[[0,2],[3,2],[0,5],[3,5]],[[0,0],[1,0],[0,1],[1,1]],
];
const WALL = [
  [[2,2],[1,2],[2,1],[1,1]],[[0,2],[1,2],[0,1],[1,1]],[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],
  [[2,2],[3,2],[2,1],[3,1]],[[0,2],[3,2],[0,1],[3,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]],
  [[2,2],[1,2],[2,3],[1,3]],[[0,2],[1,2],[0,3],[1,3]],[[2,0],[1,0],[2,3],[1,3]],[[0,0],[1,0],[0,3],[1,3]],
  [[2,2],[3,2],[2,3],[3,3]],[[0,2],[3,2],[0,3],[3,3]],[[2,0],[3,0],[2,3],[3,3]],[[0,0],[3,0],[0,3],[3,3]],
];
const FALL = [[[2,0],[1,0],[2,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[2,0],[3,0],[2,1],[3,1]],[[0,0],[3,0],[0,1],[3,1]]];

const SHEETS = ['TileA1', 'TileA2', 'TileA3', 'TileA4', 'TileA5', 'TileB', 'TileC', 'TileD', 'TileE'];
export const tileSheetPaths = SHEETS.map((n) => `Graphics/System/${n}.png`);

export function drawTile(c, bm, id, dx, dy, anim) {
  if (id < 1024) {
    const src = bm[5 + (id >> 8)];
    const t = id & 255;
    if (src) c.drawImage(src, ((t % 8) + (t >> 7) * 8) * 32, ((t >> 3) % 16) * 32, 32, 32, dx, dy, 32, 32);
    return;
  }
  if (id >= 1536 && id < 2048) {
    const t = id - 1536;
    if (bm[4]) c.drawImage(bm[4], (t % 8) * 32, (t >> 3) * 32, 32, 32, dx, dy, 32, 32);
    return;
  }
  if (id < 2048) return;
  let table = FLOOR;
  const kind = ((id - 2048) / 48) | 0, shape = (id - 2048) % 48;
  const tx = kind % 8, ty = (kind / 8) | 0;
  let bx = 0, by = 0, set = 0;
  if (id < 2816) {
    const wi = [0, 1, 2, 1][anim % 4];
    if (kind === 0) { bx = wi * 2; by = 0; } else if (kind === 1) { bx = wi * 2; by = 3; }
    else if (kind === 2) { bx = 6; by = 0; } else if (kind === 3) { bx = 6; by = 3; }
    else {
      bx = ((tx / 4) | 0) * 8;
      by = ty * 6 + (((tx / 2) | 0) % 2) * 3;
      if (kind % 2 === 0) bx += wi * 2; else { bx += 6; table = FALL; by += anim % 3; }
    }
  } else if (id < 4352) { set = 1; bx = tx * 2; by = (ty - 2) * 3; }
  else if (id < 5888) { set = 2; bx = tx * 2; by = (ty - 6) * 2; table = WALL; }
  else { set = 3; bx = tx * 2; by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0)); if (ty % 2 === 1) table = WALL; }
  const q = table[shape], src = bm[set];
  if (!q || !src) return;
  for (let i = 0; i < 4; i++) {
    c.drawImage(src, (bx * 2 + q[i][0]) * 16, (by * 2 + q[i][1]) * 16, 16, 16, dx + (i % 2) * 16, dy + (i >> 1) * 16, 16, 16);
  }
}

// Renders the map into a ground canvas and an "above characters" canvas (☆ tiles).
export function renderMap(map, passages) {
  const bm = tileSheetPaths.map((p) => { const e = img(p); return e.ok ? e.im : null; });
  const W = map.w * 32, H = map.h * 32;
  const ground = mkCanvas(W, H), upper = mkCanvas(W, H);
  const g = ground.getContext('2d'), u = upper.getContext('2d');
  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const id = map.layers[z][x + y * map.w];
        if (id <= 0) continue;
        drawTile(passages[id] & 0x10 ? u : g, bm, id, x * 32, y * 32, 0);
      }
    }
  }
  return { ground, upper };
}

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
