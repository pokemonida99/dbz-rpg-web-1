# 龍珠Z RPG 重製版（試玩：Z1 拉蒂茲篇）

為手機直向重新設計的版本：新的 JavaScript 引擎，沿用原版（RPG Maker VX 同人作品「ドラゴンボールZ RPG」）的素材與數值資料。
原版完整移植的「經典版」在另一個 repo：pokemonida99/dbz-rpg-web（橫向／原腳本執行）。

線上：https://pokemonida99.github.io/dbz-rpg-web-1/

## 玩法改動
- **地圖**：不再用卡片移動，手指拖曳自由飛行；走一段距離隨機遇敵（原版機率約每 20 格一次），敵人組合照原版拉蒂茲區（甜菜人／球根人／奧尼恩／帕普金，1～3 隻）。
- **戰鬥**：保留原版卡牌規則（手牌 6 張、攻／防星數、流派一致才能出必殺技、行動順序看攻＋防、傷害與迴避公式），介面改成直向大卡。
- **經驗值**：用原版的「經驗值倍率」選項設為 8 倍，否則要打約 100 場才能挑戰拉蒂茲（約 Lv6-7）。
- 規則來源與公式整理在 `docs/battle-rules.md`。

## 開發
```bash
python3 tools/serve.py 8790
```
資料重建（需要原版遊戲資料夾，例如 `../dbz-rpg-web-dist/game`）：
```bash
ln -s ../dbz-rpg-web-dist/game game          # 原版素材（不進 git）
ruby tools/extract.rb game/Data data 1 6 7   # .rvdata → JSON（系統 Ruby 2.6 即可）
python3 tools/build_data.py                  # → data/world.json（台詞在這裡轉繁體）
python3 tools/copy_assets.py game            # 只複製用到的素材到 assets/
```

| 檔案 | 內容 |
|---|---|
| `src/core.js` | 畫布縮放（整數倍像素）、素材載入、搖桿與鍵盤、音效、對話框 |
| `src/tiles.js` | RPG Maker VX 地圖圖塊繪製 |
| `src/field.js` | 地圖飛行、遇敵、Boss 位置 |
| `src/battle.js` | 卡牌戰鬥（規則＋直向介面） |
| `src/anime.js` | 戰鬥動畫：照經典版逐格移植的一對一演出（普通攻擊、各必殺技、閃避、爆炸），點畫面可加速 |
| `src/main.js` | 標題、劇情、HUD、選單、存讀檔（localStorage） |

## 本版自製素材
`assets/bg/battle_{night,dusk,day}.png`：直向戰鬥背景（400×600），用 ChatGPT 照原版 Z1 戰場地面的風格生成，再縮成像素、減色。每場戰鬥隨機選一張，同一場不會換。

## 發佈

每次推上去之前先跑 `python3 tools/bump.py`，會更新版本號並讓手機自動抓到新版。
