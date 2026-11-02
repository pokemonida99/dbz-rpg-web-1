"""Z4 第四章 金屬古拉（地圖 84・90） — world.json data, added by tools/build_z3.py (read by src/z4d.js). docs/z4d.md has the
whole chapter with the original's sources.

The original: Map007 event 7 「Z4_セル編」 pages 41-54 (variable 41 = 2701-2791), the scenes 143_Event_Main.rb z1field
2701-2792 (all.rb 177902-178106), the spots of maps 84 / 90 (145_Event_Check.rb `when 84` / `when 90`, all.rb 185725),
their encounters (140_Field_Main.rb `when 84,91` / `when 90,92`, all.rb 165678), CE36 / CE37 / CE278 and battle_process
2726 / 2736 / 2765 / 2782 (all.rb 183035):
  2701 (page 41) Goku on New Namek, the Grand Elder, the Z fighters come ($partyc = [3,4,5,6,7,8,9,12,17]), Dende, the
       Big Gete Star, the young Namekian (actor 15: skills, +1800000 EXP), 筋斗雲 (CE278, item 78), Gohan's and the
       youth's moves, CE180 → map 84 (7,48), variable 43 = 90
  map 84: the Elder's village (6..7, 49..50) → 2711 (page 42); Metal Cooler (68..69, 2..3) → 2721 (page 43) → battle
       2726 → 2731 (page 44) → battle 2736 (three of him) → 2741 (page 45: more and more of him, the light) → 2751
       (page 46: inside the Big Gete Star, the guide robot) → map 90 (5,51), variable 43 + 1
  map 90: the robot soldiers A (7,7) B (43,48) C (69,9) D (73,49) (pages 47-50: CE37, switches 571-574; all four →
       575) → battle 2765 each; the fourth → 2769 (page 51: something moved); the door (30,14) → 2771 (page 52, until
       switch 575); the core (49,10) → 2781 (page 53) → battle 2782 → 2791 (page 54: back on Namek, Dende comes to
       Earth) → variable 41 = 2371 (第五章)
"""
import re

MAPS = ('84', '90')
SUPER = {14: 3, 18: 5, 19: 12, 20: 17}  # 315 to a Super Saiyan form: the remake keeps one member per character
# the speakers of these pages that the shared table (tools/build_z3.py PARTY_FACES / the enemies) does not have:
# 顔カード column 2 = Z3 (z1field 2702: 最長老 row 30, デンデ row 14), Z3_顔味方 row = actor id - 3 (青年 15, トランクス 17),
# Z3_顔イベント row 71 (誘導ロボット, z1field 2751), Z3_顔敵 row 113 (ロボット兵, z1field 2761)
FACES = lambda P3, E3, F3, CARD: {'大長老': [CARD, 30, 2], '丹迪': [CARD, 14, 2], '青年': [P3, 12], '特蘭克斯': [P3, 14],
                                  '機器人': [E3, 71], '機器兵': [F3, 113]}
# the field encounters (140_Field_Main.rb `when 84,91` / `when 90,92`: 金属人・金属沙维扎・金属德雷・金属内兹)
FOES = [229, 230, 231, 232]
# the enemies' moves of this chapter (the database has Japanese names only): the words the earlier chapters use
FOE_MOVES = {'エネルギー波': '能量波', '強力エネルギー波': '強力能量波', '連続エネルギー波': '連續能量波', '超能力': '超能力',
             '爆発波': '爆發波', 'マシーナリーレイン': '機械之雨', 'サウザーブレード': '沙維扎之刃', 'ビーム砲': '光束砲',
             'バルカン砲': '機關炮', '口からエネルギー波': '口中能量波', 'エネルギー吸収': '能量吸收',
             'スーパービッグノヴァ': '超級大新星'}


def add(world, h, z3):
    build_map, enemy, skill, actor, script, D = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 'script', 'D'))
    file = z3['file']
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    z = world['z3']

    # ---------- maps (the last row holds the original's control events only) ----------
    world['maps']['84'] = build_map(84, rows=69)
    world['maps']['90'] = build_map(90, rows=64)
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    spot = lambda x, y, label, pg, when=None: dict({'x': x, 'y': y, 'label': label, 'chapter': 'z4d', 'page': pg},
                                                   **({'when': when} if when else {}))
    world['pois']['84'] = at([(6, 37), (30, 10), (28, 26), (46, 32), (58, 14), (81, 27), (52, 49)], CARD_SQ) \
        + at([(16, 49), (43, 16), (54, 51), (74, 15), (21, 8)], INN) \
        + at([(22, 47), (8, 9), (33, 17), (56, 23), (56, 53), (78, 29)], TRAIN) \
        + [spot(x, y, '進入大長老的村子', 2711) for x, y in ((6, 49), (6, 50), (7, 49), (7, 50))] \
        + [spot(x, y, '前往金屬古拉那裡', 2721) for x, y in ((68, 2), (69, 2), (68, 3), (69, 3))]
    # (the door (30,13) stands in the way to the core until switch 575; here the player flies, so the core waits for it)
    world['pois']['90'] = at([(8, 47), (50, 34), (25, 8)], CARD_SQ) + at([(3, 48), (14, 12), (37, 28), (79, 40)], INN) \
        + at([(11, 53), (61, 28), (29, 17)], TRAIN) + [
        spot(30, 14, '調查門', 2771, ['sw', 575, False]),
        spot(49, 10, '前往金屬古拉核心', 2781, ['sw', 575, True])]
    # (the 時の間 squares — 84: (13,53) (25,2) (52,53), 90: (29,22) — wait for the 時之間)
    # the robot soldiers (map 90 events 7-10: enemy3.png character 7 facing left, until switches 571-574)
    world['bosses']['90'] = [{'x': x, 'y': y, 'sheet': 'Graphics/Characters/enemy3.png', 'index': 7, 'row': 1,
                              'flag': f'z4dRobot{k}', 'key': f'robot{k}', 'page': pg, 'when': ['sw', sw, False]}
                             for k, x, y, pg, sw in (('A', 7, 7, 2761, 571), ('B', 43, 48, 2762, 572),
                                                     ('C', 69, 9, 2763, 573), ('D', 73, 49, 2764, 574))]
    world['areas']['84'] = {'pool': FOES, 'n': [2, 5]}  # rand(4) + 2
    world['areas']['90'] = {'pool': FOES, 'n': [3, 6]}  # rand(4) + 3
    # (the battle backgrounds of the field: src/z3.js z3Backdrop, set_battle_map — Namek 0, the Big Gete Star 33)

    # ---------- enemies the shared part does not have (229-232, Z3 sheets) and the moves' names ----------
    enemies_db, sdb = D('enemies'), D('skills')
    sk = lambda sid: world['skills'][sid] if sid in world['skills'] else world['skills'][str(sid)]
    for eid in FOES:
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        assert e['sprite'] and e['portrait'], name
        e['face'] = [F3, eid - 100]
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
    for eid in FOES + [136, 213, 214]:
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            if sid and str(sid) not in world['skills'] and sid not in world['skills']:
                world['skills'][sid] = skill(sid)
            jp = re.sub(r'^.*\)', '', sdb[sid]['name'])
            if jp in FOE_MOVES:
                sk(sid)['name'] = FOE_MOVES[jp]

    # ---------- people ----------
    # 超悟飯 (18): the third chapter (the 精神時光屋) brings him; here only if it has not. CE9 必殺技設定: 46 47 48 53
    # (52 once 悟飯 has it); the Z4 sheet is ZG_戦闘_ゴハン(超) (set_btl_cha_name: cha_no 18, variable 40 = 2)
    if 18 not in world['actors'] and '18' not in world['actors']:
        world['actors'][18] = dict(actor(18, 15, '悟飯', 'ZG_戦闘_ゴハン(超).PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', [46, 47, 48, 53]),
                                   special=file('ZG_戦闘_必殺技_ゴハン(超)'), ss=5)
    # the moves page 41 teaches (悟飯 48 / 59, 超悟飯 46 47 48 52 53, 青年 145)
    for sid in (46, 47, 48, 52, 53, 59, 145, 141, 142, 143, 144):
        if sid not in world['skills'] and str(sid) not in world['skills']:
            world['skills'][sid] = skill(sid)
    sk(59)['ss'] = True  # スーパーサイヤ人変身 (悟飯: as 29)

    # ---------- the story pages ----------
    faces = dict(z3['faces'], **FACES(P3, E3, F3, CARD))
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')

    def code355(p):
        t = p[0].strip()
        if t == 'all_charecter_recovery':
            return [{'x': 'recover'}]  # (src/z2scenes.js: everyone, the bench too)
        if re.match(r'\$partyc\s*=\s*\[', t):
            return [{'x': 'z4dParty', 'ids': [int(x) for x in re.findall(r'\d+', t)]}]
        m = re.match(r'cha_tec_puls (\d+),0,3,(\d+)', t)
        if m:  # the move's use count + n (all.rb 13222, puls_type 3)
            return [{'x': 'uses', 'map': {m.group(1): int(m.group(2))}}]
        m = re.match(r'#z4dLearnIf (\d+) (\d+) (\d+) (\d+)', t)
        if m:  # (marked below: 「if actor a has skill b」 around 「actor c learns d」)
            a, b, c, d = (int(x) for x in m.groups())
            return [{'x': 'z4dLearnIf', 'has': [a, b], 'id': c, 'skill': d}]
        return []  # ($eve, $chadead, update_party_detail_status: nothing to do here)

    def ce(p):
        n = p[0]
        if n == 36:  # 悟空瞬間移動: the flash and the sound
            return script(cdb[36]['list'])
        if n == 37:  # ロボット兵イベント (switches 571-575, variable 41 = 2765)
            return z3['nodes_of'](cdb[37]['list'], faces)
        if n == 278:  # 筋斗雲カードについて: its explanation, as it is
            return script(cdb[278]['list'])
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        return []

    EXTRA.update({
        117: ce, 355: code355, 655: code355,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        251: lambda p: [{'x': 'z4dSeStop'}],
        314: lambda p: [{'x': 'recover', 'id': p[0]}],
        315: lambda p: [{'x': 'exp', 'id': SUPER.get(p[0], p[0]), 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(shakeSw=True)

    def learn_if(lst):
        """111 [4, a, 2, b] (actor a has learned skill b) around one 318: the shared converter has no actor conditions"""
        out, k = [], 0
        while k < len(lst):
            c = lst[k]
            if c['code'] == 111 and c['parameters'][0] == 4 and c['parameters'][2] == 2 and lst[k + 1]['code'] == 318 \
                    and [d['code'] for d in lst[k + 2:k + 4]] == [0, 412]:
                a, b = c['parameters'][1], c['parameters'][3]
                pid, _, sid = lst[k + 1]['parameters']
                out.append(dict(c, code=355, parameters=[f'#z4dLearnIf {a} {b} {pid} {sid}']))
                k += 4
                continue
            out.append(c)
            k += 1
        return out

    raw = z3['raw4']

    def page(v, lst=None):
        return [{'v41': v}] + z3['nodes_of'](learn_if(lst if lst is not None else raw[v]), faces)

    def before(v, code, test):
        """a page up to its first command `code` (top level) that passes test: the part before the battle / branch"""
        lst = raw[v]
        k = next(i for i, c in enumerate(lst) if c['code'] == code and c['indent'] == 0 and test(c['parameters']))
        return page(v, lst[:k])

    split = z3['split_battle']
    pages = {str(v): page(v) for v in (2701, 2711, 2741, 2751, 2769, 2771, 2791)}
    # page 46 opens a new scene window (Event_Main.new) after map 7: black until its z1field
    pages['2751'] = pages['2751'][:1] + [{'x': 'z4dClear'}] + pages['2751'][1:]
    pages['2721'] = split(page(2721))[0]  # (after the battle: only the transfer)
    pages['2731'] = split(page(2731))[0]
    pages['2781'] = split(page(2781))[0]
    for v in (2761, 2762, 2763, 2764):  # up to 「switch 575 on?」: the battle and the door are the flow's (src/z4d.js)
        pages[str(v)] = before(v, 111, lambda p: p[:2] == [0, 575])
    EXTRA.clear()
    OPTS.update(shakeSw=False)
    z['pages'].update({'z4d' + k: v for k, v in pages.items()})

    # ---------- the chapter ----------
    z['titles']['z4d'] = 'Z4　第四章　金屬古拉'
    z['z4d'] = {
        'map84': {'map': '84', 'x': 7, 'y': 48},  # page 41: variables 1 / 2 = 7 / 48, map 84
        'map90': {'map': '90', 'x': 5, 'y': 51},  # page 46
        'party': [3, 4, 5, 6, 7, 8, 9, 12, 17],  # page 41
        # $Battle_MapID of the story battles (battle_process)
        'backdrops': {'2726': 0, '2736': 0, '2765': 33, '2782': 33},
        # character_output_all mode 1 / 2 (all.rb 167997): who the scenes show besides the party
        'all1': [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 15],
        'all2': [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20],
    }

    # ---------- assets: the scenes' pictures, music, sounds ----------
    names = ['Z3_背景_ナメック星', 'Z3_背景_ビッグゲテスター', 'Z3_背景_ビッグゲテスター内部', 'Z2_顔イベント']
    pics = {file(n) for n in names} | {P3, E3, F3, CARD, 'Graphics/Characters/enemy3.png'}
    assert None not in pics, [n for n in names if not file(n)]
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
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
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {world['maps'][m]['bgm'] for m in MAPS})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics
                                    | {world['enemies'][i][k] for i in FOES + [136, 213, 214] for k in ('sprite', 'portrait')})
