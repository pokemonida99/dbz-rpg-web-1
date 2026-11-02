// RPG Maker VX animations (Animations.rvdata) played on the map, as Sprite_Base#animation_set_sprites draws them:
// world.viz.anims[id] = { pics: [animation1, animation2], pos, frames: [[cell …] …] } (tools/build_viz.py), a cell =
// [pattern, x, y, zoom, angle, mirror, opacity, blend]. Each frame shows for 4 game frames; a cell is a 192×192 piece
// of its picture (pattern ≥ 100: the second one) with its middle on (x, y) from the anchor — the target's centre for
// position 1. Blend 1 adds, 2 subtracts.
import { img } from './core.js?v=20261102-2217';

export const animFrames = (a) => a.frames.length * 4;
export function drawAnim(c, a, t, x, y) {
  const fr = a && a.frames[Math.floor(t / 4)];
  if (!fr) return;
  for (const [pat, cx, cy, zoom, angle, mirror, op, blend] of fr) {
    const e = img(a.pics[pat >= 100 ? 1 : 0]), p = pat % 100;
    if (!e.ok) continue;
    const sx = (p % 5) * 192, sy = Math.floor(p / 5) * 192, sw = Math.min(192, e.im.width - sx), sh = Math.min(192, e.im.height - sy);
    if (sw <= 0 || sh <= 0) continue;
    c.save();
    c.translate(Math.round(x + cx), Math.round(y + cy));
    if (angle) c.rotate((-angle * Math.PI) / 180);
    c.scale(((mirror ? -1 : 1) * zoom) / 100, zoom / 100);
    c.globalAlpha = op / 255;
    c.globalCompositeOperation = blend === 1 ? 'lighter' : blend === 2 ? 'difference' : 'source-over';
    c.drawImage(e.im, sx, sy, sw, sh, -96, -96, sw, sh);
    c.restore();
  }
}
