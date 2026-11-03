# 招式動畫 F 組 cmd：Z3 分歧的組合技 29xx 片（2026-11-03）

`docs/anim-f-plan.md` 的 cmd 分工：原版 Z3 分歧（all.rb 59742，`$btl_progress` 2）裡組合技編號 +10 的攻擊 pattern 派發的
anime_pattern 29xx，照原版逐格移植到 `src/combo_z3b.js`（ComboDuel 的方法，`addComboFilms` 登記）。

## 做法

- **舞台**（`CmdStage`，繼承 `src/anime_zfighters.js` 的 ZfStage）：保留原版我方攻擊時的實例變數——`z.f`（@battle_anime_frame）、
  `z.ax…gy`（output_battle_anime：@gx 每格反號）、`z.efp/eft/eff`、`z.rt/rf`、`z.bt/bf`、`z.color`、`z.c1…c4`／`z.t1…t4`
  （@scombo_cha*）、`z.cf`、`z.tok`、`z.chg`（@btl_ani_cha_chg_no，換畫成別的角色）——每部片就是原版的 case 逐格照寫：
  `for (;;) { const f = z.top(); …; yield* z.out(ray_x, ray_y); }`。效果（effect_pattern）與背景（back_anime_pattern）
  照原版編號寫成 `EFFECTS`／`BACKS` 表（我方方向），內嵌的 blt 畫在角色後面、效果畫在前面，和原版順序相同。
- **背景條與 32**：用 ZfStage 的（`this.st` 在 31 開始前建好，`anime_zfighters.js` 的 launch 就在 32 第 30 格打開背景條與 cut-in）；
  ZfStage 沒有的 `@tec_output_back_no = 4`（ZG 超龜派氣功左右板）在子類別補上。
- **cut-in**：用 `src/anime_goku_gohan.js` 的（`d.agSt` 讓它的 render 畫：發動者那列，set_chr_display_out 之後換敵人那列；Z1 敵人沒有）。
- **傷害**：原版這些組合技用的 damage pattern 21／22／41／43／44／48／82 照原版寫在同檔（`cmdDamageNN`），背景條與 cut-in 留著。
- **時期**：只有 876 決死的超元氣玉在 Z2（變數 40 = 1）就開放，原版 Z2 分歧派發 1976（all.rb 87752），照原版分歧，用 Z2_ 圖與 Z2 背景條／cut-in。
- 圖：每部片的圖在 31 開始時載入；`tools/copy_assets.py` 掃 `src/combo_z3b*.js` 的 `pic('…')` 與 `se('…')`。

## 跳關

`?dev=cmd<組合技>`（例：`?dev=cmd801`；`?dev=cmd876z2` 是變數 40 = 1）：該組合技的成員入隊（超賽角色變身）、所有組合技開關、Lv60、甜菜人 ×3（HP 很高）。
主控台：`__cmdPlay(組合技, 發動者)` 直接播片、`__cmdSheet(組合技, 發動者, 每幾格, 起, 迄)` 同步播完並把格子排成一張縮圖（點一下關掉）。
走正式規則用 `src/combo_dev.js` 的 `?dev=cmbx…` ＋ `__cmbx(組合技)`。`src/main.js` 的 dev 前綴清單加了 `cmd`。

## 各組合技

（見下表）

## 和原版不同／原版的問題

- 862 弟子組合攻擊、864 快走開！、875 師徒攻擊？：原版派發的 2962／2964／2975 在 anime_pattern 裡**沒有這個 case**（原版會停在發動畫面，
  只能按 B 跳過），沒有片可移植，維持 chain（參加者依序放自己的招式）。862、864 原版本來就拿不到。
- 原版沒有的圖：`Z3_戦闘_必殺技_気を溜める(四身の拳気功砲)`（back 8）用 Z1_ 那張；`Z3_必殺技_超カメハメ波(球点滅大)`（effect 289 白色）用青色那張；
  `Z2_戦闘_必殺技_エネルギー波_特大_緑`、`Z3_戦闘_必殺技_エネルギー弾2(緑)` 不存在，用白色。
- 原版的計數器行為照留：例如 877 衝擊波背景把 @back_anime_type 停在 2，接著的 201 號光環（只有 2 格）就畫不出來，計數器只往上加——原版也是這樣。
- 原版每格把 @gx 反號；組合技在重製版只打一個目標，814／825 原版的 @all_attack_count ≥ 2（全體招第二個目標起）分支沒做。
