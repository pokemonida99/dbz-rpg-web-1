# 劇情與系統的小缺口（第二批分工 sys）

原則同前：**總之參照原版**（`research/all.rb`、`game/Data`、`data/*.json`），台詞全文保留（`tools/s2t.py`）。分工見 `docs/batch2-plan.md` 的 sys 段。

檔案：`tools/build_sys.py`（由 `tools/build_timeroom.py` 在 ZG 概況之後呼叫，資料 → `world.sys`、`world.z3.z34Recap`，順便改 `world.pois`、`world.growth`、`world.skills` 的名稱）、
`src/sys.js`（卡片效果、Z3／Z4 概況、跳關）。其餘是共用檔的小改動（見最後一節）。

## 1. 神龍的願望（z3cd.md 頁 1311 的選單）

| 開關 | 原版 | 重製版 |
|---|---|---|
| 490 神探測器 | 探測器（卡 34）也能讀人造人／沙魯（敵人屬性 17／30），不會被元素 16 的敵人弄壞（all.rb 48324、48423） | `src/items.js` 的 `scout()`：探測器照原版一隻一隻讀：17／30 讀不到（跳過），16 讓探測器爆炸（「Z3 光線系ヒット」，之後的敵人都不讀）；開關 490 或神探測器（卡 205）全部讀得到。神探測器照原版在還有沒讀到的敵人時可以再用（147276） |
| 494／495 | 卡片等級提升卡的上限 7 → 8 → 9（`update_max_item_card_num` 12477） | `src/items.js` 的 `maxRankUp(s)` |
| 496～499 | 戰鬥與修行的 ZP ×2～5（`get_zp_bairitu` 9148：50754、149374、150189、154946、155606） | 戰鬥：`src/growth.js` 一行掛鉤 `ext('zpRate')`（`src/sys.js` 登記）；修行：`src/training.js` 的 `zpRate`（修行格、`src/training_more.js` 的三種修行） |
| 1320 | 移動時選哪張卡都走 8 格（165117） | **沒有對應**：重製版是自由飛行，沒有用卡片移動，所以開關照原版設、沒有效果 |

探測器讀到的敵人照原版記進 `state.foeScouted`（`$ene_sco_history_flag`，敵人情報看得到 HP 與掉落）；原版是戰鬥結束時記，重製版在讀到的當下記。
491（波倫加升 S 級）不在這次：重製版沒有波倫加卡（38）。

## 2. 「カード特殊」卡片格（變數 44 = 10／20）

原版 145_Event_Check.rb：地圖 63 (59,18)、64 (3,7)、71 (10,69) 與主線的 15 (59,18)、51 (3,7)、29 (10,69) 先把變數 44 設成 10（Z1）或 20（Z2）再 `chk_card`。
商店照 `command_302` 多一個時代的商品（10 → Z1＋Z2、20 → Z1～Z3），抽獎／神經衰弱和一般一樣。
重製版：`tools/build_sys.py` 在這六個卡片格的 poi 加 `v44`，`src/cardgames.js` 的 `cardSquare(game, poi)` 先設變數 44（`src/main.js` 把 poi 傳進去）。
Z3／Z4 的 30／40 本來就各篇自己做好了（`src/z3e.js`、`src/z4f.js`、`src/tr_z3.js`、`src/tr_z4.js`、`src/zg_bojack.js`）。

## 3. 卡片商店「打倒 X 後追加」的 13 張卡

`tools/build_items.py` 的 BASE 加上 194、187、207、184、195、180、179、181、201、162、165、166、167（圖示表 `assets/ui/item_cards*.png` 跟著重產），
`tools/build_cards_square.py` 的 BONUS 本來就有條件，現在會出現在商店。

| 卡 | 原版效果 | 重製版 |
|---|---|---|
| 194 布洛克、187 科欽、207 吉斯、184 悟空(C)、195 庫爾德、162 13號、165 布羅利(F)、166 波傑克(F)、167 齊爾德 | 技能卡（Items element 32，`base_damage` = 技能）：學會觀望形勢 625、鋼鐵意志 619、同調 363、光之旅 620、同歸於盡的覺悟 634、吸收（擊破）511、氣的暴走 458、旁若無人 476、征服 538 | `world.growth.cards`（`src/growth.js` 的 `useSkillCard`），技能資料一起收進 `world.growth.skills` |
| 179 海賊／180 狗星人／181 魚星人 | 變數 311／312／313 + 15（經驗值／CAP／SP 增加，最多 999；all.rb 147185～147223） | `src/sys.js` |
| 201 小吉 | 一人 ZP + 1500（46177） | `src/sys.js`（同 202 界王星的選人畫面） |

和原版不同：九張技能卡的技能裡，只有征服（538～546）重製版有戰鬥效果；其他八個是「原版有但重製版沒收的被動技能」（第二批不做，之後另做），現在學得到、能裝，但戰鬥中沒有作用。

## 4. Z3／Z4 的概況

原版：地圖選單「あらすじ」與讀檔後都是 Map007 事件 2 頁 201：變數 43 = 51、52、54、55、57～61（CE101～109，BGM「Z3 イベント2」）、
65～69（CE110～114）、81～86、90～96（CE121～137，BGM「ZArrang_prologue01_プロローグ1」）。
旁白（四行訊息框）＋ z1field 場景：1100（黑畫面）、1001～1009 與 1034～1040（概況專用）、1106／1156（Z3 開頭）、Z4 劇情的場景（2034、2052～2054、2139、2191、2192、2275、2311、2321、2342、2352、2371、2437、2438、2442、2461、2705、2711、2742、2751、2805、2808、2826、2943）。

重製版照 ZG 概況（`docs/zg-recap.md`）的做法：
- `tools/build_sys.py` 讀頁 201 的分支與公共事件（共通的 `nodes_of`），場景用 `tools/build_zg_a.py` 的 `scene_of` 從 all.rb 讀，編號 **+2000000**（ZG 是 +1000000）。
  另外處理：場景最後的 `$game_variables[41] += 1`（1001～1009：下一次 z1field 畫下一張，節點後面補一個變數 41 + 1）、`$partyc[k]` 的臉（1004：隊伍第 k 人，`['@pc', k, …]`）、
  `for x in 0..temptekiput - 1` 排一排臉（2742：九個金屬古拉）、`=begin … =end` 裡的註解掉的場景（2438 後面那段）、原版沒有的編號（2722：`clear_chr` 後什麼都不畫）。
- 繪製用 `src/zg_a.js` 的 `drawZgScene`（`set_character_face` 照換裝變數選臉）；`character_output_all` 加了 Z4 用到的模式 1、2、5、8、9（all.rb 168006～168039）。
- 65～69 用 `tools/build_z3b.py` 早就做好的 `world.z3.recap` 與 `src/z3b.js` 的場景 1011～1015。
- `src/sys.js` 用 `addRecap` 接上（選單「概況」、讀檔後；「跳過概況」設定照舊）。播放時用狀態的複本。

和原版不同：Z2 後半的概況（變數 43 = 31～41，CE26～32）不在這次範圍，仍是錯誤音。

## 5. 自動關閉的「\^」訊息、戰鬥前的曲

- **「\^」**：`tools/build_data.py` 的 `boxes()` 在有「\^」的訊息框最後一格加上那個框裡的等待（「\|」1 秒、「\.」1/4 秒）與「\^」；
  `src/opening.js` 的劇情 `say` 與 `src/core.js` 的地圖 `say` 照等待時間顯示完就自己關掉（點一下會馬上往下）。只有代碼的空白框照舊省略。
  和原版不同：等待放在文字全部出來之後（原版在文字中間的位置停），總時間相同。
- **戰鬥前ＢＧＭ（變數 319）**：設定畫面加「戰鬥前ＢＧＭ」一列（原版 Scene_Db_Option：默認＝不播，DB3／Z1／激鬥天下一武道會／傳說的超戰士們的戰鬥前曲，其餘解鎖後出現）。
  不是默認時，戰鬥一開始（選卡時）播戰鬥前的曲，第一次出招時換成戰鬥曲（all.rb 47545、53145；`src/fieldmenu.js` 包 `Battle.prototype.resolveTurn`）。
  和原版不同：原版在 319 ≠ 0 時有些劇情戰（鬥技場、battle_process 的劇場版曲）會改用另一個版本的戰鬥曲（`$set_btlarn_ready_bgm`、`_btl` 版），重製版照 319 = 0 的版本播；事件戰的「事件戰鬥ＢＧＭ／事件戰鬥前ＢＧＭ」（428／429）原版只在第二輪出現，沒做。

## 6. 日文招式名稱

`world.skills` 裡資料庫只有日文名（中文版的說明欄空白）的 28 招：327、385～387、456、461、519、591～611。照前面各章的翻法（`tools/build_zg_bojack.py`、`tools/build_zg_c.py` 的對照表）：
能量波、連續能量波、強力能量波、連續強力能量波、連續能量彈、連打（ラッシュ）、雙重攻擊（607 塔德＆佐爾特）、刀攻擊(強)（608 吉加、609 尼奇）、死亡地帶（611 巨大化卡里克）、冰結攻擊(全體)（461 艾比略）。

## 7. 戰鬥音樂解鎖與收藏

原版設定畫面的「戰鬥ＢＧＭ」（變數 37）不是固定清單：`chk_battle_bgm_on`（all.rb 11637）＝變數 40 決定的數量（Z1 11、Z2 13、Z3 以後 16 首），
再依開關加減（拉蒂茲／貝吉塔打倒前沒有 9～11、GB 版 31～40、ZG 的 17～21、超賽亞傳說、劇場版各曲：713 BGM1 ver2、186／725／735 金屬古拉 1～3、187 HERO、188 GIRIGIRI、193 人造人間 13 號等等）。
重製版：`tools/build_sys.py` 從 all.rb 讀 `set_battle_bgm_name`／`set_battle_ready_bgm_name`（編號 → 檔名、曲名）與兩個 `chk_…_on` 的規則；
`src/fieldmenu.js` 的 `bgmOn(game, 'battle'|'ready')` 照這個存檔的開關算出能選的曲子，設定畫面的 ◀ ▶ 在這些之間切換，「隨機」也只從解鎖的曲子裡抽（10567）。
曲名照原版（日文作品名，原版漢化也沒翻）。用到的 BGM 檔（約 22 MB）由 `tools/copy_assets.py` 照 `world.extraBgm` 複製。

和原版不同：設定照重製版的做法存在這台裝置（原版存在存檔的變數裡）；選到的曲子在別的存檔還沒解鎖時照默認播。原版按 Shift 把曲子排除在隨機之外（灰字）沒做；使用者自己的 MYBGM 檔沒有。

## 跳關（加 `&timer`）

- `?dev=sysrecap<變數 43>`：Z3（`z3efield`）或 Z4（81 以上：`z4fring`）的存檔，然後照讀檔的方式播那段概況，例如 `sysrecap54`、`sysrecap91`。
- `?dev=syswish`：`z3efield` 的存檔，神龍的願望全部實現（490、494、495、496～499、1320），手上有探測器、神探測器、小吉、海賊、狗星人、魚星人、布洛克、齊爾德。
- `?dev=sysbgm`：同上，戰鬥曲的解鎖開關打開（713、186、187、735、193、188 等）。

## 共用檔的最小改動

- `src/battle.js`（flg 負責）：**一行**，探測器的顯示改成看那隻敵人有沒有被讀到：`items.scouted()` → `items.scouted(f)`（`drawLineup`）。
- `src/growth.js`（grw 負責）：**一行**，`beforeExp` 的 ZP 乘上 `ext('zpRate', 1, s)`。
- `src/main.js`：`import './sys.js'`、跳關前綴加 `sys`、`cardSquare(this, poi)`。
- `src/items.js`：卡片上限、探測器（`scout`、`scouted(f)`）。`src/cardgames.js`：`cardSquare(game, poi)`。`src/fieldmenu.js`：戰鬥曲清單、戰鬥前的曲。
- `src/core.js`、`src/opening.js`：「\^」。`src/zg_a.js`：`character_output_all` 的 Z4 模式、`'@pc'`。`src/training.js`、`src/training_more.js`：ZP 倍率。
- `tools/build_data.py`（`boxes()`）、`tools/build_items.py`（BASE）、`tools/build_timeroom.py`（呼叫 `build_sys`）。
