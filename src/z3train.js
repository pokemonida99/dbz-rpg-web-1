// Z3's training mini-games, ported from the original (docs/z3-plan.md):
//   流派一致修行  Scene_Db_Ryuha_Pair_Training (all.rb #118; z1field 1302 / 1304 / 1306: Goku, Piccolo, Gohan; CE40
//                流派一致修行用カード生成 makes its cards)
//   Z3 重力修行   Scene_Db_Z3_Gravity_Training (all.rb #115; z1field 1308: Vegeta under 300× gravity)
// Chapter 4 (src/z3d.js) calls them. (Placeholder from the shared Z3 base: the mini-games' branch fills it in; until
// then they end at once as if cleared.)

// resolves when the mini-game is over: { cleared: boolean } (and whatever the port adds)
export async function ryuhaPairTraining(game, opts = {}) { void game; void opts; return { cleared: true }; }
export async function z3GravityTraining(game, opts = {}) { void game; void opts; return { cleared: true }; }
