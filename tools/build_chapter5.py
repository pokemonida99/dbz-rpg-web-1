"""Chapter 5 (卡里克篇) data, added to world.json by tools/build_data.py (after build_chapter3 and the chapter 4 part).

What follows the Ginger area in the original (Map007 event 1, pages by variable 41; spots from 145_Event_Check.rb):
  114 (the end of the Ginger area, chapter 4) ends with the Z fighters gathering at Garlic's castle (z1field 116:
      $partyc = [4..9], all recovered) and sends them to map 13 at (4,24).
  Map 13 Z1ガーリックエリア (the six; encounters [1,2,7,8,9] 2-5 at a time, 140_Field_Main.rb encounter):
     占卜婆婆 172 (21,15) gives cards once (switch 1310); inns, card and training squares;
     卡里克三人眾 117 (54,17, marker EV006 at 54,16, gone on switch 59) → battle_process 120: enemies 13, 14, 15;
     卡里克 121 (54,5, marker EV005 at 54,4) → battle_process 122: enemy 16 → 123 (he grows and revives the three)
     → battle_process 126: enemies 17, 13, 14, 15 (music: ZArrang_btl02) → 127: the 一星球 (card 2) and a fade —
     the end of this chapter. The rest of page 127 (King Kai, z1field 128/129, Goku alone to map 14) and King Kai's
     training are the next chapter (src/chapter6.js).
Variable 43 (the 概況 number) is 8 in the Garlic area, 9 after the three.
"""


def add(world, h):
    build_map, ev, enemy, skill, s2t = h['build_map'], h['ev'], h['enemy'], h['skill'], h['s2t']
    scenes = h['build_chapter2'].scenes
    FACE_EVENT = h['FACE_EVENT']

    # ---------- maps ----------
    world['maps']['13'] = build_map(13, rows=36)  # the last row holds the original's control events only

    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    CARD = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois']['13'] = [{'x': 21, 'y': 15, 'label': '和占卜婆婆說話', 'event': 172}] \
        + at([(3, 24), (20, 3), (46, 24)], INN) + at([(3, 2), (50, 11)], CARD) \
        + at([(6, 2), (13, 22), (37, 6), (39, 20)], TRAIN)

    # ---------- people ----------
    for eid in (13, 16, 17):
        world['enemies'][eid] = enemy(eid)
    h['SKILL_NAMES'].update({308: '強力能量波', 309: '刀攻擊', 326: '能量彈', 328: '強力能量波', 329: '能量波', 330: '黑洞波'})
    for sid in (307, 308, 309, 326, 328, 329, 330):
        world['skills'][sid] = skill(sid)
    world['faces'].setdefault(s2t('占卜婆婆'), ['Graphics/Pictures/顔カード.PNG', 18])

    # ---------- events ----------
    h['INLINE_CE'].add(274)  # お助けカードについて, what 占卜婆婆 explains
    world['events']['172'] = ev(172)
    world['areas']['13'] = {'pool': [1, 2, 7, 8, 9], 'n': [2, 5]}  # rand(4) + 2 on map 13
    # both stand on the map at once (EV005 / EV006); the three are met first on the way up to the castle
    world['bosses']['13'] = [
        {'x': 54, 'y': 16, 'foes': [13, 14, 15], 'index': 3, 'flag': 'sanninDone', 'id': 'sannin'},
        {'x': 54, 'y': 4, 'foes': [16], 'index': 0, 'flag': 'garlicDone', 'id': 'garlic', 'after': 'sanninDone'},
    ]
    world['radar']['13'] = [(54, 4)]

    # page 127 up to its first fade: the 一星球 (card 2); King Kai and map 14 after it are chapter 6
    p127 = ev(127)
    after127 = p127[:next(k for k, n in enumerate(p127) if n.get('fadeout')) + 1]

    world['chapter5'] = {
        'title': '第五章　卡里克篇',
        'end': '第五章　完',
        'garlic': {'map': '13', 'x': 4, 'y': 24, 'party': [4, 5, 6, 7, 8, 9]},  # where page 114 leaves them
        'sannin': scenes(ev(117), [(None, 'DB3 戦闘前')]),
        'garlicBefore': scenes(ev(121), [(None, 'Z1 戦闘前')]),
        'garlicGrows': scenes(ev(123), [(None, 'DB2 イベント02')]),
        'garlicAfter': scenes(after127, [(None, 'Z1 戦闘前')]),
        'giantBgm': 'ZArrang_btl02_恐怖のギニュー特戦隊',
        'goals': {'13': ['目標：前往卡里克城，打倒卡里克三人眾（地圖右側）', '目標：進入卡里克城，打倒卡里克（地圖右上方）']},
    }
    c = world['chapter5']
    world['extraBgm'] = sorted(set(world['extraBgm']) | {c['giantBgm']}
                               | {sc['bgm'] for k in ('sannin', 'garlicBefore', 'garlicGrows', 'garlicAfter') for sc in c[k]})

    # 概況 (Scene_Story_So_Far, the Chinese edition) for variable 43 = 8, 9
    world['story']['soFar'].update({k: s2t(v) for k, v in {
        8: """终于，Ｚ战士们抵达了卡里克城
这里是他们的根据地！！
最后的一颗龙珠就在这里！
卡里克一伙也会拼死一战！""",
        9: """Ｚ战士们击败了卡里克的三人小队：吉加、尼奇和桑修
现在就剩下卡里克一人了！！！
围绕最后的龙珠，
一场激烈的生死搏斗即将开始！""",
    }.items()})
