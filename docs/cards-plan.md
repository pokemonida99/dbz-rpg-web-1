# 卡片與修行格：分工（照原版）

原則同前：**總之參照原版**，台詞全文保留（`tools/s2t.py` 簡轉繁），不確定先查原版再討論手機版怎麼優化；跟使用者說話用繁體中文。
先讀 `docs/item-cards.md`（重製版卡片系統的現況）、`docs/HANDOFF.md` 的開發流程。

## 現況（2026-11-02）

- `world.items` 已經有原版在各時代拿得到的全部卡片（`tools/build_items.py` 的 `BASE`，138 張）。效果還沒做的卡是 `kind: 'hook'`：
  地圖選單「卡片」／戰鬥「卡牌」用的時候顯示「這張卡片的功能還沒做好」，直到有人設定 `fieldCards[id]`（`src/items.js`）。
- `fieldCards[id] = async ({ game, battle }) => …`：`battle` 是戰鬥中使用時的戰鬥物件（地圖上是 null）；回傳 true = 用掉了（卡片
  `spent` 時會減少）、`'close'` = 卡片畫面一起關掉（例如移動了位置）、false = 沒用。可不可以在戰鬥／地圖用，看 `world.items[id].occ`（原版 occasion）。
- 卡片格（`src/cardgames.js`）目前只用 Z1 的商品與抽獎清單；修行格（`src/training.js`）只有速度修行。

## 原版出處

- 卡片效果：`research/all.rb` 的 `Scene_Db_Card`（`run_card`，約 146000 行起）、戰鬥裡的卡片處理（`101_Scene_Db_Battle`），各卡的說明文字。
- 卡片格：`chk_card`（186483：商店／抽籤／神經衰弱，變數 44 = 時代）、Map007 事件 1 頁 21 的商店（Z1～ZG 各段）、`Scene_Shop` 的
  `z1_cardlist`～`zG_cardlist`（31668）、`create_get_card`（20594：`card_id_z1`～`card_id_zg`）、神經衰弱的卡池。
- 修行格：`chk_training`（186457：變數 40 ≥ 2 時 0 速度、1 波波、2 界王的冷笑話、3 琪琪），Map007 事件 1 頁 31／33／34／35 與各自的場景。

## 分工（每人只改自己的檔案，都已預先建好並接上 import）

| 分工 | 內容 | 自己的檔案 | 名稱前綴 |
|---|---|---|---|
| **training** | 修行格：Z3 起四種隨機（速度・波波・界王的冷笑話・琪琪），各自的場景、規則、獎勵 | `src/training_more.js`、`tools/build_training_more.py`、可以改 `src/training.js`（只有你改它）、`docs/training-more.md` | `trn` |
| **square** | 卡片格依時代換商品（商店、抽籤、神經衰弱，變數 44）；卡片 198 卡片商店・199 卡片抽籤・200 卡片連線、90／103／157 村人 A／B／C、119 基朗、202 界王星 | `src/cards_square.js`、`tools/build_cards_square.py`、可以改 `src/cardgames.js`（只有你改它）、`docs/cards-square.md` | `csq` |
| **cards-a** | 55 月亮和尾巴、73 皮拉夫、76 飛機、79 老鼠、91 阿修、92 小舞、96 藍將軍、100 小八、107 桃白白、112 鈴鼓、113 銅撥、114 比克(O)、123 木乃伊 | `src/cards_a.js`、`tools/build_cards_a.py`、`docs/cards-a.md` | `cda` |
| **cards-b** | 141 喜歡角色變更（含原版的「喜歡的角色」系統：KI 消耗減少、經驗值／SP 增加、選「必」變自己的流派等）、142 悟空、144 比克、148 克林、151 貝吉塔、153 沙維扎、156 快速龍、160 威洛、169 外星人、173 氣墊車、197 修行之石、203 重力裝置、211 悟空(B)、212 克林(B) | `src/cards_b.js`、`tools/build_cards_b.py`、`docs/cards-b.md` | `cdb` |
| **story** | 38 波倫加、48 未來特效藥（Z3 第五章心臟病）、57 藥草、58 瀉藥、59 炸藥、62 任意卡、63 交換、68 顛倒、78 筋斗雲（戰鬥中換隊：`src/partymenu.js` 的 `memberChange` 可以用）、125～133 重要物品與撒旦的簽名、140 芭蕉扇、145 20號、155 弗利薩(S)、168 時間君、171 恐龍 | `src/cards_story.js`、`tools/build_cards_story.py`、`docs/cards-story.md` | `cst` |

已經接好（不用改）：`tools/build_cards_ext.py` 在 `tools/build_data.py` 最後呼叫各檔的 `add(world, h)`（這時所有章節的資料都在）；
`src/main.js` 已經 import 各 `src/*.js`。

## 規則

- **不要改**共用檔：`src/items.js`、`src/battle.js`、`src/growth.js`、`src/partymenu.js`、`src/main.js`、`src/field.js`、`src/z3.js`、
  各章節的 `src/*.js`、`tools/build_items.py`、`tools/build_data.py` 等。需要改（例如戰鬥裡加一個掛鉤、章節裡看某張卡）先停下來
  發訊息給主 session，主 session 改好會告訴你 commit，用 `git cherry-pick` 拿。
- 自己加的劇情節點（`addNodes`）、場景、`state.flags` 的名稱都用自己的前綴（上表），避免和別人重複（ZG 合併時出過這種問題）。
- 卡片的使用畫面照重製版既有的卡片畫面（`src/items.js` 的 `openCards`）；需要選人用 `src/partymenu.js` 的 `pickMember`，換隊用 `memberChange`。
- 從 `main` 開自己的 worktree 分支，**不要合併 main、不要 push**；做完在自己分支提交，回報分支名與測試結果。
- `data/world.json` 衝突由主 session 合併時重建；worktree 裡的 `game`、`research` 要從主資料夾重新連結；不要用不帶名字的 `git stash`。
- 測試：手機 390×844 與 375×667，網址加 `&timer`；圖檔副檔名大小寫要跟磁碟上一樣。跳關：網址 `?dev=` 以自己的前綴開頭（`trn…`、`csq…`、`cda…`、`cdb…`、`cst…`）會交給 `src/z3.js` 的 `devZ3`，在自己的檔案用 `registerZ3('前綴', { dev(game, step) { … } })` 處理（照 `src/timeroom.js` 的 `?dev=tr`）。
