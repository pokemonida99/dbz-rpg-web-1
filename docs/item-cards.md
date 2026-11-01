# Item cards (アイテムカード / 特殊卡片)

Code: `src/items.js` (rules + the card screen + the card shop), data: `tools/build_items.py` → `world.items`,
`world.cardShop`, `world.drops`, icons `assets/ui/item_cards.png` (the Z1 column of the original `顔カード.PNG`).
Script references are to the decompressed RGSS2 scripts (`NNN_Name.rb`).

## Holding
- `state.cards = {itemId: count}`. Limit per card by rank (Items `element_set` 5/6/7/8 = S/A/B/C):
  variables 224-227 start at **S 1, A 1, B 2, C 3** (`010_Share.rb:5460`); no rank → 1. Stored in `state.cardMax`.
- Getting more than the limit is allowed; when the card screen or the shop opens, extras are **sold for half price**
  (`set_max_item_card`, `010_Share.rb:3936`). `C等級提升` (45) raises the C limit by 1, up to 7.
- CAP (信用點) = `state.zeni` (the original's party gold / var 25).

## Getting cards (chapters 1-2)
- **Drops** after a won battle (`get_item_card`, `101:4928`): per enemy, `drop_item1` with chance 1/den and `drop_item2`
  with 1/den. Raditz area: 甜菜人 布爾瑪 1/4・布爾瑪媽媽 1/8; 球根人 普爾 1/4・龜仙人 1/8; 奧尼恩 占卜婆婆 1/8・古雷格利 1/6;
  帕普金 烏龍 1/4・閻魔王 1/8; 拉蒂茲 天神 1/1・爺爺 1/10. Sansho area: 賈斯敏 加林仙人/爺爺 1/20; 哈布 龜仙人 1/15・天神 1/30;
  西納蒙 波波先生/界王 1/30; 桑修 加林仙人 1/1・神龍 1/30.
- **Events** (Change Items in Map007 event 1, `{item}` nodes run by `src/events.js`): 布爾瑪 龍珠雷達, 海龜 探測器 + C等級提升,
  村民 布爾瑪媽媽 / 悟飯(C), 蛇道 爺爺 閻魔王・藍鬼 加林仙人・紅鬼 天神, 普爾 神龍 + 仙豆, 悟飯的帽子 四星球, …
- **Card shop** on the Z marks (card squares, `145_Event_Check.rb chk_card`; the original picks shop / lottery /
  concentration at random — only the shop is built). Goods = `z1_cardlist` (`040_Game_Interpreter.rb:1363`) minus cards
  for systems this version doesn't have (skills, SP/ZP, synthesis, airplane, ghost). Sell = price / 2. The Z mark still saves.

## Using (`106_Scene_Db_Card.rb`, `100_Scene_Db_Status.rb run_card`)
`occasion`: 0 field + battle, 1 battle only, 2 field only, 3 never. A card that would do nothing is refused (error sound).
| kind | cards | effect |
|---|---|---|
| heal one | 9 10 11 / 12 13 14 / 15 16 17 / 75 | HP / KI / both +ceil(max × rate %) (25 / 50 / 100); 仙豆 on a dying (<31 %) Saiyan in battle also gives power + guard up |
| heal all | 18 神龍, 49 蛇姬 | 神龍: everyone full, KO'd members half; 蛇姬 13 % each |
| one hand card | 19 / 20 / 23 / 25 / 50 / 84 / 87 | attack → Z, guard → Z, school → 必, swap attack/guard, new school (not the same), attack +1~2, guard +1~2 |
| whole hand | 21 / 22 / 24 / 26 | all attack +1~2, all guard +1~2, all new cards, swap all |
| member (battle) | 32 界王, 40 超神水, 41 戰鬥服, 53 少年, 54 卡納薩星人, 64 必殺技, 33 最長老 (all) | power up ×1.3 (as a school match), guard ×0.7, acts first this turn, dodges every attack this turn, next special move costs no KI |
| enemy (battle) | 30 爺爺, 51 藍鬼, 52 紅鬼 | enemy skips its next action; enemy card attack / guard −1~2 (each once a turn) |
| other | 29 亞奇洛貝, 34 探測器, 28 布里夫博士, 80 龜殼, 45, 70 主持人 | everyone's damage ×0.7 this turn; show enemy cards + HP for the battle; ×1.5 EXP / CAP for 5 won battles; C limit +1; +30 CAP |
Enemy cards are now dealt at the start of each turn (§2.1 of battle-rules.md) so the scouter and 藍鬼/紅鬼 can see and change them.

## Hooks
- `src/battle.js`: `items.*` calls in the damage formulas, KI cost, attack order, enemy actions, end of turn, rewards;
  `BATTLE_MENU` registry (entries `{id, label, order, open(battle)}`; 卡牌 = order 1, registered in `src/main.js`).
  Until the 菜單 shell exists the entries show as buttons next to 自動 / 逃跑.
- `src/main.js`: field menu「卡片」, Z mark → `openShop`. `src/events.js`: `{item}` → `eventCard`.

## Card squares, lottery, concentration, composition (`src/cardgames.js`)
- **Z marks** (`chk_card`): each visit picks one of three at random — card shop (BGM DB3 メニュー), card lottery, concentration. The Z mark still saves.
- **Prize pool** (`create_get_card`, Z1): `world.cardLottery`; the original's `rand(size - 1)` never picks the last entry (197), kept.
- **Lottery** (`Scene_Db_Card_lot`, BGM Z1 ミニゲーム): two prize cards, six face-down slots (2 rows × 3 columns, linked with the original's
  dashed X). Pick top or bottom from left to right. 1st ≠ 2nd: 沒中獎. 1st = 2nd, 3rd different: +1 of that card. All three the same: +2.
- **Concentration** (`Scene_Db_Card_Concentration`, BGM DB3 ミニゲーム, 爺爺): four random prize cards, two of each face down (4 × 2 here,
  one row of 8 in the original). Two misses and it ends. Each pair found = one card.
- **合成** (field menu; Map007 event 1 page 45, 卡林大人, BGM ZD イベント3): the first visit plays common event 269 (`state.sw[34]`).
  自己選擇合成: pick two cards (element 9 cards — dragon balls, radar — can't be used). A matching recipe (`world.cardCompo`, 85 recipes,
  all 100 %, order-free) makes the result. The first time a recipe is made it is remembered (`state.recipes`). No match: both cards come back.
  配方合成: the recipe list (??? until made) or 想做的卡 (results of known recipes → their recipes). Greyed when you lack the cards, count in orange at the holding limit.
- **More cards** for these pools now exist in `world.items`: those with simple effects work (93 成龍, 106 烏巴, 98 金屬軍曹, 104 阿拉蕾, 105 波拉,
  42/43/44 rank-ups, 89 仙豆罐, 205 神探測器, 46/47/60/61/69/97/170 heals, 27 巴布魯斯 = no encounters for 5 "moves", one move = 4 tiles flown).
  The rest are `kind: 'hook'` (skill / SP / ZP / skill-slot cards …). They show 「這張卡片的功能還沒做好」 until a system sets `items.fieldCards[id]`.
- New game: 三星球, 六星球, 龜屋, 哥美拉 (Map007 event 1 page 1). 龜屋 (71) and 哥美拉 (77) are hooks for the growth session.

## Not built (yet)
Skill / SP / ZP cards (hooks), 飛機, 妖怪 (the remake has no
"KO'd with HP > 0" state), 龍珠雷達 (shown, not usable).
