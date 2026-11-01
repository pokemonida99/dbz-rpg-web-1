# Z3 開發計畫與分工（照原版）

原則：**總之參照原版**，台詞全文保留（`tools/s2t.py` 簡轉繁），不確定先查原版；用繁體中文跟使用者溝通。
原版出處：Map007 事件 5「イベント実行Z3」（`data/map007.json` events['5']，75 頁，依變數 41 分頁）、
`research/all.rb` 的 `Event_Main#z1field` 1100～1591（場景）、`Event_Check` 的 Z3 地圖（約 185280 行起，`when 33 #Z3…`）、
`battle_process`（約 182900 行）。看原版實際演出：經典版 `python3 tools/serve.py 8777` → `index.html?debug`。

## 原版的順序（不是照變數 41 的大小）

| 章 | 變數 41（頁） | 地圖 | 內容 | 劇情戰（battle_process → `world.z3.battles`） |
|---|---|---|---|---|
| **z3a** 第一章 集龍珠！ | 1100～1158（頁 2、3） | 劇情 | 前情提要；悟空（z1field 1101：只剩悟空、回滿、變超賽）對弗利薩；那美克星爆炸；地球；龜仙人與琪琪加入 → 八人 `[4,5,6,7,8,9,24,10]`，變數 43 = 51 | 1107 弗利薩（101）：變數 81 = 20（我方傷害 ×20）、變數 95 = 1151 |
| | 1160～1200（頁 4～12） | 33 | 城鎮、眼鏡岩（炸藥→一星球）、藥草爺爺與恐龍（瀉藥→五星球）、礦山、門衛、敵人基地 → 4 顆；海龜 1591 | 1197 克拉斯 |
| | 1201～1220（頁 12～18） | 34 | 貝吉塔單人：屏障、三個屏障裝置、基地 → 會合、七顆 | 1216 伊爾 |
| | 1220 → 地圖 35 | 35 | 波侖加（圖片演出，地圖 35 事件 3）→ 變數 41 = 1440、43 = 65 → **z3b** | |
| **z3b** 第二章 魔凶星篇 | 1440～1447（頁 59） | 劇情 | 比克修行、天神、卡里克二世占領神殿、龜屋、分成四隊（選項：悟飯組、雅木茶組的方向） | |
| | 1471～1541（頁 60～67） | 78 東 → 79 西 → 80 南 → 81 北 | 每區一隊（依選的方向）；北：比克，途中貝吉塔加入 | 1472 加素、1492 比家、1512 素茲、1532 塔多 |
| | 1542～1571（頁 67～70） | 82 | 九人會合 → 神殿；亞奇洛貝 1583 | 1556 卡里克＋三人眾、1565 巨大化 |
| | 1571 結束 | | 變數 41 = 1230 → **z3c** | |
| **z3c** 第三章 弗利薩復仇・特南克斯 | 1230～1246（頁 19、20） | 劇情 | 弗利薩與庫爾德大王降落 → 機械弗利薩戰（變數 94 = 4）→ 神秘少年（隊伍 `[17]`） | 1237 機械弗利薩（102）：撐 4 回合結束 |
| | 1246～1266（頁 21～23） | 36（悟空到達） | 庫爾德、悟空到達、超賽對練（CE46／CE49）、未來的警告、時光機；古拉一夥出發；貝吉塔去膠囊公司 → 隊伍 `[12]`、變數 43 = 54、地圖 37 (8,9) → **z3d** | |
| **z3d** 第四章 古拉來襲 | 1270～1274（頁 24～26） | 37 | 貝吉塔單人：門衛、基地 | 1271 吉亞、1273 皮拉爾 |
| | 1274～1300（頁 26～37） | 38 | 雅木茶一行（`[7,6,8,9,24,10]`）：村民、收容所 A／B／C、凱澤、基地找到布瑪 | 1283／1286／1289、1296 凱澤 |
| | 1301～1309（頁 37～41） | 劇情＋小遊戲 | 流派一致修行 ×3、貝吉塔 Z3 重力修行（`src/z3train.js`） | |
| | 1310～1326（頁 42～45） | 39 | 古拉到達、選龜仙人或琪琪 → 機甲戰隊 → 古拉 → 超級貝吉塔（CE48）加入 → 古拉變身（CE50）；蘭琪 1581、Z3 龍珠 1431（地圖 39 七顆，神龍許願） | 1318 沙維扎・德雷・內茲、1322 古拉、1325 古拉最終形態 |
| | 1326 → **z3e** | | | |
| **z3e** 第五章 人造人間 | 1326～1340（頁 46、47、57） | 40 | 人造人出現的日子、亞奇洛貝仙豆、找人造人（20 號位置變數 308／309、方位提示 1421 隨機）、心臟病 1335；烏龍 1582 | |
| | 1341～1360（頁 48～50） | 40 | 20 號、特南克斯回來、研究所 | 1342 19 號・20 號 |
| | 1361～1382（頁 51～54） | 40 | 17／18 號、16 號、比克離隊 | 1363 17・18 號、1372 16 號 |
| | 1383～1420（頁 55、56） | 劇情 | 天神融合、沙魯（變數 94 = 4）、太陽拳、尾聲 → 變數 41 = 2001（Z4）；Z3 結尾卡「Z3 完／Z4 待續」 | 1390 沙魯（127） |

變數 43（概況）：51 開場 → 52 貝吉塔 → 65 魔凶星（每打倒一個 +1）→ 54 貝吉塔出擊 → 55 救布瑪 → 57 古拉 → 58 人造人間（+1…）。
共通：旅館（變數 41 = 11）、卡片格（chk_card）、修行格（chk_training）照各地圖 `Event_Check` 座標；時之間入口（41 = 15）先不做；CE180 用 `timeRoom(s)`。

## 共用基礎（z3-base 分支，已完成）

- `tools/build_z3.py`：Z3 的圖（`world.era['2']`：Z1_／Z2_ → Z3_）、Z3 卡片圖示、敵人 101～140・177～188（Z3 戰鬥圖、`Z3_顔敵` 頭像列 = 編號 − 100、技能、掉落）、
  `world.z3.battles`（上表全部的敵人與戰鬥曲）、Z3 戰鬥背景 `assets/bg/z3_battle_<列>.png`、頁面轉換工具 `z3['page'](v)`／`z3['split_battle']`／`z3['nodes_of']`（說話者用 `z3:` 頭像）。
  各章在自己的 `tools/build_z3?.py` 的 `add(world, h, z3)` 裡加地圖、地點、`world.z3.pages[...]`、`world.z3.goals`、`world.z3.titles['z3?']`、`world['faces']`（`z3:` 開頭）、`world['areas']`（遇敵）等。
- `src/battle.js`：Z3 卡片流派（`z3Schools`，照 create_card_i）；`dmgRate`（變數 81）。
- 戰鬥背景：`src/z3.js` 的 `z3Backdrop` 已照原版 set_battle_map（地面圖塊、第 3 層圖塊、地圖事件圖）自動選，各章不用另外寫（真的需要才用 `world.z3.backdrops[地圖]` 覆蓋）。
- `src/z3.js`：各章 `registerZ3('z3?', { maps, start, spot, boss, resume, dev, goal })`；共用 `begin／play／fight／toField／party／addMember／leave／member／heal／timeRoom／card／nextZ3`。
  `fight(game, 編號, 續玩鍵, { turns, dmgRate, stopWhen, foeHp })`：戰前自動存檔，讀檔／輸了從那場重來（`resume(game, at)` 收到 `{ ch, at }`）。
- `src/main.js`、`src/z2b.js`：Z2 結局後呼叫 `game.startZ3()`（有 z3a 才接手）；`?dev=z3…` 交給各章的 `dev(game, step)`（回傳 true 表示認得）。
- 各章空殼：`src/z3a.js`～`src/z3e.js`、`src/z3train.js`、`tools/build_z3a.py`～`build_z3e.py`、`tools/build_z3train.py`。

## 各章的交接約定

- 每章的 `start(game)` 從上表的第一頁開始播；結束時呼叫 `nextZ3(game, '自己的鍵')`（下一章還沒做好時會顯示「待續」）。z3e 自己做 Z3 結尾。
- 每章自己的 `dev(game, step)` 做出合理的開始狀態（等級、隊伍、變數 40 = 2、`s.cardiMax = 10`、`s.flags.z3 = '自己的鍵'`、`applyEra`），
  跳關名稱：z3a → `z3`、`z3a2`…；z3b → `z3b`…；z3c → `z3c`…；z3d → `z3d`…；z3e → `z3e`…（自己再細分）。
- 頁面一律用 `z3["nodes_of"]`／`z3["page"]` 轉（原版的 112 迴圈＋113 中斷會變成 `{loop}`／`{brk}`，選單才能重複問；直接用 `script()` 會把迴圈裡選項的其他分支吃掉）。變數比變數的條件是 `["vv", a, b, op]`；原版的 CAP（變數 25）會轉成 `{x: "cap"}`，加減的是 `state.zeni`。
- 場景（z1field）用 `addScenes`（`src/cutscene.js`）照 Z2 的寫法（`src/z2a.js` SCENES），編號在自己的章節範圍內，不會互相衝突。
- 小遊戲：`src/z3train.js` 的 `ryuhaPairTraining(game, opts)`、`z3GravityTraining(game, opts)`，回傳 `{ cleared }`。參數由小遊戲分支照原版定，z3d 照著呼叫。

## 分工與規則（平行開發）

| Session | 分支 | 只改這些檔案 | 測試埠 |
|---|---|---|---|
| 主（合併、上線） | `z3-base` → `z3a` | `src/z3a.js`、`tools/build_z3a.py`；共用檔案 | 8790 |
| 第二章 | `z3b` | `src/z3b.js`、`tools/build_z3b.py`、`docs/z3b.md` | 8791 |
| 第三＋四章 | `z3cd` | `src/z3c.js`、`src/z3d.js`、`tools/build_z3c.py`、`tools/build_z3d.py`、`docs/z3cd.md` | 8792 |
| 修行小遊戲 | `z3train` | `src/z3train.js`、`tools/build_z3train.py`、`docs/z3-training.md` | 8793 |
| 第五章 | `z3e` | `src/z3e.js`、`tools/build_z3e.py`、`docs/z3e.md` | 8794 |

- 共用檔案（`src/z3.js`、`src/main.js`、`src/battle.js`、`src/cutscene.js`、`tools/build_z3.py`、`tools/build_data.py` 等）盡量不改；真的要改就改最小、在 commit 訊息寫清楚，由主 session 合併。
- `data/world.json` 和 `assets/` 照常重新產生並 commit（`python3 tools/build_data.py`、`python3 tools/copy_assets.py game`）；合併時主 session 會重建，衝突不用自己解。
- **不要** `git push`、不要合併進 `main`、不要跑 `tools/bump.py`；做完 commit 在自己的分支上，回報給主 session。
- 測試照 `docs/HANDOFF.md` §7：手機 390×844 與 375×667、`&timer`、正常遇敵 `__game.state.nextEnc = 1; __game.onStep()`、主控台沒有錯誤。
