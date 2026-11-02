# 第一批小修正：分工（照原版）

> **2026-11-02 已完成並合併到 main**：tac（`docs/tac` 見 `docs/cards-a.md`、README 隊伍與作戰）、pas（`docs/pas.md`）、etf（`docs/zg-b.md`）、ovw（`docs/zg-recap.md`）。「獲得經驗值」原版是註解掉的，不做。同時修了 Z1 第六章以後 224 隻敵人沒有 SP 的問題（`tools/build_data.py` 最後設定）。以下是開工時的說明。

> **之後補上**：敵人每回合回復 HP 照原版 `*PARAM_HPRECOVER`（53 隻，`tools/build_data.py` 最後設定）；賽亞人魂（5～7、95～100）攻擊 ×1.05～1.25、受到傷害 ×0.95～0.75（`src/growth.js`）；其他 18 個角色的固有技能升級表與起始固有技能（`tools/build_growth.py` 從原版 `get_typical_skill`／`set_typical_skill_first` 抽出，到 Lv99，悟空的「地球育ちのサイヤ人」（開關 1312）第二批 grw 補上）。這些角色新學到的技能的效果也照原版做了（`growth.extra` 登記）：`src/skills_a.js` 王子的驕傲（單獨戰鬥攻防、等級非最高時 EXP ×1.3）、賽亞人的團結、應援；`src/skills_b.js` 慈愛之心、不服輸、向著未來的希望；`src/skills_c.js` 挑釁、面向絕望的反抗（`battle.js` 的 `school`）、P能量爐。
和原版不同／還沒做：重製版沒有敵人讓我方「停止行動」的攻擊（束縛類，原版元素 12／13／14），所以慈愛之心的束縛無效沒接上；組合技命中不會觸發挑釁等命中技能；再生 11／12 的 KI 回復重製版沒有。

原則同前：**總之參照原版**，台詞全文保留（`tools/s2t.py` 簡轉繁），不確定先查原版（`research/all.rb`、`game/Data`）再討論手機版怎麼優化；跟使用者說話用繁體中文。
先讀 `docs/HANDOFF.md` 的開發流程。從 `main` 開自己的 worktree 分支，**不要合併 main、不要 push**；做完在自己分支提交，回報分支名與測試結果。
`data/world.json` 衝突由主 session 合併時重建；worktree 裡的 `game`、`research` 要從主資料夾重新連結；不要用不帶名字的 `git stash`。
測試：手機 390×844 與 375×667，網址加 `&timer`；圖檔副檔名大小寫要跟磁碟上一樣。新的劇情節點、場景、`state.flags` 名稱用自己的前綴（下表）。
共用檔可以改，但**只改自己那一段**、改動越小越好（別的分工也在改 `src/battle.js`、`src/growth.js`），主 session 合併。

| 分工 | 內容 | 主要檔案 | 前綴 |
|---|---|---|---|
| **tac** 作戰三個選項 | 見下方 1 | `src/partymenu.js`（作戰畫面）、`src/supersaiyan.js`、`src/cards_a.js`（大猿戰後）、`src/battle.js` 的自動、`src/growth.js` 的經驗值 | `tac` |
| **pas** 最終決戰・征服 | 見下方 2 | `tools/build_growth.py`、`src/growth.js` 的被動技能段、敵人資料的 BOSS 屬性、`src/timeroom.js` 的戰鬥練習 | `pas` |
| **etf** 敵人變身 | 見下方 3 | `src/battle.js` 敵人變身那段、`src/zg_b*.js`／`tools/build_zg_b*.py` | `etf` |
| **ovw** ZG 概況＋威洛篇缺口 | 見下方 4 | `src/fieldmenu.js` 的概況、ZG 各篇檔案、威洛篇的章節檔、`tools/build_combo.py` | `ovw` |

## 1. 作戰的「變身技能」「變身狀態」「獲得經驗值」（tac）

原版 `Scene_Db_Tactics_Menu`（all.rb 約 141640～141990）有、重製版 `openTactics` 沒有的三項：
- `・变身技能`（`$cha_tactics[2]`）使用／不使用，預設 0＝使用。只對能變身的人顯示（141820：悟空有技能 29、悟飯有 59 或 51 或正在大猿、
  超悟空等 14,18,19,32,17,20,25～30 一律、貝吉塔有 133、巴達克有 158）。效果：自動時用不用變身技（49485）。
- `・变身状态`（`$cha_tactics[3]`）保持／不保持，**預設 1＝不保持**（`set_cha_tactics_nil_to_zero` 14330）。顯示條件同上（約 141880）。
  效果：戰鬥結束 `off_super_saiyazin_all`（12766，各角色看自己的編號）與 `off_oozaru_all`（13083，悟飯看 `[3][5]`）。
  重製版現況：超級賽亞人 `src/supersaiyan.js` 的 `afterBattle` 看 `tactics.ssOff`，但畫面沒有這個選項，所以**一律保持**（和原版預設相反）；
  大猿（`src/cards_a.js` 的 `battleHooks.end`）一律變回（剛好是原版預設）。兩者都改成照這個選項。
- `・获得经验值`（`$cha_tactics[4]`）獲得／不獲得，預設 0。顯示條件與效果照原版查（約 141950 起、經驗值分配處）。
- 舊存檔沒有這幾個值 → 用原版預設。

## 2. 被動技能「最終決戰」「征服」（pas）

- 最終決戰 8／最終決戰改 670：對 BOSS 屬性（`$data_enemies[id].element_ranks[22] == 1`）的敵人，我方傷害 ×1.25（14679～14710）、
  受到的傷害 ×0.85（16045～16080，要 SP 學滿）。征服 538～546：對通常的敵人（`element_ranks[22] == 3`）傷害 ×1.2～1.5（15665）。
  另有一段 17000 起（`chk_skill_learn`）也要對照。
- 重製版現況：`world.growth.skills` 沒有這些技能（`tools/build_growth.py` 沒收），敵人資料沒有 BOSS 屬性。
- 時之間戰鬥練習的「BOSS 屬性／通常屬性」選擇（`docs/timeroom.md`）接上。誰會學、什麼時候學照原版資料。

## 3. 敵人變身（etf）

- `docs/zg-b.md`：達列斯的大猿變身（技能 644）、史拉格的巨大化（645）現在從他們的招式拿掉了。照原版做出來（戰鬥中變身、圖、能力變化、
  台詞／音效），重製版既有的敵人變身只有貝吉塔的 373（`src/battle.js` 的 `transform` / `apeOf`），可以照它延伸。
- 順便查其他篇有沒有同類被拿掉的敵人變身招式（各篇 docs 的「和原版不同」）。

## 4. ZG 概況＋威洛篇缺口（ovw）

- ZG 概況：原版的「概況」在 ZG 期間用 ZG 劇情場景（z1field 6771～6775，`docs/zg-c.md`），重製版照共通處理。照原版做。
- 威洛篇（`docs/HANDOFF.md` 82 行）：武泰斗的教誨、琪琪／龜仙人的 S 連擊（組合技）。換裝教學等第二批的換裝系統，這次不做。

跳關：網址 `?dev=` 以自己的前綴開頭（`tac…`、`pas…`、`etf…`、`ovw…`）會交給 `src/z3.js` 的 `devZ3`，在自己的檔案用 `registerZ3('前綴', { dev(game, step) { … } })` 處理（照 `src/timeroom.js` 的 `?dev=tr`）。
