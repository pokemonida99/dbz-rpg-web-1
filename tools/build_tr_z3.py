"""Z3 時之間的區域（地圖 72 的門 9502～9554：地圖 73～77、83） — world.json data (read by src/tr_z3.js), added by tools/build_timeroom.py. Plan: docs/timeroom-plan.md.

The original (Map007 event 20 「Z3時の間」 pages 9501-9554, 145_Event_Check.rb `when 73` … `77`, `83`, 140_Field_Main.rb
encounter, battle_process 9504 …): the doors of map 72 run 9502 / 9551 / 9511 / 9521 / 9531 / 9541 — CE181, variable 43 =
921-926, the area map (a copy of a story map: 73 = 33, 74 = 37, 75 = 38, 76 = 39, 77 = 40, 83 = 82); its 時の間 square runs
9503 / 9552 / 9512 / 9522 / 9532 / 9542 (CE182, variable 43 = 999, back in front of the door). The bosses stand there as
map events with no conditions (fought again and again): their pages give no EXP (switch 124), the shared EXP / CAP / SP
of variables 306 / 317 / 318, the card drops of 241-250 (switch 477) and switch 141 (everyone healed after it); 9534
(Cooler) has switch 128 instead (variable 41 + 1 on a win → 9535, his last form, at once). Map 76 keeps the seven
balls of map 39 (page 1431 while switch 446 is off); map 77 has the special card square (variable 44 = 30), No. 20 at
(variables 308, 309) = (64,13) and two squares that take you between No. 20 and Nos. 16-18 (9545 / 9546).
No lines of their own: z1field 9504 … only runs battle_process.
"""

# the doors: page → the area map, where it puts you, variable 43, the 時の間 square and where it puts you back (9503 …)
AREAS = {
    9502: {'map': 73, 'at': (47, 46), 'v43': 921, 'exit': (47, 45), 'back': (3, 3)},
    9511: {'map': 74, 'at': (8, 10), 'v43': 922, 'exit': (8, 9), 'back': (13, 3)},
    9521: {'map': 75, 'at': (30, 9), 'v43': 923, 'exit': (30, 8), 'back': (18, 3)},
    9531: {'map': 76, 'at': (45, 48), 'v43': 924, 'exit': (45, 47), 'back': (23, 3)},
    9541: {'map': 77, 'at': (5, 57), 'v43': 925, 'exit': (5, 56), 'back': (28, 3)},
    9551: {'map': 83, 'at': (46, 43), 'v43': 926, 'exit': (46, 42), 'back': (8, 3)},
}
ROWS = {73: 99, 74: 39, 75: 69, 76: 74, 77: 69, 83: 45}  # (below: the original's control events / empty rows)

# Event_Check: card squares, inns, training squares
SQUARES = {
    73: {'card': [(72, 25), (36, 47), (8, 77), (58, 71)], 'inn': [(26, 83), (17, 6), (38, 42), (90, 1)], 'train': [(61, 16), (44, 48), (69, 63)]},
    74: {'card': [(51, 23), (15, 2)], 'inn': [(4, 8), (54, 3)], 'train': [(55, 16), (8, 13)]},
    75: {'card': [(34, 7), (58, 20), (55, 42), (9, 28)], 'inn': [(43, 16), (23, 28)], 'train': [(29, 16), (60, 12), (10, 46), (50, 34), (32, 47)]},
    76: {'card': [(14, 33), (44, 21)], 'inn': [(12, 42), (41, 45), (51, 11)], 'train': [(43, 21), (25, 43)]},
    77: {'card': [(21, 19), (8, 48), (45, 45), (59, 4)], 'inn': [(9, 43), (57, 36)], 'train': [(24, 44), (52, 54), (49, 6), (21, 11)]},
    83: {'card': [(40, 3), (65, 20)], 'inn': [(4, 31), (43, 40), (65, 4)], 'train': [(10, 10), (34, 10), (40, 38), (55, 13), (67, 20)]},
}

# the bosses: page → the button's name (the page's name), map, square, the story battle it repeats (battle_process
# `when 1197,9504` …: enemies, music), $Battle_MapID, the page's variables 306 / 317 / 318, drops (241-245 rate %,
# 246-250 card), switch 141 (heal) / 25 (alone) / 26 (hp30)
BOSSES = {
    9504: {'name': '克拉斯', 'map': 73, 'at': (78, 82), 'story': 1197, 'bg': 4, 'shared': 4000, 'cap': 12, 'sp': 6, 'drops': [[10, 33], [18, 16], [35, 108]]},
    9513: {'name': '皮拉爾', 'map': 74, 'at': (60, 22), 'story': 1273, 'bg': 4, 'shared': 3000, 'cap': 10, 'sp': 5, 'drops': [[18, 41], [13, 16], [35, 113]]},
    9523: {'name': '凱澤', 'map': 75, 'at': (9, 16), 'story': 1296, 'bg': 2, 'shared': 4000, 'cap': 14, 'sp': 7, 'drops': [[18, 51], [13, 52], [35, 101]]},
    9533: {'name': '古拉機甲戰隊', 'map': 76, 'at': (15, 15), 'story': 1318, 'bg': 5, 'shared': 15000, 'cap': 20, 'sp': 10,
           'drops': [[35, 153], [18, 51], [18, 52], [18, 53], [18, 54]]},
    9534: {'name': '古拉', 'map': 76, 'at': (16, 15), 'story': 1322, 'bg': 5, 'shared': 8000, 'cap': 10, 'sp': 5, 'drops': [[12, 61], [18, 33], [2, 44]],
           'heal': False, 'next': 9535},  # switch 128 (not 141): on to 9535
    9535: {'story': 1325, 'bg': 5, 'shared': 12000, 'cap': 20, 'sp': 10, 'drops': [[35, 112], [7, 38], [12, 98]]},
    9543: {'name': '20號・19號', 'map': 77, 'at': (64, 13), 'story': 1342, 'bg': 1, 'shared': 26000, 'cap': 28, 'sp': 14,
           'drops': [[35, 146], [7, 43], [3, 44], [4, 110], [6, 79]]},  # (at: variables 308 / 309)
    9544: {'name': '17號・18號', 'map': 77, 'at': (9, 10), 'story': 1363, 'bg': 4, 'shared': 32000, 'cap': 30, 'sp': 15, 'alone': True,
           'drops': [[35, 117], [10, 61], [10, 104], [10, 97], [10, 98]]},
    9547: {'name': '16號', 'map': 77, 'at': (10, 9), 'story': 1372, 'bg': 4, 'shared': 35000, 'cap': 32, 'sp': 15, 'drops': [[35, 107], [8, 33], [10, 18]]},
    9553: {'name': '卡里克 Jr.', 'map': 83, 'at': (5, 1), 'story': 1556, 'bg': 30, 'shared': 12000, 'cap': 20, 'sp': 10,
           'drops': [[35, 115], [7, 43], [3, 44], [4, 110], [6, 79]]},
    9554: {'name': '卡里克 Jr.（巨大化）', 'map': 83, 'at': (6, 1), 'story': 1565, 'bg': 30, 'shared': 15000, 'cap': 22, 'sp': 11,
           'drops': [[30, 118], [7, 43], [3, 44], [4, 110], [6, 79]]},
}

# 140_Field_Main.rb encounter (`when 33,73` 2-5, `37,74` 2-5 in the 時の間, `38,75`, `39,76`, `40,77`, `82,83` 4-6)
ENCOUNTERS = {73: ([103, 106, 109, 111, 114, 117], [2, 5]), 74: ([104, 107, 110, 112, 115, 118], [2, 5]),
              75: ([104, 107, 110, 112, 115, 118], [2, 5]), 76: ([105, 108, 110, 112, 115, 118], [2, 5]),
              77: ([137, 174, 175, 176], [2, 5]), 83: ([183, 184, 185], [4, 6])}

BALLS = [(53, 11), (21, 33), (19, 47), (21, 11), (25, 25), (49, 50), (14, 23)]  # map 76: 一星球 … 七星球
WARPS = [((11, 10), (61, 13), '前往20號那裡'), ((61, 13), (11, 10), '前往17號那裡')]  # 9545 / 9546


def add(world, h, z3, tr):
    build_map, D = h['build_map'], h['D']
    T = lambda x, y, label, page, **kw: dict(chapter='tr', x=x, y=y, label=label, page=page, **kw)
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (as the story maps they copy)
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}

    # ---------- the maps: flying (copies of the story maps), the bosses standing there (their map events) ----------
    tile_events = {}
    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        # only the boss sprites (enemy sheets): the story maps they copy do not draw the rest (animap1 woods …)
        m['ev'] = [e for e in tr['map_events'](D, mid, rows)
                   if any(isinstance(p[1], list) and p[1][0].startswith('enemy') for p in e[2])]
        tr['sheets'].update(p[1][0] for e in m['ev'] for p in e[2] if isinstance(p[1], list))
        world['maps'][str(mid)] = m
        pool, n = ENCOUNTERS[mid]
        world['areas'][str(mid)] = {'pool': pool, 'n': n}
        sq = SQUARES[mid]
        world['pois'][str(mid)] = at(sq['card'], CARD_SQ) + at(sq['inn'], INN) + at(sq['train'], TRAIN)
        # the map events' graphics by square (set_battle_map: get_event_id_and_graphic), for the field battles' backdrops
        best = {}
        for k, e in D('map%03d' % mid)['events'].items():
            g = e['pages'][0]['graphic']
            if int(k) == 2 or not g.get('character_name'):
                continue
            key = f"{e['x']},{e['y']}"
            if key not in best or int(k) > best[key][0]:
                best[key] = (int(k), [g['character_name'], g['character_index'], g['direction']])
        tile_events[str(mid)] = {k: v[1] for k, v in best.items()}

    for no, a in AREAS.items():
        world['pois'][str(a['map'])].append(T(*a['exit'], '回 Z3 時之間', 'trz3Leave', area=no))
    battles = world['z3']['battles']
    bosses = {}
    for no, b in BOSSES.items():
        st = battles[str(b['story'])]
        bosses[str(no)] = {'foes': st['foes'], 'bgm': st.get('bgm'), 'backdrop': f"bg/z3_battle_{b['bg']}.png",
                           'shared': b['shared'], 'cap': b['cap'], 'sp': b['sp'], 'drops': b['drops'],
                           'heal': b.get('heal', True), 'hp30': True, **({'alone': True} if b.get('alone') else {}),
                           **({'next': str(b['next'])} if b.get('next') else {})}
        if 'map' in b:
            world['pois'][str(b['map'])].append(T(*b['at'], f"和{b['name']}戰鬥", 'trz3Boss', boss=no))
    # map 77: the special card square, the two squares between No. 20 and the others
    world['pois']['77'] += [T(16, 21, '卡片商店', 'trz3Card30')] + [T(*f, label, 'trz3Warp', to={'map': '77', 'x': t[0], 'y': t[1]})
                                                                for f, t, label in WARPS]
    # map 76: the seven balls (page 1431 of the story, src/z3d.js), while that ball is not held and switch 446 is off
    world['pois']['76'] += [T(x, y, '調查這附近', 'trz3Ball', ball=k + 1, when=['sw', 446, False]) for k, (x, y) in enumerate(BALLS)]
    world['radar']['76'] = [{'x': x, 'y': y, 'when': ['sw', 446, False]} for x, y in BALLS]

    world['trZ3'] = {
        'areas': {str(no): {'to': tr['GO'](a['map'], *a['at']), 'v43': a['v43'], 'back': tr['GO'](72, *a['back'])} for no, a in AREAS.items()},
        'bosses': bosses,
        'tileEvents': tile_events,
    }
    world['extraBgm'] = sorted(set(world['extraBgm']) | {b['bgm'] for b in bosses.values() if b['bgm']}
                               | {world['maps'][str(m)]['bgm'] for m in ROWS})
