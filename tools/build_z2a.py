"""Z2 first half (フリーザ編 前半: to Namek, Goku's training, the Grand Elder and Zarbon) data for world.json, added by
tools/build_data.py (world['z2a'], read by src/z2a.js).

The Z2 story is Map007 event 2 (イベント実行Z2), one page per value of variable 41 (a page runs for every value from its
number up to the next page's); the spots that pick the page are 145_Event_Check.rb, the scenes 143_Event_Main.rb
z1field 201-445 / 503-515 / 601 (src/z2a.js SCENES), the battles battle_process 308 / 324 / 340 / 425 / 440 / 443.

  Z2-1 いざ！ナメック星へ  281 (Z2 あらすじ 1, CE15) → map 17 (4,4) space: 謎の宇宙船 301 (sw81), 謎の惑星 305 → aliens
       (308) → 309 (sw82), ナメック星 310 → map 18 (13,33) Namek: cave 321 → map 22 (34,6) キュイ 323/324 (sw87),
       the Namekian village 325 (sw86; the young Namekian joins, 503, once sw96), Frieza's gang 326 (sw96) → the
       shooting game (TBoss_Scene) → 336, Dodoria 339 (sw97: set by the village after キュイ, or by キュイ after the
       village, 337/338) → battle 340 → 341 (CE180) → 401.
  Z2-2 悟空出撃！  401 (Goku alone, map 23 (4,4)) → training squares 410 → map 20 (10,3) gravity room → 20× (var43 23,
       sw90) → 411 (Gohan's party back on Namek, map 24 (26,72); the young Namekian leaves 504/505) → the village 413
       (sw89) and the pond 419/420 (sw85, CE79: one of six pond maps) in either order; the first sends the story to
       Goku 415 (King Kai, Piccolo), the second to Goku 421; Goku's 50× (var43 25, sw91) → 418 (Frieza's ship 432-434,
       back to Namek 515), 100× (var43 27, sw92) → 428 → Piccolo with King Kai (map 21 (11,2), 10×, sw100) → 430
       → map 24. カナッサ星 422 (map 23 (14,39), sw93) whenever Goku is in space.
  Z2-3 最長老  435 the Grand Elder's house (map 24 (7,7), behind the rock EV005 at (23,20) until var43 28) → Vegeta
       joins (439), Zarbon (440) and his transformation (443) → 444 → map 26 (4,6) → the pond (57,25) 445: the last
       ball → map 27 (page 446 on: the second half).
Variable 43 (the 概況 number): 21 space, 22 Namek, 23 Goku 20×, 24 Gohan, 25 Goku 50×, 26 Gohan, 27 Goku 100×,
28 Piccolo, 29 Gohan (the Grand Elder), 30 Namek 3.
"""
import os
import re
import unicodedata
from PIL import Image

P = lambda n: f'Graphics/Pictures/{n}.PNG'
P2, E2, F2, CARD = P('Z2_顔味方'), P('Z2_顔イベント'), P('Z2_顔敵'), P('顔カード')

# the original's Z2 art for what Z1 drew (the Z2_ prefix of $top_file_name / $btl_top_file_name): src/era.js swaps them
# while variable 40 is 1. Battle sheets of the Z1 party (actor 3-9) and the party faces (same rows).
ERA_SHEETS = ['顔味方'] + [f'戦闘_{n}' for n in ('ゴクウ', 'ピッコロ', 'ゴハン', 'クリリン', 'ヤムチャ', 'テンシンハン', 'チャオズ')] \
    + [f'戦闘_必殺技_{n}' for n in ('ゴクウ', 'ピッコロ', 'ゴハン', 'クリリン', 'ヤムチャ', 'テンシンハン', 'チャオズ')]

# who speaks with which face in Z2 (the remake's dialogue faces; [sheet, row, column])
FACES = {
    '悟空': [P2, 0], '比克': [P2, 1], '悟飯': [P2, 2], '克林': [P2, 3], '雅木茶': [P2, 4], '天津飯': [P2, 5], '餃子': [P2, 6],
    '貝吉塔': [P2, 9], '內魯': [P2, 10], '青年': [E2, 7],
    '弗利薩': [F2, 23], '薩博': [F2, 15], '多多利亞': [F2, 13], '邱夷': [F2, 10],
    '那美克星人': [E2, 1], '老人': [E2, 1], '外星人': [E2, 2], '少年': [E2, 0], '男': [E2, 8], '卡納薩星人': [E2, 8], '卡薩納星人': [E2, 8],
    '丹迪': [CARD, 14, 1], '布爾瑪': [CARD, 8, 1], '龜仙人': [CARD, 9, 1], '亞奇洛貝': [CARD, 23, 1], '大長老': [CARD, 30, 1],
}
NARRATION = ('獲得了', '悟飯找到了')  # 「…」 in a narration line, not a speaker

INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
TRAIN = {'label': '修行', 'effect': 'training'}
at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]


def resolve_jumps(lst):
    """Inlines label jumps (119 to a 118 label other than 終了): the commands after the label up to and including the next
    119 終了 at the label's indent, re-indented to where the jump was. 115 (exit the event) becomes 119 終了."""
    labels = {c['parameters'][0]: k for k, c in enumerate(lst) if c['code'] == 118}
    out = []
    for c in lst:
        if c['code'] == 115:
            out.append(dict(c, code=119, parameters=['終了']))
        elif c['code'] == 119 and c['parameters'][0] != '終了' and c['parameters'][0] in labels:
            k = labels[c['parameters'][0]] + 1
            base = lst[k - 1]['indent']
            while k < len(lst):
                d = lst[k]
                out.append(dict(d, indent=d['indent'] - base + c['indent']))
                if d['code'] == 119 and d['parameters'][0] == '終了' and d['indent'] == base:
                    break
                k += 1
        else:
            out.append(c)
    return out


def add(world, h):
    build_map, enemy, skill, actor, s2t, script, D, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D', 'root'))
    ce = D('commonevents')
    faces = FACES

    def nodes_of(lst):
        """script() plus BGM changes ({bgm}) and the event exits; speakers get their Z2 face (say[2] = 'z2:name')."""
        lst = resolve_jumps(lst)
        lst = [dict(c, code=250, parameters=[{'name': '\0BGM' + c['parameters'][0]['name']}]) if c['code'] == 241 else c for c in lst]
        ns = script(lst)

        def fix(ns):
            out = []
            for n in ns:
                if isinstance(n.get('se'), str) and n['se'].startswith('\0BGM'):
                    n = {'bgm': n['se'][4:]}
                if 'say' in n:
                    who, text = n['say'][0], n['say'][1]
                    if who in NARRATION:
                        n = {'say': ['', f'{who}「{text}」']}
                    elif who in faces or who == '？':  # (？: someone not known yet — no face)
                        n = {'say': [who, text, 'z2:' + who]}
                for k in ('then', 'else'):
                    if k in n:
                        n[k] = fix(n[k])
                if 'branches' in n:
                    n['branches'] = [fix(b) for b in n['branches']]
                out.append(n)
            return out
        return fix(ns)

    pages = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['2']['pages'] if p['condition']['variable_valid']}
    page = lambda v: [{'v41': v}] + nodes_of(pages[v])

    def split_battle(ns):
        """a page whose last top-level z1field is a battle_process: [before it, after it]"""
        k = max(i for i, n in enumerate(ns) if n.get('z1field'))
        return [ns[:k], ns[k + 1:]]

    # ---------- maps ----------
    for mid, rows in ((17, 50), (18, 85), (22, 35), (20, 14), (21, 14), (23, 50), (24, 85), (26, 35)):
        world['maps'][str(mid)] = build_map(mid, rows=rows)
    for mid in ('20', '21'):  # the gravity room / King Kai's planet: the ring of floor tiles only (src/field.js path maps)
        world['maps'][mid]['path'] = [1544]

    # 145_Event_Check.rb spots. `when`: the condition for the spot to be there ([sw, id, on] / [var, id, value, op]);
    # `page`: the story page it runs (src/z2a.js)
    W = lambda *c: list(c)
    world['pois']['17'] = at([(18, 3), (14, 12), (4, 40)], CARD_SQ) + at([(22, 4), (4, 21)], TRAIN) + at([(14, 6), (9, 14), (19, 36)], INN) + [
        {'x': 26, 'y': 8, 'label': '接觸神秘的宇宙船', 'chapter': 'z2a', 'page': 301, 'when': W('sw', 81, False)},
        {'x': 23, 'y': 21, 'label': '前往不明的行星', 'chapter': 'z2a', 'page': 305, 'when': W('sw', 82, False)},
        {'x': 33, 'y': 41, 'label': '前往那美克星', 'chapter': 'z2a', 'page': 310}]
    world['pois']['18'] = at([(14, 27), (28, 67), (63, 54), (78, 71), (75, 12), (58, 26)], CARD_SQ) \
        + at([(9, 24), (12, 57), (82, 15)], TRAIN) + at([(10, 29), (15, 59), (50, 48), (71, 60), (77, 21)], INN) + [
        {'x': 25, 'y': 58, 'label': '進入洞窟', 'chapter': 'z2a', 'page': 321},
        {'x': 67, 'y': 20, 'label': '進入村子', 'chapter': 'z2a', 'page': 325},
        {'x': 32, 'y': 17, 'label': '靠近那美克星人的村子', 'chapter': 'z2a', 'page': 326, 'when': W('sw', 96, False)},
        {'x': 11, 'y': 33, 'label': '多多利亞', 'chapter': 'z2a', 'page': 339, 'when': W('sw', 97, True)}]
    world['pois']['22'] = at([(4, 7), (1, 23), (20, 24), (38, 1)], CARD_SQ) + [
        {'x': 34, 'y': 5, 'label': '離開洞窟', 'chapter': 'z2a', 'page': 322},
        {'x': 2, 'y': 26, 'label': '離開洞窟', 'chapter': 'z2a', 'page': 322},
        {'x': 5, 'y': 24, 'label': '邱夷', 'chapter': 'z2a', 'page': 323, 'when': W('sw', 87, False)}]
    world['pois']['20'] = [dict(CARD_SQ, x=9, y=3), dict(INN, x=11, y=3),
                           {'x': 10, 'y': 8, 'label': '重力修行', 'chapter': 'z2a', 'page': 'gravity'}]
    world['pois']['21'] = [dict(INN, x=10, y=2)] + at([(6, 5), (13, 5), (10, 9)], {'label': '重力修行', 'chapter': 'z2a', 'page': 'gravity'})
    world['pois']['23'] = at([(18, 3), (14, 12), (4, 40)], CARD_SQ) + at([(14, 6), (28, 12), (4, 30), (19, 36)], INN) \
        + at([(26, 9), (11, 34), (30, 39)], {'label': '前往修行', 'chapter': 'z2a', 'page': 410}) + [
        {'x': 14, 'y': 39, 'label': '前往發出求救信號的行星', 'chapter': 'z2a', 'page': 422, 'when': W('sw', 93, False)}]
    world['pois']['24'] = at([(29, 73), (56, 45), (20, 22), (30, 2)], CARD_SQ) + at([(24, 73), (13, 24), (37, 2), (45, 48)], INN) \
        + at([(23, 22), (26, 11), (54, 52)], TRAIN) + [
        {'x': 25, 'y': 17, 'label': '和那美克星人說話', 'chapter': 'z2a', 'page': 601},
        {'x': 11, 'y': 48, 'label': '調查池塘', 'chapter': 'z2a', 'page': 419},
        {'x': 55, 'y': 5, 'label': '進入村子', 'chapter': 'z2a', 'page': 413},
        {'x': 7, 'y': 7, 'label': '進入大長老的家', 'chapter': 'z2a', 'page': 435, 'when': W('var', 43, 28, 1)}]
    world['pois']['26'] = at([(12, 12), (36, 20)], CARD_SQ) + at([(6, 7), (54, 2), (52, 21)], INN) + at([(7, 16), (32, 5), (46, 11)], TRAIN) + [
        {'x': 57, 'y': 25, 'label': '調查池塘', 'chapter': 'z2a', 'page': 445, 'when': W('var', 41, 446, 4)}]  # (until page 445 has run)
    # the dragon radar (Scene_Dragon_Radar: map events with walk_anime on the page that is showing)
    world['radar'].update({
        '18': [{'x': 67, 'y': 21, 'when': ['sw', 86, False]}, {'x': 25, 'y': 58, 'when': ['sw', 87, False]},
               {'x': 32, 'y': 17, 'when': ['sw', 96, False]}, {'x': 11, 'y': 33, 'when': ['sw', 97, True]}],
        '22': [{'x': 5, 'y': 25, 'when': ['sw', 87, False]}],
        '24': [{'x': 7, 'y': 48, 'when': ['sw', 85, False]}, {'x': 8, 'y': 7}, {'x': 55, 'y': 5, 'when': ['sw', 89, False]}],
        '26': [(57, 25)],
    })
    # random encounters (140_Field_Main.rb encounter): Z2 space / Namek / the cave; none in the gravity room
    world['areas'].update({'17': {'pool': [31, 34, 37], 'n': [2, 4]}, '18': {'pool': [31, 34, 37], 'n': [2, 5]},
                           '22': {'pool': [31, 34, 37], 'n': [3, 5]}, '23': {'pool': [31, 34, 37], 'n': [1, 2]},
                           '24': {'pool': [32, 35, 38, 41, 42], 'n': [3, 5]}, '26': {'pool': [32, 35, 38, 41, 42], 'n': [3, 5]},
                           '20': None, '21': None})

    # ---------- people ----------
    enemies_db = D('enemies')
    for eid in range(31, 48):
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = P(f'Z2_戦闘_必殺技_敵_{name}')
        e['portrait'] = P(f'Z2_戦闘_敵_{name}')
        e['face'] = [F2, eid - 30]  # Z2_顔敵: one row per enemy from 30
        world['enemies'][eid] = e
    world['enemies'][46]['name'] = s2t('萨博(变身)')
    h['SKILL_NAMES'].update({331: '能量波', 332: '光線槍', 333: '能量波', 334: '能量波', 335: '爆發波', 336: '連續能量波',
                             337: '能量波', 338: '口中怪光線', 339: '爆發波', 340: '能量波', 341: '超級能量波', 342: '爆發波',
                             343: '能量波', 344: '超級能量波'})
    party_skills = {12: [121, 123, 124], 15: [141, 142, 143, 144]}  # CE24 (Vegeta joins), page 325 (the young Namekian)
    for sid in list(range(331, 345)) + party_skills[12] + party_skills[15]:
        world['skills'][sid] = skill(sid)
    # 貝吉塔 (actor 12) and the young Namekian (actor 15, わかもの) with their Z2 battle sheets
    world['actors'][12] = actor(12, 9, s2t('贝吉塔'), 'Z2_戦闘_ベジータ.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', party_skills[12])
    world['actors'][15] = actor(15, 12, s2t('青年'), 'Z2_戦闘_わかもの.PNG', 'Z1_戦闘_必殺技_エネルギー波(緑).PNG', party_skills[15], 'green')
    world['actors'][12]['special'] = P('Z2_戦闘_必殺技_ベジータ')
    world['actors'][15]['special'] = P('Z2_戦闘_必殺技_わかもの')
    world['faces'].update({'z2:' + k: v for k, v in faces.items()})
    world['drops'].update({eid: [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                                 if d['kind'] == 1 and d['item_id'] in world['items']]
                           for eid in range(31, 48)})

    # ---------- the era switch (src/era.js) ----------
    have = {unicodedata.normalize('NFC', n) for n in os.listdir(os.path.join(root, 'game', 'Graphics', 'Pictures'))}  # (macOS: NFD names)
    alias = {}
    for n in ERA_SHEETS:
        for ext in ('.PNG', '.png'):
            if f'Z1_{n}{ext}' in have and f'Z2_{n}{ext}' in have:
                alias[f'Graphics/Pictures/Z1_{n}{ext}'] = f'Graphics/Pictures/Z2_{n}{ext}'
    alias['ui/item_cards.png'] = 'ui/item_cards_z2.png'  # the card icons below
    world['era'] = {'1': alias}
    # the card icons of Z2 (005_Icon.rb put_icon: column $game_variables[40] of 顔カード.PNG, e.g. the Namek balls)
    icons1 = Image.open(os.path.join(root, 'assets', 'ui', 'item_cards.png'))
    sheet = Image.open(os.path.join(root, 'game', 'Graphics', 'Pictures', '顔カード.PNG')).convert('RGBA')
    icon_row = h['build_items'].ICON_ROW
    z2 = Image.new('RGBA', icons1.size)
    for i, it in world['items'].items():
        k, r = it['icon'], icon_row.get(int(i), int(i) - 1)
        cell = sheet.crop((64, 64 * r, 128, 64 * r + 64))
        if cell.getbbox() is None:  # no Z2 picture: keep the Z1 one
            cell = icons1.crop((64 * (k % 10), 64 * (k // 10), 64 * (k % 10) + 64, 64 * (k // 10) + 64))
        z2.paste(cell, (64 * (k % 10), 64 * (k // 10)))
    z2.save(os.path.join(root, 'assets', 'ui', 'item_cards_z2.png'), optimize=True)

    # ---------- battle backgrounds ----------
    # the original draws one 640×100 strip of Z2_戦闘_背景 ($Battle_MapID by the tile under the player, set_battle_map)
    # under a black sky; here it becomes a 400×600 portrait backdrop like assets/bg/battle_*.png
    strips = Image.open(os.path.join(root, 'game', 'Graphics', 'Pictures', 'Z2_戦闘_背景.PNG')).convert('RGB')
    for row in (0, 2, 3, 5):
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strips.crop((120, 100 * row, 520, 100 * row + 100)), (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'z2_battle_{row}.png'), optimize=True)

    # ---------- the story ----------
    inn = nodes_of(D('map007')['events']['1']['pages'][[p['condition']['variable_value'] for p in D('map007')['events']['1']['pages']].index(11)]['list'])
    def no41(ns):  # the inn's scene number (variable 41 += 1 for its z1field) would move the story page here
        out = []
        for n in ns:
            if n.get('var') and n['var'][0] == 41:
                continue
            for k in ('then', 'else'):
                if k in n:
                    n[k] = no41(n[k])
            out.append(n)
        return out
    world['events']['z2inn'] = no41(inn)  # event 1 page 11 with its label jumps (悟空休憩 / ピッコロ休憩 / ブルマ休憩 …)
    h['INLINE_CE'].add(273)  # the Namekian on map 24 explains the arena and the areas (page 601)

    pg = {v: page(v) for v in (601, 301, 309, 310, 325, 326, 336, 337, 341, 401, 411, 413, 415, 418, 419, 420, 421, 426, 428, 430, 444, 445)}
    for v in (305, 323, 339, 422, 435, 441):  # [before the battle, after it]
        pg[v] = split_battle(page(v))
    # 概況 (CE15-23, 25 for variable 43 = 21-30: page 201 sets variable 41 to 211 first; CE15 is the opening one, page 281)
    recaps = {}
    for v43, cid in list(zip(range(21, 30), range(15, 24))) + [(30, 25)]:  # (page 201: 30 → CE25, the map 26 one)
        recaps[v43] = [{'v41': 211}] + nodes_of(ce[cid]['list'])

    world['z2a'] = {
        'titles': ['Z2　第一章　前往那美克星！', 'Z2　第二章　悟空出擊！', 'Z2　第三章　大長老'],
        'start': {'map': '17', 'x': 4, 'y': 4, 'party': [5, 6, 7, 8, 9]},  # page 281
        'pages': {str(k): v for k, v in pg.items()},
        'recap': {str(k): v for k, v in recaps.items()},
        'battles': {  # battle_process: enemies, music (set_bgm; none = the story's default)
            '308': {'foes': [37, 32, 34, 37]},
            '324': {'foes': [40, 32, 35, 38], 'bgm': 'ZSSD 戦闘1'},
            '425': {'foes': [35, 31, 37]},
            '340': {'foes': [43, 35, 32, 32], 'bgm': 'Z2 戦闘1(VRC6)'},
            '440': {'foes': [45, 33, 36, 39], 'bgm': 'Z2 戦闘1(VRC6)'},
            '443': {'foes': [46], 'bgm': 'Z2 戦闘1(VRC6)'},
        },
        # XFER targets of the pages ($game_variables[1] / [2]); party = $partyc set by the scenes
        'to': {
            '310': {'map': '18', 'x': 13, 'y': 33}, '321': {'map': '22', 'x': 34, 'y': 6}, '322': {'map': '18', 'x': 25, 'y': 59},
            '336': {'map': '18', 'x': 80, 'y': 68}, '401': {'map': '23', 'x': 4, 'y': 4}, '410': {'map': '20', 'x': 10, 'y': 3},
            '411': {'map': '24', 'x': 26, 'y': 72}, '415': {'map': '23', 'x': 26, 'y': 10}, '421': {'map': '23', 'x': 12, 'y': 34},
            'village': {'map': '24', 'x': 55, 'y': 5}, 'pond': {'map': '24', 'x': 12, 'y': 48},
            '428': {'map': '21', 'x': 11, 'y': 2}, '444': {'map': '26', 'x': 4, 'y': 6},
        },
        'party': [5, 6, 7, 8, 9],
        'young': {'id': 15, 'uses': {141: 80, 142: 50, 143: 30, 144: 10}, 'defeats': 50},  # z1field 503
        'vegeta': {'id': 12, 'uses': {121: 110, 123: 85, 124: 65}, 'defeats': 100},  # z1field 439
        'elderExp': 15000,  # page 435: C 315 +15000 EXP to actors 5-9
        'gravity': {'23': 0, '25': 1, '27': 2, '28': 3},  # Scene_Db_Gravity_Training @training_level by variable 43
        'gravityDone': {'0': [90, 411], '1': [91, 418], '2': [92, 428], '3': [100, 430]},  # map 20 EV029 / map 21 EV005
        'backdrops': {'2048': 0, '1543': 2, '1551': 2, '1580': 2, '1581': 2, '1588': 2, '1590': 2, '1596': 2, '1598': 2,
                      '1575': 3, '1542': 5},
        'goals': {
            '17': '目標：前往那美克星（宇宙飛船、不明行星可以順路看看）',
            '18': '目標：收集龍珠（洞窟、村子），打倒多多利亞',
            '22': '目標：打倒洞窟裡的邱夷',
            '20': '目標：在重力室修行', '21': '目標：比克在界王星重力修行',
            '23': '目標：前往修行（卡納薩星可以順路看看）',
            '24': '目標：收集龍珠（村子、池塘），前往大長老的家',
            '26': '目標：前往池塘',
        },
    }
    z = world['z2a']
    world['extraBgm'] = sorted(set(world['extraBgm']) | {
        'Z2 あらすじ', 'Z2 フィールド1(宇宙)', 'Z2 フィールド2(ナメック星)', 'Z2 フィールド3(修行)', 'ZSSD フィールド2', 'ZSSD ダンジョン',
        'GBZ2 フィールド1', 'Z2 戦闘1', 'Z2 戦闘1(VRC6)', 'ZSSD 戦闘1', 'DB2 イベント01', 'DB2 イベント02', 'DB2 イベント03', 'GBZ1 イベント1',
        'GBZ1 イベント2', 'GBZ1 イベント6', 'GBZ1 戦闘2', 'GBZ1 界王修行', 'DB3 イベント02', 'DB3 イベント03', 'DB3 イベント04', 'DB3 イベント05',
        'DB3 イベント07', 'DB3 イベント08', 'DB3 戦闘前', 'GBZ2 イベント2', 'GBZ2 イベント3', 'GBZ2 イベント4', 'GBZ2 イベント5',
        'GBZ2 イベント8', 'GBZ2 戦闘終了', 'GBZ2 戦闘2', 'ZD イベント1', 'Z1 宿', 'Z2 ドラゴンレーダー'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {
        'Z2 宇宙船移動', 'Z2 アイテム取得', 'Z2 気が遠くなる', 'Z2 カードアップ', 'Z1 爆発1', 'Z3 エネルギー波', 'Z1 出る', 'Z1 入る',
        'Z1 高速移動', 'ZG 打撃4', 'Z1 飛ぶ', 'Z1 ダメージ', 'DB3 敵発見', 'Z3 回復', 'Z3 レベルアップ', 'Z1 パワーアップ', 'Z1 アイテム取得'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {v for v in alias.values() if v.startswith('Graphics/')} | {P2, E2, F2, CARD})
    # the scenes of src/z2a.js: their pictures, music and sounds (copy_assets.py copies these lists)
    js = open(os.path.join(root, 'src', 'z2a.js'), encoding='utf-8').read()
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {P(f'Z2_背景_{n}') for n in re.findall(r"BG\('([^']+)'\)", js)}
                                    | {P(f'Z2_あらすじ{n}') for n in re.findall(r"ARA\('([^']+)'\)", js)})
    world['extraBgm'] = sorted(set(world['extraBgm']) | set(re.findall(r"bgm: '([^']+)'", js)))
    world['fieldSe'] = sorted(set(world['fieldSe']) | set(re.findall(r"se: '([^']+)'", js)))

    # 概況 numbers this part uses have a scene recap instead of text (src/fieldmenu.js storySoFar)
    world['story']['soFarScenes'] = sorted(int(k) for k in z['recap'])

    # the mini-games of this part (their own pictures / sounds)
    import build_z2shoot  # noqa: E402  (page 326: fleeing from Dodoria, src/z2shoot.js)
    build_z2shoot.add(world, h)
    import build_z2gravity  # noqa: E402  (the gravity room, src/gravitytraining.js)
    build_z2gravity.add(world, h)
    import build_z2pond  # noqa: E402  (the pond of map 24: Gohan's dive for the ball, src/z2pond.js)
    build_z2pond.add(world, h)
