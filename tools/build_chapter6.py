"""Chapter 6 (界王修行・賽亞人篇, the end of Z1) data, added to world.json by tools/build_data.py.

What follows Garlic Jr. in the original (Map007 event 1, pages by variable 41; spots from 145_Event_Check.rb):
  127 (second half) King Kai: the last stage of Goku's training → map 14 Z1界王様修行 at (7,3), Goku alone.
  Map 14 (the ring of squares like map 9, no encounters): the five training squares run page 130, a battle against King
     Kai (battle_process 130: enemy 18; his HP carries over between tries in variable 52; losing sends Goku back to the
     map, healed: page 131). Variable 51 counts the tries; it decides when Goku reaches Earth later.
  132 King Kai is beaten → CE14 (the dragon balls are used up), CE12 (Goku becomes 界 school and learns 界王拳,
     界王拳・かめはめ波, 元気玉) → the Kame House, the seven balls → map 117 (the Shenron summoning film, 550 frames)
  135 Shenron revives Goku; King Kai gives the 喜歡角色變更 card; Goku runs down Snake Way; the Saiyans land, blow up
     the city; Kami and the Z fighters (party = Piccolo, Gohan, Krillin, Yamcha, Tien, Chiaotzu) → map 15 at (4,35)
  Map 15 Z1ベジータエリア: encounters [1..6] 2-6 at a time (140_Field_Main.rb); 琪琪 145 (cards; may join: actor 10),
     波波 146, 蘭琪 171, inns, card / training squares; 栽培人 147 (6 × enemy 3), 那巴 150 (enemy 11), 貝吉塔 154
     (enemy 12, who turns into the Great Ape, enemy 26, with skill 373). Goku arrives (CE11) before the Saibamen if
     King Kai took ≤ 5 tries, else before Nappa.
  156-160 Vegeta flees in his pod, King Kai, the narration → Title_Anime z1_ed (the Z1 ending film: the pod leaving
     Earth, Frieza) → variable 41 = 901 (the Willow chapter and the 時の間 extras, not in this version).
Variable 43 (the 概況 number): 10 King Kai's training, 11 Vegeta area, 12 after the Saibamen, 13 after Nappa.
"""


def add(world, h):
    build_map, ev, enemy, skill, actor, s2t, script, D = (h[k] for k in ('build_map', 'ev', 'enemy', 'skill', 'actor', 's2t', 'script', 'D'))
    scenes = h['build_chapter2'].scenes
    FACE_PARTY, FACE_EVENT = h['FACE_PARTY'], h['FACE_EVENT']
    enemies_db = h['enemies_db']

    # ---------- maps ----------
    world['maps']['14'] = build_map(14, rows=14)  # the last row holds the original's control events only
    world['maps']['14']['path'] = [1544]  # the ring of squares round King Kai's house (src/field.js)
    world['maps']['15'] = build_map(15, rows=38)  # rows 38-47 are empty

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['14'] = at([(6, 4), (8, 3), (10, 3), (9, 8), (11, 8)], {'label': '界王修行', 'chapter': 'kaioBattle'}) \
        + at([(6, 7), (13, 5)], CARD)
    world['pois']['15'] = [
        {'x': 5, 'y': 5, 'label': '和琪琪說話', 'chapter': 'chichi'},
        {'x': 36, 'y': 7, 'label': '和波波說話', 'event': 146},
        {'x': 25, 'y': 26, 'label': '和蘭琪說話', 'event': 171},
    ] + at([(5, 36), (24, 4), (48, 21)], INN) + at([(18, 30), (59, 18)], CARD) + at([(4, 28), (11, 32), (31, 28), (39, 20)], TRAIN)

    # ---------- people ----------
    for eid in (3, 6, 11, 12, 18, 26):
        world['enemies'][eid] = enemy(eid)
    world['enemies'][26]['size'] = 192  # the Great Ape's battle sheets have 192×192 frames
    world['enemies'][18]['sprite'] = world['enemies'][18]['portrait']  # King Kai has no special moves (no sheet)
    for eid in (17, 26):  # *PARAM_HPRECOVER[n]: n % of the max HP back every turn (all.rb 47470)
        if eid in world['enemies']:
            world['enemies'][eid]['regen'] = 1 if eid == 26 else 3
    h['SKILL_NAMES'].update({304: '自爆', 312: '能量波', 313: '爆發波', 314: '口中能量波', 316: '能量波', 319: '爆發波',
                             320: '伽利克砲', 373: '大猿變身', 585: '能量波'})
    sids = [6, 7, 18, 101, 102, 103, 104, 303, 304, 312, 313, 314, 316, 319, 320, 373, 585]
    sdb = D('skills')
    for sid in sids:
        world['skills'][sid] = skill(sid)
        el = sdb[sid]['element_set']
        if 25 in el:
            world['skills'][sid]['tail'] = True  # 尻尾切る: turns the Great Ape back (all.rb 68895)
        if 60 in el:
            world['skills'][sid]['selfDestruct'] = True  # the user dies (all.rb 68975)
    for sid in (64, 65, 103, 104):  # Krillin's 気円斬 too
        if sid in world['skills']:
            world['skills'][sid]['tail'] = True
    # 琪琪 (actor 10): joins on Earth (page 145); her moves from common event 9; she has no special-move sheet
    world['actors'][10] = actor(10, 7, '琪琪', 'Z1_戦闘_チチ.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', [101, 102, 103, 104])
    world['actors'][10]['special'] = world['actors'][10]['sprite']
    world['faces'].update({s2t(n): [FACE_EVENT, r] for n, r in [('界王', 18), ('神龙', 19), ('琪琪', 15), ('波波', 10), ('天神', 14)]})
    world['faces']['蘭琪'] = ['Graphics/Pictures/顔カード.PNG', 33]
    world['faces'][s2t('那巴')] = [h['FACE_FOE'], 11]
    world['faces'][s2t('贝吉塔')] = [h['FACE_FOE'], 12]
    world['drops'].update({eid: [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                                 if d['kind'] == 1 and d['item_id'] in world['items']] for eid in (3, 6, 11, 12, 18, 26)})

    # ---------- events ----------
    h['INLINE_CE'].add(267)  # 蘭琪 reads 武天老師's message = the tactics explanation (common event 267)
    for v in (146, 171):
        world['events'][str(v)] = ev(v)
    world['events']['145'] = ev(145)
    world['areas']['14'] = None
    world['areas']['15'] = {'pool': [1, 2, 3, 4, 5, 6], 'n': [2, 6]}
    # three on map 15 (map events 3, 5, 4 with enemy1.png characters 1-3); `key` = which fight (src/chapter6.js)
    world['bosses']['15'] = [
        {'x': 12, 'y': 5, 'index': 1, 'flag': 'saibaDone', 'key': 'saibamen', 'foes': [3] * 6},
        {'x': 45, 'y': 29, 'index': 2, 'flag': 'nappaDone', 'key': 'nappa', 'foes': [11]},
        {'x': 55, 'y': 5, 'index': 3, 'flag': 'vegetaDone', 'key': 'vegeta', 'foes': [12]},
    ]
    world['radar']['15'] = [(12, 5), (45, 29), (55, 5)]

    def before_if(nodes):  # a page up to its first branch (the part every visit plays)
        k = next(i for i, n in enumerate(nodes) if 'if' in n)
        return nodes[:k]

    p127 = ev(127)
    cut = next(i for i, n in enumerate(p127) if 'fadeout' in n)
    p132, p135, p156 = ev(132), ev(135), ev(156)
    # page 132 and CE11 set variable 41 and call z1field in one script command (a 655 line script() skips)
    p132 = p132[:1] + [{'z1field': True}] + p132[1:]
    ce11 = [{'v41': 152}, {'z1field': True}] + script(D('commonevents')[11]['list'])
    world['chapter6'] = {
        'title': '第六章　界王修行・賽亞人篇',
        'end': 'Z1　完',
        # 127, after the 一星球: King Kai starts the last stage (z1field 128/129), Goku alone on map 14
        'kaio': scenes([{'v41': 128}] + p127[cut + 1:], [(None, None)]),
        'kaioMap': {'map': '14', 'x': 7, 'y': 3, 'party': [3]},
        'kaioFoe': 18, 'kaioBgm': 'ZSSD 修行(GB音源Ver)',
        'kaioLose': s2t('被界王打败了……　再挑战一次吧！'),
        # 132: beaten → the Kame House, the dragon balls (then the Shenron film), 135: the wish … the Saiyans land
        'kaioWin': scenes(p132, [(None, None)]),
        'shenron': {'film': 'assets/film/shenron.webp', 'frames': 550, 'se': 'Z1 シェンロン呼び出し', 'seAt': 50, 'bgm': 'Z1 神龍'},
        'revive': scenes(p135, [(None, 'Z1 神龍')]),
        'earth': {'map': '15', 'x': 4, 'y': 35, 'party': [4, 5, 6, 7, 8, 9]},
        'goku': {'skills': [6, 7, 18], 'school': 3, 'uses': {1: 20, 2: 15, 5: 10}},  # CE12, z1field 153 cha_tec_puls
        'gokuArrives': scenes(ce11, [(None, None)]),
        'saibamen': scenes(before_if(ev(147)), [(None, None)]),
        'nappa': scenes(before_if(ev(150)), [(None, None)]),
        'vegeta': scenes(ev(154), [(None, None)]),
        'bgm': {'nappa': 'Z1 戦闘ボス1(中ボス)', 'vegeta': 'Z1 戦闘ボス2(ベジータ)'},  # battle_process set_bgm 10 / 11
        'after': scenes(p156, [(None, None)]),
        'ending': {
            'pictures': ['z1_edutyuu1', 'z1_edutyuu2', 'z1_edutyuu3', 'z1_edutyuu4', 'z1_edhuri-za', 'z1_edhuri-za2'],
            'se': 'Z1 落下',
        },
        'goals': {'14': '目標：到修行格挑戰界王（打倒界王修行就結束）',
                  '15': '目標：迎擊賽亞人（栽培人、那巴、貝吉塔）'},
        # what the original opens after Z1 (not in this version): shown on the end card
        'unlocks': ['巴達克篇（拉蒂茲區・巴達克篇，地圖 31）', '這世上最強的人：威洛篇（雪原・要塞，地圖 50／51）',
                    '複製拉蒂茲的洞窟（地圖 65）', '時之間的新區域（「通知！」卡）'],
    }
    c = world['chapter6']
    world['extraBgm'] = sorted(set(world['extraBgm']) | {c['kaioBgm'], c['shenron']['bgm'], 'Z1 フィールド1', 'Z1 イベント1',
                                                         'Z1 イベント2', 'Z1 イベント3', 'Z1 イベント4', 'Z1 戦闘前', 'DB3 カメハウス',
                                                         'DB3 筋斗雲', 'Z1 界王', 'Z1 戦闘ボス1(中ボス)', 'Z1 戦闘ボス2(ベジータ)'})

    # 概況 (Scene_Story_So_Far, the Chinese edition) for variable 43 = 10 … 13
    world['story']['soFar'].update({k: s2t(v) for k, v in {
        10: """终于，悟空得以直接接受界王的严格训练
这是一次艰苦的修行，地球的命运正悬在悟空身上！
赛亚人们的到来已经迫在眉睫！""",
        11: """终于，赛亚人来了！
Ｚ战士们能够阻止他们的侵略吗！？
悟空在另一个世界的修炼已经结束，他能及时赶到吗！？""",
        12: """拉蒂兹所说的更强大的赛亚人！
他们的实力如何！？力量又如何！？
Ｚ战士们能够抵抗他们的力量吗！？
决战的时刻即将来临！！！""",
        13: """Ｚ战士们打败了拥有可怕力量的那巴！
他们的战斗即将迎来高潮！
发挥出最后的力量吧！Ｚ战士！""",
    }.items()})

    P = lambda n: f'Graphics/Pictures/{n}.PNG'
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {P(n) for n in c['ending']['pictures']})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {'Z1 シェンロン呼び出し', 'Z1 落下', 'Z1 宇宙船落下', 'Z1 都爆発', 'Z1 飛ぶ',
                                                       'Z1 エネルギー波2', 'Z1 怪しい気', 'Z1 ダメージ', 'Z1 アイテム取得',
                                                       'Z1 スカウター音'})
