# Z3／Z4 敵人招式的戰鬥動畫（E 組 aen2）

檔案：`src/anime_foes_z34.js`（`src/main.js` 最後一行 import），共用片用 E 組共用檔 `src/anime_foes_common.js`（aen3 寫、四組原封不動複製），照原版 `research/all.rb` 的 Scene_Db_Battle_Anime 逐格移植，原版圖與音效。
跳關：`?dev=aen2`（Z3 存檔，悟空・雅木茶・悟飯・貝吉塔 Lv60，對弗利薩・古拉・金屬古拉）、`?dev=aen2-127-128-129`（對指定的敵人編號）。
戰鬥中在主控台 `aen2Use(i, 技能編號)` 讓第 i 個敵人立刻用那一招（走 `src/battle.js` 的 `enemyAct`，和回合中一樣），`aen2Heal()` 補滿雙方。

## 原版規則

- 敵人招式的 attack pattern ＝ 技能編號 +10，和我方同一個 Z3 分歧（all.rb 59742「when 2 #Z3」，Z3、Z4、ZG 都走這段）。
- 大部分敵人共用幾個片，依 `@enedatenum`（敵人編號）決定光束位置。這幾個片（2431／2494／2498／2499／2495／2493）用 `src/anime_foes_common.js` 的 feWave／feWaves／feBlast／feBigWave／feDeathBall／feCutter，本檔只 `feRegister` 登記技能。我原本也寫了一份（e2Wave 等），和共用檔逐片比過片長完全一樣，為了不重複已刪掉，改用共用檔。
- 打全體的招式（連續能量波、爆發波）在 `src/battle.js` 是每個目標各播一片；第 2 片以後就是原版的 `@all_attack_count >= 2`（不播 31／32、直接短片），由共用檔處理（共用檔第四版包了 `Battle.prototype.enemyAct`，記同一次出手的第幾片）。

| 片名 | 原版 pattern | 用到的技能（敵人） | 傷害 | 32 之前的設定 |
|---|---|---|---|---|
| feWave（共用檔） | 2431 (敵汎用)エネルギー波 | 385～391、396、408、412、416、420、424、428、434、439、445、471、476、481、484 | 23 | 無 cut-in |
| feWaves（共用檔） | 2494 連続エネルギー波（全體） | 394、402、404、406、411、415、417、421、425、429、435、440、446、456、618、619、620 | 23 | cut-in |
| feBigWave（共用檔） | 2499 強力エネルギー波 | 399、409、413、422、450～454、472、477、482、485 | 23 | cut-in、小背景條 |
| feBlast（共用檔） | 2498 爆発波（全體） | 398、442、478 | 23 | cut-in |
| feDeathBall（共用檔） | 2495 デスボールとスーパーノヴァ | 395、400 | 41 | cut-in、直條背景（back_no 1） |
| feCutter（共用檔） | 2493 フリーザカッター | 393 | 23 | cut-in、右上／左下角（back_no 3） |
| e2Rain | 2501 マシーナリーレイン | 401 | 41 | cut-in、小背景條 |
| e2Bind | 2503 ネイズバインドウェーブ | 403 | 73（痺れ） | cut-in |
| e2Rush | 2505 ドーレテリブルラッシュ | 405 | 23 | cut-in |
| e2Sword | 2272 剣攻撃（特蘭克斯共用） | 407 | 22 | 無 cut-in |
| e2Blade | 2552 サウザーブレードスラッシュ | 452 | 22 | cut-in |
| e2Drain | 2510 ドレインライフ | 410、414、433 | 22 | cut-in |
| e2Kame | 2530 カメハメ波(セル1) | 430、436、441、447 | 23 | 無 cut-in |
| e2Makanko | 2531 魔貫光殺砲(セル1) | 431、448 | 23 | 無 cut-in（片中途才開） |
| e2BigBang | 2537 ビッグバンアタック(セル２) | 437 | 41 | cut-in、紅色背景條 |
| e2SuperKame | 2544 スーパーカメハメ波(セル) | 444 | 42 | cut-in |
| e2Assassin | 2573 サイレントアサシン13 | 473 | 22 | cut-in |
| e2Assault | 2574 デッドリィアサルト | 474 | 23 | cut-in |
| e2Bomber | 2575 13号 SSデッドリィボンバー | 475 | 41 | cut-in、直條背景 |
| e2Bomber2 | 2579 合体13号 SSデッドリィボンバー | 479 | 41 | cut-in、直條背景 |
| e2FullBomber | 2580 合体13号 フルパワーSSデッドリィボンバー | 480 | 42 | cut-in |
| e2Charge14 | 2583 アンドロイドチャージ14 | 483 | 22（ZG 打撃4） | cut-in |
| e2Strike15 | 2586 アンドロイドストライク15 | 486 | 22（ZG 打撃4） | cut-in |

## 寫法

- 每個片照原版的 `case @battle_anime_frame` 寫成一個 body（`r.f` 是 `@battle_anime_frame`），引擎 `Run` 保留原版的計數器：effect（`@effect_anime_frame／type`）、ray、back；`@ax` 每格對敵人鏡像（原版 `output_battle_anime` 的 `@ax = -@ax`），`@gx／@gy` 不鏡像並且一直生效到被改掉為止；`battle_anime_change 0, n` 配 `@output_anime_type`（0 普通圖、1 必殺技圖）。body 裡自己 blt 的圖畫在角色後面，effect_pattern 畫在前面。
- 背景條、cut-in、pattern 32 用 `src/anime_goku_gohan.js` 的 stage（`agStage`），沒有另寫一份。那個檔改了兩處：`across()` 支援負的捲動量、`tecBack()` 在 `st.rev` 時橫條反方向捲（原版敵人出招時 `@tec_back += …`）；對我方的片沒有影響。敵人側 cut-in 一開始是敵人的列（`@chr_cutin_mirror_flag` false），`set_chr_display_out` 後換成我方。
- `src/anime_androids.js` 只加一行 export（`andaAt`、`AndaGather`、`andaShake`），本檔用同一套 blt／抖動。
- 本檔自己的片仍跑在 `agStage` 上（`Run` 引擎）；共用檔有自己的 FeStage，兩者並存（之後可把本檔的片改寫到 FeStage 上收成一套）。
- 傷害 22／23／73 用 `src/anime.js`；41／42（effect 102／103）在敵人側的位置（x 230／204）寫在本檔 `e2End`；13・14・15 號的 `@tec_kyouda_se` 讓 22 改播「ZG 打撃4」。
- 各章檔案（`src/z4d.js` 等）原本給這些技能借用的舊片沒刪，本檔較晚載入會蓋過去。

## 和原版不同

- 敵人出招時原版是敵人畫在我方上面，重製版共用的 `render()` 固定我方在上（兩人重疊的幾格看得出來，例如德雷恐怖連擊、15 號打擊）。
- 我方是巨大角色（`$cha_bigsize_on`，大猿）時原版有另一種衝擊波背景與光束，這裡沒做。
- `$game_switches[463]` 的爆炸種類變化沒做（和 `src/anime.js` 一樣）。
- RGSS 來源框超出圖片時，照 canvas 的做法（裁掉並平移目的地）；超級龜派氣功、大光束伸長的那幾格會用到。
- 手機只顯示 640 舞台中間一段（和其他招式一樣），金屬古拉兩個分身剛飛進來、13 號（合體）特寫左邊的巨大死亡球會被裁掉一部分。
- 弗利薩 392、古拉／金屬古拉 397 的「超能力」（pattern 2492）不在本分工清單內，仍播原本的 `psychic`。

## 測試（2026-11-03）

改用共用檔後重測：弗利薩 391／393／394／395、古拉 398／399／400、賽魯完全體 444、13 號 473 在戰鬥中各出一次，片長和改之前一樣，打全體的第 2～4 個目標走短片，主控台無錯誤；共用檔用到的 25 張圖已複製進 assets/。以下是改之前的完整測試：

390×844、375×667、`&timer`；79 招都用 `aen2Use` 讓對應的敵人在戰鬥中各出一次（`enemyAct` 的正常流程），每招片長、命中扣血、主控台皆正常；打全體的招式確認第 1 個目標整段、第 2～4 個目標走短片；重點幾格（集氣、特寫、發射、切到我方、命中）逐格截圖。20 號對雅木茶的吸取生命有原版的額外光束；賽魯第二形態大爆炸攻擊的紅色角落背景條、完全體超級龜派氣功的特寫與反向光線、13 號（合體）全力 SS 致命炸彈的特寫都有。另外按「自動」跑完一個正常回合（賽魯完全體自己選了龜派氣功、19 號強力能量波）。本檔 39 張圖、37 個音效全部 200，主控台無錯誤。沒做：用經典版實際跑原版逐格比對（對照的是原版程式碼）。

## 2026-11-08 修正（docs/z3-audit-foes.md A～D）

都改在 `src/anime_foes_z34.js`，沒動 `src/anime.js` 的 Z1 片（Z1 敵人照舊用）。

- **專屬片 cut-in 順序**：`syncStage` 的 `st.mirror` 原本寫成 `!e.mir`，和 stage 的意思（`st.mirror` ＝ `@chr_cutin_mirror_flag`，false 時畫敵人列）相反，所以 32 時先畫我方的臉、切到我方後才換敵人。改成 `!!e.mir` 後，401、403、405、410、414、431、433、437、444、448、452、473～475、479、480、483、486 都是先畫敵人、set_chr_display_out 後才換我方；405、452 片中沒有 display_out，整段都是敵人。
- **Z3 敵人還在用的 Z1 片**：敵人編號 ≥101 時，原版一律走 Z3 分歧（all.rb 54627／59742），就算 pattern 是 Z1 那批片也一樣。新段落「the first films a Z3 enemy still plays」把 21 個 Z1 片（gingerWave、nikkiBigWave、swordAttack、sanshoWave、sanshoBigWave、garlicBall、garlicBigWave、giantWave、blackHole／blackHoleAgain、paralysis、shockwave、kishimeWhip、ebiIce、misoStretch、misoWave、misoBigWave、willowWave、photonStrike、willowMouth、gigantic、planetGeyser／geyserAgain）包一層，只對這些敵人起作用：
  - 圖：在這段片自己的 canvas 上把 `Z1_` 效果圖換成 `Z3_`（`$btl_top_file_name`），黑洞波的 back 13 換成 `Z3_…気を溜める10`；原版寫死 `Z1_` 的 back 4 集氣（`気を溜める`／`(緑)`／`(青)`）和 `突進(ウィロー)` 不換。Z3 圖還沒載好的那一格不畫（不會閃 Z1 圖）。
  - 303 溶解液：播成 403（藍色 `エネルギー弾(青)`、`エネルギー液(青)`），不再是 401 痺れ液的黃色。
  - 背景條、cut-in：用 `src/anime_goku_gohan.js` 的 `agBase`，32 第 30 格起依 Z3 分歧的 `@tec_output_back_no`／`@tec_back_small`／`@chr_cutin_flag`（`OLD` 表，附 all.rb 行號）。
  - 切到我方那一格（我方被放到畫面中央時）照原版：407／408／424～429 橫條改回 no 0；409、559、563、1101 背景條消失；430 一開片背景條就消失；只有 559／562／563／690／1101 有 set_chr_display_out，cut-in 才換成我方，其他維持敵人。
  - 408／409 第 1～60 格集氣用第 11 格姿勢；559／563 不畫殘影（原版只有 `$btl_progress == 0` 才畫）。
  - 黑洞波、行星噴發的第 2 個以後目標（沒有 31／32）：背景條與 cut-in 直接接上第一個目標結束時的狀態。
- 範圍：卡里克一夥「強」181～188 的 307～309、321～326、328～330；金科人、栽培人(改)系的 301～303；威洛一夥「強」208～211 的 459、462～465、586～590；超特蘭克斯 134 的 1（衝擊波）。
- 素材：6 張 `Z3_` 圖從經典版 `game/Graphics/Pictures` 手動複製進 `assets/Graphics/Pictures`（`エネルギー波`、`エネルギー波_中(桃)`、`エネルギー弾_敵`、`エネルギー波_敵_大`、`気を溜める7`、`気を溜める8`）；本檔的 `pic('…')` 也列了它們，之後跑 `tools/copy_assets.py` 會一起收。
- 測試：`?dev=aen2-…` 的 `aen2Use` 逐招實播（含 Z1 敵人 3、9、13 對照，照舊是 Z1 片、無背景條），攔 `drawImage` 確認只剩原版本來就寫死的 `Z1_`／`Z2_`（back 4 集氣、突進(ウィロー)、13 號(合體) 480 的 `Z2_…デスボール(極大玉)_反転`），主控台 0 錯誤。
- 沒做：176 栽培人(改) 304 自爆原版 Z3 分歧是 31 → 32（cut-in）→ 404，重製版各時期都直接衝過去、沒有 31／32，這次沒改；562 冰結攻擊原版還有 back 101（`気を溜める3(青)`），重製版的 Z1 片本來就沒畫，也沒補。
- 更正：上面「和原版不同」說 392／397 超能力仍播舊的 psychic，現在已由 `src/laps_arena.js` 登記成 2492 的片。
