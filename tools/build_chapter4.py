"""Chapter 4 (古雷格利修行・吉加篇) data, added to world.json by tools/build_data.py (after build_chapter3).

What follows Nikki in the original (Map007 event 1, pages by variable 41; spots from 145_Event_Check.rb):
  104 (the end of chapter 3) sends Goku to map 11 at (13,3) with variable 41 = 108.
  Map 11 Z1グレゴリー修行 (Goku alone, no encounters, the same ring of squares as map 9): five training squares run
     page 37 → Scene_Db_Gregory_Training (src/gregorytraining.js); card squares (6,7) (13,5). Winning sets 41 = 109.
  109 King Kai, then (z1field 110) the west pair takes over (variables 49/50, variable 43 +1); Piccolo + Gohan get
     their own scene (z1field 86, switch 50) → map 12 at (40,13).
  Map 12 Z1ジンジャーエリア (the west pair; encounters [1,2,7,8,9] 1-3 at a time, 140_Field_Main.rb encounter):
     牛魔王 111 (52,3) (cards once, switch 57), 吉加 112 (58,23; marker EV005 59,23 enemy1 index 3)
     → battle_process 113: enemies 13, 8, 9 → 114 (七星球), then z1field 116: the Z fighters gather at Garlic's
     castle (party = all six, all recovered, variable 43 +1) → map 13 at (4,24) with variable 41 = 117.
  Map 13 (the Garlic area) is the next chapter (src/chapter5.js, its own branch): it starts from there.
"""


def add(world, h):
    build_map, ev, enemy, skill, s2t = h['build_map'], h['ev'], h['enemy'], h['skill'], h['s2t']
    scenes = h['build_chapter2'].scenes

    # ---------- maps ----------
    for mid, rows in ((11, 14), (12, 47)):  # below these rows: nothing but the original's control events
        world['maps'][str(mid)] = build_map(mid, rows=rows)
    world['maps']['11']['path'] = [1544]  # King Kai's planet again: only the ring of squares (src/field.js)

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['11'] = at([(6, 4), (8, 3), (10, 3), (9, 8), (11, 8)], {'label': '古雷格利修行', 'chapter': 'gregory'}) \
        + at([(6, 7), (13, 5)], CARD)
    world['pois']['12'] = [{'x': 52, 'y': 3, 'label': '和牛魔王說話', 'event': 111}] \
        + at([(23, 6), (39, 13), (30, 25)], INN) + at([(5, 4), (12, 19), (39, 6)], CARD) \
        + at([(5, 32), (28, 12), (40, 19), (54, 34)], TRAIN)

    # ---------- people ----------
    world['enemies'][13] = enemy(13)
    h['SKILL_NAMES'].update({308: '強力能量波', 309: '刀攻擊'})
    for sid in (307, 308, 309):
        world['skills'][sid] = skill(sid)

    # ---------- events ----------
    world['events']['111'] = ev(111)
    world['areas']['12'] = {'pool': [1, 2, 7, 8, 9], 'n': [1, 3]}
    world['areas']['11'] = None  # King Kai's planet: no encounters
    world['bosses']['12'] = {'x': 59, 'y': 23, 'enemy': 13, 'foes': [13, 8, 9], 'index': 3, 'flag': 'gingerDone'}  # enemy1.png character 3
    world['radar']['12'] = [(59, 23)]

    world['chapter4'] = {
        'title': '第四章　古雷格利修行・吉加篇',
        'end': '第四章　完',
        'gregory': {'map': '11', 'x': 13, 'y': 3, 'party': [3]},  # where page 104 leaves Goku
        # Scene_Db_Gregory_Training (112): texts in the order the scene shows them
        'training': {
            'bgm': 'Z1 界王修行', 'exp': 1800, 'tec': 15, 'wins': 6,
            'face': [h['FACE_EVENT'], 13],
            'intro': [[s2t(t) for t in page] for page in (
                ['用锤子击中古雷格利吧！', '打出6回攻击星数比古雷格利小的牌！', '古雷格利出的牌为1时可以出7　2时可以出8', '※玩家出的牌为上述情况时不会输！'],
                ['即便输了也要继续出到用完牌为止！', '中途结束时也可以接着上次的进度开始！'],
                ['快点击中他　与界王大人一起修行吧！', '抓紧时间　悟空！'])],
            'caught': s2t('悟空「终于成功了！！　打中古雷格利了！！！」'),
            'done': s2t('修行终了！　　获得了{exp}经验值！'),
            'level': s2t('{name}升到{level}级了！'),
            'tecText': s2t('所有的必杀技使用回数增加　{n}　回！'),
        },
        # 109: King Kai; then the west pair (Piccolo + Gohan scene on switch 50)
        'afterTraining': scenes(ev(109), [(None, 'Z1 界王'), ('此時 為了尋找', 'DB3 イベント02')]),
        'west': {'map': '12', 'x': 40, 'y': 13},
        'before': scenes(ev(112), [(None, 'DB3 戦闘前')]),
        # 114: Ginger flees, the seven-star ball, then everyone gathers at Garlic's castle (z1field 116)
        'after': scenes(ev(114), [(None, 'DB3 戦闘前'), ('以剩下的一個龍珠', 'Z1 イベント3')]),
        'gather': [4, 5, 6, 7, 8, 9],
        'goals': {'11': '目標：到修行格用錘子擊中古雷格利',
                  '12': '目標：找到吉加，奪回龍珠（地圖右側）'},
    }
    c = world['chapter4']
    for k in ('afterTraining', 'before', 'after'):  # 吉加「…」」 ends with one 」 too many in places, like 尼奇
        for sc in c[k]:
            for n in sc['nodes']:
                if 'say' in n and n['say'][0] and n['say'][1].endswith('」'):
                    n['say'][1] = n['say'][1][:-1]
    world['extraBgm'] = sorted(set(world['extraBgm']) | {c['training']['bgm']}
                               | {sc['bgm'] for k in ('afterTraining', 'before', 'after') for sc in c[k]})

    # 概況 (Scene_Story_So_Far, the Chinese edition) for variable 43 = 7, 8 (7 writes Ｚ戦士 with the Japanese 戦 once; 战 here)
    world['story']['soFar'].update({k: s2t(v) for k, v in {
        7: """Ｚ战士们朝西方前进，追寻龙珠！
为了守护地球，Ｚ战士加油吧！""",
        8: """终于，Ｚ战士们抵达了卡里克城
这里是他们的根据地！！
最后的一颗龙珠就在这里！
卡里克一伙也会拼死一战！""",
    }.items()})

    # the Gregory training scene (src/gregorytraining.js)
    P = lambda n: f'Graphics/Pictures/{n}.PNG'
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {P(n) for n in (
        'Z1_走るグレゴリー', 'Z1_走るグレゴリー(横振り避け)', 'Z1_走るグレゴリー(縦振り避け)', 'Z1_走るグレゴリー(悟空しゃがみ中)',
        'Z1_走る悟空_ハンマー持っている', 'Z1_走る悟空_ハンマー(しゃがむ)', 'Z1_走る悟空_ハンマー(縦振り)', 'Z1_走る悟空_ハンマー(横振り)')})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z1 強打'})
