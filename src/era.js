// The art of the part of the story the save is in: the original picks its file names by $top_file_name /
// $btl_top_file_name ("Z1_", "Z2_" … from variable 40), so from Z2 on the party's faces, battle sheets and card icons
// are the Z2_ pictures. world.era[variable 40] = { Z1 path: its version for that part } (tools/build_z2a.py); core.js
// img() looks paths up there, so every screen that draws those pictures follows without knowing about it.
// ZG (variable 43 151-200) has cards of its own (set_card_frame set 4, all.rb 14062): world.era.zg on top of era 2.
import { setImageAlias, loadImages } from './core.js?v=20261107-2255';
import { withCostume } from './costume.js?v=20261107-2255'; // the clothes' faces and battle sheets on top (換裝)

export const eraKey = (s) => {
  const v = ((s && s.var) || {})[40] || 0, v43 = ((s && s.var) || {})[43] || 0;
  return v >= 2 && v43 >= 151 && v43 <= 200 ? 'zg' : String(v);
};
export function applyEra(game) {
  const v = ((game.state && game.state.var) || {})[40] || 0, era = game.world.era || {};
  const map = { ...(era[v] || {}), ...(eraKey(game.state) === 'zg' ? era.zg || {} : {}) };
  const all = withCostume(game, map);
  setImageAlias(all);
  return loadImages(Object.values(all));
}
