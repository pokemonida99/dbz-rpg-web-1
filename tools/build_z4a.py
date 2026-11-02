"""Z4 第一章 賽魯誕生的秘密（地圖 42・44・45）— world.json data, added by tools/build_z3.py (read by src/z4a.js).

Map007 event 7 pages (variable 41) and where they run (145_Event_Check.rb "Z4セル誕生の秘密" / "Z4精神と時の部屋"):
  2001 (page 2)  あらすじ (CE120), Piccolo and the others hear of Cell; Cell at Ginger Town (2002); Vegeta flies off →
                 $partyc = [6,17,7,8,9,10,24], variable 43 = 81, map 42 (67,46)
  map 42: the lab's basement (19,9) 2011 (page 3) → Willow and the bio-warriors again (2014) → battle 2015 →
          2016 (page 4): Trunks goes to Vegeta, Capsule Corp., Piccolo after Cell, three days, Yamcha's plane,
          Goku wakes (Chi-Chi, Roshi), his instant transmission, Trunks and Vegeta, the androids, Kami's lookout →
          $partyc = [12,17], variable 43 + 1, variable 121 = 1 → map 44 (9,8)
  map 44 (精神と時の部屋, shared by Z4 chapters 1 / 3 / 5): card (11,8), inn (4,4), the training start (15,4):
          variable 121 = 1 → 2071 (page 5: CE40, Scene_Db_Ryuha_Pair_Training — pattern 1, Super Vegeta and Super
          Trunks) → variable 41 + 10 → 2081 (page 6): the plane, the androids at the Kame House, Piccolo leads them off
          → map 45 (the flight of Piccolo and Nos. 17, 16, 18: its event 15 moves them, then variable 41 = 2091) →
          第二章 (src/z4b.js)
"""
import os
import re

P = lambda n: f'Graphics/Pictures/{n}.PNG'


def add(world, h, z3):
    build_map, D = h['build_map'], h['D']
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    split_battle, file, nodes_of, raw4 = z3['split_battle'], z3['file'], z3['nodes_of'], z3['raw4']
    E3, F3, CARD, P3 = z3['E3'], z3['F3'], z3['CARD'], z3['P3']
    z = world['z3']

    # ---------- maps (the last row holds the original's control events only) ----------
    world['maps']['42'] = build_map(42, rows=64)
    world['maps']['44'] = build_map(44, rows=14)
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['42'] = at([(80, 3), (5, 50), (17, 2), (77, 37)], CARD_SQ) \
        + at([(17, 43), (52, 5), (10, 2), (61, 44)], INN) + at([(5, 7), (15, 37), (66, 7), (66, 36)], TRAIN) + [
        {'x': 19, 'y': 9, 'label': '調查研究所的地下', 'chapter': 'z4a', 'page': 2011, 'when': ['var', 43, 81, 0]}]
    # map 44, shared: chapter 'z4' = whichever Z4 chapter is being played (src/z3.js z3Spot); page 'htc' = the training
    # start, its page by variable 121 (1: 2071 Vegeta / Trunks, 2: 2331 Goku / Gohan, 3: 2951 the Earthlings)
    world['pois']['44'] = [dict(CARD_SQ, x=11, y=8), dict(INN, x=4, y=4),
                           {'x': 15, 'y': 4, 'label': '開始修行', 'chapter': 'z4', 'page': 'htc'}]
    world['radar']['42'] = [(19, 9)]
    # 140_Field_Main.rb `when 42,87`: 2-5 of these; none in the time chamber
    world['areas'].update({'42': {'pool': [137, 174, 175, 176, 189, 193, 207], 'n': [2, 5]}, '44': None})

    # ---------- faces ----------
    F1 = P('Z1_顔敵')
    faces = {
        '沙魯': [F3, 27], '威洛': [F1, 20], '艾比略': [F1, 23], '米索茲': [F1, 24], '吉西米': [F1, 22],
        '布爾瑪': [CARD, 8, 2], '布里夫': [CARD, 36, 2], '17號': [F3, 25], '18號': [F3, 24], '16號': [F3, 26],
        '特蘭克斯': [P3, 14], '特蘭克斯ス': [P3, 14],
    }
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    allfaces = dict(z3['faces'], **faces)

    # ---------- the story pages ----------
    def ce(p):
        n = p[0]
        if n == 36:  # 瞬間移動 (the sound only here)
            return [{'se': 'Z3 瞬間移動'}] if os.path.exists(os.path.join(h['root'], 'game', 'Audio', 'SE', 'Z3 瞬間移動.ogg')) else []
        if n == 180:
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        return []  # CE120 (the あらすじ picture is the page's own z1field), CE40 (src/z4a.js deals the training cards)

    EXTRA.update({117: ce, 230: lambda p: [{'wait': p[0]}], 221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}]})
    OPTS.update(partyc=True, shakeSw=True)
    pg = lambda v: [{'v41': v}] + nodes_of(raw4[v], allfaces)
    pages = {str(v): pg(v) for v in (2001, 2016, 2081)}
    pages['2011'] = split_battle(pg(2011))  # [before the battle 2015, after it]
    pages['flight'] = [{'z1field': True}]  # map 45: scene 9045 (src/z4a.js), played with variable 41 = 9045
    OPTS.update(partyc=False, shakeSw=False)
    EXTRA.clear()
    z['pages'].update(pages)

    z['titles']['z4a'] = 'Z4　第一章　賽魯誕生的秘密'
    z['goals'].update({'42': '目標：調查蓋洛博士的研究所（地下室）', '44': '目標：在精神時光屋修行'})
    z['z4a'] = {
        'start42': {'map': '42', 'x': 67, 'y': 46, 'party': [6, 17, 7, 8, 9, 10, 24]},  # page 2001's $partyc
        'start44': {'map': '44', 'x': 9, 'y': 8, 'party': [12, 17]},  # page 2016's $partyc
        'after2081': [4, 6, 7, 8, 9],  # page 2081's $partyc (Piccolo leaves for map 45)
        # map 45 (Z4 ピッコロと17号たち移動): its event 15 flies Piccolo (chara_fly2 1) and Nos. 17, 16, 18
        # (chara_fly4 4 / 6 / 5) off together; src/z4a.js plays it as a short film
        'flight': {'piccolo': ['chara_fly2', 1], 'a17': ['chara_fly4', 4], 'a16': ['chara_fly4', 6], 'a18': ['chara_fly4', 5]},
    }
    world['extraBgm'] = sorted(set(world['extraBgm']) | {'ZArrang_前回のあらすじ', 'Z3 イベント3', 'Z3 イベント4', 'ZD イベント4',
                                                         'DB2 イベント08', 'DB2 イベント09', 'DB3 イベント03', 'DB3 イベント12',
                                                         'GBZ1 イベント1', 'FCJ2 筋斗雲', 'FCJ2 フィールド1', 'DB2 イベント05',
                                                         'ZSA2 BGM14(GB音源Ver)', 'GBZ2 イベント5', 'Z3 イベント2', 'Z1 戦闘前', 'Z3 フィールド1',
                                                         'Z2 フィールド3(修行)'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z1 飛ぶ'})
    js = open(os.path.join(h['root'], 'src', 'z4a.js'), encoding='utf-8').read()
    names = re.findall(r"PIC\('([^']+)'\)", js)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {f for f in map(file, names) if f}
                                    | {f'Graphics/Characters/{c}.png' for c in ('chara_fly2', 'chara_fly4')})
    world['extraBgm'] = sorted(n for n in set(world['extraBgm']) | set(re.findall(r"bgm: '([^']+)'", js))
                               if os.path.exists(os.path.join(h['root'], 'game', 'Audio', 'BGM', n + '.ogg')))
