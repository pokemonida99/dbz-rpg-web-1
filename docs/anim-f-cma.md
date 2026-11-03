# 組合技 F 組 cma：OS射擊／FOS射擊／雙重爆裂／賽亞攻擊／賽亞人強襲（進行中）

檔案：`src/combo_os.js`（`addComboFilms` 登記 50 個組合技；`src/main.js` 一行 import＋跳關正規式加 `cma`；`tools/copy_assets.py` 收 pic 與 CMA_SOUNDS；新增 4 個素材到 assets/）。

## 做法
- 舞台用 `src/anime_zfighters.js` 的 ZfStage（子類 CmaStage）：背景條（Z2／Z3）、cut-in（先手者，含 set_battle_cutin_name 的 ZG／大猿列）、原版 back／effect 計數器。
  `ComboDuel.prototype.swoopIn` 用「接續既有定義」的方式包一層（其他 cm 分工若也包，不會互相蓋掉），建好舞台後 32 由 zf 的 launch 畫背景條與 cut-in。
- 一族一份帶參數的片：`cmaPair`（OS 2825/2843/2855/2874-2879、1833/1835-1837/1865-1868，FOS 2943-2959/2971-2974；表 PAIR）、
  `cmaDouble`（2927-2935；表 DOUBLE）、`cmaSaiyanTP`（1832）、`cmaSaiyanST`（1834）、`cmaApes`（1842）。傷害 41／42／43 用 zfHit，44 自己寫（effect 105、DB3 大爆発）。
- Z2（變數 40 = 1）時照原版改用 back 105 集氣、Z2_ 圖與音效。

## 測試狀況（390×844、`&timer`，`?dev=cmaz3ss` ＋ `__cma(id)`）
- 已實際發動、主控台無錯誤：725（Z3，兩種先手）、733、735、736、737、765～768、843～852、732、734（Z3）。截圖對照原版流程正確。
- **還沒測**：725／732／734／765～768 的 Z2 版（`?dev=cmaz2`）、742 強襲（要先四人大猿變身）、743／755／774～779／853～858（`?dev=cmaand`、`cmaandss`）、
  雙重爆裂 827～835（`?dev=cmade`、`cmadess`）、871～874（`?dev=cmafg`）、859（era 3 永不開放，需直接建 ComboDuel）、375×667。
- 第二次連發 732 時 `__cma` 回傳列名但組合技沒發動（待查：可能是先手判定或開關被 catchUp 關掉）。

## 和原版不同（目前已知）
- 742、827～835 原版是全體攻擊（skills scope 2，第二個目標起只播短片）；重製版組合技只打一個目標，只做了第一目標的完整片。
- `@scombo_cha2_anime_type` 原版不重設（沿用上一招的值）；這裡一律從 0 開始。

## 待辦
- 上面未測的部分逐一測、375×667、把做完的組合技從 `docs/combos.md` chain 清單移到本文件。
