# Battle rules — Dragon Ball Z RPG (RPG Maker VX fan game, FC-style card battle)

Spec for re-implementing the battle system in JavaScript. Sources are the extracted RGSS2 scripts in
`scratchpad/scripts/NNN_*.rb`. References use `file:line` (file prefix numbers are the script index).
Data references use the JSON dumps in `data/*.json` (made by `tools/extract.rb` from `game/Data/*.rvdata`).

Conventions used in the code and in this doc:

- `$partyc` = array of actor ids in party order (index = "party slot"; initial `[3,4]` = Goku, Piccolo, `139_Public.rb:163`).
- Ruby integer arithmetic: `/` on two ints is floor division; `.prec_i` = `to_i` (truncate toward 0), `.prec_f` = `to_f` (`001_Extension.rb:3-30`).
- `rand(n)` = integer in `0..n-1`.
- Scenario chapter: `$game_variables[40]` (0 = Z1 Vegeta saga, 1 = Z2 Freeza, 2 = Z3+). Fine-grained progress: `$game_variables[43]`.
- Many hundreds of passive "スキル" (SP-learned abilities, e.g. 気のコントロール, 湧き出る力) tweak the numbers below.
  They are listed as **(passive hooks)** and are *simplified* (omitted) unless noted. Base rules work without them.

---

## 1. Card model

### 1.1 Card fields
Each card has three integers (`139_Public.rb:127-136`):

| field | player array | enemy array | meaning |
|---|---|---|---|
| attack 攻撃の星 | `$carda[i]` | `$enecarda[i]` | 0..7. Face shows 1..7 stars, 7 = "Z" (strongest). Used for attack power, speed, map movement. |
| guard 防御 (kanji numeral) | `$cardg[i]` | `$enecardg[i]` | 0..7, same scale. Used for defence, speed, evasion. |
| school 流派 | `$cardi[i]` | `$enecardi[i]` | 0 = 必 (wild "special move" card), 1.. = school id. |

School ids = `class_id - 1` of the RPG::Class records (`data/classes.json`):
`0 必, 1 亀, 2 神, 3 界, 4 魔, 5 惑, 6 ギニュー, 7 悟, 8 超, 9 造, 10 化, 11 術, …, 16 気`.
A character's own school = `$game_actors[id].class_id - 1` (e.g. Goku class 3 → 神(2); Piccolo/Gohan class 5 → 魔(4);
Vegeta saiyans class 6 → 惑(5); Super Saiyan forms class 9 → 超(8)).
Special pseudo-school **16 気カード**: when played it becomes the player's own school (`101:2421`, `101:3142-3150`).

Enemy school = `$data_enemies[id].hit - 1` (the DB "hit" field is abused as school+1; Z1 field enemies have `hit = 6` → 惑).

### 1.2 Hand size and slots
- `$Cardmaxnum = 5` → the hand is **6 cards**, slots 0..5 (`139_Public.rb:10`). Slot 6 is a scratch slot used on the map.
- The **same hand** is used for map movement and for battle (no separate deck).
- Enemy cards: one card per enemy slot 0..8, regenerated every turn.

### 1.3 Generating a player card — `createcardval x` (`010_Share.rb:3731`)
```
carda[x] = rand(8)        # uniform 0..7
cardg[x] = rand(8)        # uniform 0..7, independent
cardi[x] = create_card_i(0)
```
Extras: passive 一か八か forces (0,0) or (7,7) 50/50 (`3743-3760`); battle-practice switch 1305 forces (7,7,16).

### 1.4 School roll — `create_card_i(n)` (`010_Share.rb:12233`)
`cardi = rand($cardi_max)`, re-rolled while it is in an exclusion list `noncardi`.
`$cardi_max` by chapter: Z1 = 6, Z2 = 7, Z3+ = 10 (`010_Share.rb:5446-5454`; event overrides to 9 at `143_Event_Main.rb:4261`).

Player (n = 0), chapter Z1 (`var40 == 0`, normal case `12245-12256`):
`noncardi = [5,6,7,8,9,10]` plus `2` (神) if `var43 >= 11`, plus `3` (界) if `var43 <= 10`.
- Early Z1 (Raditz area, `var43 <= 10`): possible schools {0 必, 1 亀, 2 神, 4 魔}, **each 1/4**.
- Later Z1 (`var43 >= 11`, after Goku trains with Kaio and becomes 界): {0 必, 1 亀, 3 界, 4 魔}, each 1/4.
- Special ranges: `var43` 51..80 → excludes only [2,3]; `var43 == 101` (Bardock) excludes [2,3,6..10].

Z2 (`12257-12278`): exclude [2,6,7] (+3 if Goku is Super Saiyan). Z3+ (`12279-12340`): exclude [2,6,7,9] with many
scenario-specific additions; **solo party** (1 member): only 必 + own school + one random other school are possible.
Passive 光の旅 forces own school (`12353-12375`). (simplified: implement Z1 table, keep the others as data.)

Enemy (n = 1, `12427-12475`): Z1 → exclude [6] plus 2 or 3 as above (so early Z1 enemies roll {0,1,2,4,5}, **each 1/5**);
Z2 → exclude [2,7] (+3); Z3 → exclude [2,3,6,7,9] with per-area exceptions.

### 1.5 Enemy cards — `create_enemy_card` (`010_Share.rb:3779`)
For every enemy slot 0..8 at turn start: `enecarda = rand(8)` (re-rolled until `>= 4` if the enemy has element flag 53 "boss");
`enecardg = rand(8)`; element flag 55 forces both to 0; `enecardi = create_card_i(1)`.
Then `ryuhakakuritu_keisan` (`010_Share.rb:12654`): if the card is neither 必 nor the enemy's school, and the enemy has
element flag 45/46/47/48, with probability 100/75/50/25 % the card is changed to (50/50) its own school or 必.
Z1 field enemies (1,2,4,5) have none of these flags.

### 1.6 Consumption and refill
- **Map** (`140_Field_Main.rb:367-410`): the player picks a card; movement = `carda + 1` squares (×2/×3 with airplane item
  or NG+; fixed 8 in 時の間 / with a Shenron wish). After moving, `createcardval` makes a new card in slot 6 and
  `cardvalslide` shifts the cards right of the used one left by one (`010_Share.rb:3892`), so the new card enters at
  the right end. One encounter roll per move (§7).
- **Battle**: each acting character consumes one card. At the end of the turn's animation scene every used slot is
  regenerated in place with `createcardval x` (`102:750-755`); unused cards stay. Card-to-character assignment is reset
  (`$cardset_cha_no = [99]*6`, `102:778`).

---

## 2. Battle turn flow

### 2.1 Turn start (`Scene_Db_Battle#start`, `101:740-1092`, block guarded by `$battle_turn_num_chk_flag`)
1. Roll per-character random numbers for passives (`101:940-976`).
2. `create_enemy_card` + `ryuhakakuritu_keisan` for every enemy (`101:982-987`).
3. `$battle_turn_num += 1` (`101:989`).
4. If turn > 1: enemy HP regen `hp += floor(pct/100 * maxhp)` for enemies whose note has `*PARAM_HPRECOVER[pct]`
   (`101:995-1015`, parsed at `010_Share.rb:12690`); then party `turn_recover_hpki` (§4.6).
5. Characters with `$cha_stop_num > 0` (stunned) are skipped this turn; the counter is decremented (`101:1031-1044`).

### 2.2 Player input (`window_key_state`, `101:2357`)
Main menu (`$CursorState`, `101:2380-2396`): 0 たたかう (fight), 1 menu (status / item cards / S-combo / tactics), 2 にげる (escape).
After "fight" the player chooses **オート (auto) / マニュアル (manual)** (`$WinState 8`).

Manual, repeated for each living, non-stunned party member, in party order (`$WinState 1→2→(6)→3`):
1. Select the character (cursor skips dead/stunned).
2. Select one unused card from the hand. `$cardset_cha_no[card] = party_slot`.
3. **Special-move window opens iff** (`101:2425-2434`)
   `(card.school == own school OR card.school == 0 必) AND actor has ≥1 skill AND !剛腕 passive`.
   (16 気 was already converted to own school; the "favourite character" `var104` also converts 必 → own school.)
   In the window the player picks a skill; it is accepted only if `actor.mp >= get_mp_cost(skill)` (`101:2277`).
   `Y` instead of `C` = same skill but forbid S-combo for this character.
   `$cha_set_action[slot] = skill_id + 10`. If the player has no valid card/skill → normal attack
   (`$cha_set_action = 1`).
4. Target: single-target skills (`scope == 1`, no element 10) and normal attacks ask for an enemy
   (`$cha_set_enemy[slot]`); all-target (`scope == 2`) or no-damage skills skip targeting.

The turn starts when `card_set_count == number of able characters` or `== 6` (`chk_battle_start`, `101:4835`).
With `X` the player may start early with fewer characters (`101:2689`). Only **6 characters max** act per turn
(one per card). Characters without a card this turn do not act **and cannot be targeted by enemies** (§2.4).

Escape (`101:2390-2395`): always succeeds when `$battle_escape == true` (normal encounters); impossible in story battles.

### 2.3 Auto mode — `set_auto_btl` (`101:3068`) / `set_auto_tec` (`101:2942`)
Pass 1, per able character in party order: take the first unused card whose school == own school;
else the first 気(16) or 必(0) card (needs ≥1 skill); otherwise no card yet.
Pass 2, per character:
- own-school card → `set_auto_tec`; 必/気 card → convert (気→own school; 必→own only for favourite) then `set_auto_tec`;
- else a random remaining card and normal attack.
`set_auto_tec`: pick a random skill from the actor's list, filtered by tactic `$cha_tactics[1]`
(0 any, 1 only KI-cost 0, 2 only 小技 element 27, 3 only 大技 element 28, 4 the designated skill `$cha_tactics[7]`);
must satisfy `mp >= get_mp_cost`; after 50 failed tries fall back to "KI-free" / 小技 (`$cha_tactics[5]`).
Tactic 6/8: below a KI % threshold use only KI-free skills.
Target by tactic `$cha_tactics[0]`: 0 = living enemy with lowest current HP, 1 = enemy with highest max HP.

### 2.4 Attack order and resolution (`Scene_Db_Battle_Anime`)
`set_attack_order` (`101:4847`, sort at `4863`, run from `terminate`, `101:161`):
- entries = every used player card slot `x` with key `carda[x] + cardg[x]`, plus every enemy `i` (id `10+i`) with key
  `enecarda[i] + enecardg[i]`; sort **descending** by key. Ruby `sort!` is not stable → ties are effectively unordered
  (recommend: random tie-break).
- Passive 先手 / 先手カード moves that character to the front (`101:203-211`).

Main loop (`102:796-1150`), for each entry in order:
- `chk_attack_course` (`102:1219`): 1-digit id → player attacks enemy; 2-digit → enemy attacks.
- `chk_attack_num` (`102:88074`): player = 1 attack; enemy = `$data_enemies[id].eva` attacks (DB "eva" field = attacks
  per turn; +1 at low HP / few allies when battle switches 25-29 are set). **Each extra enemy attack draws a fresh
  enemy card** (`create_enemy_card(i,false)` + `ryuhakakuritu_keisan`).
- `ene_action_set` (§5).
- `chk_attack` (`102:1370`):
  - player: skip if dead/stunned or already acted; if its target died, retarget by tactic `$cha_tactics[0]`
    (lowest HP / highest max HP); `scope == 2` → hit every enemy in turn (`chk_all_attack`, `102:1575`); no enemies left → skip.
  - enemy: skip if dead or stunned (stun counter decremented); target = random card slot `y in 0..5` re-rolled until it
    holds a living character (`102:1538-1550`) — uniform over characters that played a card. `scope == 2` skill →
    every party member who played a card.
- `battle_start` (`102:2108`): computes damage (§4) and, for a player special move, **pays KI once**:
  `actor.mp -= get_mp_cost(skill, …)` (`102:2155-2170`).
- `chk_battle_damage` (`102:16406`) applies HP loss and side effects; HP ≤ 0 → dead flag.
- After each player action: `set_skill_level` (§3.3).

---

## 3. Normal attack vs special move (必殺技)

### 3.1 Decision
A character uses a special move only if the card is **own school or 必** (or 気) and a skill was chosen with enough KI.
Every other card → normal attack (punch/kick animation; `$cha_set_action = 1`).
The **school match bonus** (×1.3, §4.1) applies only when `card.school == own school` — a 必 card enables the move
but gives no bonus (unless converted for the favourite character).

### 3.2 KI cost — `get_mp_cost(cha, skill)` (`008_Share_Sub_skill.rb:4601`)
```
cost = $data_skills[skill].mp_cost
if 必殺技カード item effect ($cha_ki_zero): cost = 0
if passive 湧き出る力 triggers (6..15 % chance): cost = 0
if cost != 0:
  if favourite character (var104): cost *= 0.8
  if skill has element 20: cost -= floor(skill_level / 10), min 0
  (passive hooks) ×0.95..0.6 気のコントロール, ×1.06..1.25 必殺の一撃, ×1.2 スタートダッシュ, ×0.75 手加減, ×1.75 気の暴走, ×0.5..様子見 …
return cost.to_i     # truncate
```
KI is the actor's MP (`Actors` parameter index 1). Enemies never pay KI.

### 3.3 Skill list and proficiency (熟練度)
- Skill list = `$game_actors[id].skills` (learned via events / `Classes.learnings`, level-gated in `028_Game_Actor.rb:60-62`,
  `level_up` `028:550`). In battle the window shows 7 per page.
- `$cha_skill_level[skill_id]` = times used (global per skill id), +1 per use, cap 99999 (`102:88126`,
  `139_Public.rb:245`). Skills listing ids in `message2` (comma list) share the maximum count.
- `$cha_normal_attack_level[actor]` = normal-attack count (saiyan base/SSJ forms share it).
- Effect on power (`102:15995-16020`), with `L = min(level, 999)`:
  `power = ceil(base * (100 + L) / 100)`; if `level > 1000`: `power = ceil(power + (level - 999) / 5)`.
  (So +1 % per use up to doubled power.) Normal attack uses `base = 3`. Oozaru form doubles skill power.
- Element 20 skills also get `-floor(level/10)` KI cost (§3.2).

### 3.4 S-combo (Sコンボ, simplified)
If several party members chose the specific skills listed in `data/scombo.json` (`scombo_cha`, `scombo_flag_tec`,
card star conditions), the first one triggers a combined move (`chk_scombo_flag*`, `101:5593-5933`): all participants
pay their KI, are marked as having acted, and damage uses the sum formula in §4.2. ひらめき (tecspark.json) can teach
a new move mid-battle (that use costs no KI). Implement later.

---

## 4. Damage

### 4.1 Player → enemy (`damage_calculation(0)`, `102:15982-16290`)
`x` = the attacker's card slot, `e` = target enemy display slot, `E = $data_enemies[enemy_id]`.
```
P = (special) skill_power from §3.3   |  (normal) ceil(3 * (100+min(Lnormal,999))/100) [+ (Lnormal-999)/5]
dmg = ((actor.atk + P) * 8 * (carda[x] + 7 + rand(2) + 1))  /  (E.def * (enecardg[e] + 7) / 3)
```
(integer math; the denominator is `floor(E.def*(g+7)/3)`; `rand(2)+1` ∈ {1,2}.) Then, in order, each step truncating:
1. any attacker of class 9 (Super Saiyan; for S-combo any participant): ×1.3
2. attacker is giant (大猿) `$cha_bigsize_on`: ×1.5
3. **school match** `class_id-1 == cardi[x]` or power-up flag / 気を溜める: ×1.3
4. enemy defence-up item effect `$ene_defense_up`: ×0.7
5. `set_damage_add` (`010_Share.rb:5863`) — passive hooks (サイヤ人魂, Z戦士の絆, 剛腕, …), result `to_i`.
6. skill element 11 (no-damage skill, e.g. 太陽拳): dmg = 0.
7. **Evasion**: `avoid = trunc((E.agi*1.2 + enecardg[e])/3 - (actor.agi*1.1 + carda[x])/3)`;
   if `avoid > 0` and `rand(100)+1 < avoid` → miss (dmg 0), unless skill element 29 (never miss), passive 必中 (389) or switch 129.
8. Event multiplier `var81` if non-zero.
There are **no critical hits** (DB `has_critical` is unused here).

Example (Goku Lv1 atk 17, normal attack, card ★4 (=3) vs 甜菜人 def 15 with guard 3):
`(17+3)*8*(3+7+{1,2}) / (15*10/3) = 1760..1920/50 = 35..38` (enemy HP 38).

### 4.2 S-combo damage (`102:16062-16190`, simplified)
`P = combo.base_damage + Σ participants' skill power (with proficiency) + ceil(comboLevel * n/2 * k)`,
`k = 1 + 0.2*(n-2)` for n > 2; `A = Σ (atk + level)` of participants; star = `min(7, max participant carda + (n-2) + passive)`.
`dmg = ((A + P) * 8 * (star + 7 + rand(2) + 1)) / (E.def * (enecardg + 7) / 3)`, then steps 1-8 above.

### 4.3 Enemy → player (`damage_calculation(1)`, `102:16287-16400`)
`x` = the **defender's own card slot** (the card the targeted character played this turn), `e` = attacking enemy.
```
P = (special) trunc(E.atk * base_damage / 100) - E.atk      # base_damage is a percentage (e.g. 150 → ×1.5 atk)
    (normal)  0
dmg = ((E.atk + P) * 8 * (enecarda[e] + 7 + rand(2) + 1))  /  (actor.def * (cardg[x] + 7) / 3)
```
Then: enemy school match (`E.hit-1 == enecardi[e]`) or `$ene_power_up`: ×1.2; defender class 9: ×0.85;
defender giant: ×0.7; defence-up (`$one_turn_cha_defense_up` / `$cha_defense_up`, item cards): ×0.7;
`set_damage_add` (passive hooks); element 11 → 0;
evasion `avoid = trunc((actor.agi*1.2 + cardg[x])/3 - (E.agi*1.1 + enecarda[e])/3)` + `get_avoid_add` (passives),
miss if `avoid > 0 && rand(100)+1 < avoid` unless element 29 / switch 130; 回避カード (`$cha_kaihi_card_flag`) forces a miss;
passive 不惜身命 forces a hit; event multiplier `var82`.

So the defender's **guard** stars and the attacker's **attack** stars both come from the single card each side
played; both also drive evasion. High agility + high guard = dodge.

### 4.4 Side effects (`chk_battle_damage`, `102:16406`)
- Player hit: `enehp -= dmg`; ≤ 0 → enemy dead (credited to that character).
  Stun (`STOP_TURN = 1`, `102:23`): element 12 → +1 turn (+1 more if school matched); 13 → +1 only if school matched;
  14 → +1. Element 25 reverts a giant enemy to normal form.
- Enemy hit: `actor.hp -= dmg` (passive やせ我慢 keeps 1 HP); element 15 = drain (enemy heals dmg);
  stun elements 12/14 (+1) and 13 (only if enemy school matched) unless passive 鋼の意志/自愛;
  element 60 = self-destruct (attacker dies, e.g. 栽培人 自爆 skill 304). HP ≤ 0 → character KO (`$chadeadchk`).

### 4.5 Skill element flags used by battle code (`Skills.element_set`)
10 non-attack/support (no target), 11 deals 0 damage, 12/13/14 stun, 15 drain, 20 KI cost −level/10,
24 enemy may use once per turn, 25 cancel giant form, 26 excluded by tactic, 27 小技, 28 大技, 29 never misses,
33 S-combo move, 60 attacker self-destructs; `element_set[0] == 4` = enemy combined attack. `scope`: 1 single, 2 all.

### 4.6 HP / KI recovery between turns — `turn_recover_hpki` (`010_Share.rb:10064`, from turn 2 on)
- HP: alive `+ceil(maxhp * 3 / 100)`; **KO'd** characters `+ceil(maxhp * 7.5 / 100)` (`$turn_recover_hp = 3`, ×2.5 when dead);
  giant ×1.3. A KO'd character whose HP reaches max **revives** (`010_Share.rb:10118-10123`). Passives (再生, 力の温存, …) add %.
- KI: alive only, `+ceil(maxmp * 2.5 / 100)` (`$turn_recover_ki = 2.5`), giant ×1.2, capped; passives add %.
- HP/KI are **not** restored after battle (only if switch 141 is on, `101:359`).

---

## 5. Enemy behaviour

- Each enemy gets one random card per attack (§1.5) — no AI in card choice.
- `ene_action_set` (`102:87678`): if the enemy card is **必 (0) or the enemy's own school** and the enemy has actions →
  special move; otherwise normal attack (`@ene_set_action = 1`).
- Special move pick: uniform random among `Enemies.actions`, re-rolled until valid:
  `condition_type 0` always valid; `condition_type 2` valid when `hp*100/maxhp <= condition_param2`;
  combined-attack skills need their partners; element-24 skills once per turn. (Other condition types never qualify.)
  `@ene_set_action = skill_id + 10`. Damage per §4.3 (enemy skill `base_damage` = % of enemy ATK).
- Target: random living character among those holding a card (§2.4); `scope 2` hits all of them.
- Attacks per turn = `Enemies.eva`.
- Enemy flags (`Enemies.element_ranks[n] == 1`): 22 boss HP display scaling, 23 large sprite, 45-48 school-match
  chance, 53 min attack ★5, 55 cards forced to 1/1, 34-44 / 51 chapter tags for the bestiary.
- Z1 Raditz-area actions: 甜菜人 → 痺れ液 (301, 150 %); 球根人 → エネルギー弾 (302, 150 %);
  奥尼恩 → (サイヤ人)エネルギー波 (305, 130 %), 貫光線 (306, 160 %), 大猿変身 (384, 350 %, only at HP ≤ 30 %);
  帕普金 → 305, 306. All their schools are 惑 (hit 6) → special move when card is 必 or 惑 (2/5 chance in early Z1).

---

## 6. Victory / defeat

Battle results (`101:1451-1560`): 1 start anime, 2 all enemies dead, 3 all party dead, 4 escaped,
8/9 story exits (event-specified, e.g. survive N turns `var94`).

Victory (`chk_all_enemy_dead`, `101:4243-4790`):
- **EXP** = Σ `Enemies.exp` × `$exp_rate` (Game.ini, default 1) ×1.5 while the ブリーフ博士 item is active (`var311`).
  **Every member of the full party (including reserves, `get_full_party`) gets the whole amount**,
  modified by `get_exp_add` (`010_Share.rb:9822`: favourite ×1.15, passive サイヤ人の血 ×1.1…).
- **CAP** (shown as "CAP", stored `var25`) = Σ `Enemies.gold` × `$cap_rate` (×1.5 with 亀の甲羅).
- **SP** (skill points) = Σ `Enemies.maxmp` × `$sp_rate` (×1.5 with 重い道着); each member's equipped passive skills
  gain SP and are learned when reaching `cha_skill_get_val` (`data/chaskill.json`).
- **ZP** per full-party member = number of enemies × ZP multiplier (1..5 by switches 496-499) (`101:4279`);
  level-ups also give `$levelup_add_zp = 50` ZP on a new max level (`028:555-562`).
- **Item-card drops** (`get_item_card`, `101:4928`): per enemy, `drop_item1` (kind 1 = item) with chance
  `1/denominator`; `drop_item2` with `1/get_card_drop_add(denominator)` (passives); ids ≤ 8 skipped when switch 126.
  These are inventory "item cards" (Items DB), not hand cards.
- Level-up: `change_exp` loops while `exp >= exp_list[level+1]` (`153_KGC_LimitBreak.rb:540`). Curve
  (`153_KGC_LimitBreak.rb:414`): `m = exp_basis`, `n = 0.75 + exp_inflation/200`;
  for `i = 2..final_level`: `exp[i] = exp[i-1] + Integer(m)`; for `k = 0,1,2` with `$expup_lv = [28,61,100]`,
  `$expup_num = [2500,4500,6500]` (`139_Public.rb:493`): if `i >= lv[k]` add
  `num[k]*(i-lv[k]) + (exp[i]-exp[i-1])/95` (k = 1,2 add `num[k]*(i-lv[k])` once more); then `m *= 1+n; n *= 0.9`.
  Max level `$actor_final_level_default = 199` (9999 after a flag, `010_Share.rb:12762`).
  Stats per level = `Actors.parameters[type, level]` (types 0 maxHP, 1 maxKI, 2 atk, 3 def, 4 spi, 5 agi);
  above 99: `p[99] + (p[99]-p[98])*(level-99)`. HP/KI are not refilled on level-up.

Defeat (result 3): Game Over scene (`Scene_Gameover`), unless the battle set `var239` (story continues) or it is the
Kaio sparring battle (`var41 == 130`: full heal, continue). Item-effect counters reset.

Escape (result 4): no rewards, counter `var213 += 1`, back to the map; HP/KI/KO state kept.

After any non-escape battle the turn counter, stuns, power-ups and flags are reset (`my_terminate`, `101:275-540`).

---

## 7. Field encounters (`Field_Main#encounter`, `140_Field_Main.rb:646`)

Called by the map's movement common event after **each card move** when no story event fired
(`map001` event 1: `$game_variables[13] = @map_id`, event check, `if var41 == 0 → @Fldwin.encounter`).
`$game_variables[13]` = current map id.

```
battle_enc = {var31: 1 → 1 (normal), 0 → 1.5 (few), else → 0.5 (many)}
encounter_count = 999 if passive 引き寄せ (616) else 0
if var39 == 0 (no Bubbles repel active):
   per-area: enc_rand = rand(trunc(K * battle_enc)); encounter if encounter_count >= enc_rand   (i.e. enc_rand == 0)
var39 -= 1 if > 0;  passive 追い払い (617) cancels any encounter
```
K = 5 for Z1 areas, 6 for Z2/Z3/Z4/ZG (4 for map 54). Probability per move = `1 / trunc(K*battle_enc)`:
Z1 normal **1/5**, few 1/7, many 1/2.

**Map 1 (and 5, 60, 65, 31) — Z1 ラディッツエリア / 蛇の道** (`140:673-686`):
- enemy count: `rand(3)+1` (**1–3**, uniform) if party size ≠ 1, else `rand(2)+1` (1–2).
- each enemy independently uniform from `[1, 2, 4, 5]` (`erea_enemy_no[rand(n)-1]`, `140:1180` — the −1 just wraps
  to the last element, still uniform 1/4 each):

| id | name (zh build) | HP | atk | def | agi | school | atk/turn | EXP | CAP | SP | drops (item, 1/den) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 甜菜人 | 38 | 9 | 15 | 3 | 惑 | 1 | 3 | 1 | 1 | 9 (1/4), 13 (1/8) |
| 2 | 球根人 | 48 | 10 | 18 | 6 | 惑 | 1 | 5 | 2 | 1 | 12 (1/4), 10 (1/8) |
| 4 | 奥尼恩 | 55 | 12 | 21 | 9 | 惑 | 1 | 10 | 2 | 1 | 20 (1/8), 25 (1/6) |
| 5 | 帕普金 | 60 | 11 | 18 | 12 | 惑 | 1 | 8 | 1 | 2 | 24 (1/4), 19 (1/8) |

- Enemies have **no level**: stats are the fixed DB values (`029_Game_Enemy.rb`); HP set to `maxhp` at encounter
  (`140:1181`). No troop table is used.
- Other Z1 areas for reference: Garlic maps 8/10/12 → 1–3 of [1,2,7,8,9] (maps 13/61 → 2–5); Vegeta map 15/63 → 2–6 of
  [1..6]; Willow 50 → 2–5 of [1,2,3,25], 51/64 → 2–6.
- Battle background is chosen from the tile under the player (`set_battle_map`, `140:1199`; Z1 field tile 1537/1545 → bg 0,
  Snake Road → 5, sea → 1). `battle_ready` (`140:1385`) plays the SE and switches to `Scene_Db_Battle` (escapable).

---

## 8. Data sources

| data | file / JSON | fields used |
|---|---|---|
| Actors | `Actors.rvdata` → `data/actors.json` | `class_id` (school+1), `initial_level`, `exp_basis`, `exp_inflation`, `parameters` (Table 6×levels: `data[type + level*6]`; 0 maxHP, 1 maxMP=KI, 2 atk, 3 def, 4 spi, 5 agi). Goku Lv1: 80/59/17/15/45/9; Piccolo Lv1: 80/50/16/24/60/12. |
| Classes | `data/classes.json` | `name` = school glyph; `learnings` (level → skill). |
| Enemies | `Enemies.rvdata` → `data/enemies.json` | `maxhp`, `maxmp` (= **SP reward**), `atk`, `def`, `agi`, `spi` (bestiary order), `hit` (= school+1), `eva` (= attacks/turn), `exp`, `gold` (= CAP), `drop_item1/2` (`kind`,`item_id`,`denominator`), `actions[]` (`skill_id`, `condition_type`, `condition_param2`), `element_ranks.data[n]==1` flags (§5), `note` (`*PARAM_HPRECOVER[n%]`), `levitate` (hidden in bestiary). |
| Skills | `Skills.rvdata` → `data/skills.json` | `base_damage` (player: flat power added to ATK; enemy: % of ATK), `mp_cost` (KI), `scope` (1 single, 2 all), `element_set` (§4.5), `message2` (proficiency sync list). `atk_f`/`spi_f`/`variance` are **not** used by this battle system. |
| Items | `data/items.json` | item cards (drops, shop); `element_set` 5-8 = card rank S/A/B/C. |
| Passive skills | `_chaskill.csv` → `data/chaskill.json` | `cha_skill_No`, `cha_skill_get_val` (SP needed), effects implemented in code. |
| S-combos | `_scombo.csv` → `data/scombo.json` | participants, required moves, card conditions. |
| ひらめき | `_tecspark.csv` → `data/tecspark.json` | sparks (new moves learned in battle). |
| Card synthesis | `_card_compo.csv` → `data/cardcompo.json` | menu feature, not battle. |
| Constants | `139_Public.rb` | `$Cardmaxnum=5`, `$turn_recover_hp=3`, `$turn_recover_ki=2.5`, `$levelup_add_zp=50`, `$cha_add_dmg_skill_level_max=999`, `$cha_add_dmg_atk_ratio=5`, `$cha_skill_level_max=99999`, `$expup_lv/$expup_num`. |

Runtime state worth mirroring: `$partyc`, `$chadead` (KO), `$cha_stop_num`, `$cardset_cha_no[card]=slot`,
`$cha_set_action[slot]` (1 = normal, skill+10 = special), `$cha_set_enemy[slot]`, `$battleenemy[i]` (enemy ids),
`$enehp[i]`, `$enedead[i]`, `$battle_turn_num`, `$cha_skill_level[skill]`, `$cha_normal_attack_level[actor]`.
