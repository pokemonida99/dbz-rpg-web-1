# 時之間 第 3 階段＋ZG：分工（照原版）

原則同 Z3／Z4：**總之參照原版**，台詞全文保留（`tools/s2t.py` 簡轉繁），不確定先查原版再討論手機版怎麼優化；跟使用者說話用繁體中文。
先讀 `docs/timeroom.md`（時之間本體）、`docs/timeroom-plan.md`（第 2 階段的共用工具與交接約定，這裡照用）、`docs/z3-plan.md`（劇情章節的做法）。

## 原版的流程（v1.072）

Z4 通關（開關 458）後，主線就是在時之間裡進行：
- Z4 時之間大廳（地圖 85）的門 9781 **絕望的反抗**（Map007 事件 12，頁 3500～，地圖 55）、9791 **另一個結局**（事件 13，頁 3801～，打完開關 570）。
- 開關 459（Z4 頁 2461）＋570 → ZG 時之間大廳（地圖 96）開放。大廳的門（開放條件是地圖 96 的事件，第 1 階段已照做）：
  9902 **熱戰・烈戰・超激戰**（事件 8，頁 5000～，地圖 56；打完開關 580）→ 9911 **銀河危機**（事件 24，頁 5500～，地圖 97～99；581）→
  9921 **Episode of Bardock**（事件 25，頁 5701～；585）→ 9931 **ZG 本編（Z 外傳）**（事件 23，頁 6000～6999，地圖 100～110；586）→
  9941 **帕伊庫漢**（事件 28，頁 7101～；587）→ 9951 **最後的頭目（布歐）**（事件 29，頁 7201～；600）。
- 鬥技場：時之間入口大廳 (22,5)，Map007 事件 19（頁 90001～）、`Scene_Db_Battle_arena`。
原版做法都是門把變數 41 設成那篇的第一頁、跑 Map007；劇情場景是 `Event_Main#z1field` 的那些頁，劇情戰是 `battle_process`。

## 分工（每人只改自己的檔案，都已預先建好並接上 import）

| 分工 | 內容 | 自己的檔案 | 章節 key（registerZ3） |
|---|---|---|---|
| **future** | 絕望的反抗＋另一個結局（事件 12、13，地圖 55） | `tools/build_tr_future.py`、`src/tr_future.js`、`docs/tr-future.md` | `trfuture`、`trtrunks` |
| **broly** | 熱戰・烈戰・超激戰（事件 8，地圖 56）＋Episode of Bardock（事件 25） | `tools/build_zg_broly.py`、`src/zg_broly.js`、`docs/zg-broly.md` | `zgbroly`、`zgeob` |
| **bojack** | 銀河危機（事件 24，地圖 97～99）＋帕伊庫漢（28）＋布歐（29）＋鬥技場（19） | `tools/build_zg_bojack.py`、`src/zg_bojack.js`、`docs/zg-bojack.md` | `zgbojack`、`zgpaikuhan`、`zgbuu`（鬥技場用 `registerArea('arena', …)`） |
| **zga** | ZG 本編 前段：頁 6000～6171（ZG 開始、巴達克一夥篇，地圖 100～102）；門 9931 | `tools/build_zg_a.py`、`src/zg_a.js`、`docs/zg-a.md` | `zga` |
| **zgb** | ZG 本編 中段：頁 6181～6421（四個毀滅瓦斯產生裝置、西之都尖塔，地圖 103～107） | `tools/build_zg_b.py`、`src/zg_b.js`、`docs/zg-b.md` | `zgb` |
| **zgc** | ZG 本編 後段：頁 6431～6999（布布克島（力紐姆）、克恩星、奧特星、暗黑行星、結尾，地圖 105、108～110） | `tools/build_zg_c.py`、`src/zg_c.js`、`docs/zg-c.md` | `zgc` |

ZG 本編三段的交接：`zga` 最後一步呼叫 `startTrStory(game, 'zgb')`，`zgb` 呼叫 `startTrStory(game, 'zgc')`，`zgc` 結尾設開關 586 後 `endTrStory(game, ZG 大廳的門前)`。
每段的 `start(game)` 要能單獨開始（隊伍、變數、位置照原版那一頁之前的狀態），跳關才能分開測。

## 共用工具

- 第 2 階段那些都照用：`registerArea`、`registerTrSpot`、`registerBackdrop`、`trBattle`、`goTo`、`healAll`（`src/timeroom.js`）。
- **劇情**：`registerZ3(key, { maps, start, spot, boss, resume, dev, goal })`（`src/z3.js`，同 Z3／Z4 的章節）。
  `startTrStory(game, key)`：開始一篇（主線的 `state.flags.z3` 暫存起來，劇情期間是這篇的 key，所以讀檔會回到這篇、頭目與目標會顯示）。
  `endTrStory(game, {map, x, y})`：結束、還原主線的章節、回到時之間那個位置。還沒做的篇 `startTrStory` 會說「尚未製作」。
  `play(game, 'key')`、`fight(game, 編號, at, opts)`、`begin`、`toField`、`party`、`addMember`、`leave`、`member`、`heal`、`card`（`src/z3.js`）同 Z3。
  劇情頁放 `world.z3.pages['zga:…']` 等（key 前綴用自己的），戰鬥放 `world.z3.battles`（編號用原版的頁號，不會重複）。
- **戰鬥動畫**：新角色／新招式用 `src/anime.js` 的 `addMoves({...})` 在自己的檔案裡加（照經典版逐格移植），不要改 anime.js 本身；
  圖片與音效加進 `world['fieldPictures']`、`world['fieldSe']`、`world['extraBgm']`，`copy_assets.py` 才會複製。
- 跳關：網址 `?dev=` 以 `tr`、`zg`、`z3`、`z4` 開頭會交給 `src/z3.js` 的 `devZ3`；在自己的章節的 `dev(game, step)` 處理，名稱用自己 key 的開頭（`zgb…`）。

## 交接約定（同第 2 階段）

- 從 `main` 開自己的 worktree 分支，**不要合併 main、不要 push**；做完在自己分支提交，回報分支名與測試結果。
- **不要改**共用檔（`src/timeroom.js`、`src/z3.js`、`src/battle.js`、`src/field.js`、`src/main.js`、`src/anime.js`、`tools/build_timeroom.py`、`tools/build_z3.py` 等）。需要的話先停下來發訊息給主 session，主 session 改好會告訴你 commit，用 `git cherry-pick` 拿。
- `data/world.json` 衝突由主 session 合併時重建；worktree 裡的 `game`、`research` 要從主資料夾重新連結；不要用不帶名字的 `git stash`。
- 測試：手機 390×844 與 375×667，網址加 `&timer`；圖檔副檔名大小寫要跟磁碟上一樣。
