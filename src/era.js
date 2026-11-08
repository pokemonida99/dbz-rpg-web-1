// The art of the part of the story the save is in: the original picks its file names by $top_file_name /
// $btl_top_file_name ("Z1_", "Z2_" … from variable 40), so from Z2 on the party's faces, battle sheets and card icons
// are the Z2_ pictures. world.era[variable 40] = { Z1 path: its version for that part } (tools/build_z2a.py); core.js
// img() looks paths up there, so every screen that draws those pictures follows without knowing about it.
// ZG (variable 43 151-200) has cards of its own (set_card_frame set 4, all.rb 14062): world.era.zg on top of era 2.
import { setImageAlias, loadImages } from './core.js?v=20261108-1751';
import { withCostume } from './costume.js?v=20261108-1751'; // the clothes' faces and battle sheets on top (換裝)

export const eraKey = (s) => {
  const v = ((s && s.var) || {})[40] || 0, v43 = ((s && s.var) || {})[43] || 0;
  return v >= 2 && v43 >= 151 && v43 <= 200 ? 'zg' : String(v);
};
// ---------- the window skin ($skin_kanri: set_skn → chk_scenario_progress mode 1, all.rb 13843 / 20355) ----------
// Z1 and Z2 share one skin; Z3 (and Z4, variable 40 = 2) has its own — pink-orange ground, round corners, the orange
// ▼ (set_tate_cursor_blink 13352: アイコン cells 16 / 18); ZG (variable 43 151-200, or variable 40 = 3) the framed one.
// The border pictures are cut from <era>_Window.png by tools/copy_assets.py. The pages' CSS reads --frame, --frame-k,
// --cream and --cream-hi; canvas screens read `skin` (src/battle.js win / cursor) or the 'ui/frame.png' alias.
const SKINS = {
  z1: { frame: 'ui/frame.png', k: 8, cream: '#ffd8a0', css: '#f6d7a0', hi: '#fbe6bf', cur: [12, 14] },
  z3: { frame: 'ui/frame_z3.png', k: 8, cream: '#ffc8b8', css: '#ffc8b8', hi: '#ffded3', cur: [16, 18] },
  zg: { frame: 'ui/frame_zg.png', k: 16, cream: '#ffc8b8', css: '#ffc8b8', hi: '#ffded3', cur: [24, 26] },
};
export const skin = { key: 'z1', ...SKINS.z1 };
export const skinOf = (s) => { const k = eraKey(s); return k === 'zg' || k === '3' ? 'zg' : k === '2' ? 'z3' : 'z1'; };
export function setSkin(key) {
  Object.assign(skin, { key }, SKINS[key] || SKINS.z1);
  const r = document.documentElement.style, url = new URL(`assets/${skin.frame}`, document.baseURI).href;
  r.setProperty('--frame', `url("${url}")`); // (absolute: the pages' own <style> blocks resolve against the page)
  r.setProperty('--frame-k', String(skin.k));
  r.setProperty('--cream', skin.css);
  r.setProperty('--cream-hi', skin.hi);
  document.documentElement.dataset.skin = skin.key;
}
setSkin('z1');

export function applyEra(game) {
  const v = ((game.state && game.state.var) || {})[40] || 0, era = game.world.era || {};
  setSkin(skinOf(game.state));
  const map = { ...(era[v] || {}), ...(eraKey(game.state) === 'zg' ? era.zg || {} : {}) };
  if (skin.key !== 'z1') map['ui/frame.png'] = skin.frame;
  const all = withCostume(game, map);
  setImageAlias(all);
  return loadImages(Object.values(all));
}
