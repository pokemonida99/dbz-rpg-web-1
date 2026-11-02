"""The Willow chapter (この世で一番強いやつ), added to world.json by tools/build_data.py after chapter 6.

What the original plays after the Z1 ending film (Title_Anime z1_ed sets variable 41 = 901; Map007 event 9
「イベント実行Z1ウィロー編」, one page per value of variable 41; spots from 145_Event_Check.rb):
  901 the story: the narration, Piccolo on the 鶴舞つぶり山 (z1field 901-909: Oolong and Gohan with the dragon radar,
     Kochin summons Shenron and wakes Dr. Willow from the ice, the Bio-Men, Piccolo is taken), the Kame House (910-913:
     Kochin takes Master Roshi and Bulma), Kochin and Willow (914/915), Oolong tells Goku (916), the Z fighters set off
     (917; Piccolo joins at 918, Chichi at 919): $partyc = [3..10] → map 50 Z1ウィローエリア(雪原) at (5,30).
  Map 50 (encounters [1,2,3,25], 2-5 at a time; inns, card and training squares): the fortress door (5..6, 3..4)
     runs page 931 → map 51 Z1ウィローエリア(要塞) at (37,34).
  Map 51 (encounters [1,2,3,25], 2-6; inns, card and training squares): the Bio-Warriors at (6,17) (marker EV005 at
     (6,16), gone with switch 502) run page 941 — Master Roshi joins ($partyc << 24, get_skill 24,13) — then battle
     943: enemies 23, 24, 22 (music $bgm_no_ZMove_M814A); Dr. Willow at (5,4)/(6,5)/(7,4) (marker EV006 at (6,4))
     runs page 951 (z1field 951/952) and battle 953: enemy 20 (music 戦(IKUSA)3); the win goes to page 961 (z1field
     961, CE180) and 962 「Dr.ウィロー撃破後フリーザ編へ」: variable 40 = 1, $game_progress = 1, $partyc = [5,6,7,8,9],
     variable 41 = 281 (the Z2 opening, not in this version: src/willow.js shows a 「待續」 card instead).
Variable 43 (the 概況 number): 16 the snowfield, 17 the fortress, 18 after the Bio-Warriors.
"""


def add(world, h):
    build_map, enemy, skill, actor, s2t, script, D = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D'))
    FACE_FOE, FACE_EVENT = h['FACE_FOE'], h['FACE_EVENT']
    CARD_FACES = 'Graphics/Pictures/顔カード.PNG'
    enemies_db = h['enemies_db']

    # ---------- maps ----------
    world['maps']['50'] = build_map(50, rows=47)  # the last row holds the original's control events only
    world['maps']['51'] = build_map(51, rows=47)

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['50'] = [{'x': x, 'y': y, 'label': '進入威洛要塞', 'chapter': 'fortress'} for x, y in ((5, 3), (6, 3), (5, 4), (6, 4))] \
        + at([(8, 31), (61, 23), (25, 3)], INN) + at([(2, 25), (28, 3), (53, 18)], CARD) + at([(2, 27), (53, 16), (16, 1)], TRAIN)
    # (3,7) is the 「カード特殊」 square: chk_card with variable 44 = 10, the same Z1 cards
    world['pois']['51'] = at([(13, 15), (40, 34)], INN) + at([(27, 8), (49, 32), (3, 7)], CARD) + at([(7, 26), (42, 20)], TRAIN)

    # ---------- people ----------
    for eid in (20, 22, 23, 24, 25):  # (コーチン, 21, never fights: only his face is used)
        e = world['enemies'][eid] = enemy(eid)
        e['sp'] = int(enemies_db[eid]['maxmp'])  # (build_growth sets this for the enemies that exist before it)
    world['enemies'][20]['size'] = 192  # Dr. Willow's battle sheets have 192×192 frames (like the Great Ape)
    h['SKILL_NAMES'].update({459: '電磁鞭', 462: '冰結攻擊', 463: '伸皮攻擊', 464: '能量波', 465: '強力能量波',
                             586: '能量波', 587: '光子衝擊', 588: '口中能量波', 589: '巨型轟炸', 590: '行星噴發'})
    # 亀仙人 (actor 24): joins at the Bio-Warriors (page 941); his moves from common event 9 (魔封波 only from Z2 on)
    world['actors'][24] = actor(24, 21, s2t('龟仙人'), 'Z1_戦闘_かめせんにん.png', 'Z1_戦闘_必殺技_エネルギー波.PNG', [225, 226, 228, 229])
    for sid in (225, 226, 228, 229, 459, 462, 463, 464, 465, 586, 587, 588, 589, 590):
        world['skills'][sid] = skill(sid)
    # his 固有技能 (008_Share_Sub_skill.rb get_typical_skill chano 24): Z戦士の絆 / かなしばり / 武泰斗の教え
    world['growth']['typical'][24] = [[3, 13, 1], [6, 39, 2], [9, 687, 0], [13, 14, 1], [17, 688, 0], [21, 40, 2], [26, 15, 1],
                                      [33, 41, 2], [39, 689, 0], [45, 101, 1], [51, 131, 2], [57, 690, 0], [64, 102, 1],
                                      [70, 132, 2], [76, 691, 0], [82, 103, 1], [88, 133, 2], [95, 692, 0]]
    rows = D('chaskill')
    table = {r[0]: dict(zip(rows[0], r)) for r in rows[1:]}
    ids = lambda v: [int(x) for x in str(v).replace('`', ',').split(',') if x not in ('', '0')]
    for sid in range(687, 696):  # 武泰斗の教え (its effect — evasion, Sコンボ stars — is in src/willow.js)
        r = table[sid]
        world['growth']['skills'][sid] = {
            'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
            'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'], 'same': ids(r['cha_skill_same_no']),
            'up': int(r['cha_upgrade_skill_no'] or 0), 'old': ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE',
            'fx': {k: v for c, k in (('cha_skill_hatudouritu', 'rate'), ('cha_skill_a_hoshi', 'ah')) if (v := r[c]) not in (0, '0', '')}}
    world['faces'].update({
        s2t('老人'): [FACE_FOE, 21],  # Kochin, before he gives his name
        s2t('龟仙人'): [FACE_EVENT, 1],
    })
    world['drops'].update({eid: [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                                 if d['kind'] == 1 and d['item_id'] in world['items']] for eid in (20, 22, 23, 24, 25)})

    # ---------- encounters, bosses ----------
    world['areas']['50'] = {'pool': [1, 2, 3, 25], 'n': [2, 5]}  # rand(4) + 2
    world['areas']['51'] = {'pool': [1, 2, 3, 25], 'n': [2, 6]}  # rand(5) + 2
    # the markers are enemy5.png character 2 (map 51 events 5 and 6)
    world['bosses']['51'] = [
        {'x': 6, 'y': 16, 'sheet': 'Graphics/Characters/enemy5.png', 'index': 2, 'flag': 'bioDone', 'key': 'bio', 'foes': [23, 24, 22]},
        {'x': 6, 'y': 4, 'sheet': 'Graphics/Characters/enemy5.png', 'index': 2, 'flag': 'willowDone', 'key': 'willow', 'foes': [20]},
    ]
    world['radar']['51'] = [(6, 16), (6, 4)]

    # ---------- the story (Map007 event 9) ----------
    pages = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['9']['pages'] if p['condition']['variable_valid']}
    opts = h['OPTS']
    opts.update(bgm=True, partyc=True, shakeSw=True)
    ev = lambda v: [{'v41': v}] + script(pages[v])
    p901, p931, p941, p951, p961 = (ev(v) for v in (901, 931, 941, 951, 961))
    opts.update(bgm=False, partyc=False, shakeSw=False)
    one = lambda nodes: [{'bgm': None, 'nodes': nodes}]  # the music comes from the page's own BGM commands
    world['willow'] = {
        'title': s2t('威洛篇　这世上最强的人'),
        'intro': one(p901),
        'snow': {'map': '50', 'x': 5, 'y': 30, 'party': [3, 4, 5, 6, 7, 8, 9, 10]},  # z1field 919: $partyc = [3..10]
        'fortress': one(p931),
        'inside': {'map': '51', 'x': 37, 'y': 34},
        'bio': one(p941),
        'roshi': {'id': 24, 'skill': 13, 'uses': {225: 60, 226: 50, 228: 40, 229: 30}},  # get_skill 24,13; z1field 941 cha_tec_puls
        'willow': one(p951),
        'after': one(p961),
        'bgm': {'bio': 'ZArrang_btl02_恐怖のギニュー特戦隊', 'willow': 'ZArrang_btl13_戦(IKUSA)3'},
        # page 962: what Z2 starts from (variable 41 = 281 is the Z2 opening)
        # (the original sets 281 and its Map007 page leads on to 201, the Z2 あらすじ; Z2 here starts from 201)
        'z2': {'party': [5, 6, 7, 8, 9], 'var40': 1, 'progress': 1, 'v41': 201},
        'end': s2t('威洛篇　完'),
        'next': s2t('Ｚ２　弗利沙篇　待续'),
        'goals': {'50': s2t('目标：前往左上方的威洛要塞'),
                  '51': [s2t('目标：救出武天老师（要塞左侧的生化战士）'), s2t('目标：打倒威洛博士（要塞左上方）')]},
        # still not in this version: shown on the title screen after the chapter
        'unlocks': ['巴達克篇（拉蒂茲區・巴達克篇，地圖 31）', '複製拉蒂茲的洞窟（地圖 65）', '時之間的新區域（「通知！」卡）'],
    }
    c = world['willow']
    bgms = {n['bgm'] for k in ('intro', 'fortress', 'bio', 'willow', 'after') for n in c[k][0]['nodes'] if n.get('bgm')}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgms | set(c['bgm'].values()))
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n['se'] for k in ('intro', 'fortress', 'bio', 'willow', 'after')
                                                        for n in c[k][0]['nodes'] if n.get('se')})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {'Graphics/Characters/enemy5.png', CARD_FACES,
                                                                   'Graphics/Pictures/Z1_背景_シェンロン.png'})

    # 概況 (Scene_Story_So_Far, the Chinese edition) for variable 43 = 16 … 18
    world['story']['soFar'].update({k: s2t(v) for k, v in {
        16: """作为被誉为天才科学家的威洛博士的助手
克勤博士收集龙珠，从永久冰壁中，
在威洛博士死去50年后，让他重新复活！

作为拥有地球上最强的头脑的人
威洛博士开始寻找地球上最强的人类身体！
他将目标锁定在被称为武术之神的武天老師龟仙人身上
并且把他和布尔玛一同绑架！
在乌龙的请求下，大家迅速赶来相救
Ｚ战士们正前往被冰封的鹤舞山
那里正是威洛博士的要塞！""",
        17: """终于，Z战士们抵达了威洛博士的要塞！
被绑架的亀仙人和布尔玛，他们都平安无事吗！？

赶快，Ｚ战士们！！""",
        18: """Ｚ战士们成功解救了被绑架的亀仙人和布尔玛
并打倒了由克勤博士制造的生物战士！

无论如何，一定要阻止威洛博士的野心！！""",
    }.items()})
