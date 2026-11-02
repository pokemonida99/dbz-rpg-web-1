"""Z4 時之間的區域（地圖 85／86 的門 9702～9771：地圖 87～95） — world.json data (read by src/tr_z4.js), added by tools/build_timeroom.py. Plan: docs/timeroom-plan.md, the whole part: docs/tr-z4.md.

The original: Map007 event 21 「Z4時の間」 pages 9701-9773, 145_Event_Check.rb `when 85,86` (the doors) and `when 87` …
`when 95` (the areas' squares), 140_Field_Main.rb `when 42,87` … `when 48,95` (the encounters), battle_process 9704 …
9773 (the same battles as the story's 2015 … 2561) and set_battle_map (the field battles' backgrounds):
  a door (9702 …) → CE181, variable 43 = 931 … 937, the area map; its 時の間 square (9703 …) → CE182, variable 43 = 999,
  back to the door of map 85 (after Z4, switch 458) or 86; its boss square (9704 …) → the battle page: no EXP (124), no
  card (122), the time-room cards (477: variables 241-250), shared EXP / CAP / SP (306 / 317 / 318), recovery after
  (141), the extra-attack switches 25 / 26 / 28 / 29; 9755 (No. 13) turns 128 on: won, 9756 (No. 13 merged) follows.
  Map 94 has six squares that carry the party between Nos. 15, 14 and 13 (9761-9766).
"""

# a door: the page, the area map (rows: the last one holds the original's control events), where it puts the party,
# variable 43, the 時の間 square there and the x of its door in the hall (the way back is (x, 3) of map 85 / 86), its
# boss squares (x, y, page, name), the encounters (140_Field_Main.rb: the pool, rand(n) + lo) and its name (CE story_string)
AREAS = [
    {'door': 9702, 'map': 87, 'rows': 64, 'at': (66, 46), 'v43': 931, 'back': (67, 46), 'hall': 3,
     'bosses': [(19, 9, 9704, '威洛（強）')], 'pool': [137, 174, 175, 176, 189, 193, 207], 'n': [2, 5]},
    {'door': 9711, 'map': 88, 'rows': 59, 'at': (58, 5), 'v43': 932, 'back': (59, 5), 'hall': 8,
     'bosses': [(8, 41, 9713, '賽魯（第一形態）')], 'pool': [137, 174, 175, 176, 189, 193, 207, 212], 'n': [2, 5], 'alone': [1, 1]},
    {'door': 9721, 'map': 89, 'rows': 59, 'at': (7, 10), 'v43': 933, 'back': (7, 9), 'hall': 13,
     'bosses': [(40, 34, 9723, '賽魯（第二形態）')], 'pool': [137, 174, 175, 176, 189, 193, 207, 212], 'n': [2, 5]},
    {'door': 9731, 'map': 91, 'rows': 69, 'at': (8, 48), 'v43': 934, 'back': (7, 48), 'hall': 18,
     'bosses': [(68, 3, 9733, '金屬古拉')], 'pool': [229, 230, 231, 232], 'n': [2, 5]},
    {'door': 9741, 'map': 92, 'rows': 64, 'at': (6, 51), 'v43': 935, 'back': (5, 51), 'hall': 23,
     'bosses': [(49, 10, 9743, '金屬古拉核心')], 'pool': [229, 230, 231, 232], 'n': [3, 6]},
    {'door': 9751, 'map': 94, 'rows': 54, 'at': (59, 29), 'v43': 936, 'back': (60, 29), 'hall': 28,
     'bosses': [(10, 24, 9753, '15 號'), (31, 22, 9754, '14 號'), (65, 17, 9755, '13 號')],
     'pool': [234, 235, 236, 237], 'n': [3, 6]},
    {'door': 9771, 'map': 95, 'rows': 84, 'at': (74, 63), 'v43': 937, 'back': (75, 63), 'hall': 33,
     'bosses': [(44, 35, 9773, '賽魯（完全體）')], 'pool': [197, 199, 201, 203, 205], 'n': [3, 6]},
]
# 145_Event_Check.rb: the card squares (chk_card), the inns (variable 41 = 11) and the training squares (chk_training)
SQUARES = {
    87: ([(80, 3), (5, 50), (17, 2), (77, 37)], [(17, 43), (52, 5), (10, 2), (61, 44)], [(5, 7), (15, 37), (66, 7), (66, 36)]),
    88: ([(4, 8), (51, 36), (14, 42), (77, 37)], [(62, 11), (10, 5), (8, 46)], [(6, 11), (4, 39), (21, 25), (48, 36)]),
    89: ([(4, 43), (66, 5), (57, 46)], [(11, 11), (60, 44)], [(7, 15), (38, 35), (61, 4)]),
    91: ([(6, 37), (30, 10), (28, 26), (46, 32), (58, 14), (81, 27), (52, 49)],
         [(16, 49), (43, 16), (54, 51), (74, 15), (21, 8)], [(22, 47), (8, 9), (33, 17), (56, 23), (56, 53), (78, 29)]),
    92: ([(8, 47), (50, 34), (25, 8)], [(3, 48), (14, 12), (37, 28), (79, 40)], [(11, 53), (61, 28), (29, 17)]),
    94: ([(18, 19), (29, 16), (28, 42), (31, 14), (46, 8), (58, 25)], [(13, 22), (28, 18), (38, 10), (43, 7), (62, 27)],
         [(11, 17), (20, 38), (27, 18), (33, 4), (57, 28), (58, 15)]),
    95: ([(10, 13), (8, 65), (79, 32)], [(6, 42), (80, 9), (72, 66)], [(14, 50), (30, 10), (60, 11), (55, 66)]),
}
CARD40 = (95, 38, 29)  # map 95 カード特殊: variable 44 = 40, then chk_card
# map 94: the squares between the androids (the page, the square, where it puts the party, its name)
WARPS = [(9761, (11, 23), (62, 17), '13 號'), (9762, (11, 25), (31, 21), '14 號'), (9763, (34, 21), (62, 19), '13 號'),
         (9764, (31, 21), (11, 25), '15 號'), (9765, (62, 17), (11, 23), '15 號'), (9766, (62, 19), (34, 21), '14 號')]
# battle_process: the time-room page → the story battle it shares (`when 2015,9704` …: the enemies, the music) and
# its $Battle_MapID (Z3_戦闘_背景 row)
BATTLES = {9704: (2015, 2), 9713: (2153, 1), 9723: (2256, 1), 9733: (2736, 0), 9743: (2782, 33),
           9753: (2832, 6), 9754: (2842, 6), 9755: (2852, 6), 9756: (2871, 6), 9773: (2561, 29)}
# the battle page's switches → src/battle.js options (all.rb 140508)
FLAGS = {25: 'alone', 26: 'hp30', 27: 'hp40', 28: 'two', 29: 'hp50'}


def add(world, h, z3, tr):
    build_map, D = h['build_map'], h['D']
    pages = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['21']['pages']
             if p['condition']['variable_valid']}
    battles = world['z3']['battles']
    T = lambda **kw: dict(chapter='tr', **kw)
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (variable 43 = 931-937: 卡林大人 / 丹迪 / 機器人兵)
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]

    # ---------- the boss pages: the battle and what the page sets before it ----------
    bosses = {}
    for no, (story, row) in BATTLES.items():
        sw, var = {}, {}
        for c in pages[no]:
            if c['code'] == 121:
                sw[c['parameters'][0]] = c['parameters'][2] == 0
            elif c['code'] == 122 and c['parameters'][3] == 0:
                var[c['parameters'][0]] = c['parameters'][4]
        assert sw.get(124) and sw.get(477) and sw.get(475), no
        b = {'foes': battles[str(story)]['foes'], 'bgm': battles[str(story)]['bgm'], 'backdrop': f'bg/z3_battle_{row}.png',
             'shared': var[306], 'cap': var[317], 'sp': var[318],
             'drops': [[var[241 + k], var[246 + k]] for k in range(5)], 'heal': bool(sw.get(141))}
        b.update({name: True for n, name in FLAGS.items() if sw.get(n)})
        if sw.get(128):
            b['next'] = no + 1  # chk_set_event_no: variable 41 + 1
        bosses[str(no)] = b

    # ---------- the areas ----------
    doors = {}
    for a in AREAS:
        mid = a['map']
        m = build_map(mid, rows=a['rows'])
        # the boss sprites (the map's events with a character other than the animap1 trees and rocks, which the
        # story's copies of these maps do not draw either)
        m['ev'] = [e for e in tr['map_events'](D, mid, a['rows'], None)
                   if any(isinstance(p[1], list) and not p[1][0].startswith('animap') for p in e[2])]
        for e in m['ev']:
            for p in e[2]:
                if isinstance(p[1], list):
                    tr['sheets'].add(p[1][0])
        world['maps'][str(mid)] = m
        area = {'pool': a['pool'], 'n': a['n']}
        if 'alone' in a:
            area['alone'] = a['alone']  # (map 88: one enemy for a party of one)
        world['areas'][str(mid)] = area
        cards, inns, train = SQUARES[mid]
        pois = at(cards, SHOP) + at(inns, INN) + at(train, TRAIN)
        pois.append(T(x=a['back'][0], y=a['back'][1], label='回到時之間', page='z4back', hall=a['hall']))
        pois += [T(x=x, y=y, label=f'挑戰{name}', page='z4boss', boss=no) for x, y, no, name in a['bosses']]
        if mid == CARD40[0]:
            pois.append(T(x=CARD40[1], y=CARD40[2], label='卡片商店', page='z4card40'))
        if mid == 94:
            pois += [T(x=x, y=y, label=f'前往{name}那裡', page='z4warp', to={'map': '94', 'x': tx, 'y': ty})
                     for _, (x, y), (tx, ty), name in WARPS]
        world['pois'][str(mid)] = pois
        doors[str(a['door'])] = {'map': str(mid), 'x': a['at'][0], 'y': a['at'][1], 'v43': a['v43']}

        # the field battles' backgrounds: src/z3.js z3BackdropAt (set_battle_map) reads the map events by square
        # (get_event_id_and_graphic: the highest id there, its first page) for the forest / grove rows
        evs = {}
        for k, e in D('map%03d' % mid)['events'].items():
            g = e['pages'][0]['graphic']
            if int(k) == 2 or not g.get('character_name'):
                continue
            key = f"{e['x']},{e['y']}"
            if key not in evs or int(k) > evs[key][0]:
                evs[key] = (int(k), [g['character_name'], g['character_index'], g['direction']])
        world['z3']['tileEvents'][str(mid)] = {k: v[1] for k, v in evs.items()}

    world['trZ4'] = {'doors': doors, 'bosses': bosses}
