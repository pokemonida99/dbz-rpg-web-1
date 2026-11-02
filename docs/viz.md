# batch2 viz：畫面表現的小缺口

程式：`src/viz.js`（戰鬥的技能名框、掩護過場、大猿頭像、時代卡面的切換、跳關）、`src/vxanim.js`（地圖上的 RPG Maker 動畫）、
`tools/build_viz.py`（資料與圖：`world.viz`、`world.era` 的卡面、地圖 1／90 的事件）。其餘是各檔案裡的小改動（下面列出）。

> 開發用跳關（加 `&timer`）：`?dev=viz`（Z1：悟空 鋼鐵之拳1＋激怒、悟飯 最終決戰、比克 金縛術1、克林 Z戰士的羈絆1，帶著閻魔王、牛魔王、琪琪、烏龍、古雷格利、
> 波倫加、任意卡、快速龍、外星人、月亮和尾巴）、`vizcover`（悟空 HP 1、克林 掩護9）、`vizz3`／`vizzg`（同上，Z3／ZG 的卡面）、`vizpod`（地圖 36 太空船降落）、
> `vizpod1`（地圖 1 拉蒂茲旁的「たすけて!」）、`vizfusion`（z1field 1384）、`vizpirate`（地圖 108 海盜船）、`vizhatch`（CE94 哈奇亞克登場）。

## 1. 發動技能的名稱框（output_runskill，all.rb 54324）
- 原版把發動的被動技能放進 `$tmp_run_skill`（`set_damage_add` 14356，每次計算傷害清空）、`$tmp_run_hit_skill`（`get_attack_hit_skill` 17111）、
  `$tmp_run_kabau_skill`（掩護），在戰鬥影片的前 60 格從左邊滑進來（每格 32 px，第 y 個從 −240 − 48y 開始），最多 3 個，第 4 行是「ETC」；
  框是 `戦闘_Sコンボ表示枠`，數字與「l」（LV）用 `数字英語` 的字、全部白色。我方全體攻擊只有第一個目標顯示。
- 重製版：`growth.ran(id, kind, course)` 記錄（`src/growth.js` 的 dealt／taken／onHit，`src/cards_a.js`／`cards_b.js`／`cards_story.js` 的效果處各加一行），
  `src/viz.js` 包住 `Battle.prototype.draw`／`update` 在舞台左上畫（`src/battle.js` 沒改）。
- 設定加了原版的「發動技能顯示」（全部／攻擊時／防禦時／不顯示，變數 351）與「技能顯示方法」（滑動／固定位置，變數 352）。
- 和原版不同：命中時的技能（金縛術、惡作劇、交換…）重製版是在影片播完後才算，所以名稱框在影片後出現（原版在命中畫面）。組合技的參加者技能（`@tmp_scom_run_skill`）由 cmb 分工處理。

## 2. 卡片變化、掩護、大猿
- **卡片變化**（change_card_run 146173／output_card_change_effect 146203）：`items.cardBlink`——先放 Z2 カードアップ，閃爍框（set_card_frame 5～9，外星人／烏龍是卡背 1）
  疊在要變的卡上（整手變的卡是 6 張），兩格亮兩格暗 50 格，最後才變。用在卡片畫面的「選一張」與「整手」、快速龍 156、外星人 169、任意卡 62。波倫加 38 沒有選卡畫面，照舊。
- **掩護**（anime_pattern 39，72565）：`CoverFilm`——掩護的人從左邊飛進來（第 25 格起從上方降下）、被掩護的人往後退，兩人站好；名稱框顯示掩護技能。
  `src/battle.js` 在「X 掩護了 Y！」後只等 0.9 秒，所以站好後馬上接攻擊（原版站到第 92 格）。
- **大猿**：變身照 anime 151（滿月升起 200 格 → 臉閃八格 → 大猿的臉；`src/anime.js` gohanApe，`src/cards_a.js` 用 `b.play` 播）；
  大猿的魔光砲照 anime 146 的大猿分支（臉、蓄氣、口中光球、特大光線；apeMakouhou）；Z1 戰鬥狀態與對決列的頭像換成 `Z1_顔大猿`（set_character_face 19769，
  `ui/faces_ape_z1.png`，只在畫戰鬥時換）。

## 3. 卡面與時之間 HUD
- 卡面：set_card_frame（14062）組 2（Z2）、組 3（Z3 起）、組 4（ZG：變數 43 151～200）的卡面、攻擊星、流派框、閃爍框搬到 Z1 的位置做成
  `ui/cards_z2.png`／`cards_z3.png`／`cards_zg.png`，經 `world.era` 換圖（`src/era.js` 加了 `eraKey` 與 `zg`）；`src/viz.js` 每 0.5 秒看變數 40／43 變了就重新套用。
- 卡片圖示與爺爺頭像：原版 `put_icon` 用 `$game_variables[40]` 那一欄，變數 40 最大是 2，`顔カード.PNG` 第 3 欄又和第 2 欄一樣，所以 ZG 不用另外換（照原版）。
- 時之間 HUD：`trGoal` 在區域裡顯示原版 `story_string`（35461～35506）的區域名（`world.viz.trArea`，變數 43 = 901～937）。

## 4. 地圖
- `src/field.js` 的地圖事件：照圖的大小算格子（`$` 開頭一人 3×4、其他 12×8；`!bigsize_anime` 是 96×64），貼在格子下緣中間；有原地動畫的頁照 VX
  每 19 − 2×速度 格換一格（`tools/build_timeroom.py` 的 `map_events` 多記速度）。`holds` 多了 `['flag', 名稱, 真假]`。
- 地圖 1 EV009（拉蒂茲還在時太空艙旁的「たすけて!」）、時之間地圖 60 也畫；地圖 90 的門（事件 6）與核心周圍的 animap1（事件 39～53）畫到開關 575。
- 地圖 36：太空船落地後畫面震動 60 格，同時在太空船上播動畫 4（宇宙船到着1フレ，加算）兩次、間隔 30 格（`tools/extract.rb` 多轉 `Animations`）。
- z1field 1384：天神與比克每步不透明度 −5，最後比克 255、天神 95。
- 地圖 108 海盜船：兩張圖直接畫在地圖上（原版 640×480 畫面以玩家為中心換算，`src/zg_c.js` shipOverMap）。
- CE94 哈奇亞克：閃光用原版的灰圖（127／188／255）放大 200%、加算，在背景之上、本體之下（`src/opening.js` 的 screen 圖片多了 `zoom`／`blend`）。

## 測試（2026-11-02，headless Chrome，390×844 與 375×667，`&timer`）
- 名稱框（鋼鐵之拳 Lv1 滑入、60 格後消失）、掩護過場、滿月→大猿→大猿頭像→口中魔光砲、卡片閃爍（Z1／Z3／ZG 卡面）、地圖 1／60／90、地圖 36、1384、海盜船、哈奇亞克閃光、
  時之間核心區的 HUD；主控台除了 favicon.ico 沒有錯誤，圖片都讀得到。
