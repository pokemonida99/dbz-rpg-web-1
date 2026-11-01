"""Chapter 3 (界王星・尼奇篇) data, added to world.json by tools/build_data.py (after build_field).

What follows Sansho in the original (Map007 event 1, pages by variable 41; spots from 145_Event_Check.rb):
  94 (the end of chapter 2) sends Goku to map 9, King Kai's planet, for the first training (巴布魯斯).
  Map 9 Z1バブルス修行 (Goku alone, no encounters): four training squares run page 36 → Scene_Db_Bubbles_Training
     (src/kaiotraining.js); a card square at (7,7). Winning the training sets variable 41 = 99.
  99  King Kai, then (z1field 100) the east pair takes over (variables 47/48); Piccolo + Gohan get their own scene
     (switch 50, as in z1field 86) → map 10 at (28,14).
  Map 10 Z1ニッキーエリア (the east pair; encounters [1,2,7,8,9] 1-3 at a time, 140_Field_Main.rb encounter):
     烏龍 101 (仙豆 card once, switch 54), 尼奇 102 → battle_process 103: enemies 14, 7, 9 → 104 (五星球), which ends
     with Goku's second training (古雷格利) — the end of this chapter. Gregory's training (map 11) and the west pair
     in the Ginger area (map 12) are the next chapter.
Variable 43 (the 概況 number) is 4 on King Kai's planet, 5 in the Nikki area, 6 after Nikki.
"""


def add(world, h):
    build_map, ev, enemy, skill, s2t = h['build_map'], h['ev'], h['enemy'], h['skill'], h['s2t']
    scenes = h['build_chapter2'].scenes

    # ---------- maps ----------
    for mid, rows in ((9, 14), (10, 38)):  # below these rows: nothing but the original's control events
        world['maps'][str(mid)] = build_map(mid, rows=rows)
    # King Kai's planet is a ring of squares (tile 1544) round his house: walk the ring, like the original's board
    world['maps']['9']['path'] = [1544]  # King Kai's planet: only the ring of squares (field.js walkable)

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['9'] = at([(7, 4), (10, 3), (12, 6), (9, 8)], {'label': '巴布魯斯修行', 'chapter': 'bubbles'}) \
        + at([(7, 7)], CARD)
    world['pois']['10'] = [{'x': 12, 'y': 33, 'label': '和烏龍說話', 'event': 101}] \
        + at([(27, 13), (54, 1), (53, 32)], INN) + at([(5, 17), (62, 1)], CARD) + at([(11, 3), (29, 28)], TRAIN)

    # ---------- people ----------
    world['enemies'][14] = enemy(14)
    h['SKILL_NAMES'].update({322: '強力能量波', 323: '刀攻擊'})
    for sid in (321, 322, 323):
        world['skills'][sid] = skill(sid)
    FACE_EVENT = h['FACE_EVENT']
    world['faces'].update({s2t(n): [FACE_EVENT, r] for n, r in [('古雷格利', 13), ('巴布鲁斯', 17), ('乌龙', 20)]})

    # ---------- events ----------
    world['events']['101'] = ev(101)
    world['areas']['10'] = {'pool': [1, 2, 7, 8, 9], 'n': [1, 3]}
    world['areas']['9'] = None  # King Kai's planet: no encounters
    world['bosses']['10'] = {'x': 41, 'y': 22, 'enemy': 14, 'foes': [14, 7, 9], 'index': 2, 'flag': 'nikkiDone'}  # enemy1.png character 2
    world['radar']['10'] = [(41, 22)]

    after99 = ev(99)
    world['chapter3'] = {
        'title': '第三章　界王星・尼奇篇',
        'end': '第三章　完',
        'kaio': {'map': '9', 'x': 7, 'y': 3, 'party': [3]},  # where page 94 leaves Goku
        # Scene_Db_Bubbles_Training (113): texts in the order the scene shows them
        'bubbles': {
            'bgm': 'Z1 界王修行', 'exp': 1000, 'tec': 10, 'wins': 6,
            'face': [FACE_EVENT, 17],
            # page 1 line 3: the Chinese edition says 古雷格利 here, a slip copied from the Gregory scene; the Japanese
            # original (commented out next to it) says バブルス, so this version names 巴布鲁斯
            'intro': [[s2t(t) for t in page] for page in (
                ['抓住巴布鲁斯吧！', '打出6回攻击星数比巴布鲁斯大的牌！', '巴布鲁斯出的牌为7时可以出1　8时可以出2', '※玩家出的牌为上述情况时不会输！'],
                ['即便输了也要继续出到用完牌为止！', '中途结束时也可以接着上次的进度开始！'],
                ['快点抓住他　与界王大人一起修行吧！', '抓紧时间　悟空！'])],
            'caught': s2t('悟空「终于成功了！！　抓到了！！！」'),
            'done': s2t('修行终了！　　获得了{exp}经验值！'),
            'level': s2t('{name}升到{level}级了！'),
            'tecText': s2t('所有的必杀技使用回数增加　{n}　回！'),
        },
        # 99: King Kai; then the east pair (Piccolo + Gohan scene on switch 50)
        'afterBubbles': scenes(after99, [(None, 'Z1 界王'), ('此時為了尋找', 'DB3 イベント02')]),
        'east': {'map': '10', 'x': 28, 'y': 14},
        'before': scenes(ev(102), [(None, 'DB3 戦闘前')]),
        'after': scenes(ev(104), [(None, 'DB3 戦闘前'), ('於此同時', 'Z1 界王')]),
        'goals': {'9': '目標：到修行場（地圖上的修行格）抓住巴布魯斯',
                  '10': '目標：找到尼奇，奪回龍珠（地圖中央偏右）'},
    }
    c = world['chapter3']
    for k in ('afterBubbles', 'before', 'after'):  # 尼奇「…卡里克大人！」」 has one 」 too many in the original
        for sc in c[k]:
            for n in sc['nodes']:
                if 'say' in n and n['say'][0] and n['say'][1].endswith('」'):
                    n['say'][1] = n['say'][1][:-1]
    world['extraBgm'] = sorted(set(world['extraBgm']) | {c['bubbles']['bgm']}
                               | {sc['bgm'] for k in ('afterBubbles', 'before', 'after') for sc in c[k]})

    # 概況 (Scene_Story_So_Far, the Chinese edition) for variable 43 = 4 … 6
    world['story']['soFar'].update({k: s2t(v) for k, v in {
        4: """在界王的指导下，悟空的修行开始了！
首先是捉住他的宠物巴布鲁斯！
不过，这个界王星的重力非常强！身体感觉像铅一样沉重！
悟空啊！加油！""",
        5: """Ｚ战士们朝东方前进，追寻龙珠！
绝不能让龙珠落入卡里克军团手中！""",
        6: """界王的第二阶段修行是用重重的锤子
敲击界王的仆人古雷格利…
古雷格利的速度惊人！
悟空！加油打吧！！""",
    }.items()})

    # the Bubbles training scene (src/kaiotraining.js) and the sword attack in battle (src/anime.js)
    P = lambda n: f'Graphics/Pictures/{n}.PNG'
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {P(n) for n in (
        'Z1_背景_スクロール_界王星', 'Z1_走るバブルス', 'Z1_走るバブルス(ジャンプ)', 'Z1_走るバブルス(後ろ向き煽る)',
        'Z1_走るバブルス(尻書き)', 'Z1_走るバブルス(普通に走る)', 'Z1_走る悟空', 'Z1_走る悟空(しゃがむ)', 'Z1_走る悟空(飛びつく)',
        'Z1_顔イベント')})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z1 SE110', 'Z1 SE111', 'Z1 SE112', 'Z1 SE113', 'Z1 刀攻撃', 'Z1 刀'})
