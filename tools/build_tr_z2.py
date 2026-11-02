"""Z2 時之間的區域（地圖 66 的門 9302～9341：地圖 67～71） — world.json data (read by src/tr_z2.js), added by tools/build_timeroom.py. Plan: docs/timeroom-plan.md.

The original (Map007 event 18 pages 9302-9362, 145_Event_Check.rb `when 67`-`71`, 140_Field_Main.rb encounter,
battle_process 9304-9349 = the story's 324 / 340 / 440 / 443 / 452 / 472-511):
  the doors of map 66 → 9302 / 9311 / 9321 / 9331 / 9341: CE181, variable 43 = 911-915, the area map (a copy of the
    story map 22 / 18 / 24 / 26 / 29: same tiles, the boss sprites as map events, a few squares changed)
  each area: card squares (chk_card), inns (41 = 11), training squares (chk_training), the exit → 9303 / 9312 /
    9322 / 9332 / 9342 (CE182, variable 43 = 999, back to the door), the boss square → its battle page: switches 122,
    124 (no EXP), 475, 477 (time room cards) and the page's own (25 / 26 / 27 extra attacks, 128 the next page after a
    win, 137, 141 full recovery), the drops (241-245 rate % / 246-250 card), shared EXP 306, CAP 317, SP 318
  map 71 (フリーザエリア) has ten squares that move between its parts (9353-9362) and the 9349 Turles & Slug square
    (switch 109 or 119, no sprite). Its encounters are the late Namek ones once Frieza is beaten (variable 43 = 915
    and switch 119).
Nothing in these pages turns a switch on for good: the hall's boss statues follow the story's switches.
"""

# 145_Event_Check.rb: the squares of each area ([x, y] lists)
CARDS = {67: [(4, 7), (1, 23), (20, 24), (38, 1)],
         68: [(14, 27), (28, 67), (63, 54), (78, 71), (75, 12), (58, 26)],
         69: [(29, 73), (56, 45), (20, 22), (30, 2)],
         70: [(12, 12), (36, 20)],
         71: [(8, 7), (10, 7), (22, 36), (14, 64), (54, 62), (45, 17), (10, 69)]}  # (10,69): variable 44 = 20 first
INNS = {67: [(31, 6)],
        68: [(10, 29), (15, 59), (50, 48), (71, 60), (77, 21)],
        69: [(24, 73), (13, 24), (37, 2), (45, 48)],
        70: [(6, 7), (54, 2), (52, 21)],
        71: [(10, 65), (50, 68), (19, 38), (40, 23)]}
TRAINS = {68: [(9, 24), (12, 57), (82, 15)],
          69: [(23, 22), (26, 11), (54, 52)],
          70: [(7, 16), (32, 5), (46, 11)],
          71: [(11, 71), (48, 27)]}
ROWS = {67: 35, 68: 85, 69: 85, 70: 35, 71: 89}  # as the story maps (tools/build_z2a.py, build_z2b.py): below, the control events

# the doors (Map007 event 18): page → the area map and where it lands, variable 43, the page back and its spot
AREAS = {
    9302: {'map': 67, 'at': (34, 7), 'v43': 911, 'exit': (34, 6), 'back': (3, 3), 'name': '邱夷區'},
    9311: {'map': 68, 'at': (13, 32), 'v43': 912, 'exit': (13, 33), 'back': (8, 3), 'name': '多多利亞區'},
    9321: {'map': 69, 'at': (26, 71), 'v43': 913, 'exit': (26, 72), 'back': (13, 3), 'name': '薩博區'},
    9331: {'map': 70, 'at': (5, 6), 'v43': 914, 'exit': (4, 6), 'back': (18, 3), 'name': '基紐區'},
    9341: {'map': 71, 'at': (12, 67), 'v43': 915, 'exit': (11, 67), 'back': (23, 3), 'name': '弗利薩區'},
}

# the boss pages (battle_process: enemies, $Battle_MapID, set_bgm; the page's switches and variables).
# drops: [rate %, card] from 241-245 / 246-250; next: 128 on, the page that follows a win (9323 → 9324, 9346 → 9347);
# alone / hp30 / hp40: switches 25 / 26 / 27 (src/battle.js attacks). 137 (大ダメージ instead of 倒した) is not in the
# remake's battles (the story's Frieza fights don't have it either).
BOSSES = {
    9304: {'foes': [40, 32, 35, 38], 'bd': 5, 'bgm': 'ZSSD 戦闘1', 'drops': [[3, 18], [10, 34], [35, 92]],
           'shared': 1500, 'cap': 12, 'sp': 6, 'heal': True},
    9313: {'foes': [43, 35, 32, 32], 'bd': 2, 'bgm': 'Z2 戦闘1(VRC6)', 'drops': [[10, 32], [8, 60], [35, 148]],
           'shared': 2000, 'cap': 14, 'sp': 7, 'heal': True},
    9323: {'foes': [45, 33, 36, 39], 'bd': 2, 'bgm': 'Z2 戦闘1(VRC6)', 'drops': [[7, 16], [8, 28], [3, 45]],
           'shared': 1700, 'cap': 8, 'sp': 4, 'next': 9324},
    9324: {'foes': [46], 'bd': 2, 'bgm': 'Z2 戦闘1(VRC6)', 'drops': [[9, 16], [10, 28], [35, 151]],
           'shared': 1900, 'cap': 10, 'sp': 5, 'heal': True},
    9333: {'foes': [51, 52, 48, 49, 50], 'bd': 2, 'bgm': 'ZArrang_劇場版BGM1', 'alone': True,
           'drops': [[35, 152], [6, 17], [10, 11], [10, 14], [10, 16]], 'shared': 4000, 'cap': 16, 'sp': 8, 'heal': True},
    9343: {'foes': [53], 'bd': 2, 'bgm': 'ZArrang_劇場版BGM1', 'drops': [[6, 33], [2, 38], [35, 150]],
           'shared': 5000, 'cap': 16, 'sp': 8, 'heal': True},
    9344: {'foes': [54], 'bd': 2, 'bgm': 'ZSB1 ピッコロのテーマ(GB音源Ver)', 'drops': [[7, 33], [2, 38], [35, 114]],
           'shared': 6500, 'cap': 16, 'sp': 8, 'heal': True},
    9345: {'foes': [55], 'bd': 2, 'bgm': 'ZSB1 フリーザのテーマ(GXSCC音源Ver)', 'drops': [[3, 33], [7, 41], [35, 123]],
           'shared': 8000, 'cap': 18, 'sp': 9, 'heal': True},
    # 493 / 9346: ソリッドステートスカウター with the planet Kanassa seen (93), Bardock in the party (109) and leading
    9346: {'foes': [56], 'bd': 2, 'bgm': 'ZSSD 戦闘2', 'sorid': 'ZArrang_ソリッドステートスカウター', 'hp30': True, 'hp40': True,
           'drops': [[3, 33], [8, 40], [3, 18]], 'shared': 9500, 'cap': 18, 'sp': 9, 'heal': True, 'next': 9347},
    9347: {'foes': [57], 'bd': 2, 'bgm': 'GBZ2 戦闘5', 'hp30': True, 'hp40': True, 'drops': [[3, 33], [8, 40], [35, 143]],
           'shared': 11000, 'cap': 18, 'sp': 9, 'heal': True},
    9348: {'foes': [58], 'bd': 2, 'bgm': 'ZSSD 戦闘1(GB音源Ver)', 'alone': True, 'hp30': True,
           'drops': [[3, 33], [8, 40], [35, 99]], 'shared': 11000, 'cap': 18, 'sp': 9, 'heal': True},
    9349: {'foes': [59, 60], 'bd': 2, 'bgm': 'ZG 戦闘4', 'alone': True, 'hp30': True,
           'drops': [[8, 40], [9, 41], [4, 18], [2, 38], [35, 122]], 'shared': 10000, 'cap': 18, 'sp': 9, 'heal': True},
}

# the boss squares (Event_Check): map, x, y, page, label, condition
BOSS_SPOTS = [
    (67, 5, 24, 9304, '邱夷', None),
    (68, 11, 33, 9313, '多多利亞', ['sw', 97, True]),
    (69, 8, 7, 9323, '薩博', None),  # 最長老の家
    (70, 57, 25, 9333, '基紐特戰隊', None),  # 池
    (71, 24, 4, 9343, '弗利薩（第１形態）', ['sw', 529, True]),
    (71, 23, 19, 9344, '弗利薩（第２形態）', ['sw', 530, True]),
    (71, 37, 59, 9345, '弗利薩（第３形態）', ['sw', 531, True]),
    (71, 39, 59, 9346, '弗利薩（最終形態）', ['sw', 119, True]),
    (71, 38, 58, 9348, '貝吉塔（超）', ['sw', 119, True]),
    (71, 11, 5, 9349, '達列斯・史拉格', ['any', ['sw', 109, True], ['sw', 119, True]]),  # (no sprite in the original)
]

# map 71: the squares that move between its parts (9353-9362)
WARPS = [((12, 5), (22, 17), '弗利薩（第２形態）'), ((24, 5), (24, 17), '弗利薩（第２形態）'),
         ((22, 17), (12, 5), '達列斯・史拉格'), ((24, 17), (24, 5), '弗利薩（第１形態）'),
         ((22, 21), (13, 64), '入口'), ((24, 21), (38, 56), '弗利薩（第３形態）'),
         ((13, 64), (22, 21), '弗利薩（第２形態）'), ((15, 66), (36, 57), '弗利薩（第３形態）'),
         ((36, 57), (15, 66), '入口'), ((38, 56), (24, 21), '弗利薩（第２形態）')]

# 140_Field_Main.rb encounter (`when 22,67` / `18,68` / `24,26,29,69,70,71`)
NAMEK = {'pool': [32, 35, 38, 41, 42], 'n': [3, 5], 'alone': [1, 2]}
ENCOUNTERS = {67: {'pool': [31, 34, 37], 'n': [3, 5]}, 68: {'pool': [31, 34, 37], 'n': [2, 5]}, 69: NAMEK, 70: NAMEK,
              71: dict(NAMEK, late={'var43': 915, 'pool': [33, 36, 39, 42, 44, 47]})}  # (switch 119 too: src/tr_z2.js)
# set_battle_map, scenario_progress = variable 301 (1 in the Z2 hall): the row of Z2_戦闘_背景 by the ground tile
BACKDROPS = {'2048': 0, '1543': 2, '1551': 2, '1580': 2, '1581': 2, '1588': 2, '1590': 2, '1596': 2, '1598': 2, '1575': 3, '1542': 5}

INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
CARD = {'label': '卡片商店', 'effect': 'shop'}
TRAIN = {'label': '修行', 'effect': 'training'}


def add(world, h, z3, tr):
    build_map, D = h['build_map'], h['D']
    map_events, sheets, GO = tr['map_events'], tr['sheets'], tr['GO']
    T = lambda **kw: dict(chapter='tr', **kw)
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]

    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        m['ev'] = map_events(D, mid, rows, sheets)  # the boss sprites (src/field.js draws them by the switches)
        world['maps'][str(mid)] = m
        world['areas'][str(mid)] = ENCOUNTERS[mid]
        world['pois'][str(mid)] = at(CARDS[mid], CARD) + at(INNS[mid], INN) + at(TRAINS.get(mid, []), TRAIN)

    areas = {}
    for page, a in AREAS.items():
        areas[str(page)] = {'to': GO(a['map'], *a['at']), 'v43': a['v43'], 'back': GO(66, *a['back'])}
        world['pois'][str(a['map'])].append(T(x=a['exit'][0], y=a['exit'][1], label='回到時之間', page='z2exit', area=page))
    for mid, x, y, page, label, when in BOSS_SPOTS:
        p = T(x=x, y=y, label=label, page='z2boss', boss=page)
        if when:
            p['when'] = when
        world['pois'][str(mid)].append(p)
    for (x, y), to, name in WARPS:
        world['pois']['71'].append(T(x=x, y=y, label=f'移動：往{name}', page='z2warp', to=GO(71, *to)))

    world['trz2'] = {
        'areas': areas,
        'maps': [str(m) for m in ROWS],
        'battles': {str(k): {**{x: y for x, y in b.items() if x != 'bd'}, 'backdrop': f"bg/z2_battle_{b['bd']}.png"}
                    for k, b in BOSSES.items()},
        'backdrops': BACKDROPS,
    }
    world['extraBgm'] = sorted(set(world['extraBgm']) | {b['bgm'] for b in BOSSES.values()} | {b['sorid'] for b in BOSSES.values() if 'sorid' in b}
                               | {world['maps'][str(m)]['bgm'] for m in ROWS})
