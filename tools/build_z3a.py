"""Z3 第一章 集龍珠！（地圖 33・34・35）— world.json data, added by tools/build_z3.py (read by src/z3a.js).

Map007 event 5 pages (variable 41) and where they run (145_Event_Check.rb "Z3ボールを集めろ！" / "Z3ベジータ登場"):
  1100 (page 2)  前情提要 (CE174 / CE227), Goku alone as a Super Saiyan against Frieza: battle 1107 (enemy 101,
                 variable 81 = 20: the party's damage ×20; variable 95 = 1151: the next page)
  1151 (page 3)  Namek blows up, the Z fighters on Earth, King Kai, Roshi and Chi-Chi come along →
                 $partyc = [4,5,6,7,8,9,24,10], variable 43 = 51, map 33 (42,43)
  map 33: the town (42..43, 41..42) 1160 (少年 / 神秘的人 / 藥劑師 / 離開城市), the glasses rock (12,71) 1170 (dynamite →
          the 1-star ball), the herb man (6,10) 1180, the dinosaur (9..10,8) 1181 (laxative → the 5-star ball), where
          the dynamite goes (72,67) 1182, the mine (77,9) 1185 (dynamite), the gatekeeper (62,64) 1190, the base
          (78..79, 82..83) 1195 → battle 1197 (Kraz) → 1200: four balls; Vegeta alone, CE180 → map 34 (55,29)
  map 34: the barrier (13,17)…(22,26) 1210 (switch 410), its three generators (3,6) (37,6) (27,32) 1211-1213
          (switches 411-413, all three: 414), the base (11..12, 24..25) 1215 → battle 1216 (Ear) → 1217: the
          others come, seven balls, Bulma and Dende (CE14) → map 35: Porunga (pictures, two wishes) → 1440, 43 = 65
  side: the sea turtle (30,46) on map 33, page 1591 (cards; CE275 S-combo hints)
"""
import os
import re

P = lambda n: f'Graphics/Pictures/{n}.PNG'


def add(world, h, z3):
    build_map, script, D, s2t = (h[k] for k in ('build_map', 'script', 'D', 's2t'))
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    split_battle, file = z3['split_battle'], z3['file']
    E3, F3, CARD = z3['E3'], z3['F3'], z3['CARD']
    z = world['z3']

    # ---------- maps (the last row holds the original's control events only) ----------
    world['maps']['33'] = build_map(33, rows=99)
    world['maps']['34'] = build_map(34, rows=44)
    # map 33's people from the original's events (not its animap1 trees): the dinosaur (event 36, !bigsize_anime) until
    # switch 405, the gatekeeper (event 155, enemy1 character 6) until switch 409
    import build_timeroom
    world['maps']['33']['ev'] = [e for e in build_timeroom.map_events(D, 33, 99) if (e[0], e[1]) in ((10, 8), (62, 65))]

    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    spot = lambda x, y, label, pg, when=None: dict({'x': x, 'y': y, 'label': label, 'chapter': 'z3a', 'page': pg}, **({'when': when} if when else {}))
    world['pois']['33'] = at([(72, 25), (36, 47), (8, 77), (58, 71)], CARD_SQ) \
        + at([(26, 83), (17, 6), (38, 42), (90, 1)], INN) + at([(61, 16), (44, 48), (69, 63)], TRAIN) + [
        spot(42, 41, '進入城鎮', 1160), spot(43, 42, '進入城鎮', 1160),
        spot(30, 46, '和海龜說話', 1591),
        spot(12, 71, '調查眼鏡岩', 1170),
        spot(6, 10, '拜訪種藥草的老爺爺', 1180),
        spot(9, 8, '調查恐龍', 1181, ['sw', 405, False]),
        spot(72, 67, '調查這附近', 1182, ['sw', 409, False]),
        spot(77, 9, '進入礦山', 1185),
        spot(62, 64, '和門衛說話', 1190, ['sw', 409, False]),
        spot(78, 82, '進入敵人的基地', 1195, ['sw', 409, True]),  # (the gatekeeper stands in front until he leaves)
    ]
    world['pois']['34'] = at([(57, 17), (20, 9)], CARD_SQ) + at([(4, 11), (46, 28)], INN) + at([(30, 5), (39, 26)], TRAIN) + [
        spot(x, y, '這是……', 1210, ['sw', 414, False]) for x, y in [(13 + k, 17 + k) for k in range(10)]] + [
        spot(3, 6, '調查裝置', 1211, [['sw', 410, True], ['sw', 411, False]]),
        spot(37, 6, '調查裝置', 1212, [['sw', 410, True], ['sw', 412, False]]),
        spot(27, 32, '調查裝置', 1213, [['sw', 410, True], ['sw', 413, False]]),
        spot(11, 24, '進入敵人的基地', 1215, ['sw', 414, True]),
        spot(11, 25, '進入敵人的基地', 1210, ['sw', 414, False]),  # the barrier is in the way until the generators are gone
    ]
    world['radar']['33'] = [(12, 71), (9, 8), (78, 82)]
    world['radar']['34'] = [(11, 24)]
    # random encounters (140_Field_Main.rb encounter, `when 33,73` / `when 34`): 2-5 / 1-2 of the same six
    world['areas'].update({'33': {'pool': [103, 106, 109, 111, 114, 117], 'n': [2, 5]},
                           '34': {'pool': [103, 106, 109, 111, 114, 117], 'n': [1, 2]}})

    # ---------- faces of this chapter's speakers ----------
    faces = {
        '少年': [E3, 1], '門衛': [E3, 1], '神秘的人': [E3, 2], '神秘男': [E3, 2], '藥劑師': [E3, 4], '老爺爺': [E3, 0],
        '恐龍': [E3, 3], '恐竜': [E3, 3], '布爾瑪': [E3, 5], '克拉斯': [F3, 31], '伊爾': [F3, 5], '弗利薩': [F3, 1],
        '界王': [CARD, 25, 2], '丹迪': [CARD, 14, 2], '穆利': [CARD, 30, 2], '波侖加': [CARD, 31, 2], '海龜': [CARD, 49, 0],
    }
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    z['faces'].update(faces)
    allfaces = dict(z3['faces'], **faces)

    # ---------- the story pages ----------
    def pic(p):  # 231 show picture: number, name, origin (0 top-left, 1 centre), x, y (variables 85 / 86 = 210, 40 on map 35)
        f = file(p[1]) or P(p[1])
        x, y = (p[4], p[5]) if p[3] == 0 else (210, 40)
        return [{'x': 'pic', 'n': p[0], 'name': f, 'o': p[2], 'px': x, 'py': y, 'zoom': p[6], 'op': p[8]}]

    def ce(p):
        n = p[0]
        if n == 46:  # 悟空超サイヤ人変身: the state, then CE45's pictures (src/z3c.js transformFilm, clothes by variable 171)
            return [{'x': 'ss', 'on': 1}, {'x': 'z3Transform', 'who': 'goku'}]
        if n == 14:  # ドラゴンボール使用
            return [{'item': [i, -99]} for i in range(2, 9)]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        if n == 227:  # バーダック初回加入調整 (only when he never joined: switch 109 off)
            return [{'x': 'uses', 'map': {147: 200, 148: 150, 149: 150, 150: 100, 151: 50, 152: 30}}, {'x': 'defeats', 'id': 16, 'n': 200}]
        if n == 275:  # Sコンボの追加ヒント: its text, as it is
            return script(D('commonevents')[275]['list'])
        return []  # CE9 必殺技設定 (world.actors), CE173 / CE174 倍速 (no fast-forward lock here)

    def code355(p):
        t = p[0].strip()
        if t.startswith('#ZP取得'):  # map 35: $zp[x] += 150 for everyone
            return [{'x': 'zp', 'n': 150}]
        return []

    EXTRA.update({231: pic, 235: lambda p: [{'x': 'erase', 'n': p[0]}], 230: lambda p: [{'wait': p[0]}],
                  221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}], 117: ce, 355: code355})
    OPTS.update(partyc=True, shakeSw=True)
    pg = lambda v: [{'v41': v}] + z3['nodes_of'](z3['raw'][v], allfaces)
    pages = {str(v): pg(v) for v in (1151, 1160, 1170, 1180, 1181, 1182, 1185, 1190, 1200, 1210, 1211, 1212, 1213, 1217, 1591)}
    for v in (1100, 1195, 1215):  # [before the battle, after it]
        pages[str(v)] = split_battle(pg(v))
    # map 35 (Porunga): event 1 (the picture, the flash), event 3 (the two wishes: the original loops the choice while
    # variable 93 > 0 — here the choice twice; then Porunga leaves → 1440, 43 = 65)
    m35 = D('map035')['events']
    film = z3['nodes_of'](m35['1']['pages'][0]['list'], allfaces)
    wishes = z3['nodes_of'](m35['3']['pages'][0]['list'], allfaces)
    pages['porunga'] = film + wish_count(wishes)
    OPTS.update(partyc=False, shakeSw=False)
    EXTRA.clear()
    z['pages'].update(pages)

    z['titles']['z3a'] = 'Z3　第一章　集龍珠！'
    z['goals'].update({
        '33': '目標：在附近收集龍珠（城鎮、眼鏡岩、恐龍、敵人的基地）',
        '34': '目標：破壞屏障發生裝置，進入敵人的基地',
    })
    z['z3a'] = {
        'opening': {'party': [3], 'dmgRate': 20},  # z1field 1101 / page 1100: Goku alone (Super Saiyan), variable 81 = 20
        'start33': {'map': '33', 'x': 42, 'y': 43, 'party': [4, 5, 6, 7, 8, 9, 24, 10]},
        'start34': {'map': '34', 'x': 55, 'y': 29, 'party': [12]},
        'after': {'party': [4, 5, 6, 7, 8, 9, 24, 10]},  # page 1217: the others arrive ($partyc), Vegeta goes
        # z1field 1158: what Roshi has been doing (cha_tec_puls); Piccolo's moves 101-104 too
        'uses1158': {101: 150, 102: 100, 103: 80, 104: 50, 225: 120, 226: 90, 228: 60, 229: 25},
    }
    world['extraBgm'] = sorted(set(world['extraBgm']) | {'Z3 フィールド1', 'Z3 フィールド2', 'Z3 イベント1', 'Z3 イベント2',
                                                         'Z3 イベント4', 'Z3 神龍'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z3 バリア', 'Z3 光線系ヒット', 'Z3 経験値取得', 'Z3 アイテム取得',
                                                       'Z2 ポルンガ呼び出し', 'Z3 決定'})
    # the scenes of src/z3a.js: their pictures, music and sounds (tools/copy_assets.py copies these lists)
    js = open(os.path.join(h['root'], 'src', 'z3a.js'), encoding='utf-8').read()
    names = [f'Z3_背景_{n}' for n in re.findall(r"BG\('([^']+)'\)", js)] + \
        ['Z3_背景_ポルンガ_西の都_修正', 'Z3_背景_ポルンガ_イベントから呼び出し用(白)', 'Z3_背景_ポルンガ_イベントから呼び出し用(4C)']
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {f for f in map(file, names) if f})
    world['extraBgm'] = sorted(set(world['extraBgm']) | set(re.findall(r"bgm: '([^']+)'", js)))
    world['fieldSe'] = sorted(set(world['fieldSe']) | set(re.findall(r"se: '([^']+)'", js)))


def wish_count(ns):
    """「還有\\V[93]次願望可以實現！」: the message code \\V[93] (variable 93, the wishes left) is dropped when the text
    is converted, so that line becomes one line per value (2 / 1) chosen by the variable."""
    out = []
    for n in ns:
        if 'say' in n and '還有次' in n['say'][1]:
            say = lambda k: {'say': [n['say'][0], n['say'][1].replace('還有次', f'還有{k}次'), *n['say'][2:]]}
            out.append({'if': ['var', 93, 2, 0], 'then': [say(2)], 'else': [say(1)]})
            continue
        for k in ('then', 'else', 'loop'):
            if k in n:
                n[k] = wish_count(n[k])
        if 'branches' in n:
            n['branches'] = [wish_count(b) for b in n['branches']]
        out.append(n)
    return out
