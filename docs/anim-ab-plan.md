# 招式動畫 A／B 組：分工（照原版逐格移植）

> **2026-11-03 三個分工都已完成並合併上線**：25 招（悟空・悟飯 `src/anime_goku_gohan.js`、比克・貝吉塔 `src/anime_piccolo_vegeta.js`、Z 戰士等 `src/anime_zfighters.js`）。Z3 時期的招式 pattern 是「技能編號 +2100」。兩邊各有一份必殺技背景條與 cut-in，之後可收成一份放進 `src/anime.js`。以下是開工時的說明。

做法和既有的 96 招一樣：讀原版 `research/all.rb` 的 Scene_Db_Battle_Anime（102_Scene_Db_Battle_Anime.rb）裡這一招的
anime_pattern／effect_pattern／back_anime_pattern（招式的攻擊 pattern 是「技能編號 +10」，再追它呼叫的子 pattern），逐格寫成網頁程式，
用原版的圖與音效（`game/Graphics/Pictures`、`game/Audio`），不重畫、不自創。照 `src/anime.js` 的寫法（`Duel`、`draw`、`spark`、`BALL`、`RAY`、`BACKS`…）。
原版依時期換圖（Z1_／Z2_／Z3_ 的戰鬥圖、氣功波素材、`$btl_progress` 決定要不要 cut-in），照原版的時期判斷。

**檔案（避免衝突）**：每個分工把自己的影片寫在自己的新檔（下表），用 `addMoves({ 技能編號: '影片名' })` 登記、`Object.assign(Duel.prototype, { *影片名() {…} })`
加方法（照 `src/zg_broly.js` 第 30／87 行的寫法），在 `src/main.js` 加一行 import。`src/anime.js` 只在需要時加 export（一行），不改既有影片。
新圖要能被 `tools/copy_assets.py` 收到（它掃 `pic('…')`；新檔若沒被掃到，在 copy_assets.py 加上檔名），檔名大小寫和磁碟一致。

先讀 `docs/HANDOFF.md`、`docs/battle-rules.md`、`src/anime.js` 開頭的說明。從 `main` 開 worktree 分支，**不要合併 main、不要 push**；做完提交，回報分支名與測試結果。
`data/*.json` 是從原版抽出的（gitignore），worktree 缺的話從主資料夾複製；`game` → `../dbz-rpg-web/game`、`research` 連結主資料夾。
測試：390×844 與 375×667、`&timer`、主控台無錯誤、圖檔都載入；每招截圖幾格對照原版流程。跳關用自己的前綴（`?dev=前綴…`，`registerZ3('前綴', { dev })`）。
**每做完一個角色就在對話裡用一句中文回報**（使用者要看得到進度）。

| 分工 | 角色與招式（技能編號） | 新檔 | 前綴 |
|---|---|---|---|
| **anga** | 悟空：26 超級龜派氣功、27 瞬間移動龜派氣功（超悟空 14）、29 超賽變身；悟飯：48 龜派氣功、52 爆裂衝擊、53 激烈魔閃光、54 超級龜派氣功（超悟飯 18）、59 超賽變身 | `src/anime_goku_gohan.js` | `anga` |
| **anpv** | 比克：32 爆裂波、39 激烈光彈、40 魔空包圍彈、41 全功率魔貫光殺炮；貝吉塔：122 多重能量波、125 大爆炸攻擊、130 終極閃光（超貝吉塔 19）、133 超賽變身 | `src/anime_piccolo_vegeta.js` | `anpv` |
| **anzb** | 克林 65 氣圓烈斬、雅木茶 74 超級操氣彈／75 新狼牙風風拳、天津飯 85 新氣功炮、餃子 94 念力／95 全力洞洞波、琪琪 107 芭蕉扇、那美克星青年 145 魔貫光殺炮／146 神秘閃光 | `src/anime_zfighters.js` | `anzb` |

（招式的使用者是從原版事件的「變更技能」查出來的。超賽變身 29／59／133 原版若只是變身演出、沒有攻擊片，就照原版做變身的那段。）
