# 時之間 第 2 階段：分工（照原版）

原則同 Z3／Z4：**總之參照原版**，台詞全文保留（`tools/s2t.py` 簡轉繁），不確定先查原版再討論手機版怎麼優化；跟使用者說話用繁體中文。
第 1 階段（本體）的說明在 `docs/timeroom.md`，先讀它。

## 分工（每人只改自己的檔案）

| 分工 | 原版 | 自己的檔案 |
|---|---|---|
| **z1** Z1 的區域 | 地圖 59 的門：9102 拉蒂茲區（地圖 60）、9111 卡里克區（61）、9121 界王（62）、9131 貝吉塔區（63，開關 68）、9141 威洛區（64，開關 520）；Map007 事件 17 頁 9101～9144；`Event_Check` 的 `when 60`～`64`；`140_Field_Main` 的遇敵 | `tools/build_tr_z1.py`、`src/tr_z1.js`、`docs/tr-z1.md` |
| **z2** Z2 的區域 | 地圖 66 的門 9302 邱夷（67）、9311 多多利亞、9321 薩博、9331 基紐、9341 弗利薩（68～71）；事件 18 頁 9301～9362 | `tools/build_tr_z2.py`、`src/tr_z2.js`、`docs/tr-z2.md` |
| **z3** Z3 的區域 | 地圖 72 的門 9502 克拉斯（73）、9551 卡里克 Jr.（83）、9511 皮拉爾、9521 凱澤、9531 古拉、9541 人造人間（74～77）；事件 20 頁 9501～9554 | `tools/build_tr_z3.py`、`src/tr_z3.js`、`docs/tr-z3.md` |
| **z4** Z4 的區域 | 地圖 85／86 的門 9702 威洛（強）、9711 賽魯第一形態、9721 第二形態、9731 金屬古拉、9741 大格提斯塔、9751 13 號、9771 賽魯遊戲（地圖 87～95）；事件 21 頁 9701～9773。9781 絕望的反抗、9791 另一個結局是第 3 階段，不做 | `tools/build_tr_z4.py`、`src/tr_z4.js`、`docs/tr-z4.md` |
| **bardock** 巴達克篇 | 門 9151（Z1 大廳，開關 109 或 119）→ Map007 事件 4／14（頁 800～）、地圖 31、65；門 9351（Z2 大廳）→ 事件 10（頁 3000～3200）、地圖 54。原版的隊伍／技能變數整組交換（`main_z1bar_varchange` 等） | `tools/build_tr_bardock.py`、`src/tr_bardock.js`、`docs/tr-bardock.md` |

已經接好（不用改）：`tools/build_timeroom.py` 會呼叫各檔的 `add(world, h, z3, tr)`；`src/main.js` 已經 import 各 `src/tr_*.js`。
**不要改** `src/timeroom.js`、`src/battle.js`、`src/field.js`、`tools/build_timeroom.py`、`src/main.js`（需要改共用的東西，先跟主 session 說）。

## 共用工具（`src/timeroom.js`）

- `registerArea(頁號, async (game, poi) => …)`：大廳的門。例：`registerArea(9102, (game) => enterArea(game, { map: '60', x: 16, y: 16 }, 901))`。
- `enterArea(game, {map, x, y}, 變數43)`：原版的 CE181（給舞空術 37、帶路人 124 卡）、變數 43 = 901 等、移動。
- `leaveArea(game, {map, x, y})`：CE182（收回那兩張卡）、變數 43 = 999、回大廳（9103 等頁的座標）。
- `registerTrSpot('名字', async (game, poi) => …)`：區域地圖上的格子（`world.pois[地圖]` 裡 `{chapter: 'tr', page: '名字', …}`）。
- `trBattle(game, [敵人], { shared, cap, sp, drops: [[機率%, 卡片], …], heal, bgm, backdrop, … })`：區域頭目戰（頁 9104 等）：
  不給經驗值（開關 124），給頁上寫的共有經驗值（變數 306）、CAP（317）、SP（318），掉卡照頁上的 241～245（機率%）／246～250（卡片），
  開關 141 開著就 `heal: true`（戰後全員回復）。其他欄位直接傳給 `game.startBattle`（`bgm`、`backdrop`、`hp30` 等）。
- `registerBackdrop('73', (game) => 'bg/….png')`：區域地圖的雜兵戰背景（原版 `set_battle_map`）。Z3／Z4 的區域可以直接用 `src/z3.js` 的 `z3BackdropAt(game)`（Z3 的地形規則，不檢查主線章節）。
- `goTo(game, {map, x, y})`、`healAll(game)`、`inTimeRoom(s)`。
- 建資料：`add(world, h, z3, tr)` 的 `tr['map_events'](D, 地圖, 列數, tr['sheets'])` 轉出地圖事件（頭目的站姿、門），放進
  `world.maps[id].ev`，`src/field.js` 會照開關畫、照原版擋路；`h['build_map']`、`h['enemy']`、`z3['nodes_of']`、`z3['file']` 同 Z3。
  劇情頁可以放在 `world.z3.pages['tr:…']`，用 `play(game, key)`（`src/z3.js`）播。
- 區域地圖是原版主線地圖的複製（飛行）：遇敵照 `140_Field_Main` 該地圖的設定寫進 `world.areas[id]`；戰鬥背景照 `set_battle_map`
  （變數 43 的 901～937 段落）；卡片格、旅館、修行格照該地圖的 `Event_Check`。

## 交接約定

- 從 `main` 開自己的 worktree 分支，**不要合併 main、不要 push**；做完在自己分支提交，回報分支名與測試結果。
- `data/world.json` 一定會衝突：主 session 合併時重跑 `python3 tools/build_data.py` 與 `python3 tools/copy_assets.py game`。
  所以新素材要能由 `copy_assets.py` 複製（放進 `world['fieldPictures']`、`world['extraBgm']`、`world['fieldSe']` 等）。
- worktree 裡的 `game`、`research` 是忽略檔，要從主資料夾重新連結（`ln -s /Users/hermes/Public/0720/dbz-rpg/dbz-rpg-web-1/game game` 等）；
  `git stash` 在 worktree 之間共用，不要用不帶名字的 stash。
- 測試：手機 390×844 與 375×667，網址加 `&timer`；加自己的跳關：網址 `?dev=` 以 `tr` 開頭的會交給 `src/z3.js` 的 `devZ3`，所以在 `src/tr_*.js` 用 `registerZ3('trz1', { dev(game, step) { … } })`（照 `src/timeroom.js` 的 `?dev=tr` 做法），跳關名稱用 `trz1…`、`trz2…`、`trbd…` 等不重複的開頭。
  圖檔副檔名大小寫要跟磁碟上一樣（GitHub Pages 區分大小寫）。
