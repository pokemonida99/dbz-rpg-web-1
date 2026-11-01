"""Z3 第二章 魔凶星篇 (maps 78-82) — world.json data, added by tools/build_z3.py (read by src/z3b.js). docs/z3b.md has
the whole chapter.

The original: Map007 event 5 pages 59-70 (variable 41 = 1440-1571) and 73 (1583, Yajirobe), their scenes z1field
1440-1571 / 1583 (143_Event_Main.rb, src/z3b.js SCENES), the spots of 145_Event_Check.rb (`when 78` … `when 82`), the
battles of battle_process (1472 / 1492 / 1512 / 1532 / 1556 / 1565) and the encounters of 140_Field_Main.rb
(`when 78,79,80,81` / `when 82,83`).
  1440 Piccolo trains, Kami; Garlic Jr. takes the lookout; the Kame House: four teams (the choice of page 59 for
       Gohan's team and Yamcha's: variables 314 / 315 / 316 = 6 east, 4 west, 2 south; switches 536-538)
  → map 78 east (63,6): ガッシュ (29,21) 1471 → battle 1472 → 1481 → map 79 west (7,39): ビネガー (60,6) 1491 →
    1492 → 1501 → map 80 south (22,38): ゾルド (23,23) 1511 → 1512 → 1521: Piccolo alone in the north, Vegeta joins
    → map 81 north (60,42): タード (6,6) 1531 → 1532 → 1541: everyone together → map 82 (46,42): Karin Tower (5-6,1-3)
    1551 → battle 1556 (Garlic Jr. with Ginger, Nicky, Sansho) → 1561 the Makyo Star → 1565 (Garlic Jr. giant with
    the four revived) → 1571 → variable 41 = 1230 (z3c). Yajirobe on map 82 (30,26): 1583 (the cards, once: sw1311).
Each area is played by the team that chose that direction (east / west / south by variables 314-316, the north is
Piccolo's); variable 43 (概況) 65 → 69 (+1 for each of them beaten, 70 at Karin Tower).
"""
import os

DIRS = {'東': 6, '西': 4, '南': 2}  # page 59: variable 314 / 315 / 316 of the team that goes that way
DIR_SW = {'東': 536, '西': 537, '南': 538}
INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (variable 41 = 11: Map007 event 1 page 11, as in Z2)
CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}  # chk_card
TRAIN = {'label': '修行', 'effect': 'training'}  # chk_training
at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]

# 145_Event_Check.rb `when 78` … `when 82` (all.rb 185366-185490): card squares, inns, training squares
SPOTS = {
    78: {'card': [(7, 8), (46, 5), (51, 38), (4, 36), (27, 13)], 'inn': [(11, 6), (40, 41), (36, 15), (61, 7)],
         'train': [(9, 7), (39, 19), (66, 10), (38, 41)]},
    79: {'card': [(17, 40), (36, 20), (45, 6)], 'inn': [(8, 33), (23, 7), (62, 38)],
         'train': [(17, 21), (38, 20), (34, 42), (62, 29), (57, 14)]},
    80: {'card': [(16, 37), (20, 25), (19, 5)], 'inn': [(26, 37), (30, 12), (33, 26)],
         'train': [(19, 33), (12, 4), (21, 24), (45, 31)]},
    81: {'card': [(5, 43), (44, 29), (67, 1)], 'inn': [(61, 43), (68, 2), (37, 11)],
         'train': [(58, 43), (68, 1), (21, 25), (4, 42)]},
    82: {'card': [(40, 3), (65, 20)], 'inn': [(4, 31), (43, 40), (65, 4)],
         'train': [(10, 10), (34, 10), (40, 38), (55, 13), (67, 20)]},
}
# the four of the Demon Clan (map event EV069, Graphics/Characters/enemy6.png character 0: its direction picks who —
# down ガッシュ, left タード, right ビネガー, up ゾルド); the spot of each is where he stands
DEMONS = [  # map, x, y, sheet row, page (Event_Check), flag
    ('78', 29, 21, 0, 1471, 'z3bEast'),
    ('79', 60, 6, 2, 1491, 'z3bWest'),
    ('80', 23, 23, 3, 1511, 'z3bSouth'),
    ('81', 6, 6, 1, 1531, 'z3bNorth'),
]
# where each page sends the party (201 transfer: map, x, y)
TO = {'1440': {'map': '78', 'x': 63, 'y': 6}, '1481': {'map': '79', 'x': 7, 'y': 39}, '1501': {'map': '80', 'x': 22, 'y': 38},
      '1521': {'map': '81', 'x': 60, 'y': 42}, '1541': {'map': '82', 'x': 46, 'y': 42}}
# battle_process $Battle_MapID of the story battles (all.rb 182916-182938): the Z3_戦闘_背景 row
BATTLE_BG = {'1472': 4, '1492': 5, '1512': 2, '1532': 6, '1556': 30, '1565': 30}

# who speaks with which face, besides the party and the enemies (tools/build_z3.py): 顔カード column 2 = Z3, the
# Z3_顔敵 rows of the three of Garlic Jr.'s old men (z1field 1553-1555: rows 86-88)
CARD_FACES = {'天神': 10, '波波先生': 12, '波波': 12, '布爾瑪': 8, '海龜': 49, '亞奇洛貝': 23}
FOE_FACES = {'吉加': 86, '尼奇': 87, '桑修': 88}


def backdrop_table(world, mid, D):
    """set_battle_map for variable 40 >= 2 (all.rb 165937): the bottom tile picks the row; on the plains (1552 / 1555)
    the top tile 274 / 275 is 4 and the map events' trees (animap1 0 facing down / 1 facing right) 2 / 9; cliffs
    (1600-1602) by variable 101 (1 on map 81, set by page 1521: 6). Positions that differ from their tile go in `at`."""
    m = world['maps'][str(mid)]
    w, n = m['w'], m['w'] * m['h']
    t = {'1552': 1, '1555': 1, '1553': 5, '1554': 6, '1543': 0, '1551': 0, '1575': 32, '1550': 29,
         '1600': 1, '1601': 1, '1602': 1, 'default': 1}
    if mid == 81:
        t.update({'1600': 6, '1601': 6, '1602': 6})
    trees = {}
    for e in D('map%03d' % mid)['events'].values():
        g = e['pages'][0]['graphic']
        if g.get('character_name') == 'animap1':
            trees[e['x'] + e['y'] * w] = 2 if (g['character_index'], g['direction']) == (0, 2) else \
                9 if (g['character_index'], g['direction']) == (1, 6) else 1
    raw = D('map%03d' % mid)['data']
    top = lambda i: raw['data'][i % w + (i // w) * raw['x'] + 2 * raw['x'] * raw['y']]
    over = {}
    for i in range(n):
        tile = m['layers'][0][i]
        if tile in (1552, 1555):
            row = 4 if top(i) in (274, 275) else trees.get(i, 1)
        elif tile == 1554:
            row = 7 if top(i) == 276 else 6
        else:
            continue
        if row != t[str(tile)]:
            over[str(i)] = row
    t['at'] = over
    return t


def add(world, h, z3):
    build_map, D, s2t, script = (h[k] for k in ('build_map', 'D', 's2t', 'script'))
    nodes_of, raw, file = z3['nodes_of'], z3['raw'], z3['file']
    ce = D('commonevents')

    # ---------- maps, spots, the four demons, encounters, battle backgrounds ----------
    for mid in range(78, 83):
        world['maps'][str(mid)] = build_map(mid, rows=45)  # (rows 45-53 are empty, row 54 the original's control events)
    for mid, sp in SPOTS.items():
        world['pois'][str(mid)] = at(sp['card'], CARD_SQ) + at(sp['inn'], INN) + at(sp['train'], TRAIN)
    # Karin Tower (5-6, 1-3: two spots cover the six squares) and Yajirobe (30,26)
    world['pois']['82'] += [{'x': 5, 'y': 2, 'label': '前往天神的神殿', 'chapter': 'z3b', 'page': 1551},
                            {'x': 6, 'y': 2, 'label': '前往天神的神殿', 'chapter': 'z3b', 'page': 1551},
                            {'x': 30, 'y': 26, 'label': '和亞奇洛貝說話', 'chapter': 'z3b', 'page': 1583}]
    for mid, x, y, row, page, flag in DEMONS:
        world['bosses'][mid] = [{'x': x, 'y': y, 'sheet': 'Graphics/Characters/enemy6.png', 'index': 0, 'row': row,
                                 'flag': flag, 'key': str(page)}]
    # 140_Field_Main.rb: maps 78-81 two or three of 183-185 (one or two for a party of two); 82 four to six
    for mid in ('78', '79', '80', '81'):
        world['areas'][mid] = {'pool': [183, 184, 185], 'n': [2, 3], 'size': {'2': [1, 2]}}
    world['areas']['82'] = {'pool': [183, 184, 185], 'n': [4, 6]}
    for mid in range(78, 83):
        world['z3']['backdrops'][str(mid)] = backdrop_table(world, mid, D)

    # ---------- faces ----------
    for k, r in CARD_FACES.items():
        z3['faces'][k] = [z3['CARD'], r, 2]
    for k, r in FOE_FACES.items():
        z3['faces'][k] = [z3['F3'], r]
    world['faces'].update({'z3:' + k: z3['faces'][k] for k in list(CARD_FACES) + list(FOE_FACES)})

    # ---------- the pages ----------
    opts, extra = h['OPTS'], h['EXTRA']
    keep_extra = dict(extra)
    extra.update({
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        # 117: CE180 時の間新エリア開放 (and its notice card); CE276 the 「自由」 skill (Yajirobe's explanation)
        117: lambda p: [{'sw': [483, 483, True]}, {'item': [67, 1]}] if p[0] == 180 else script(ce[276]['list']) if p[0] == 276 else [],
    })
    opts.update(bgm=True, shakeSw=True)
    pg = {}
    for v in (1481, 1501, 1571, 1583):
        pg[str(v)] = z3['page'](v)
    for v in (1471, 1491, 1511, 1531, 1551, 1561):
        pg[str(v)] = z3['split_battle'](z3['page'](v))
    opts.update(partyc=True)  # (the unconditional `$partyc = …` / `<< 12` of these two: who the scenes show)
    for v in (1521, 1541):
        pg[str(v)] = z3['page'](v)
    opts.update(partyc=False)

    # page 59 (1440): [before the label 方角選択, the choosing (built below), after it]
    lst = raw[1440]
    lab = next(k for k, c in enumerate(lst) if c['code'] == 118 and c['parameters'][0] == '方角選択')
    end = max(k for k, c in enumerate(lst) if c['code'] == 404)  # the end of the 是 / 不是 choice
    texts = [c['parameters'][0] for c in lst[lab:end] if c['code'] == 401]
    assert len(texts) == 13, texts
    q1, a1, q2, a2, a3, c1, c2, c3, cq, yes1, yes2, yes3, no1 = texts
    # (the choosing is a cutscene of its own here: it draws the Kame House scene again first, variable 41 = 1447)
    pg['1440'] = [[{'v41': 1440}] + nodes_of(lst[:lab]), [{'z1field': True}] + nodes_of(choosing(q1, a1, q2, a2, a3, c1, c2, c3, cq, [yes1, yes2, yes3], no1)),
                  nodes_of(lst[end + 1:])]
    # 概況 65-69 (map 7 event 2 page 201: BGM Z3 イベント2, CE110-114 — the scenes 1011-1015 are in src/z3b.js); the
    # field menu's 概況 / the recap after loading are shared (src/z2a.js storyScenes plays world.z2a.recap only)
    world['z3'].setdefault('recap', {}).update({str(v43): [{'bgm': 'Z3 イベント2'}] + nodes_of(ce[cid]['list'])
                                                for v43, cid in zip(range(65, 70), range(110, 115))})
    opts.update(bgm=False, shakeSw=False)
    extra.clear()
    extra.update(keep_extra)
    world['z3']['pages'].update(pg)

    # ---------- the chapter ----------
    world['z3']['titles']['z3b'] = 'Z3　第二章　魔凶星篇'
    # 概況 65-69 (draw_story_so_far, all.rb 35370) as the goal while on the map
    world['z3']['goals'].update({
        '78': '目標：' + s2t('Ｚ战士、向东进发!!') + '（找出魔族）',
        '79': '目標：' + s2t('Ｚ战士、向西进发!!') + '（找出魔族）',
        '80': '目標：' + s2t('Ｚ战士、向南进发!!') + '（找出魔族）',
        '81': '目標：' + s2t('比克和贝吉塔! 向北进发!!') + '（找出魔族）',
        '82': '目標：' + s2t('天界怎么了!? 紧急!Ｚ战士!!') + '（登上西北方的卡林塔）',
    })
    world['z3']['z3b'] = {
        'to': TO,
        'battleBg': BATTLE_BG,
        'dirs': DIRS,
        'dirSw': DIR_SW,
        'teams': {'314': [5, 10, 24], '315': [7, 8], '316': [6, 9]},  # 悟飯・琪琪・龜仙人 / 雅木茶・天津飯 / 克林・餃子
        'north': [4],  # page 1521; Vegeta (12) joins
        'all': [4, 5, 6, 7, 8, 9, 10, 24, 12],  # page 1541
        'pics': {n: file('Z3_背景_' + n) for n in ('天界', '魔凶星', '草原', '砂漠', '雪山')},
    }

    # ---------- what the pages and scenes need (tools/copy_assets.py) ----------
    bgm, se = set(), set()

    def walk(nodes):
        for n in nodes:
            if isinstance(n, list):
                walk(n)
                continue
            if 'se' in n:
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
            for k in ('then', 'else'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    walk(list(pg.values()))
    bgm |= {'Z1 フィールド3'} | {world['z3']['battles'][k].get('bgm') for k in BATTLE_BG if world['z3']['battles'][k].get('bgm')}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm)
    world['fieldSe'] = sorted(set(world['fieldSe']) | se | {'Z3 決定'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {'Graphics/Characters/enemy6.png'}
                                    | {p for p in world['z3']['z3b']['pics'].values() if p})


def choosing(q1, a1, q2, a2, a3, c1, c2, c3, cq, yes, no):
    """Page 59's choosing (label 方角選択 … the 是 / 不是 choice) as plain event commands, one branch per way it can go:
    the original names actor 1 after the direction ($game_actors[1].name) and shows it as \\N[1]; here each branch has
    its direction written in. Gohan's team picks of 東 西 南, Yamcha's of the two left, Krillin's goes the last way.
    不是 starts again: the label's three switches go off (src/z3b.js plays the choosing again while they are all off)."""
    cmds = []
    msg = lambda t, ind: [{'code': 101, 'indent': ind, 'parameters': ['', 0, 0, 1]}, {'code': 401, 'indent': ind, 'parameters': [t]}]
    sw = lambda k, on, ind: {'code': 121, 'indent': ind, 'parameters': [k, k, 0 if on else 1]}
    var = lambda k, x, ind: {'code': 122, 'indent': ind, 'parameters': [k, k, 0, 0, x]}
    N = lambda t, d: t.replace('\\N[1]', d)

    def choice(labels, body, ind):
        out = [{'code': 102, 'indent': ind, 'parameters': [labels, 0]}]
        for k, d in enumerate(labels):
            out.append({'code': 402, 'indent': ind, 'parameters': [k, d]})
            out += body(d, ind + 1)
            out.append({'code': 0, 'indent': ind + 1, 'parameters': []})
        out.append({'code': 404, 'indent': ind, 'parameters': []})
        return out

    order = ['東', '西', '南']
    cmds += [sw(DIR_SW[d], False, 0) for d in order] + msg(q1, 0)

    def gohan(d1, ind):
        rest = [d for d in order if d != d1]

        def yamcha(d2, ind):
            d3 = next(d for d in rest if d != d2)
            out = [var(315, DIRS[d2], ind), sw(DIR_SW[d2], True, ind)] + msg(N(a2, d2), ind)
            out += [var(316, DIRS[d3], ind)] + msg(N(a3, d3), ind)
            out += msg(N(c1, d1), ind) + msg(N(c2, d2), ind) + msg(N(c3, d3), ind) + msg(cq, ind)
            out += choice(['是', '不是'], lambda a, i: sum((msg(t, i) for t in yes), []) if a == '是'
                          else msg(no, i) + [sw(DIR_SW[d], False, i) for d in order], ind)
            return out
        return [var(314, DIRS[d1], ind), sw(DIR_SW[d1], True, ind)] + msg(N(a1, d1), ind) + msg(q2, ind) + choice(rest, yamcha, ind)
    cmds += choice(order, gohan, 0)
    return cmds
