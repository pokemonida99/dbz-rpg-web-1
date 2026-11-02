"""Z4 第三章 新生貝吉塔父子出擊（地圖 46・44） — world.json data, added by tools/build_z3.py (read by src/z4c.js).
docs/z4bc.md has the whole chapter with the original's sources; the helpers are tools/build_z4b.py's.

The original: Map007 event 7 「Z4_セル編」 pages 16-21 (variable 41 = 2191-2361), the scenes 143_Event_Main.rb z1field
2191-2364 (all.rb 176086-176900), the spots of maps 46 and 44 (145_Event_Check.rb `when 46` / `when 44`), the
encounters of map 46 (140_Field_Main.rb `when 46,89`), battle_process 2256 and set_battle_event 7 (all.rb 52555):
  2191 (page 16) after battle 2188 (switches 142 / 144: they got away, 143: Cell beaten): Goku's instant transmission,
       Krillin meets Bulma (the controller), the lookout, Vegeta and Trunks out of the room, the battle suits, Cell
       threatens the islands → map 46 (7,9), party [12,17]
  map 46 (40,34) → 2251 (page 17) → battle 2256 (Super Vegeta and Super Trunks, ×4 / enemy ×0.5, 5 turns) →
       2261 (page 18): 「超級貝吉塔」, Krillin and No. 18, Trunks, the 太陽拳, No. 18 absorbed (CE68), the perfect Cell,
       the film 2281 (Final Flash) → 2291 (page 19): Vegeta beaten, Trunks fights; Goku and Gohan in the room →
       map 44 (9,8), party [3,5], variable 121 = 2
  map 44 (15,4) → 2331 (page 20): CE40, 流派一致修行 (Scene_Db_Ryuha_Pair_Training, pattern 2) → variable 41 + 10 →
       2341 (page 21): Cell's tournament, No. 16, Goku sees the perfect Cell, off to New Namek → variable 41 = 2701
"""
import build_z4b  # noqa: E402  (the shared helpers of chapters 2 and 3)

MAP46, MAP44 = '46', '44'


def add(world, h, z3):
    build_map, root = h['build_map'], h['root']
    file = z3['file']

    # ---------- map 46 ----------
    world['maps'][MAP46] = build_map(46, rows=59)  # (row 59: the original's control events)
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois'][MAP46] = at([(4, 43), (66, 5), (57, 46)], SHOP) + at([(11, 11), (60, 44)], INN) + at([(7, 15), (38, 35), (61, 4)], TRAIN)
    # map 46 event 59 セル (enemy1.png character 7) at (40,34) → 2251
    world['bosses'][MAP46] = [{'x': 40, 'y': 34, 'index': 7, 'flag': 'z4cCell', 'key': 'cell2'}]
    # 140_Field_Main.rb `when 46,89`: 1-3 of these
    world['areas'][MAP46] = {'pool': [137, 174, 175, 176, 189, 193, 207, 212], 'n': [1, 3]}

    # ---------- map 44 精神と時の部屋 (the first, third and fifth chapters use it too: variable 121 = 1 / 2 / 3) ----------
    # Only what is not there yet is added, so the chapters' builders don't overwrite each other (docs/z4bc.md). The
    # training square is one spot for all of them: chapter 'z4' hands it to the chapter being played (src/z3.js z3Spot).
    if MAP44 not in world['maps']:
        world['maps'][MAP44] = build_map(44, rows=14)  # (row 14: the original's control events)
    pois = world['pois'].setdefault(MAP44, [])
    have = {(p['x'], p['y']): p for p in pois}
    for p in [dict(SHOP, x=11, y=8), dict(INN, x=4, y=4), {'x': 15, 'y': 4, 'label': '開始修行', 'chapter': 'z4', 'kind': 'timeroom'}]:
        if (p['x'], p['y']) not in have:
            pois.append(p)
        elif p.get('kind') == 'timeroom':
            have[(15, 4)].update(chapter='z4', kind='timeroom')
    world['areas'].setdefault(MAP44, None)  # (140_Field_Main.rb: no encounters in the room)

    # ---------- the pages ----------
    page, done, faces = build_z4b.converter(h, z3)
    pages = {str(v): page(v) for v in (2191, 2261, 2291, 2341)}
    pages['2251'] = z3['split_battle'](page(2251))
    pages['2331'] = z3['split_battle'](page(2331))  # (z1field 2331 is the training, src/z3train.js)
    done()
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    world['z3']['pages'].update({'z4c' + k: v for k, v in pages.items()})

    # ---------- the scenes, the film ----------
    sc = build_z4b.scenes(root, file, 2191, 2364, {2256, 2281, 2301, 2331})
    world['z3']['titles']['z4c'] = 'Z4　第三章　新生貝吉塔父子出擊'
    world['z3']['z4c'] = {
        'scenes': sc,
        'field': {'map': MAP46, 'x': 7, 'y': 9},  # page 16: party [12,17]
        'room': {'map': MAP44, 'x': 9, 'y': 8},  # page 19: party [3,5], variable 121 = 2
        # set_battle_event 7: Super Vegeta's Final Flash (action 140 = move 130) on the perfect Cell
        'films': {'2281': {'party': 19, 'foe': 129, 'acts': [[1, 130, 1]]}},
    }
    build_z4b.assets(world, pages, build_z4b.scene_pics(sc) | {file('Z3_背景_精神と時の部屋')})
