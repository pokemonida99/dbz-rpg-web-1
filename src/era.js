// The art of the part of the story the save is in: the original picks its file names by $top_file_name /
// $btl_top_file_name ("Z1_", "Z2_" … from variable 40), so from Z2 on the party's faces, battle sheets and card icons
// are the Z2_ pictures. world.era[variable 40] = { Z1 path: its version for that part } (tools/build_z2a.py); core.js
// img() looks paths up there, so every screen that draws those pictures follows without knowing about it.
import { setImageAlias, loadImages } from './core.js?v=20261102-1344';

export function applyEra(game) {
  const v = ((game.state && game.state.var) || {})[40] || 0;
  const map = (game.world.era || {})[v] || {};
  setImageAlias(map);
  return loadImages(Object.values(map));
}
