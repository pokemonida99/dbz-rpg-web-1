"""Z2, second half (the Ginyu Force and Frieza) data, added to world.json by tools/build_data.py.

The Z2 story is Map007 event 2 「イベント実行Z2」, one page per value of variable 41 (`$eve.z1field` draws each scene,
143_Event_Main.rb; the spots are 145_Event_Check.rb "Z2ナメック星エリア３/４"):
  445 (map 26, the pond at 57,25) Vegeta's dragon ball, Frieza's ship → map 27 (the Ginyu Force pose, pictures)
  447 the Ginyu Force come for Vegeta; Goku lands (449/450: joins, healed, move counts up) → battle 452
      (enemies 51 52 48 49 50, the film-BGM; switch 25 = one more attack for the last one standing)
  453 Vegeta finishes them, the medical room (455: Goku out, party Gohan Krillin Yamcha Tien Chiaotzu Vegeta), the
      balls do nothing, Frieza goes to Guru's, Nail fights, Dende arrives → map 29 (Namek 4) at (47,24), 概況 +3
  Map 29: Porunga spot (24,4) → 463 → map 28 (Porunga, pictures) → 466: Piccolo revives, Guru dies, Frieza → 472
      (enemy 53) → 473 Frieza transforms; Piccolo alone at (10,69): Nail (16,65) → 476 (the fusion pictures) →
      Frieza (22,19) → 478 → 480 (enemy 54) → 481 (CE41, his 2nd form flies off; 概況 35) → (37,59) 484 → 485
      (enemy 55) → 486 (CE42 3rd form; Goku healed, joins; 概況 36) → (37,59) 492 → 493 (enemy 56; when a party
      member other than Goku first falls, the battle stops: battle_main_result 8) → 494 Goku becomes a Super
      Saiyan (CE46) → 497 (enemy 56 with the HP he had, variable 56) → 498: Super Vegeta (switch 105: Goku fought as
      a Super Saiyan) 499/500 → 501 (enemy 58) → 502 the Z2 ending; or (no one fell, no Super Saiyan) 531 the Super
      Spirit Bomb (CE147) → 543 Frieza lives, Krillin, Goku turns (CE46) → 556 (enemy 57) → 561 the Z2 ending.
  Side spots on map 29: the young Namekian (506), the battle suits (521), Turles and Slug with Bardock (514 → map 30
      → 508 → 511, enemies 59 60, after 概況 36), the Namekian who explains skills (602), inns, cards, training.
After the ending: variable 40 = 2, variable 41 = 1100 (Z3, Map007 event 5) — not in this version yet.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda n: f'Graphics/Pictures/{n}'


def add(world, h):
    build_map, enemy, skill, actor, s2t, script, D = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D'))
    scenes = h['build_chapter2'].scenes
    EXTRA = h['EXTRA']
    pics = set()

    # ---------- commands script() drops: pictures, EXP, recovery, skills, BGM, the Super Saiyan ----------
    def file(name):  # a picture's path with the extension it has on disk
        return next((P(name + e) for e in ('.PNG', '.png') if os.path.exists(os.path.join(ROOT, 'game', P(name + e)))), P(name + '.PNG'))

    def pic(p):  # 231 show picture: number, name, origin (0 top-left, 1 centre), x, y (640×480 screen), zoom
        pics.add(file(p[1]))
        return [{'x': 'pic', 'n': p[0], 'name': file(p[1]), 'o': p[2], 'px': p[4], 'py': p[5], 'zoom': p[6]}] if p[3] == 0 else \
            [{'x': 'pic', 'n': p[0], 'name': file(p[1]), 'o': p[2], 'px': 0, 'py': 0, 'zoom': p[6]}]

    def move(p):  # 232 move picture (constant coordinates only), over p[10] frames
        return [{'x': 'move', 'n': p[0], 'o': p[2], 'px': p[4], 'py': p[5], 'op': p[8], 'dur': p[10], 'wait': p[11]}] if p[3] == 0 else []

    def ce(p):  # 117 call common event
        n = p[0]
        if n in (41, 42, 148):  # Frieza's transformations / the ending picture: pictures and waits
            return script(D('commonevents')[n]['list'])
        if n == 46:  # 悟空超サイヤ人変身 (CE46 → CE45: the change itself)
            return [{'x': 'ss', 'on': 1}]
        if n == 147:  # Z2超元気玉でフリーザ撃破: the film is drawn by src/z2scenes.js (it moves pictures by variables)
            return [{'x': 'film', 'name': 'superGenki'}]
        if n == 14:  # ドラゴンボール使用
            return [{'item': [i, -99]} for i in range(2, 9)]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        if n == 227:  # バーダック初回加入調整: his move counts (cha_tec_puls)
            return [{'x': 'uses', 'map': {147: 200, 148: 150, 149: 150, 150: 100, 151: 50, 152: 30}}]
        return []  # (CE9 必殺技設定: the moves are in world.actors)

    def code355(p):
        t = p[0].strip()
        if t.startswith('on_super_saiyazin'):
            return [{'x': 'ss', 'on': 1}]
        if t.startswith('chano = 3'):  # 486: Goku's 固有技能 サイヤ人の血 → 地球育ちのサイヤ人 (678 + its level)
            return [{'x': 'typical', 'id': 3, 'slot': 2, 'from': [13, 14, 15, 101, 102, 103, 104, 105, 106], 'to': 678}]
        if t.startswith('#クリリンをパーティーから外す'):  # 543 (the script's first line is this comment): Krillin leaves
            return [{'x': 'leave', 'id': 6}]
        if t.startswith('#悟空が死んでる可能性があるので復活する'):  # 543: Goku stands up again if he was down
            return [{'x': 'revive', 'id': 3}]
        return []

    EXTRA.update({
        231: pic, 232: move, 235: lambda p: [{'x': 'erase', 'n': p[0]}], 230: lambda p: [{'wait': p[0]}],
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        225: lambda p: [{'x': 'quake', 'dur': p[2]}],
        241: lambda p: [{'x': 'bgm', 'name': p[0]['name']}], 242: lambda p: [{'x': 'bgm', 'name': ''}],
        314: lambda p: [{'x': 'recover', 'id': p[0]}],
        315: lambda p: [{'x': 'exp', 'id': p[0], 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        117: ce, 355: code355,
    })
    pages = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['2']['pages'] if p['condition']['variable_valid']}
    ev2 = lambda v: [{'v41': v}] + script(pages[v])
    film = lambda mid, page=0: script(D('map%03d' % mid)['events']['1']['pages'][page]['list'])
    one = lambda nodes: scenes(nodes, [(None, None)])
    z2 = {str(v): one(ev2(v)) for v in (445, 447, 453, 463, 466, 473, 476, 478, 481, 484, 486, 492, 494, 498, 502,
                                       506, 508, 514, 521, 543, 561, 602)}
    z2['ginyuPose'] = one(film(27))  # map 27 (then 447)
    z2['porunga'] = one(film(28))  # map 28 (then 466)
    z2['turlesSlug'] = one(film(30))  # map 30: Slug and Turles appear (then 508)
    # the battle_process numbers of these pages: the battles themselves are run by src/z2b.js
    EXTRA.clear()

    # ---------- map 29 (Namek 4) ----------
    world['maps']['29'] = build_map(29, rows=89)  # the last row holds the original's control events only
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['29'] = [
        {'x': 24, 'y': 4, 'label': '召喚神龍', 'chapter': 'z2porunga', 'when': ['sw', 101, False]},
        {'x': 16, 'y': 65, 'label': '去內魯那裡', 'chapter': 'z2nail', 'when': ['sw', 102, False]},
        {'x': 26, 'y': 30, 'label': '和那美克星人說話', 'chapter': 'z2page', 'page': 506},
        {'x': 47, 'y': 22, 'label': '調查宇宙船', 'chapter': 'z2page', 'page': 521},
        {'x': 21, 'y': 61, 'label': '和那美克星人說話', 'chapter': 'z2page', 'page': 602},
        # Turles and Slug (and Bardock): at 概況 36, until Bardock has joined (145_Event_Check.rb, all.rb 185253)
        {'x': 11, 'y': 5, 'label': '這股氣是……', 'chapter': 'z2turles', 'when': [['sw', 109, False], ['var', 43, 36]]},
    ] + at([(10, 65), (50, 68), (19, 38), (40, 23)], INN) \
      + at([(8, 7), (10, 7), (22, 36), (14, 64), (54, 62), (45, 17), (10, 69)], CARD) + at([(11, 71), (48, 27)], TRAIN)
    # Frieza (map events 8-10, enemy1.png character 4): his first form once Piccolo is back, then the 2nd / 3rd form.
    # At 概況 34 the original stands Gohan (event 8, chara1, facing him) at (22,19) and Frieza (event 9) at (23,19) — drawn
    # from those events (world.maps[29].ev, as the original's conditions), the first form's marker only starts the fight
    import build_timeroom
    world['maps']['29']['ev'] = [e for e in build_timeroom.map_events(D, 29, 89) if (e[0], e[1]) in ((22, 19), (23, 19))]
    world['bosses']['29'] = [
        {'x': 23, 'y': 19, 'index': 4, 'flag': 'z2Frieza1', 'key': 'frieza1', 'when': [['sw', 102, True], ['var', 43, 34]], 'hidden': True},
        {'x': 37, 'y': 59, 'index': 4, 'flag': 'z2Frieza2', 'key': 'frieza2', 'when': ['var', 43, 35]},
        {'x': 37, 'y': 59, 'index': 4, 'flag': 'z2Frieza3', 'key': 'frieza3', 'when': ['var', 43, 36]},
    ]
    world['radar']['29'] = [(24, 4), (16, 65), (23, 19), (37, 59)]
    # 140_Field_Main.rb (24,26,29): 3-5 at a time (1-2 when alone); Frieza's last form (概況 36) brings stronger ones
    world['areas']['29'] = {'pool': [32, 35, 38, 41, 42], 'n': [3, 5], 'alone': [1, 2],
                            'late': {'var43': 36, 'pool': [33, 36, 39, 42, 44, 47]}}

    # ---------- people ----------
    def z2enemy(eid):
        e = enemy(eid)
        for k in ('sprite', 'portrait'):
            z = e[k].replace('Z1_戦闘_', 'Z2_戦闘_')
            for ext in ('.PNG', '.png'):
                if os.path.exists(os.path.join(ROOT, 'game', z[:-4] + ext)):
                    e[k] = z[:-4] + ext
        return e
    for eid in [32, 33, 35, 36, 38, 39, 41, 42, 44, 47] + list(range(48, 61)):
        world['enemies'][eid] = z2enemy(eid)
        world['enemies'][eid]['face'] = [P('Z2_顔敵.PNG'), eid - 30]  # the Z2 enemy faces: row = enemy id - 30
    names = {345: '能量波', 346: '超級能量波', 347: '爆發波', 349: '能量波', 350: '粉碎球', 382: '紫色彗星攻擊',
             351: '能量波', 352: '速度攻擊', 383: '紫色彗星攻擊', 353: '能量波', 354: '連續能量波', 355: '橡皮擦炮',
             356: '能量波', 357: '時間停止', 358: '能量波', 359: '爆發波', 360: '超級能量波', 361: '能量波', 362: '爆發波',
             363: '超級能量波', 364: '能量波', 365: '爆發波', 366: '超級能量波', 367: '能量波', 368: '爆發波', 369: '超級能量波',
             624: '死亡球', 694: '你就該死在我手上', 370: '能量波', 371: '爆發波', 372: '伽利克砲', 695: '超級伽利克砲',
             374: '能量波', 375: '爆發波', 376: '殺戮驅動', 377: '流星爆發', 378: '魔光砲', 379: '爆發波', 380: '大粉碎',
             381: '流星爆發', 331: '能量波', 332: '光線槍', 333: '能量波', 334: '能量波', 337: '能量波', 340: '能量波'}
    h['SKILL_NAMES'].update(names)
    sdb = D('skills')
    for sid in list(names) + [26, 29, 121, 122, 123, 124, 125, 147, 148, 149, 150, 151, 152, 158]:
        world['skills'][sid] = skill(sid)
        el = sdb[sid]['element_set']
        if 12 in el and 11 in el:
            world['skills'][sid]['stop'] = True  # グルドのタイムストップ: the target loses its turn (no damage)
    world['skills'][29]['ss'] = True  # スーパーサイヤ人変身: no damage, the user becomes a Super Saiyan (all.rb 53426)
    world['skills'][26]['name'] = '超級龜派氣功'
    # Vegeta (12), Nail (13), Super Saiyan Goku (14): CE9's moves; the Z2 battle sheets
    z2actor = lambda aid, name, jp, skills, ray='orange': dict(
        actor(aid, aid - 3, name, f'Z2_戦闘_{jp}.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills, ray), special=P(f'Z2_戦闘_必殺技_{jp}.PNG'))
    world['actors'].setdefault(12, z2actor(12, '貝吉塔', 'ベジータ', [121, 123, 124]))
    world['actors'][14] = z2actor(14, '悟空', 'ゴクウ(超)', [1, 2, 5, 26])
    world['actors'][14]['ss'] = 3  # the Super Saiyan form of actor 3 (src/supersaiyan.js)
    # Bardock (16): joins against Turles and Slug (page 508); CE9 outside his own chapters: 147 148 149 151 152
    # (158 スーパーサイヤ人変身 only after switch 595, his own story)
    world['actors'][16] = z2actor(16, '巴達克', 'バーダック', [147, 148, 149, 151, 152])

    # ---------- faces: the Z2 sheets (rows: party = actor id - 3, enemies = enemy id - 30) ----------
    FP, FF, FE, FC = P('Z2_顔味方.PNG'), P('Z2_顔敵.PNG'), P('Z2_顔イベント.PNG'), P('顔カード.PNG')
    faces = {s2t(n): [FP, r] for n, r in [('悟空', 0), ('比克', 1), ('悟饭', 2), ('克林', 3), ('雅木茶', 4), ('天津饭', 5),
                                           ('天津飯', 5), ('饺子', 6), ('贝吉塔', 9), ('内鲁', 10), ('巴达克', 13)]}
    faces.update({s2t(n): [FF, r] for n, r in [('基纽', 18), ('吉斯', 19), ('巴特', 20), ('利库姆', 21), ('古尔多', 22),
                                                ('弗利萨', 23), ('达列斯', 29), ('史拉格', 30)]})
    faces.update({s2t(n): [FE, r] for n, r in [('那美克星人', 1), ('青年', 7)]})
    faces.update({s2t('丹迪'): [FC, 14, 1], s2t('界王'): [FC, 25, 1], s2t('波仑加'): [FC, 31, 1]})
    faces['？'] = ['ui/face_unknown.png', 0]  # the stranger not yet named (Bardock, Turles, Slug): a black face, unknown (the opening's ？ is Raditz's shadow)

    def say_names(nodes, acc):
        for n in nodes:
            if 'say' in n:
                acc.add(n['say'][0])
            for k in ('then', 'else'):
                say_names(n.get(k, []), acc)
            for b in n.get('branches', []):
                say_names(b, acc)
        return acc
    who = set()
    for sc in z2.values():
        for part in sc:
            say_names(part['nodes'], who)

    world['z2b'] = {
        'titles': {'ginyu': '第二部　第四章　基紐特戰隊', 'frieza': '第二部　第五章　弗利薩'},
        'end': 'Z2　完',
        'pages': z2,
        'faces': faces,
        'start445': {'map': '26', 'x': 57, 'y': 25},
        'namek4': {'map': '29', 'x': 47, 'y': 24},
        'piccoloAt': {'map': '29', 'x': 10, 'y': 69},
        'beforeFrieza3': {'map': '29', 'x': 38, 'y': 62},  # the original's (38,59) is right by him: here he would start at once
        # battle_process (all.rb 182847-182898): enemies, music ($bgm_no_*); the extra-attack flags are the switches the
        # pages set before each battle (25-29, src/z2b.js fight); sorid: the 493/497 music with Bardock leading (and 93)
        'battles': {
            'ginyu': {'foes': [51, 52, 48, 49, 50], 'bgm': 'ZArrang_劇場版BGM1'},
            'frieza0': {'foes': [53], 'bgm': 'ZArrang_劇場版BGM1'},
            'frieza1': {'foes': [54], 'bgm': 'ZSB1 ピッコロのテーマ(GB音源Ver)'},
            'frieza2': {'foes': [55], 'bgm': 'ZSB1 フリーザのテーマ(GXSCC音源Ver)'},
            'frieza3': {'foes': [56], 'bgm': 'ZSSD 戦闘2', 'sorid': 'ZArrang_ソリッドステートスカウター'},
            'frieza3ss': {'foes': [56], 'bgm': 'ZSSD 戦闘2', 'sorid': 'ZArrang_ソリッドステートスカウター'},
            'fullPower': {'foes': [57], 'bgm': 'GBZ2 戦闘5'},
            'superVegeta': {'foes': [58], 'bgm': 'ZSSD 戦闘1(GB音源Ver)'},
            'turlesSlug': {'foes': [59, 60], 'bgm': 'ZG 戦闘4'},
        },
        'goku': {'uses450': {1: 50, 2: 40, 5: 30, 6: 25, 7: 20, 18: 15}, 'uses488': {1: 25, 2: 20, 5: 20, 6: 15, 7: 15, 18: 15}},
        'piccolo': {'uses475': {31: 20, 33: 20, 34: 20, 35: 10, 36: 30}, 'uses477': {31: 20, 33: 20, 34: 20, 35: 15, 36: 45},
                    'uses507': {31: 40, 33: 30, 34: 30, 35: 25, 36: 20}},
        'goals': {'29': {'33': '目標：把龍珠運到西北方的島上（召喚神龍）', '34': '目標：找到內魯，再去挑戰弗利薩（第二型態）',
                         '35': '目標：挑戰弗利薩（第三型態）', '36': '目標：與悟空一起挑戰弗利薩（最終型態）'}},
        # what the original opens after Z2 (not in this version): shown on the end card
        'unlocks': ['Z3：悟空在那美克星的最後決戰之後，收集龍珠、貝吉塔登場、古拉到來、人造人間……',
                    '時之間的新區域（「通知！」卡）', '超級賽亞人戰鬥曲（設定・戰鬥 BGM）'],
        'speakers': sorted(who),
    }
    # tools/s2t.py turns 那美克星 into 那美剋星; put the name right everywhere in this chapter's text
    world['z2b'] = json.loads(json.dumps(world['z2b'], ensure_ascii=False).replace('美剋', '美克'))
    c = world['z2b']
    for k in filter(None, c["faces"].values()):
        pics.add(k[0])
    pics |= {P(n) for n in ['Z2_背景_ナメック星_地上.PNG', 'Z2_背景_フリーザ_宇宙船_内部.PNG', 'Z2_背景_メディカルルーム.PNG',
                            'Z2_背景_最長老の家.PNG', 'Z2_背景_ナメック星_暗い.PNG', 'Z2_背景_界王星.PNG', 'Z2_背景_ナメック星_家.PNG',
                            'Z1_背景_都崩壊.PNG', 'Z2_戦闘_ゴクウ.PNG', 'Z2_戦闘_必殺技_ゴクウ.PNG',
                            'Z2_戦闘_必殺技_デスボール(極大玉縦)(超元気玉).PNG', 'z2_フリーザ超元気弾(フリーザのみ).PNG',  # CE147 (src/z2scenes.js)
                            'z2_フリーザ超元気弾_ヒット1.PNG', 'z2_フリーザ超元気弾_ヒット2.PNG', 'z2_フリーザ撃破界王星崩壊_1.PNG',
                            'z2_フリーザ撃破界王星崩壊_2.PNG', 'z2_フリーザ撃破界王星崩壊_3.PNG',
                            'Z2_戦闘_ゴハン_バトルスーツ.png', 'Z2_戦闘_必殺技_ゴハン_バトルスーツ.png',  # 521 (src/z2b.js suits)
                            'Z2_戦闘_クリリン_バトルスーツ.png', 'Z2_戦闘_必殺技_クリリン_バトルスーツ.png']}
    # sounds and music the pages use
    se, bgm = set(), {b['bgm'] for b in c['battles'].values()} | {b['sorid'] for b in c['battles'].values() if 'sorid' in b} | {'Z2 エンディング', 'GBZ2 フィールド1'}
    def walk(nodes):
        for n in nodes:
            if 'se' in n:
                se.add(n['se'])
            if n.get('x') == 'bgm' and n['name']:
                bgm.add(n['name'])
            for k in ('then', 'else'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    for sc in z2.values():
        for part in sc:
            walk(part['nodes'])
    se |= {'Z2 ラスト超元気玉ヒット', 'Z2 ラスト_ナメック星に穴が開く', 'Z3 変身', 'Z1 パワーアップ', 'Z1 飛ぶ'}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm)
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {p for p in pics if os.path.exists(os.path.join(ROOT, 'game', p))})
