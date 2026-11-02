"""時之間（第 1 階段）— world.json data, added by tools/build_z3.py (read by src/timeroom.js). Plan: docs/timeroom.md.

The original (Map007 event 1 pages 15 / 16, events 16-22 pages 9001-9999, 145_Event_Check.rb `when 58` …):
  the story maps' 時の間 squares (variable 41 = 15) → page 15: the first time 「这里是 时之间…」 + CE262 (switch 470),
    CE179 「新的区域开放了！」 while switch 483 is on; the way back (variables 231-235 ← 1, 2, 13, 43, 40), variable 43 =
    999, switches 471-473 by variable 40 (the walking sprites), switch 466, the story party ($story_partyc) and
    Super Saiyan flags ($story_sp_saiya) kept, everyone healed → map 58 (22,13), walking (switch 19 off)
  map 58 (時の間出入口): the exit (22,14) → page 16 (all of it undone, CE155, CE39); the doors of Z1 (5-6,1), Z2
    (16-17,1), Z3 (27-28,1), Z4 (38-39,1), ZG (49-50,1) — the corridors open with switches 520 / 119 / 431 / 459+570
    (the map's own events); 隊伍變更 (21,6) 9051, 説明 (19,13) 9021, 戦闘練習 (25,13) 9031, 闘技場 (22,5) 90001
  maps 59 / 66 / 72 / 85 (after Z4) or 86 / 96: each era's hall — 隊伍變更, back to map 58, the area doors at y = 2
    (open when the map's event there shows tile 255), the halls next to it (1,6) / (30,6)
The areas behind the doors (maps 60-65, 67-71, 73-77, 83, 87-95 …) are phase 2: src/timeroom.js lets them register.
"""
import os

from PIL import Image

ROWS = {58: 17, 59: 13, 66: 13, 72: 13, 85: 13, 86: 13, 96: 13}  # the rows with something on them (below: black, the control events)
GO = lambda m, x, y: {'map': str(m), 'x': x, 'y': y}

# the story maps' squares (145_Event_Check.rb: variable 41 = 15), with the conditions it has there
ENTRIES = {15: [(58, 28)], 51: [(10, 21)], 18: [(18, 39), (66, 59), (61, 14)], 24: [(10, 25)], 26: [(48, 23)],
           29: [(7, 6, ['var', 43, 36, 0]), (9, 68, ['var', 43, 36, 0]), (47, 65, ['var', 43, 36, 0]), (44, 26)],
           33: [(47, 45)], 38: [(11, 25)], 39: [(37, 21)], 40: [(24, 10), (10, 54), (68, 15)], 84: [(13, 53), (25, 2), (52, 53)],
           90: [(29, 22)], 93: [(39, 25), (55, 35)], 48: [(17, 10), (21, 55), (65, 12), (69, 63), (44, 28, ['sw', 458, True])]}

# each era's hall: (map, party change, back to the hall at its door, back to the hall's exit, the area doors at y = 2,
# the halls on either side). Areas: the page the original runs (phase 2 registers them by it) and the door's name.
HALLS = {
    59: {'party': (15, 6), 'back': ([15, 16], 11, GO(58, 5, 2)), 'exit': (14, 10), 'areas': [
        (3, 9102, '拉蒂茲區'), (8, 9111, '卡里克區'), (13, 9121, '界王區'), (18, 9131, '貝吉塔區'), (23, 9141, '威洛區'),
        (28, 9151, '巴達克篇')], 'next': (30, 6, GO(66, 2, 6), 'Z2')},
    66: {'party': (15, 6), 'back': ([15, 16], 11, GO(58, 16, 2)), 'exit': (14, 10), 'areas': [
        (3, 9302, '邱夷區'), (8, 9311, '多多利亞區'), (13, 9321, '薩博區'), (18, 9331, '基紐區'), (23, 9341, '弗利薩區'),
        (28, 9351, '巴達克篇（Z2）')], 'prev': (1, 6, GO(59, 29, 6), 'Z1'), 'next': (30, 6, GO(72, 2, 6), 'Z3')},
    72: {'party': (15, 6), 'back': ([15, 16], 11, GO(58, 27, 2)), 'exit': (14, 10), 'areas': [
        (3, 9502, '克拉斯區'), (8, 9551, '卡里克 Jr. 區'), (13, 9511, '皮拉爾區'), (18, 9521, '凱澤區'), (23, 9531, '古拉區'),
        (28, 9541, '人造人間區')], 'prev': (1, 6, GO(66, 29, 6), 'Z2'), 'next': (30, 6, 'z4side', 'Z4')},
    96: {'party': (15, 6), 'back': ([15, 16], 11, GO(58, 49, 2)), 'exit': (14, 10), 'areas': [
        (3, 9902, '布羅利區'), (8, 9911, '波傑克區'), (13, 9921, 'Episode of Bardock'), (18, 9931, 'Z 外傳'),
        (23, 9941, '帕伊庫漢區'), (28, 9951, '最後的頭目')], 'prev': (1, 6, GO(85, 44, 6), 'Z4')},
}
Z4_AREAS = [(3, 9702, '威洛（強）區'), (8, 9711, '賽魯第一形態區'), (13, 9721, '賽魯第二形態區'), (18, 9731, '金屬古拉區'),
            (23, 9741, '大格提斯塔區'), (28, 9751, '人造人間 13 號區'), (33, 9771, '賽魯遊戲區'), (38, 9781, '絕望的反抗'),
            (43, 9791, '另一個結局')]
HALLS[85] = {'party': (23, 6), 'back': ([23, 24], 11, GO(58, 38, 2)), 'exit': (22, 10), 'areas': Z4_AREAS,
             'prev': (1, 6, GO(72, 29, 6), 'Z3'), 'next': (45, 6, GO(96, 2, 6), 'ZG')}
HALLS[86] = {'party': (18, 6), 'back': ([18, 19], 11, GO(58, 38, 2)), 'exit': (17, 10), 'areas': Z4_AREAS,
             'prev': (1, 6, GO(72, 29, 6), 'Z3')}

# Scene_Db_infolist (create_put_infolist): [name, common event, shown when] in the original's order
INFO = [('　时之间', 262, None), ('　技能', 264, None), ('　组合技', 265, None), ('　必杀技熟练度', 266, None),
        ('　帮助卡', 274, None), ('　玩家喜欢的角色设定', 263, None), ('　作战', 267, None), ('　卡片合成', 269, None),
        ('　竞技场', 277, None), ('　１回合攻击挑战', 268, None),
        ('　服装变更', 271, ['sw', 502, True]),
        ('　时之间的战斗竞技场和各个场景', 273, ['any', ['sw', 1309, True], ['sw', 522, True]]),
        ('　技能「在地球长大的赛亚人」和「武泰斗的教诲」', 279, ['any', ['sw', 1313, True], ['var', 40, 2, 1]]),
        ('　组合技获取的提示', 275, ['any', ['sw', 1307, True], ['sw', 521, True]]),
        ('　技能「自由」', 276, ['any', ['sw', 1311, True], ['sw', 545, True]]),
        ('　组合技发动的优先度', 272, ['any', ['sw', 1308, True], ['sw', 431, True]]),
        ('　卡片「筋斗云」', 278, ['sw', 565, True])]

# lines of the pages (Map007 event 16 / event 1), converted like the story text
TEXT = {
    'here': '这里是 时之间…',  # page 15
    'partyFirst': ['在时之间中，我们可以随意改变队伍，不受主线剧情的影响', '※在队伍变更界面移动时，变身状态会解除'],  # 9051
    'partyAsk': '要改变队伍吗？', 'yes': '是', 'no': '否',
    'infoFirst': '在这里可以再次确认各种功能的说明哦！', 'infoAsk': '要确认功能的说明吗？', 'infoYes': '确认', 'infoNo': '不确认',  # 9021
    'infoTitle': '您想要确认哪个功能的说明？(按取消键可以退出)', 'infoEnd': '结束',  # Scene_Db_infolist
    'practiceAsk': '要开始战斗的练习吗？', 'practiceYes': '开始', 'practiceNo': '不开始',  # 9031
    'practiceKind': '请选择敌人的属性', 'practiceBoss': '以BOSS属性开始战斗', 'practiceNormal': '以通常属性开始战斗',
    'practiceBest': ['这次最高的伤害是', '{turn}回合的　{dmg}　伤害！！'],  # 9036 (\V[426], \V[424])
    'practiceNew': ['太好了！　刷新最高伤害记录了！', '', '最高记录：{dmg}', '过去记录：{old}'],
    'practiceNot': ['可惜！　没有更新最高记录！', '下次再加油吧！！'],
}


def cond(c):
    """an event page's conditions → src/field.js holds() form"""
    out = [['sw', c[k + '_id'], True] for k in ('switch1', 'switch2') if c[k + '_valid']]
    if c['variable_valid']:
        out.append(['var', c['variable_id'], c['variable_value'], 1])
    return out


def map_events(D, mid, rows, sheets=None):
    """world.maps[id].ev: the map's events from id 5 on above `rows` (1-4 are the original's control events) as
    [x, y, pages], a page = [conditions, graphic (tile id / [sheet, index, direction, pattern] / 0), priority (0 below,
    1 same as, 2 above the player), through]; src/field.js draws them and they block the way like the original's.
    The phase 2 areas use it for their maps' events too (boss sprites, doors). `sheets` collects the sheets used."""
    evs = []
    for k, e in sorted(D('map%03d' % mid)['events'].items(), key=lambda kv: int(kv[0])):
        if int(k) < 5 or e['y'] >= rows:
            continue
        pages = []
        for p in e['pages']:
            g = p['graphic']
            if g['tile_id']:
                gfx = g['tile_id']
            elif g['character_name']:
                gfx = [g['character_name'], g['character_index'], g['direction'], g['pattern']]
                if sheets is not None:
                    sheets.add(g['character_name'])
            else:
                gfx = 0
            pages.append([cond(p['condition']), gfx, p['priority_type'], int(p['through'])])
        evs.append([e['x'], e['y'], pages])
    return evs


def add(world, h, z3):
    build_map, D, s2t, enemy, root = h['build_map'], h['D'], h['s2t'], h['enemy'], h['root']
    nodes_of, file = z3['nodes_of'], z3['file']
    z = world['z3']
    ce = {c['id']: c for c in D('commonevents') if c}

    # ---------- the maps: walking (src/field.js `walk`), the map events' graphics by the switches ----------
    sheets = set()
    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        m['walk'] = True
        m['ev'] = map_events(D, mid, rows, sheets)
        world['maps'][str(mid)] = m
        world['areas'][str(mid)] = None  # no encounters

    # the walking sprites: map 58 event 2 「主人公」 (switches 471-473 = the era, variable 42 = the leader)
    walk = []
    for p in D('map058')['events']['2']['pages']:
        c, g = p['condition'], p['graphic']
        if not c['variable_valid'] or not g['character_name']:
            continue
        walk.append([c['variable_value'], [c[k + '_id'] for k in ('switch1', 'switch2') if c[k + '_valid']], g['character_name'], g['character_index']])
        sheets.add(g['character_name'])

    # map 48 (セルゲーム): its ring square (44,28) is a map event that shows the 時の間 tile 12 once Z4 is over
    world['maps']['48']['ev'] = [[44, 28, [[[], 0, 0, 0], [[['sw', 458, True]], 12, 0, 0]]]]

    # ---------- the spots ----------
    T = lambda **kw: dict(chapter='tr', **kw)
    for m, spots in ENTRIES.items():
        for sp in spots:
            p = T(x=sp[0], y=sp[1], label='時之間', page='enter')
            if len(sp) > 2:
                p['when'] = sp[2]
            world['pois'].setdefault(str(m), []).append(p)
    hall = [T(x=22, y=14, label='回到主線', page='leave'),
            T(x=5.5, y=1, label='往 Z1 時之間', page='go', to=GO(59, 15, 10)),
            T(x=16.5, y=1, label='往 Z2 時之間', page='go', to=GO(66, 15, 10), when=['sw', 520, True]),
            T(x=27.5, y=1, label='往 Z3 時之間', page='go', to=GO(72, 15, 10), when=['sw', 119, True]),
            T(x=38.5, y=1, label='往 Z4 時之間', page='go', to='z4', when=['sw', 431, True]),
            T(x=49.5, y=1, label='往 ZG 時之間', page='go', to=GO(96, 15, 10), when=[['sw', 570, True], ['sw', 459, True]]),
            T(x=21, y=6, label='隊伍變更', page='party'), T(x=19, y=13, label='功能說明', page='info'),
            T(x=25, y=13, label='戰鬥練習', page='practice'), T(x=22, y=5, label='鬥技場', page='arena')]
    world['pois']['58'] = hall
    for mid, hl in HALLS.items():
        ev = {(e[0], e[1]): e[2] for e in world['maps'][str(mid)]['ev']}
        xs, y, back = hl['back']
        spots = [T(x=hl['party'][0], y=hl['party'][1], label='隊伍變更', page='party'),
                 T(x=(xs[0] + xs[-1]) / 2, y=y, label='回大廳', page='go', to=back),
                 T(x=hl['exit'][0], y=hl['exit'][1], label='回大廳出口', page='go', to=GO(58, 22, 13))]
        for x, no, name in hl['areas']:
            open_ = [pg[0] for pg in ev.get((x, 2), []) if pg[1] == 255]  # the door shows tile 255 once open
            p = T(x=x, y=2, label=name, page='area', area=no)
            if open_ and all(open_):
                p['when'] = ['any', *open_] if len(open_) > 1 else open_[0]
            spots.append(p)
        for k in ('prev', 'next'):
            if k in hl:
                x, y, to, era = hl[k]
                spots.append(T(x=x, y=y, label=f'往 {era} 時之間', page='go', to=to))
        world['pois'][str(mid)] = spots

    # ---------- texts and pages ----------
    def ce_list(n):
        out = []
        for c in ce[n]['list']:
            if c['code'] == 401:  # \V[461] in CE275: $all_scombo_skill_level_add_num = 25
                c = dict(c, parameters=[c['parameters'][0].replace('\\V[461]', '25')])
            if c['code'] in (355, 655):
                continue
            out.append(c)
        return out

    bgm = {'code': 241, 'indent': 0, 'parameters': [{'name': 'DB3 イベント06', 'volume': 100, 'pitch': 100}]}
    msg = lambda t: [{'code': 101, 'indent': 0, 'parameters': ['', 0, 0, 1]}, {'code': 401, 'indent': 0, 'parameters': [t]}]
    pages = {
        'tr:first': nodes_of([bgm, *msg(TEXT['here']), *ce_list(262)]),  # page 15, switch 470 off
        'tr:new': nodes_of(ce_list(179)),  # CE179 時の間新表示
        'tr:practiceHelp': nodes_of(ce_list(268)),
    }
    info = []
    for name, n, when in INFO:
        key = f'tr:info{n}'
        pages[key] = nodes_of(ce_list(n))
        info.append({'name': s2t(name.strip('　')), 'page': key, **({'when': when} if when else {})})
    z['pages'].update(pages)

    conv = lambda t: [s2t(x) for x in t] if isinstance(t, list) else s2t(t)
    world['timeroom'] = {
        'walk': walk,
        'text': {k: conv(v) for k, v in TEXT.items()},
        'info': info,
        'z4': [GO(85, 23, 10), GO(86, 18, 10)],  # 9004: after Z4 (switch 458) map 85, before it map 86
        'z4Side': [GO(85, 2, 6), GO(86, 2, 6)],  # 9699 (from the Z3 hall)
        'bgm': 'DB3 イベント06',
    }

    # ---------- 戦闘練習 (9031-9036): 訓練人偶 (enemy 27) on the era's arena background ----------
    e = enemy(27)
    e['sprite'] = file('Z1_戦闘_必殺技_敵_训练人偶')
    e['portrait'] = file('Z1_戦闘_敵_训练人偶')
    world['enemies'][27] = e
    # set_battle_event 9035: $Battle_MapID 9 (Z1) / 6 (Z2) / 10 (Z3 on) of that era's 戦闘_背景
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    for era, (sheet, row) in enumerate([('Z1_戦闘_背景', 9), ('Z2_戦闘_背景', 6)]):
        strips = Image.open(os.path.join(pics, sheet + '.PNG')).convert('RGB')
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strips.crop((120, 100 * row, 520, 100 * row + 100)), (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'tr_practice_{era}.png'), optimize=True)
    world['timeroom']['practiceBg'] = ['bg/tr_practice_0.png', 'bg/tr_practice_1.png', 'bg/z3_battle_10.png']

    # ---------- phase 2: the areas, each part in its own file (docs/timeroom-plan.md) ----------
    tr = {'map_events': map_events, 'cond': cond, 'sheets': sheets, 'GO': GO}
    import build_tr_z1  # noqa: E402  (Z1 的區域: maps 60-64)
    build_tr_z1.add(world, h, z3, tr)
    import build_tr_z2  # noqa: E402  (Z2 的區域: maps 67-71)
    build_tr_z2.add(world, h, z3, tr)
    import build_tr_z3  # noqa: E402  (Z3 的區域: maps 73-77, 83)
    build_tr_z3.add(world, h, z3, tr)
    import build_tr_z4  # noqa: E402  (Z4 的區域: maps 87-95)
    build_tr_z4.add(world, h, z3, tr)
    import build_tr_bardock  # noqa: E402  (巴達克篇 Z1 / Z2: maps 31, 54, 65)
    build_tr_bardock.add(world, h, z3, tr)

    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {f'Graphics/Characters/{n}.png' for n in sheets})
    world['extraBgm'] = sorted(set(world['extraBgm']) | {'DB3 イベント06', 'FCJ1 イベント1'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z1 出る', 'Z1 入る', 'DB2 アイテム取得', 'Z2 気が遠くなる', 'Z3 アイテム取得'})
