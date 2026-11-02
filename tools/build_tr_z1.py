"""Z1 時之間的區域（地圖 59 的門 9102～9144：地圖 60～64） — world.json data (read by src/tr_z1.js), added by tools/build_timeroom.py. Plan: docs/timeroom-plan.md, notes: docs/tr-z1.md.

The original (Map007 event 17 「時の間」 pages 9101-9144, 145_Event_Check.rb `when 60`-`64`, 140_Field_Main.rb encounter,
battle_process 9104 …, set_battle_map):
  9102 / 9111 / 9121 / 9131 / 9141  the doors of map 59 → CE181, variable 43 = 901-905, the area at its entry square
  9103 / 9112 / 9122 / 9132 / 9142  the area's way back (the square next to the entry) → CE182, variable 43 = 999, map 59
  9104 拉蒂茲 / 9113 → 9114 卡里克 → 卡里克(巨大化)＋三人眾 / 9123 界王 / 9133 那巴 / 9134 貝吉塔 / 9143 生化戰士 /
  9144 威洛: the boss fights of the areas (switches 122 124 475 477, the drops 241-250, shared EXP 306, CAP 317, SP 318,
  switch 141 = everyone healed afterwards; 25 / 26 / 27 = the enemies' extra attacks; 9113 turns 128 on: its win runs
  9114 right away). The areas are copies of the story maps 1, 13, 14, 15, 51 (flying), with their inns (page 11:
  901 / 903 蛇姫, 902 / 904 / 905 卡林), card squares and training squares; map 62's training squares are the 界王 fight.
"""
import os

from PIL import Image

GO = lambda m, x, y: {'map': str(m), 'x': x, 'y': y}
HALL = 59
# door page: (map, rows, entry square, way-back page and square, variable 43, the hall square page 9103 … returns to)
AREAS = {
    9102: dict(map=60, rows=28, at=(16, 16), back=(15, 16), v43=901, hall=(3, 3), name='拉蒂茲區'),
    9111: dict(map=61, rows=27, at=(4, 24), back=(5, 24), v43=902, hall=(8, 3), name='卡里克區'),
    9121: dict(map=62, rows=14, at=(7, 3), back=(6, 3), v43=903, hall=(13, 3), name='界王區'),
    9131: dict(map=63, rows=38, at=(3, 34), back=(2, 34), v43=904, hall=(18, 3), name='貝吉塔區'),
    9141: dict(map=64, rows=38, at=(35, 34), back=(34, 34), v43=905, hall=(23, 3), name='威洛區'),
}

# 145_Event_Check.rb: inns (variable 41 = 11), card squares (chk_card; 「カード特殊」 variable 44 = 10 is the same Z1
# draw as 0, create_get_card_2), training squares (chk_training), and the boss squares → the page
SPOTS = {
    60: dict(inn=[(13, 21), (30, 15), (2, 11), (19, 5), (44, 11), (53, 20)], card=[(7, 3), (30, 9), (57, 19), (61, 27)],
             train=[(30, 5), (25, 20), (52, 19), (53, 19), (54, 19), (52, 20), (54, 20), (52, 21), (53, 21), (54, 21)],
             boss=[(x, y, 9104) for y in (4, 5, 6) for x in (57, 58, 59)]),
    61: dict(inn=[(3, 24), (20, 3), (46, 24)], card=[(3, 2), (50, 11)], train=[(6, 2), (13, 22), (37, 6), (39, 20)],
             boss=[(54, 5, 9113)]),
    62: dict(inn=[(7, 4)], card=[(6, 7), (13, 5)], train=[], boss=[(6, 4, 9123), (8, 3, 9123), (10, 3, 9123), (9, 8, 9123), (11, 8, 9123)]),
    63: dict(inn=[(5, 36), (24, 4), (48, 21)], card=[(18, 30), (59, 18)], train=[(4, 28), (11, 32), (31, 28), (39, 20)],
             boss=[(55, 8, 9133), (55, 6, 9134)]),
    64: dict(inn=[(13, 15), (40, 34)], card=[(27, 8), (49, 32), (3, 7)], train=[(7, 26), (42, 20)],
             boss=[(5, 12, 9143), (5, 4, 9144), (6, 5, 9144), (7, 4, 9144)]),
}
SNAKE, KARIN = (901, 903), (902, 904, 905)  # page 11: the inn of 蛇姫 / of 卡林 by variable 43 (labels 蛇姫休憩 / カリン様休憩)

# 140_Field_Main.rb (variable 13 = the map): 60 like map 1 (one member alone: 1-2), 61 like map 13, 63 like map 15,
# 64 like map 51; 62 (King Kai's planet) has none
ENCOUNTERS = {60: {'pool': [1, 2, 4, 5], 'n': [1, 3], 'alone': [1, 2]}, 61: {'pool': [1, 2, 7, 8, 9], 'n': [2, 5]}, 62: None,
              63: {'pool': [1, 2, 3, 4, 5, 6], 'n': [2, 6]}, 64: {'pool': [1, 2, 3, 25], 'n': [2, 6]}}

# set_battle_map (scenario_progress = variable 301 = 0 in the Z1 hall): the strip of Z1_戦闘_背景 by the ground tile;
# a tile it doesn't list keeps the last one ($Battle_MapID), here the area's usual one
BACKDROPS = {60: {1537: 0, 1545: 0, **{t: 1 for t in range(1560, 1575)}, 'default': 0},
             61: {1541: 7, 1549: 7, **{t: 1 for t in range(1560, 1575)}, 'default': 7},
             62: {'default': 5},
             63: {1542: 8, 'default': 8},
             64: {1556: 10, 1541: 7, 1549: 7, **{t: 1 for t in range(1560, 1575)}, 'default': 10}}

# the boss pages: battle_process (foes, $Battle_MapID, set_bgm) and what the page sets (241-250 the drops [rate %, card],
# 306 shared EXP, 317 CAP, 318 SP, 141 heal, 25 / 26 / 27 extra attacks: alone / hp30 / hp40)
BOSSES = {
    9104: dict(foes=[10], row=0, bgm='Z1 戦闘ボス1(中ボス)', drops=[[13, 11], [18, 34], [35, 142]], shared=300, cap=6, sp=3, heal=True, hp30=True),
    # set_bgm 0: the story's default (variable 43 = 902: Z1 戦闘2); 128: its win runs 9114
    9113: dict(foes=[16], row=7, bgm=None, drops=[[7, 11], [8, 15]], shared=350, cap=6, sp=3, heal=False, hp30=True, next=9114),
    9114: dict(foes=[17, 13, 14, 15], row=7, bgm='M814A', drops=[[7, 11], [8, 15], [7, 14], [2, 18], [35, 158]], shared=600, cap=8, sp=4,
               heal=True, alone=True, hp30=True),
    9123: dict(foes=[18], row=5, bgm='kaio', drops=[[15, 32], [35, 111]], shared=500, cap=8, sp=4, heal=True),
    9133: dict(foes=[11], row=8, bgm='Z1 戦闘ボス1(中ボス)', drops=[[8, 32], [8, 29], [35, 213]], shared=700, cap=10, sp=5, heal=True, hp40=True),
    9134: dict(foes=[12], row=8, bgm='Z1 戦闘ボス2(ベジータ)', drops=[[8, 17], [8, 23], [35, 149]], shared=900, cap=14, sp=7, heal=True, hp40=True),
    9143: dict(foes=[23, 24, 22], row=10, bgm='M814A', drops=[[7, 21], [8, 28], [7, 20], [35, 91]], shared=800, cap=12, sp=6, heal=True, alone=True),
    9144: dict(foes=[20], row=10, bgm='ikusa', drops=[[33, 10], [15, 32], [35, 116]], shared=1000, cap=14, sp=7, heal=True, alone=True, hp30=True),
}
ROWS = sorted({b['row'] for b in BOSSES.values()} | {r for t in BACKDROPS.values() for r in t.values()})


def add(world, h, z3, tr):
    build_map, root, s2t = h['build_map'], h['root'], h['s2t']
    map_events, sheets = tr['map_events'], tr['sheets']
    D = h['D']

    # ---------- the maps (flying, like the story maps they copy) ----------
    for a in AREAS.values():
        mid = a['map']
        m = build_map(mid, rows=a['rows'])
        ev = map_events(D, mid, a['rows'])
        for e in ev:  # map 60: Raditz shows with switch 41 (on since his fight in the story); his pod (EV009) is a
            for pg in e[2]:  # 96×64 '!bigsize_anime' sheet the map events can't draw (the story's map 1 has none either)
                pg[0] = [c for c in pg[0] if c != ['sw', 41, True]]
        m['ev'] = [e for e in ev if not any(isinstance(pg[1], list) and pg[1][0].startswith('!') for pg in e[2])]
        sheets.update(pg[1][0] for e in m['ev'] for pg in e[2] if isinstance(pg[1], list))
        if mid == 62:
            m['path'] = [1544]  # the ring of squares round King Kai's house, as the story's map 14 (src/field.js)
        world['maps'][str(mid)] = m
        world['areas'][str(mid)] = ENCOUNTERS[mid]

    # ---------- the inns (page 11's 蛇姫 / 卡林 branches of the converted event 11) ----------
    inn = {}
    for n in world['events']['11']:
        c = n.get('if')
        if c and c[:2] == ['var', 43] and c[2] in (7, 20) and c[3] == 2:
            inn[c[2]] = [{'var': [219, 1, 1]}, *[x for x in n['then'] if 'end' not in x]]
    world['events']['trz1inn901'] = inn[7]  # ジンジャーエリアまでは蛇の宿 (901, 903)
    world['events']['trz1inn902'] = inn[20]  # ベジータ撃墜まではカリンの宿 (902, 904, 905)

    # ---------- the spots ----------
    T = lambda **kw: dict(chapter='tr', **kw)
    names = {no: world['enemies'][b['foes'][0]]['name'] for no, b in BOSSES.items()}
    names.update({9143: s2t('生化战士'), 9123: '界王修行'})  # (three of them; map 62's training squares, as the story's map 14)
    for no, a in AREAS.items():
        mid, sp = a['map'], SPOTS[a['map']]
        ev_inn = 'trz1inn901' if a['v43'] in SNAKE else 'trz1inn902'
        pois = [T(x=a['back'][0], y=a['back'][1], label='回到時之間', page='trz1back', to=GO(HALL, *a['hall']))]
        pois += [{'x': x, 'y': y, 'label': '進入旅館', 'event': ev_inn, 'effect': 'rest'} for x, y in sp['inn']]
        pois += [{'x': x, 'y': y, 'label': '卡片商店', 'effect': 'shop'} for x, y in sp['card']]
        pois += [{'x': x, 'y': y, 'label': '修行', 'effect': 'training'} for x, y in sp['train']]
        pois += [T(x=x, y=y, label=names[b], page='trz1boss', boss=b) for x, y, b in sp['boss']]
        world['pois'][str(mid)] = pois

    # ---------- the battle backgrounds: rows of Z1_戦闘_背景 (as tools/build_timeroom.py's 戦闘練習) ----------
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    strips = Image.open(os.path.join(pics, 'Z1_戦闘_背景.PNG')).convert('RGB')
    for row in ROWS:
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strips.crop((120, 100 * row, 520, 100 * row + 100)), (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'tr_z1_battle_{row}.png'), optimize=True)
    bg = lambda row: f'bg/tr_z1_battle_{row}.png'

    # the music: set_bgm 10 / 11, $bgm_no_ZSSD_training_for_gb, $bgm_no_ZMove_M814A, $bgm_no_ZMove_ikusa (the same
    # songs the story's battles 130 / 126 / 943 / 953 play here: src/chapter6.js, src/chapter5.js, src/willow.js)
    songs = {'kaio': world['chapter6']['kaioBgm'], 'M814A': world['willow']['bgm']['bio'], 'ikusa': world['willow']['bgm']['willow']}
    bosses = {}
    for no, b in BOSSES.items():
        o = {k: b[k] for k in ('foes', 'drops', 'shared', 'cap', 'sp', 'heal')}
        o['backdrop'] = bg(b['row'])
        o['bgm'] = songs.get(b['bgm'], b['bgm'])
        for k in ('alone', 'hp30', 'hp40', 'next'):
            if b.get(k):
                o[k] = b[k]
        bosses[str(no)] = o
    world['trZ1'] = {
        'doors': {str(no): {'to': GO(a['map'], *a['at']), 'v43': a['v43']} for no, a in AREAS.items()},
        'bosses': bosses,
        'backdrops': {str(m): {str(k): bg(r) for k, r in t.items()} for m, t in BACKDROPS.items()},
    }
    world['extraBgm'] = sorted(set(world['extraBgm']) | {o['bgm'] for o in bosses.values() if o['bgm']})
