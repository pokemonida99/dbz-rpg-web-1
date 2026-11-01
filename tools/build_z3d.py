"""Z3 第四章 古拉來襲（地圖 37・38・39） — world.json data, added by tools/build_z3.py (read by src/z3d.js).
docs/z3cd.md has the original's pages, scenes and what this version does with them.

Map007 event 5 pages (variable 41) and where they run (145_Event_Check.rb `when 37 / 38 / 39`):
  map 37 (Vegeta alone, from (8,9)): the gatekeeper (60,13) 1270 → battle 1271 (switch 419: he is gone); the base
          (60..61, 22..23) 1272 → battle 1273 → 1274: someone in the next room; Brief calls Yamcha's party →
          $partyc = [7,6,8,9,24,10], CE180, variable 43 + 1 (55), switch 532, map 38 (30,8)
  map 38: the gatekeeper (27,6) 1280 (go in some other way); the villager (11,21) 1281 (switch 422: the hostages, 420:
          all three freed — the short cut through the village); the camps A (46,29) 1282 → 1283 → 1284, B (51,47)
          1285 → 1286 → 1287, C (14,40) 1288 → 1289 → 1290 (switches 423-425); Kaiz (9,17) 1295 → battle 1296 →
          1297 (switch 421); the base (8..9, 7..8) 1298: Bulma, Vegeta → Goku's party ($partyc = [3,4,5]):
          流派一致修行 ×3 (z1field 1302 / 1304 / 1306, pages 1303 / 1305) → Vegeta ($partyc = [12]) under 300× gravity
          (z1field 1308; failed: page 1309 and again) → 1310 Cooler lands: everyone, Roshi or Chi-Chi (choice; switch
          555 / 556), variable 43 + 2 (57), CE39, variable 101 = 2, map 39 (45,47)
  map 39: Cooler's ship (15..16, 14..15) 1316 → battle 1318 (Salza, Dore, Neiz) → 1319 Vegeta comes, a Super Saiyan
          (CE48; +150000 EXP, 125 / 133) → battle 1322 (Cooler) → 1323 his last form (CE50) → battle 1325 → 1326
          (第五章, src/z3e.js); Lunch (34,41) 1581; the seven balls 1431 (variable 240 = the ball; all seven: Shenron,
          the wishes of page 58)
"""
from build_z3c import convert, faces_of, mend, walk_sounds, assets


def add(world, h, z3):
    build_map, D, root = (h[k] for k in ('build_map', 'D', 'root'))
    split_battle = z3['split_battle']
    z = world['z3']

    # ---------- maps (the last row holds the original's control events only) ----------
    world['maps']['37'] = build_map(37, rows=39)
    world['maps']['38'] = build_map(38, rows=69)
    world['maps']['39'] = build_map(39, rows=74)

    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    spot = lambda x, y, label, pg, when=None, **more: dict({'x': x, 'y': y, 'label': label, 'chapter': 'z3d', 'page': pg},
                                                         **({'when': when} if when else {}), **more)
    # (the base of map 37 once the gatekeeper is beaten, the one of map 38 once Kaiz is: the original's squares lead
    # through them; here the player flies, so the story keeps its order this way)
    world['pois']['37'] = at([(51, 23), (15, 2)], CARD_SQ) + at([(4, 8), (54, 3)], INN) + at([(55, 16), (8, 13)], TRAIN) + [
        spot(x, y, '進入敵人的基地', 1272, ['sw', 419, True]) for x, y in ((60, 22), (61, 22), (60, 23), (61, 23))]
    world['pois']['38'] = at([(34, 7), (58, 20), (55, 42), (9, 28)], CARD_SQ) + at([(43, 16), (23, 28)], INN) \
        + at([(29, 16), (60, 12), (10, 46), (50, 34), (32, 47)], TRAIN) + [
        spot(27, 6, '靠近基地', 1280, ['sw', 421, False]),
        spot(11, 21, '和村民說話', 1281),
        spot(46, 29, '調查收容所', 1282, ['sw', 423, False]),
        spot(51, 47, '調查收容所', 1285, ['sw', 424, False]),
        spot(14, 40, '調查收容所', 1288, ['sw', 425, False]),
    ] + [spot(x, y, '進入敵人的基地', 1298, ['sw', 421, True]) for x, y in ((8, 7), (9, 7), (8, 8), (9, 8))]
    balls = [(53, 11), (21, 33), (19, 47), (21, 11), (25, 25), (49, 50), (14, 23)]  # 一星球 … 七星球 (events 130-136)
    world['pois']['39'] = at([(14, 33), (44, 21)], CARD_SQ) + at([(12, 42), (41, 45), (51, 11)], INN) + at([(43, 21), (25, 43)], TRAIN) + [
        spot(x, y, '進入古拉的宇宙飛船', 1316) for x, y in ((15, 14), (16, 14), (15, 15), (16, 15))] + [
        spot(34, 41, '和蘭琪說話', 1581)] + [
        spot(x, y, '調查這附近', 1431, ['sw', 446, False], ball=k + 1) for k, (x, y) in enumerate(balls)]
    # the gatekeepers and Kaiz (enemy1.png / enemy4.png character 6; map 37 event 56, map 38 events 10 and 90)
    world['bosses']['37'] = [{'x': 60, 'y': 14, 'index': 6, 'flag': 'z3dGate37', 'key': 'gate37', 'when': ['sw', 419, False]}]
    world['bosses']['38'] = [
        {'x': 26, 'y': 6, 'index': 6, 'flag': 'z3dGate38', 'key': 'gate38', 'when': ['sw', 421, False], 'after': 'z3dNever'},  # (only stands there)
        {'x': 9, 'y': 16, 'sheet': 'Graphics/Characters/enemy4.png', 'index': 6, 'flag': 'z3dKaiz', 'key': 'kaiz',
         'when': [['sw', 422, True], ['sw', 421, False]], 'after': 'z3dShortcut'},  # (the short cut opens with switch 420)
    ]
    world['radar']['39'] = [{'x': x, 'y': y, 'when': ['sw', 446, False]} for x, y in balls]  # (walk_anime events)
    # random encounters (140_Field_Main.rb encounter `when 37,74` / `38,75` / `39,76`)
    world['areas'].update({'37': {'pool': [104, 107, 110, 112, 115, 118], 'n': [1, 2]},
                           '38': {'pool': [104, 107, 110, 112, 115, 118], 'n': [2, 5]},
                           '39': {'pool': [105, 108, 110, 112, 115, 118], 'n': [2, 5]}})
    # set_battle_map (variable 40 = 2): 1552 / 1555 平原 → 1, 1553 砂漠 → 5, 1600-1602 崖 → by variable 101 (0: 1,
    # 2 from page 1310 on: 5)
    plain = {'1552': 1, '1555': 1, '1553': 5, 'default': 1}
    z['backdrops'].update({'37': dict(plain, **{k: 1 for k in ('1600', '1601', '1602')}),
                           '38': dict(plain, **{k: 1 for k in ('1600', '1601', '1602')}),
                           '39': dict(plain, **{k: 5 for k in ('1600', '1601', '1602')})})

    # ---------- the story pages ----------
    faces = dict(z3['faces'], **faces_of(z3))
    page, done = convert(h, z3, faces)
    pages = {str(v): page(v) for v in (1274, 1280, 1281, 1282, 1284, 1285, 1287, 1288, 1290, 1297, 1309, 1310, 1581)}
    for v in (1270, 1272, 1295, 1298, 1303, 1305, 1307, 1316, 1319, 1323):  # [before the battle / training, after it]
        pages[str(v)] = split_battle(page(v))
    pages['1431'] = wishes(page, z3['raw'][1431])
    done()
    pages = mend(pages)
    z['pages'].update(pages)

    z['titles']['z3d'] = 'Z3　第四章　古拉來襲'
    z['goals'].update({
        '37': {'54': '目標：打倒右邊的門衛，進入敵人的基地'},
        '38': {'55': '目標：去左邊的村子打聽，救出布爾瑪'},
        '39': {'57': '目標：前往左上方古拉的宇宙飛船'},
    })
    z['z3d'] = {
        'start': {'map': '37', 'x': 8, 'y': 9, 'party': [12]},
        'map38': {'map': '38', 'x': 30, 'y': 8, 'party': [7, 6, 8, 9, 24, 10]},  # page 1274
        'map39': {'map': '39', 'x': 45, 'y': 47},  # page 1310
        # $Battle_MapID of the story battles (battle_process)
        'backdrops': {'1271': 4, '1273': 4, '1283': 1, '1286': 1, '1289': 1, '1296': 2, '1318': 5, '1322': 5, '1325': 5},
        # the 流派一致修行 (z1field 1302 / 1304 / 1306) and the gravity room (1308): who trains, as the pages set them
        'pair': {'party': [3, 4, 5], 'v324': 36}, 'gravity': {'party': [12], 'times': 300},
    }
    se, bgm = set(), set()
    for v in pages.values():
        for part in (list(v.values()) if isinstance(v, dict) else v if v and isinstance(v[0], list) else [v]):
            walk_sounds(part, se, bgm)
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {'Z3 フィールド1', 'Z3 フィールド3', 'Z3 イベント1', 'Z3 イベント2', 'Z3 イベント4', 'Z3 神龍'}
                               | {world['maps'][m]['bgm'] for m in ('37', '38', '39')})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se | {'Z3 稲妻', 'Z3 シェンロン呼び出し', 'Z3 アイテム取得', 'Z3 経験値取得', 'Z3 回復'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {'Graphics/Characters/enemy4.png'})
    assets(world, root, 'z3d.js', z3['file'])


def wishes(page, lst):
    """page 58 (1431): {found: the ball (CE184) and the check (z1field 1432), pre: Shenron (inside 「switch 446 on」),
    menu: the three pages of wishes, post: Shenron leaves (CE14)}. The menu's 119 選択肢1ページ (back to the first page:
    「that wish has come true already」 / 上一页选项) becomes {x: z3cdAgain}: src/z3d.js plays the menu again."""
    k = next(i for i, c in enumerate(lst) if c['code'] == 111 and c['parameters'][:2] == [0, 446])
    end = next(i for i in range(k + 1, len(lst)) if lst[i]['code'] == 412 and lst[i]['indent'] == lst[k]['indent'])
    inner = [dict(c, indent=c['indent'] - 1) for c in lst[k + 1:end]]
    lab = next(i for i, c in enumerate(inner) if c['code'] == 118)
    close = next(i for i in range(lab + 1, len(inner)) if inner[i]['code'] == 404 and inner[i]['indent'] == inner[lab]['indent'])
    menu = [dict(c, code=355, parameters=['#z3cdAgain']) if c['code'] == 119 and c['parameters'][0] == '選択肢1ページ' else c
            for c in inner[lab + 1:close + 1]]
    found = page(1431, lst[:k])
    return {'found': [{'v41': 1431}] + found, 'pre': page(1431, inner[:lab]),
            'menu': [{'v41': 1434}, {'z1field': True}] + page(1431, menu), 'post': page(1431, inner[close + 1:])}

