# 交接說明（給接手的電腦／Claude）

這份文件讓另一台電腦的 Claude 能完全接手「龍珠Z RPG 重製版」的開發。**先整份讀完再動手。**

## 1. 這是什麼專案

使用者取得授權的同人遊戲「ドラゴンボールZ RPG Ver1.072 漢化修復版」（RPG Maker VX／RGSS2）要做成網頁遊戲，有兩個版本，**一律用這兩個名稱稱呼**：

| 名稱 | 內容 | Repo | 線上 |
|---|---|---|---|
| **經典版** | 原版完整移植（橫向），在瀏覽器用 ruby.wasm 直接跑原版 19 萬行 Ruby 腳本 | `pokemonida99/dbz-rpg-web` | https://pokemonida99.github.io/dbz-rpg-web/ |
| **重製版** | 手機直向重新設計（本 repo），新的 JS/Canvas 引擎，沿用原版素材、數值、台詞 | `pokemonida99/dbz-rpg-web-1` | https://pokemonida99.github.io/dbz-rpg-web-1/ |

目前主要工作在**重製版**。經典版已穩定，原版遊戲的所有檔案也放在經典版 repo 的 `game/` 裡（重製版要讀原版資料就靠它）。

## 2. 使用者的規則與偏好（一定要遵守）

- **一律用繁體中文回覆**，包含進度說明與摘要。使用者看不太懂英文。程式碼、指令、檔名可以保留原文。
- **「總之參照原版」**：所有系統、劇情、台詞、演出都照原版。台詞**全文保留、不刪減**（簡體轉繁體用 `tools/s2t.py`）。不確定時去查原版，不要自己發明。
- 原版素材優先；原版沒有的圖才用 ChatGPT 生圖（見第 7 節）。
- 經驗值倍率：**戰鬥與所有修行都是 8 倍**（`src/party.js` 的 `EXP_RATE`），使用者說「8 倍很好，就維持」。
- **蛇道只能往前走**（不能倒退刷卡）；卡片格、修行格**每次停留只能用一次**。
- **大地圖上找人說話維持一般對話框**（使用者決定不改成場景演出）；章節之間的劇情要用和開場一樣的過場演出（`src/cutscene.js`）。
- 觸控出招：直接點卡片就是手動出招；點選單外面＝取消；全員選完出現「出招！」。
- 大的改動前先說明計畫；任何可能不可逆或對外的動作先問。
- 使用者常用手機遠端（Remote Control）操作，看不到桌面上的提示框，**結尾訊息要把重點和需要他決定的事寫清楚**。

## 3. 在新電腦上設定（第一次）

需要：Ruby（系統內建 2.6 即可）、Python 3（3.9 即可）、`gh`（已登入 pokemonida99 帳號）、git。

```bash
# 兩個 repo 放在同一層資料夾
mkdir -p ~/dbz && cd ~/dbz
gh repo clone pokemonida99/dbz-rpg-web        # 經典版（含原版遊戲檔案 game/，約 6300 個檔）
gh repo clone pokemonida99/dbz-rpg-web-1      # 重製版
cd dbz-rpg-web-1
ln -s ../dbz-rpg-web/game game                # 原版素材捷徑（不進 git）

# 研究用資料（不進 git，需要時重新產生）
ruby tools/dump_scripts.rb                    # → research/all.rb：原版全部腳本（176 個、約 19 萬行），可 grep
ruby tools/extract.rb game/Data data $(ls game/Data | sed -n 's/^Map0*\([0-9]*\)\.rvdata$/\1/p')
                                              # → data/*.json：地圖、事件（commonevents.json＝原版共通事件）、角色、敵人、技能…

# 測試伺服器
python3 tools/serve.py 8790                   # http://localhost:8790/index.html
```

想看原版實際怎麼演：在經典版資料夾跑 `python3 tools/serve.py 8777`，開 `http://localhost:8777/index.html?debug`。右上角「略過對話」可以快轉，`rubyEval('Ruby 程式')` 可以在遊戲裡下指令（結果在 `pageStats.log`）。

## 4. 原版資料怎麼查

- **劇情流程**：`research/all.rb` 的 `Event_Main` 腳本（`when 數字 #說明`），對應 `$game_variables[41]` 的劇情步驟。Z1 在前段，Z2 從「Dr.ウィロー撃破後フリーザ編へ」（步驟 962，設 `$game_variables[40] = 1`）之後。
- **事件台詞**：原版主要劇情在 Map007「Z1 イベント」的事件頁（`data/map007.json`）與共通事件（`data/commonevents.json`）；轉換器在 `tools/build_data.py` 的 `script()`。
- **地圖清單**：`data/mapinfos.json`（Z1／Z2／Z3／Z4／ZG 與「時の間」各區）。
- **戰鬥規則**：`docs/battle-rules.md`（已整理好公式與原版出處）。
- 其他研究筆記：`docs/*.md`（卡片、Z2 重力修行、池塘龍珠、射擊小遊戲、第二章進度等）。

## 5. 目前進度（2026-11-02）

線上版本約 `20261101-2330`。已完成並上線：

- 原版開場（片頭動畫、開場劇情）
- **Z1 全篇**：拉蒂茲 → 蛇道・界王星 → 桑修 → 巴布魯斯 → 尼奇 → 古雷格利修行 → 吉加 → 卡里克 → 界王修行 → 神龍 → 栽培人・那巴・貝吉塔（大猿）→ Z1 片尾
- **威洛篇**（Z1 與 Z2 之間的必經橋段）
- **Z2 全篇**（五章）：前往那美克星・邱夷・多多利亞 → 悟空修行（重力室、池塘龍珠、卡納薩星）→ 大長老・薩博 → 基紐特戰隊 → 弗利薩（各形態、超級賽亞人）→ Z2 結局；**達列斯・史拉格支線（巴達克加入）**
- 系統：隊伍與作戰、特殊卡片（掉落、贈送、卡片商店含購買回饋、抽獎、神經衰弱、卡林合成）、S 組合技、成長（SP 技能、ZP、共有經驗值、熟練度、復活規則）、修行格與速度修行、地圖選單（概況・情報・設定・地圖）、龍珠雷達、勝利自動存檔、觸控出招與取消、選敵音效與 ▼ 游標、章節過場
- 2026-11-01 已完成一輪過場檢查（開場～Z2 結局），台詞、場景、略過、銜接、存讀檔都已比對原版。

各章的細節與開發用跳關入口都寫在 `README.md`。

## 6. 下一步（照原版順序）

1. **Z3（人造人間篇）**：原版地圖 32～40、78～83（集龍珠、貝吉塔登場、魔凶星東西南北＋卡林、貝吉塔出擊、救布瑪、古拉到達、人造人間）。先從 `Event_Main` 的 Z3 段落（`$game_variables[40] = 2` 之後）整理出劇情步驟，分章後再做；Z2 結局目前顯示「待續」交給 Z3。
2. **時之間**：原版的練功／重玩地圖（回到以前各區、重新挑戰頭目、特殊卡片掉落、用「時之間移動卡」進出，第一個入口在 Z1 貝吉塔區）。做好後才能接：
3. **巴達克篇**（Z1／Z2 版）、**巴達克一味外傳**、**複製拉蒂茲洞窟**：原版只能從時之間進入，主線和外傳的隊伍／技能變數是整組交換的（`main_z1bar_varchange` 等）。
4. 之後：Z4（賽魯篇）、ZG（外傳：波傑克、達列斯、史拉格等）。

已知但暫不處理：Z2 部分必殺技動畫借用 Z1 的；威洛篇的武泰斗教誨、換裝教學、琪琪／龜仙人 S 連擊未做。

## 7. 開發流程（照這個做）

- 每個新功能／章節開**自己的分支**，做完合併進 `main`。同一時間只讓一個地方合併 `main`，避免衝突。**不要兩台電腦同時改 `main`。**
- 程式盡量放新檔案（例如 `src/z3a.js`、`tools/build_z3a.py`），對既有檔案只加小的掛鉤。
- **測試**（每次都要）：
  - 手機尺寸 390×844 和 375×667。
  - 畫面要真的在畫：內建瀏覽器面板隱藏時 requestAnimationFrame 不會跑，用網址加 `&timer`（例如 `index.html?dev=z2&timer`），或自己跑 update+draw 迴圈。曾經有「每場戰鬥一開始就黑畫面」的 bug 就是因為沒畫到而漏測。
  - 戰鬥要用正常遇敵的方式進入：`__game.state.nextEnc = 1; __game.onStep()`，確認主控台沒有錯誤。
  - 開發用跳關：`?dev=ch5 ch6 ch6earth ch6vegeta willow willow51 willowboss z2 z2b z2c z2d z2ginyu z2frieza z2last z2turles`（新章節也照樣加）。
- **上線**：推之前一定先跑 `python3 tools/bump.py`（更新版本號，手機才會自動換新版），推上 `main` 後用 `gh api repos/pokemonida99/dbz-rpg-web-1/pages/builds/latest` 確認部署，並看 `https://pokemonida99.github.io/dbz-rpg-web-1/version.json`。
- **GitHub Pages 部署卡住**（出現 "in progress deployment"）：**不要** `gh run rerun`（會卡在 queued 取消不掉），改用 `gh api -X POST repos/pokemonida99/dbz-rpg-web-1/pages/builds` 重新觸發。
- Commit 訊息結尾加：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

### 經典版（若要改）
- 推之前跑 `python3 tools/bump.py`（所有網址加版本號，避免手機混用新舊快取）。
- 改了 `rb/loader.rb` 裡對原版腳本的修補後，要重新產生預編譯腳本：本機 `?debug` 開啟後在主控台 `rubyEval('rgss_build_iseq')`（寫回 `rb/scripts.iseq`；沒重產也能跑，只是慢）。
- iPhone 記憶體較少（例如 13 mini）容易被系統關掉，改動時注意記憶體用量。

## 8. 工具

- **ChatGPT 生圖**（原版沒有的圖才用）：`~/claude-tools/tools/gpt-image/gen.sh out.png "<prompt>" [參考圖...]`，用 ChatGPT.app 內建的 codex（需已登入），一張約 40 秒，**最多同時 2 張**。repo 是 `pokemonida99/claude-tools`，新電腦要先 clone 到 `~/claude-tools`。生成後要縮成遊戲的像素大小和配色。
- 多個 Claude session 平行開發時：一個「主」session 負責合併與上線，其他 session 各自開分支、做完交給主 session；各 session 測試用不同的埠（8791、8792…）。
- 額度不夠時，檢查類的工作可以用比較便宜的模型。
