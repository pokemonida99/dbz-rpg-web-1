# Chapter 2 (蛇道・桑修篇) — branch claude/chapter-2-46b1ba, commit cc28f20 (on top of main fae8521)

## Original structure after Raditz (Map007 event 1 pages by var 41; spots in 145_Event_Check.rb)
- 60: Raditz last words → Vegeta/Nappa (ch1 ending stops here) → Kami/Goku death (sw864/865 = Goku/Piccolo KO'd vs Raditz; remake can't tell, so the "both alive" branch plays) → Enma → Snake Way → Garlic Jr. revives (吉加・尼奇・桑修) → Karin Tower → Scene_Team_Divide (vars 45-50 = N,N,E,E,W,W) → Goku sets off
- Map 5 Snake Way (Goku alone, Raditz-area encounters): 80 爺爺, 81 藍鬼, 82 紅鬼, 83 end of road → 84 King Kai + "north team" intro (sw50 = Piccolo+Gohan pair scene)
- Map 8 Sansho area (north pair, encounters [1,2,7,8,9] ×1-3): 91 普爾 (Yamcha branch on var42==7), 92 桑修 → battle enemy 15 → 94 (二星球, Goku starts Bubbles training) — chapter 2 ends here
- （2026-11-02：下面這些後來都做好了，Z1 全篇已完成，見 docs/HANDOFF.md）Next (not built at the time): 9 Bubbles minigame → 99 → map 10 Nikki (east pair, 101/102/104) → 11 Gregory minigame → 109 → map 12 Ginger (west pair, 111/112/114) → map 13 Garlic area (117 three henchmen, 121/123 Garlic Jr two forms, 127) → map 14 King Kai battle (130/132) → Shenron (map 117) → map 15 Vegeta area (Saibamen 147, Nappa 150, Vegeta 154)
- Z1 special moves per actor: common event 9 (必殺技設定). Gohan 46 + 47 魔閃光 (CE9: unless sw368, the Great Ape, is on).

## What the branch changes
- New: tools/build_chapter2.py (world.chapter2, areas, bosses, maps 5/8, POIs, actors 5-9, enemies 7/8/9/15, skills, faces, extraBgm), src/chapter2.js (flow + team-split UI + chapter cards, injects its own CSS)
- tools/build_data.py: 2 lines at the end calling build_chapter2.add(world, globals())
- tools/copy_assets.py: also copies world.extraBgm
- src/field.js: boss per map via world.bosses + flag (Field.boss()), enemy1.png character index, flying sprite = var 42 leader (actor id - 3)
- src/main.js: ~8 lines — import; onStep uses rollArea(); interact() hands `poi.chapter` spots to chapterSpot(); onBoss() hands non-map-1 bosses to chapterBoss(); after Raditz → afterRaditz() instead of showTitle('第一章　完'); goal text via chapterGoal(); load() → resumeChapter() (old saves stopped after Raditz continue into ch2); game.startField/save/showTitle exposed
- src/anime.js: 20 new move animations (46,47,61-64,71-73,81-84,91-93,307,321,324,325)
- Data pipeline: `ruby tools/extract.rb game/Data data 1 5 6 7 8`

## Known gaps / follow-ups
- Title subtitle still says 「Z1 拉蒂茲篇（試玩）」 (main.js showTitle default) — remake session's call.
- Card gifts from NPCs (items) are not kept (events.js ignores items), same as chapter 1.
- No cutscene backgrounds (Z1_背景_*) for the chapter-2 scenes yet; the opening-cutscene work could be reused.

## Status (checkpoint)
- Done: chapter 2 is complete and tested at 390×844 (commit cc28f20). The remake session (local_96b407db…) has been told it can merge it; it has not been merged or deployed yet.
- Next: the merge and deploy are done by the remake session. Chapter 3 would cover the Bubbles minigame, the Nikki area (east pair, map 10) and the Gregory minigame.
- Open questions: whether to rename the title subtitle; whether to add cutscene backgrounds (original Z1_背景_* pictures exist, so no generated art is needed).
