"""Z4 第五章 人造人間 13 號（地圖 44・93） — world.json data, added by tools/build_z3.py (read by src/z4e.js). docs/z4e.md has
the whole chapter with the original's sources.

The original: Map007 event 7 「Z4_セル編」 pages 22 (2371), 70 (2941), 71 (2951) and 55-69 (2801-2931), the scenes
143_Event_Main.rb z1field 2371-2373 / 2801-2951 (all.rb 176835, 178112-178605), the spots of maps 44 / 93
(145_Event_Check.rb `when 44` / `when 93`, all.rb 185665 / 185795), the encounters of map 93 (140_Field_Main.rb
`when 93,94`, all.rb 165701), set_battle_event 17 (all.rb 52884) and battle_process 2832 / 2842 / 2852 / 2871 (all.rb 183056):
  2371 (page 22) Goku brings Dende back, everyone goes home → 2941 (page 70) Tien's group at the temple, the Room of
       Spirit and Time → map 44 (9,8), variable 121 = 3; (15,4) → 2951 (page 71) CE40 + 流派一致修行 (the party)
  2801 (page 55) shopping, Nos. 14 / 15 → 2811 set_battle_event 17 (Goku against them, a film) → 2821 (page 56) the Z
       fighters (and No. 16) gather → map 93 (60,29)
  map 93: No. 15 (10,24) 2831 → battle 2832; No. 14 (31,22) 2841 → battle 2842; both beaten → 2846 No. 13 wakes;
       No. 13 (65,17) 2851 → battle 2852 → 2861 the merge (CE63) → battle 2871 → 2881 → 2901-2931 → variable 41 = 2991
"""
import re

KEY = 'z4e'
P = lambda n: f'Graphics/Pictures/{n}'
# z1field speakers who are not in the party / enemy tables (tools/build_z3.py PARTY_FACES): 顔カード column 2 = Z3,
# Z3_顔敵 row = enemy id - 100, Z3_顔味方 row = actor id - 3 (16号 is actor 23 here)
CARD_FACES = {'布爾瑪': 8, '波波': 12, '丹迪': 14, '烏龍': 20, '牛魔王': 35, '桃白白': 115}
# the enemies' moves (the database has Japanese names only): as the earlier chapters word them
FOE_MOVES = {'エネルギー波': '能量波', '強力エネルギー波': '強力能量波', '連続エネルギー波': '連續能量波', 'ドレインライフ': '吸取生命',
             'フルパワーエネルギー波': '全力能量波', '爆発波': '爆發波', 'サイレントアサシン13': '沉默刺客13',
             'デッドリィアサルト': '致命突襲', 'SSデッドリィボンバー': 'SS 致命炸彈', 'フルパワーSSデッドリィボンバー': '全力 SS 致命炸彈',
             'アンドロイドチャージ14': '人造人衝鋒14', 'アンドロイドストライク15': '人造人打擊15'}
# 145_Event_Check.rb `when 93`
CARDS93 = [(18, 19), (29, 16), (28, 42), (31, 14), (46, 8), (58, 25)]
INNS93 = [(13, 22), (28, 18), (38, 10), (43, 7), (62, 27)]
TRAIN93 = [(11, 17), (20, 38), (27, 18), (33, 4), (57, 28), (58, 15)]
# map 93 events 6-8 (enemy5.png character 1: the direction row tells them apart): No. 15 until switch 579, No. 14 until
# 578, No. 13 once both are on (Event_Check sends (65,17) to 2851 whatever the switches; the map shows him only then)
ANDROIDS = [
    {'x': 10, 'y': 24, 'row': 2, 'key': '2831', 'flag': 'z4e15', 'when': ['sw', 579, False]},
    {'x': 31, 'y': 22, 'row': 1, 'key': '2841', 'flag': 'z4e14', 'when': ['sw', 578, False]},
    {'x': 65, 'y': 17, 'row': 0, 'key': '2851', 'flag': 'z4e13', 'when': [['sw', 578, True], ['sw', 579, True]]},
]
SUPER = {14, 18, 19, 20, 26, 32}  # the Super Saiyan actors: the remake keeps one member per character (src/supersaiyan.js)


def add(world, h, z3):
    build_map, enemy, skill, s2t, script, D, root = (h[k] for k in ('build_map', 'enemy', 'skill', 's2t', 'script', 'D', 'root'))
    file = z3['file']
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]

    # ---------- map 44 精神と時の部屋 (shared with chapters 1 and 3: variable 121 tells who trains) ----------
    world['maps'].setdefault('44', build_map(44))
    pois = world['pois'].setdefault('44', [])
    for p in [dict(SHOP, x=11, y=8), dict(INN, x=4, y=4)]:  # `when 44`: カード (11,8), 宿 (4,4)
        if not any(q['x'] == p['x'] and q['y'] == p['y'] for q in pois):
            pois.append(p)
    pois.append({'x': 15, 'y': 4, 'label': '開始修行', 'chapter': KEY, 'kind': 'train', 'when': ['var', 121, 3]})  # 修行開始 → 2951

    # ---------- map 93 人造人間13号編 ----------
    world['maps']['93'] = build_map(93, rows=54)  # the last row holds the original's control events only
    world['pois']['93'] = at(CARDS93, SHOP) + at(INNS93, INN) + at(TRAIN93, TRAIN)
    # (the 時の間 squares (39,25), (55,35) wait for the 時之間)
    world['bosses']['93'] = [dict(b, sheet='Graphics/Characters/enemy5.png', index=1) for b in ANDROIDS]
    world['areas']['93'] = {'pool': [234, 235, 236, 237], 'n': [3, 6]}  # 140_Field_Main.rb `when 93,94`: 3-6 of them

    # ---------- No. 15 (enemy 141: not in the shared list) and the moves' names ----------
    enemies_db, sdb = D('enemies'), D('skills')
    if 141 not in world['enemies'] and '141' not in world['enemies']:
        e = enemy(141)
        name = enemies_db[141]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        e['face'] = [F3, 41]
        world['enemies'][141] = e
        world['drops'][141] = [[d['item_id'], d['denominator']] for d in (enemies_db[141]['drop_item1'], enemies_db[141]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
    for eid in (138, 139, 140, 141, 234, 235, 236, 237):
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            if not sid:
                continue
            if sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
            jp = sdb[sid]['name'].split(')')[-1]
            if jp in FOE_MOVES:
                world['skills'][sid if sid in world['skills'] else str(sid)]['name'] = FOE_MOVES[jp]

    # ---------- the story pages ----------
    faces = dict(z3['faces'])
    faces.update({k: [CARD, r, 2] for k, r in CARD_FACES.items()})
    faces.update({'特蘭克斯': [P3, 14], '16號': [P3, 20], '13號': [F3, 38], '14號': [F3, 40], '15號': [F3, 41]})
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})

    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')

    def code355(p):  # the script lines of these pages (355 and its continuation lines 655)
        t = p[0].strip()
        if re.match(r'\$partyc\s*=\s*\[', t):
            ids = [int(x) for x in re.findall(r'\d+', t)]
            return [{'partyc': ids}, {'x': 'z4eParty', 'ids': ids}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        if t.replace(' ', '') == '$game_switches[21]=false':  # 画面揺らすフラグ off
            return [{'shake': False}]
        return []  # ($chadead, update_party_detail_status: the remake keeps them itself)

    def ce(p):
        n = p[0]
        if n == 159:  # 超サイヤ人全解除
            return [{'x': 'z4eSsOff'}]
        if n in (61, 62):  # トランクス技切り替え / 初期化トランクス衣替関連: as they are (switches, variable 173, his moves)
            return script(cdb[n]['list'])
        if n == 63:  # 合体13号へ変身 (CE45 with No. 13's pictures)
            return [{'x': 'z4eMerge'}]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        return []  # (CE40: the training's cards, src/z3train.js deals them)

    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        315: lambda p: [] if p[0] in SUPER else [{'x': 'exp', 'id': p[0], 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    raw = z3['raw4']

    def page(v):
        ns = z3['nodes_of'](raw[v], faces)
        # 126 筋斗雲 (item 78): the remake has no such card
        return [{'v41': v}] + [n for n in ns if not (n.get('item') and n['item'][0] == 78)]

    pages = {str(v): page(v) for v in (2371, 2941, 2801, 2821, 2846, 2881, 2901, 2911, 2921, 2931)}
    for v in (2831, 2841, 2851, 2861):  # the ones that end in a battle_process: [before, after]
        pages[str(v)] = z3['split_battle'](page(v))
    EXTRA.clear()
    OPTS.update(bgm=False, shakeSw=False)
    world['z3']['pages'].update({KEY + k: v for k, v in pages.items()})

    # ---------- the chapter ----------
    world['z3']['titles'][KEY] = 'Z4　第五章　人造人間 13 號'
    # 概況 92-94 (draw_story_so_far, all.rb 35402) as the goal while on the map
    goals = world['z3']['goals']
    goals['44'] = dict(goals['44'] if isinstance(goals.get('44'), dict) else {},  # (map 44: chapters 1 and 3 too)
                       **{'94': '目標：' + s2t('地球人啊 追上赛亚人！！') + '（前往右上方開始修行）'})
    goals.update({
        '93': {'92': '目標：' + s2t('Ｚ战士对战迷一般的人造人!!') + '（找出 14 號和 15 號）',
               '93': '目標：' + s2t('极限战斗!!三大超级赛亚人') + '（前往東北方的 13 號）'},
    })
    world['z3'][KEY] = {
        'room': {'map': '44', 'x': 9, 'y': 8},  # page 70: map 44 (9,8)
        'field': {'map': '93', 'x': 60, 'y': 29},  # page 56: map 93 (60,29)
        # battle_process 2832-2871: $Battle_MapID = 6; set_battle_event 17: 31
        'backdrop': 'bg/z3_battle_6.png',
        # set_battle_event 17 (all.rb 52884): Goku against [140, 140, 141], only they attack ($attack_order = [10, 11, 12]);
        # @event_atc_hit true = he dodges (the first two), false = it lands as usual
        'film': {'party': 3, 'foes': [140, 140, 141], 'dodge': [True, True, False], 'backdrop': 'bg/z3_battle_31.png'},
        # CE63: the back (0,128), the auras ($game_variables[97], [98]) = (132,128), the bodies ([99], [100]) = (58,128)
        'merge': {'back': file('Z3_スーパーサイヤ人_バック'), 'auras': [file(f'Z3_スーパーサイヤ人_ブロリー_気{k}') for k in (1, 2, 3)],
                  'aura': [132, 128], 'bodies': [file('Z3_人造人間13号変身1'), file('Z3_人造人間13号変身2')], 'body': [58, 128]},
    }

    # ---------- assets: the scenes' pictures, music, sounds ----------
    names = ['Z3_背景_天界', 'Z3_背景_精神と時の部屋', 'Z3_背景_街', 'Z3_背景_雪山', 'ZG_背景_宇宙船', 'Z3_背景_カプセルコーポレーション',
             'Z3_背景_林', 'ZG_背景_ゴクウの家', 'Z3_スーパーサイヤ人_バック', 'Z3_スーパーサイヤ人_ブロリー_気1', 'Z3_スーパーサイヤ人_ブロリー_気2',
             'Z3_スーパーサイヤ人_ブロリー_気3', 'Z3_人造人間13号変身1', 'Z3_人造人間13号変身2']
    pics = {file(n) for n in names} | {P3, E3, F3, CARD}
    assert None not in pics, [n for n in names if not file(n)]
    pics |= {world['enemies'][i][k] for i in (140, 141) for k in ('sprite', 'portrait')} | {'Graphics/Characters/enemy5.png'}
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
            if isinstance(n, list):
                walk(n)
                continue
            if 'se' in n:
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
            for k in ('then', 'else', 'loop'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    for p in pages.values():
        walk(p)
    se |= {'Z1 飛ぶ', 'Z3 変身', 'Z1 敵発見'}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {world['maps']['93']['bgm'], world['maps']['44']['bgm']})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)
