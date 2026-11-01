"""Chapter 2 (蛇道・桑修篇) data, added to world.json by tools/build_data.py.

What comes after Raditz in the original (Map007 event 1, pages by variable 41; spots from 145_Event_Check.rb):
  60 (after the part chapter 1 shows) Kami takes Goku to the other world, Enma, Snake Way; Garlic Jr. revives and
     sends 吉加・尼奇・桑修 after the dragon balls; Karin gathers the Z fighters and they split into pairs
     (Scene_Team_Divide: north / east / west)
  Map 5 蛇道 (Goku alone): 爺爺 80, 藍鬼 81, 紅鬼 82, the end of the road 83 → King Kai 84
  Map 8 桑修區 (the north pair): 普爾 91, 桑修 92 → battle (enemy 15) → 94, which ends with Goku's first
     training (巴布魯斯) — the end of this chapter.
Encounters from 140_Field_Main.rb (encounter): Snake Way like the Raditz area, the Garlic areas [1,2,7,8,9] 1-3 at
a time. Special moves from common event 9 (必殺技設定), Z1 branch.
"""


def scenes(nodes, cues):
    """Splits an event into [{bgm, nodes}] at the lines where the original changes the music (143_Event_Main.rb).
    cues: [(text the scene starts with or None for the first, BGM name), ...]"""
    out, cur = [], None
    for n in nodes:
        for mark, bgm in cues:
            if cur is None and mark is None or (mark and 'say' in n and n['say'][1].startswith(mark)):
                cur = {'bgm': bgm, 'nodes': []}
                out.append(cur)
        cur['nodes'].append(n)
    return out


def add(world, h):
    build_map, ev, actor, enemy, skill, s2t = h['build_map'], h['ev'], h['actor'], h['enemy'], h['skill'], h['s2t']
    FACE_PARTY, FACE_EVENT = h['FACE_PARTY'], h['FACE_EVENT']

    # ---------- maps ----------
    for mid, rows in ((5, 49), (8, 47)):  # the last row holds the original's control events only
        world['maps'][str(mid)] = build_map(mid, rows=rows)
    # Snake Way: Goku keeps to the road — the passable tiles of layer 2 (src/field.js road mode)
    world['maps']['5']['road'] = 2
    world['maps']['5']['oneWay'] = [3, 9]  # no walking back towards the start (it would farm the squares)

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '在修行場修行', 'effect': 'ki', 'lines': [['', '在修行場靜下心來修行……'], ['', '全員的 KI 恢復了！']]}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['5'] = [
        {'x': 17, 'y': 16, 'label': '和爺爺說話', 'event': 80},
        {'x': 41, 'y': 30, 'label': '和藍鬼說話', 'event': 81},
        {'x': 48, 'y': 19, 'label': '和紅鬼說話', 'event': 82},
        {'x': 71, 'y': 18, 'label': '前往界王星', 'chapter': 'kaio'},  # the end of Snake Way
    ] + at([(25, 19), (14, 8), (57, 19)], INN) + at([(12, 14), (48, 31), (62, 21)], CARD) \
      + at([(15, 24), (32, 23), (54, 16)], TRAIN)
    world['pois']['8'] = [
        {'x': 26, 'y': 17, 'label': '和普爾說話', 'event': 91},
    ] + at([(4, 4), (4, 36), (40, 21)], INN) + at([(16, 3), (24, 23), (47, 34), (51, 5), (53, 5), (55, 5)], CARD) \
      + at([(4, 17), (52, 6), (54, 6), (57, 22)], TRAIN)

    # ---------- people ----------
    Z1_SKILLS = {5: [46], 6: [61, 62, 63, 64], 7: [71, 72, 73], 8: [81, 82, 83, 84], 9: [91, 92, 93]}
    for aid, name, jp, ray in [(5, '悟飯', 'ゴハン', 'green'), (6, '克林', 'クリリン', 'orange'),
                               (7, '雅木茶', 'ヤムチャ', 'orange'), (8, '天津飯', 'テンシンハン', 'orange'),
                               (9, '餃子', 'チャオズ', 'orange')]:
        world['actors'][aid] = actor(aid, aid - 3, name, f'Z1_戦闘_{jp}.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', Z1_SKILLS[aid], ray)
    for eid in (7, 8, 9, 15):
        world['enemies'][eid] = enemy(eid)
    h['SKILL_NAMES'].update({307: '能量波', 321: '能量波', 324: '能量波', 325: '強力能量波'})
    for sid in sorted({x for v in Z1_SKILLS.values() for x in v} | {307, 321, 324, 325}):
        world['skills'][sid] = skill(sid)
    world['faces'].update({s2t(n): [FACE_PARTY, r] for n, r in [('雅木茶', 4)]})
    world['faces'].update({s2t(n): [FACE_EVENT, r] for n, r in [
        ('蓝鬼', 6), ('红鬼', 9), ('古雷格利', 13), ('巴布鲁斯', 17), ('阎王', 16)]})  # 閻王: the face the scene shows (z1field 65)
    world['faces'].setdefault('悟飯', [FACE_EVENT, 0])

    # ---------- events ----------
    for v in (11, 80, 81, 82, 91):
        world['events'][str(v)] = ev(v)
    after = ev(60)
    cut = next(k for k, n in enumerate(after) if 'say' in n and '開始向地球移動' in n['say'][1])
    rest = after[cut + 1:]
    split = next(k for k, n in enumerate(rest) if 'say' in n and '拜託你了' in n['say'][1])  # team split before this
    while rest[split - 1].get('z1field'):  # z1field 70 (the team split) and 71 (Karin Tower again) open the second part
        split -= 1
    # variable 41 where each part starts (src/cutscene.js), so a save made in between still shows the right scenes:
    # the Raditz ending leaves it at 63 (z1field 60-62), the team split is z1field 70
    rest = [{'v41': 63}] + rest[:split] + [{'v41': 70}] + rest[split:]
    split += 1

    world['areas'] = {  # random encounters per map: enemy ids, how many at once
        '1': {'pool': [1, 2, 4, 5], 'n': [1, 3]},
        '5': {'pool': [1, 2, 4, 5], 'n': [1, 3]},
        '8': {'pool': [1, 2, 7, 8, 9], 'n': [1, 3]},
    }
    # bosses on the field by map (src/field.js); flag = the state.flags entry set once beaten
    world['bosses'] = {'1': dict(world['boss'], index=0, flag='bossDone'),
                       '8': {'x': 63, 'y': 31, 'enemy': 15, 'index': 1, 'flag': 'sanshoDone'}}  # enemy1.png character 1
    world['chapter2'] = {
        'title': '第二章　蛇道・桑修篇',
        # Goku dies, Enma, Snake Way, Garlic Jr., Karin Tower; then (after the teams are chosen) Goku sets off
        'otherWorld': scenes(rest[:split], [(None, 'Z1 イベント4'), ('此時的地球上', 'DB3 イベント07'), ('在地球上 不僅', 'Z1 イベント4')]),
        'karin': scenes(rest[split:], [(None, 'Z1 イベント4')]),
        'team': {'members': [4, 5, 6, 7, 8, 9], 'face': [FACE_EVENT, 8],
                 'ask': s2t('谁和谁组队呢？'), 'sides': ['北', '東', '西'], 'ok': s2t('这样就可以了吧')},
        'snake': {'map': '5', 'x': 3, 'y': 9, 'party': [3]},
        'kaio': scenes(ev(83) + ev(84), [(None, 'Z1 イベント1'), ('？　這是什麼', 'Z1 界王'), ('各自出發', 'DB3 イベント02')]),
        'north': {'map': '8', 'x': 4, 'y': 5},
        'before': scenes(ev(92), [(None, 'DB3 戦闘前')]),
        'after': scenes(ev(94), [(None, 'DB3 戦闘前'), ('那時候去界王', 'Z1 界王')]),
        'goals': {'5': '目標：沿著蛇道一直往前，抵達界王星（地圖右上方）',
                  '8': '目標：找到桑修，奪回龍珠（地圖右下方）'},
    }
    c = world['chapter2']
    world['extraBgm'] = sorted({sc['bgm'] for k in ('otherWorld', 'karin', 'kaio', 'before', 'after') for sc in c[k]})
