"""ZG 本編 中段（事件 23 頁 6181～6421：四個毀滅瓦斯產生裝置、西之都尖塔，地圖 103～107） — world.json data (read by
src/zg_b.js), added by tools/build_timeroom.py. Plan: docs/zg-plan.md; the whole flow is in docs/zg-b.md.

The original (Map007 event 23 「ZG本編」, one page per value of variable 41; 145_Event_Check.rb `when 103`-`107`; the
scenes 143_Event_Main.rb z1field 6181-6423, all.rb 181394-181975; battle_process 6206-6411, all.rb 183174):
  page 6171 (zga) ends on map 103 (24,23): Goku's team (party [3,16,27,28,29,30]), variable 43 = 151
  map 103 グランドアポロン: the village 6181 (老人 / 孩子), the egg mountain 6201, the bird (map events 64-66, switches
    802-809, the regions of Event_Check), the nest 6211 → the device: Cooler's crew → battle 6206 → 6221
  map 104 西の砂漠 (Gohan's team [5,6,10,24,15]): the village 6231 (the torch, switch 813), the pyramid 6241 (the mural,
    814), the real pyramid comes up (map event 101, switch 817 → 816), 6251 the mummy girl, Turles → battle 6261 → 6271
  map 105 ブンブク島 (Piccolo's team [4,25,21,22,23]): the village 6281 (the freeze capsule, 821), the cave 6291
    (Kawazu, 819), the mine 6296, Pilaf's villa 6301, the volcano 6311 → battle 6316 (Kawazu) → 6321 → battle 6326
    (Slug's army) → 6331
  map 106 氷の大陸 (Trunks's team [17,12,7,8,9]): the flood machine 6341 → battle 6346 (Cui) → 6351; the eternal ice
    wall 6361 → battle 6371 (Frieza, Dodoria, Zarbon) → 6381 → 6391 everyone ([3,4,5,16,17,12,25,6,7])
  map 107 西の都: the Tongari tower 6401 → battle 6411 (the ghost warriors) → 6421 (King Kai: Dr. Raichi) → map 105
    (4,33) with variable 43 = 173 (zgc: the Linium part); the 時の間 square (51,4) runs page 9932
"""
import os
import re

import build_z3

MAPS = (103, 104, 105, 106, 107)
PAGES = [6181, 6201, 6211, 6221, 6231, 6241, 6251, 6271, 6281, 6291, 6296, 6301, 6311, 6321, 6331, 6341, 6351, 6361,
         6381, 6391, 6401, 6421]
SCENES = (6181, 6423)  # the z1field numbers of these pages
# battle_process (all.rb 183174): enemies, $Battle_MapID (the Z3_戦闘_背景 row), set_bgm (19 ZG 中ボス戦, 20 ZG ボス戦);
# 'next': the page after it (variable 95)
BATTLES = {6206: ([239, 240, 241, 242], 14, 19, 6221), 6261: ([221, 217, 233, 218, 219, 220], 16, 19, 6271),
           6316: ([158], 15, 19, 6321), 6326: ([224, 225, 255, 226, 227], 15, 19, 6331), 6346: ([246], 17, 19, 6351),
           6371: ([244, 243, 245], 17, 19, 6381), 6411: ([233, 243, 255, 239], 14, 20, 6421)}
# 140_Field_Main.rb `when 103`-`107` (all.rb 165798): rand(3)+3 of these (107: rand(4)+3)
AREAS = {103: ([155, 159, 162], [3, 5]), 104: ([155, 159, 162], [3, 5]), 105: ([155, 159, 162], [3, 5]),
         106: ([155, 159, 162], [3, 5]), 107: ([156, 160, 163], [3, 6])}
FOES = sorted({e for b in BATTLES.values() for e in b[0]} | {e for a in AREAS.values() for e in a[0]})
# the map pages set variable 17 (the sea of set_battle_map: 3 the ZG sea, 4 the ice continent)
V17 = {103: 1, 104: 3, 105: 3, 106: 4, 107: 3}

# 145_Event_Check.rb `when 103`-`107` (all.rb 186090): card squares, training squares, inns, the story squares
SQ4 = lambda x, y: [(x, y), (x, y + 1), (x + 1, y), (x + 1, y + 1)]
SPOTS = {
    103: {'card': [(12, 4), (1, 37), (22, 26), (23, 43), (46, 1)],
          'train': [(9, 11), (1, 44), (27, 27), (25, 42), (49, 2), (55, 23)],
          'inn': [(4, 14), (27, 24), (55, 1), (46, 27)]},
    104: {'card': [(6, 9), (1, 30), (28, 14), (28, 36), (52, 10)],
          'train': [(7, 8), (2, 28), (23, 20), (41, 6), (51, 30)],
          'inn': [(5, 5), (15, 39), (35, 19), (41, 41), (47, 7)]},
    105: {'card': [(8, 5), (6, 23), (35, 32), (48, 9)], 'train': [(8, 4), (16, 28), (36, 3), (41, 23)],
          'inn': [(8, 1), (11, 26), (29, 14), (53, 22)]},
    106: {'card': [(7, 3), (15, 27), (41, 11), (44, 38)], 'train': [(5, 5), (3, 28), (46, 4), (41, 31)],
          'inn': [(9, 5), (21, 18), (47, 35)]},
    107: {'card': [(17, 38), (24, 10), (28, 40), (46, 5), (53, 39)],
          'train': [(4, 28), (29, 32), (32, 13), (53, 11), (55, 39)],
          'inn': [(16, 18), (23, 4), (38, 28), (48, 9), (54, 40)]},
}
BEFORE_LINIUM = ['var', 43, 173, 5]  # map 105 is zgc's too: these squares run zgc's pages while variable 43 == 173
STORY = [  # [map, squares, label, page, when]
    (103, SQ4(22, 20), '進入村子', 6181, None),
    (103, SQ4(4, 3), '調查岩山', 6201, None),
    (103, [(50, 40)], '調查鳥巢', 6211, None),
    (104, SQ4(37, 16), '進入村子', 6231, None),
    (104, SQ4(43, 30), '進入金字塔', 6241, None),
    (104, SQ4(7, 35), '調查金字塔', 6251, None),
    (105, SQ4(7, 31), '進入村子', 6281, BEFORE_LINIUM),
    (105, [(5, 3)], '進入洞穴', 6291, [['sw', 818, True], BEFORE_LINIUM]),
    (105, SQ4(53, 2), '進入礦山', 6296, BEFORE_LINIUM),
    (105, SQ4(39, 12), '前往火山', 6311, BEFORE_LINIUM),
    (105, SQ4(53, 27), '前往皮拉夫的別墅', 6301, BEFORE_LINIUM),
    (106, SQ4(28, 4), '調查機器', 6341, ['sw', 823, False]),
    (106, SQ4(7, 33), '調查冰壁', 6361, None),
    (107, SQ4(5, 22), '前往尖塔', 6401, None),
    (107, [(51, 4)], '前往時之間', 9932, None),
]
# the bird of map 103 (events 64-66: '!bigsize_anime' character 0, 96×64 frames, direction 6 / 8 flapping): where it
# stands and the switch it shows on; the regions round it (Event_Check) set the next switch and it flies off 14
# tiles to the lower right (move route: speed 4, 14 × move lower right, then the next switch)
BIRDS = [{'x': 7, 'y': 5, 'show': 803, 'fly': 803, 'done': 804},  # (page 6201 turns 803 on: it flies at once)
         {'x': 28, 'y': 20, 'show': 804, 'fly': 805, 'done': 806, 'area': [25, 18, 29, 22]},
         {'x': 42, 'y': 28, 'show': 806, 'fly': 807, 'done': 808, 'area': [39, 26, 43, 30]}]
# the speakers of these pages: Z3_顔味方 row = actor id - 3, Z3_顔イベント / Z3_顔敵 rows of the scenes, 顔カード column 2
PARTY_ROWS = {'悟空': 0, '比克': 1, '悟飯': 2, '克林': 3, '雅木茶': 4, '天津飯': 5, '餃子': 6, '琪琪': 7, '貝吉塔': 9,
              '青年': 12, '巴達克': 13, '特蘭克斯': 14, '18號': 18, '17號': 19, '16號': 20, '龜仙人': 21, '未來悟飯': 22,
              '多瑪': 24, '莎莉巴': 25, '多達布': 26, '普普堅': 27}
EVENT_ROWS = {'老人': 12, '孩子': 13, '老爺爺': 48, '大叔': 12, '木乃伊': 34, '女孩子': 42, '姐姐': 33, '男孩': 13, '男孩子': 13,
              '鳥': 49}
FOE_ROWS = {'古拉': 20, '怪物': 58, '達列斯': 133, '卡瓦茲': 58, '史拉格': 155, '邱夷': 146, '弗利薩': 143, '多多利亞': 144, '薩博': 145}
CARD_ROWS = {'丹迪': 14, '界王': 25, '布爾瑪': 8, '布利夫': 36}
# the moves of these enemies (the database has Japanese names only)
FOE_MOVES = {550: '能量波', 552: '能量波', 553: '能量吸收', 555: '能量波', 625: '能量波', 626: '氣圓斬', 627: '行星炸彈',
             629: '能量波', 630: '宇宙攻擊', 632: '能量波', 633: '爆發波', 634: '流星球', 636: '能量波', 637: '雙重能量波',
             639: '能量波', 640: '雙重能量波', 646: '能量波', 647: '邪惡類星體', 648: '伸長手臂', 650: '能量波', 651: '邪惡重力',
             653: '能量波', 654: '邪惡彗星', 655: '青蛙攻擊', 657: '能量波', 658: '邪惡衝擊', 661: '安基拉與梅達瑪茶',
             391: '能量波', 392: '超能力', 393: '弗利薩切割', 394: '連續能量波', 395: '死亡球', 400: '超新星',
             403: '內茲束縛波', 405: '德雷恐怖連擊', 452: '沙維扎之刃斬',
             644: '大猿變身', 645: '巨大化', 642: '能量波', 667: '魔光砲', 668: '爆發波', 669: '大粉碎'}
# what Turles / Slug (強) become in battle with 大猿変身 644 / 巨大化 645 (all.rb 53485-53500; src/battle.js FOE_FORMS):
# 192×192 battle sheets like the Great Ape, *PARAM_HPRECOVER[2]
FORMS = {233: 222, 255: 223}
# the actors who join in ZG (zga brings them first; here only if it has not): CE9 必殺技設定 without the 大猿変身
# moves (the remake has no Great Ape state for the party). [face row, name, battle sheet, special sheet, skills, ray]
ACTORS = {
    25: (22, '未來悟飯', 'ゴハン(未来)', [236, 237, 238, 240, 241, 245], 'orange'),
    26: (23, '未來悟飯', 'ゴハン(未来超)', [236, 237, 238, 240, 241, 242], 'orange'),
    27: (24, '多瑪', 'トーマ', [246, 248, 247, 249], 'orange'),
    28: (25, '莎莉巴', 'セリパ', [255, 257, 256, 259], 'orange'),
    29: (26, '多達布', 'トテッポ', [265, 267, 266, 268], 'orange'),
    30: (27, '普普堅', 'パンブーキン', [273, 275, 274, 276], 'orange'),
    32: (29, '巴達克', 'バーダック(超)', [147, 148, 149, 151, 152, 155], 'orange'),
}
# CE9 for the androids (other chapters made them with no moves of their own)
ANDROID_SKILLS = {21: [191, 192, 193], 22: [201, 202, 203], 23: [211, 212, 213, 214, 215]}
SUPER = {14: 3, 18: 5, 19: 12, 20: 17, 26: 25, 32: 16}  # 315 to a Super Saiyan form: one member per character


def z1field_blocks(src):
    """when-number → its lines, for the whole of Event_Main#z1field"""
    lines = src.split('\n')
    start = next(i for i, l in enumerate(lines) if 'def z1field event_no' in l)
    blocks, cur = {}, None
    for l in lines[start + 1:]:
        if l.startswith('  def '):
            break
        m = re.match(r'^ {4,5}when ([\d, ]+)\s*(#.*)?$', l)
        if m:
            cur = []
            for n in m.group(1).replace(' ', '').split(','):
                if n:
                    blocks[int(n)] = cur
            continue
        if cur is not None:
            cur.append(l)
    return blocks


def arith(expr, names):
    e = expr.replace(' ', '')
    for k, v in names.items():
        e = e.replace(k, str(v))
    if not re.fullmatch(r'[\d+\-*()]+', e):
        raise ValueError(expr)
    return eval(e)


def scene_of(body, file):
    """one z1field scene → {bg, ene: [[pic, sx, sy, dx, dy]], play: [[pic, sx, sy, dx, line]], out, all} (out: the
    party's faces under the scene, character_output; all: character_output_all's mode)"""
    pic, rect, d = None, None, {'bg': None, 'ene': [], 'play': [], 'out': False, 'all': None}
    for raw in body:
        t = raw.split('#')[0].strip()
        if not t:
            continue
        m = re.match(r'picture = "([^"]+)"', t)
        if m:
            pic = file(m.group(1))
            assert pic, m.group(1)
            continue
        m = re.match(r'rect = Rect\.new\((.+)\)$', t)
        if m:
            rect = [arith(x, {}) for x in m.group(1).split(',')]
            continue
        m = re.match(r'add_chr\((.+?),(.+?),picture,rect\)$', t)
        if m:
            x, y = m.group(1), m.group(2)
            if x.startswith('@z1_scrollscenex'):
                d['bg'] = pic
            elif '@play_y' in y:
                d['play'].append([pic, rect[0], rect[1], arith(x, {'@play_x': 0}), arith(y, {'@play_y': 0}) // 64])
            elif '@ene1_y' in y:
                d['ene'].append([pic, rect[0], rect[1], arith(x, {'@ene1_x': 0}), arith(y, {'@ene1_y': 0})])
            else:
                raise ValueError(t)
            continue
        if re.fullmatch(r'character_output( 0,0,0)?', t):
            d['out'] = True
            continue
        m = re.fullmatch(r'character_output_all 0,0,0,(\d+)', t)
        if m:
            d['all'] = int(m.group(1))
            continue
        raise ValueError(t)
    return d


def village_loop(lst):
    """118 「村の選択肢」 … 119 「村の選択肢」 (the villages ask again until 「离开村子」) → one 112 loop (code 9112 after
    build_z3's loops()) with a 113 break in the leaving branch; the jumps back are the loop's end"""
    k0 = next((i for i, c in enumerate(lst) if c['code'] == 118 and c['parameters'][0] == '村の選択肢'), None)
    if k0 is None:
        return lst
    k1 = next(i for i in range(k0, len(lst)) if lst[i]['code'] == 404 and lst[i]['indent'] == lst[k0]['indent'])
    ind = lst[k0]['indent']
    body = []
    for c in lst[k0 + 1:k1 + 1]:
        if c['code'] == 119 and c['parameters'][0] == '村の選択肢':
            continue
        body.append(dict(c, indent=c['indent'] + 1))  # (inside the loop: one indent more)
        if c['code'] == 402 and '离开' in c['parameters'][1]:
            body.append({'code': 113, 'indent': c['indent'] + 2, 'parameters': []})
    return lst[:k0] + [{'code': 112, 'indent': ind, 'parameters': []}] + body \
        + [{'code': 0, 'indent': ind + 1, 'parameters': []}, {'code': 413, 'indent': ind, 'parameters': []}] + lst[k1 + 1:]


def add(world, h, z3, tr):
    build_map, D, s2t, enemy, skill, actor, root = (h[k] for k in ('build_map', 'D', 's2t', 'enemy', 'skill', 'actor', 'root'))
    file, P3, E3, F3, CARD = z3['file'], z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    z = world['z3']
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    ev7 = D('map007')['events']

    # ---------- maps (the last row holds the original's control events) ----------
    tile_events, birds_rows = {}, {}
    for mid in MAPS:
        md = D('map%03d' % mid)
        rows = md['events']['2']['y']
        m = build_map(mid, rows=rows)
        evs = tr['map_events'](D, mid, rows, tr['sheets'])
        for e in evs:  # the bird's sheet (96×64 frames) is drawn by src/zg_b.js
            for pg in e[2]:
                if isinstance(pg[1], list) and pg[1][0] == '!bigsize_anime':
                    pg[1] = 0
        m['ev'] = evs
        world['maps'].setdefault(str(mid), m)  # (map 105: zgc builds the same; whoever comes first)
        # set_battle_map: the graphic of the event standing on a tile (the highest event id there, its first page)
        best = {}
        for k, e in md['events'].items():
            g = e['pages'][0]['graphic']
            if int(k) < 5 or not g.get('character_name'):
                continue
            key = f"{e['x']},{e['y']}"
            if key not in best or int(k) > best[key][0]:
                best[key] = (int(k), [g['character_name'], g['character_index'], g['direction']])
        tile_events[str(mid)] = {k: v[1] for k, v in best.items()}
        world['areas'].setdefault(str(mid), {'pool': AREAS[mid][0], 'n': AREAS[mid][1]})

    # ---------- the squares ----------
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    for mid, sp in SPOTS.items():
        world['pois'].setdefault(str(mid), at(sp['card'], CARD_SQ) + at(sp['inn'], INN) + at(sp['train'], TRAIN))
    for mid, squares, label, page, when in STORY:
        for x, y in squares:
            world['pois'][str(mid)].append(dict({'x': x, 'y': y, 'label': label, 'chapter': 'zgb', 'page': page},
                                                **({'when': when} if when else {})))

    # ---------- the scenes (z1field) ----------
    scenes = {}
    for n, body in z1field_blocks(src).items():
        if SCENES[0] <= n <= SCENES[1] and n not in BATTLES:
            scenes[str(n)] = scene_of(body, file)

    # ---------- the story pages ----------
    faces = {}
    for k, r in PARTY_ROWS.items():
        faces[k] = [P3, r]
    for k, r in EVENT_ROWS.items():
        faces[k] = [E3, r]
    for k, r in FOE_ROWS.items():
        faces[k] = [F3, r]
    for k, r in CARD_ROWS.items():
        faces[k] = [CARD, r, 2]
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    keep_extra, keep_opts = dict(EXTRA), dict(OPTS)

    def code355(p):
        t = p[0].strip()
        if t == 'all_charecter_recovery':
            return [{'x': 'recover'}]
        if re.match(r'\$partyc\s*=\s*\[', t):
            return [{'x': 'zgbParty', 'ids': [int(x) for x in re.findall(r'\d+', t)]}]
        m = re.match(r'cha_tec_puls (\d+),0,3,(\d+)', t)
        if m:  # the move's use count + n (all.rb 13222, puls_type 3)
            return [{'x': 'uses', 'map': {m.group(1): int(m.group(2))}}]
        return []  # ($eve, $chadead, update_party_detail_status, set_skn: nothing to do here)

    def ce(p):
        if p[0] == 39:  # 先頭キャラ: variable 42 = the leader (the flying graphic)
            return [{'x': 'zgbLead'}]
        if p[0] == 159:  # 超サイヤ人全解除
            return [{'x': 'zgbSsOff'}]
        return []  # (CE160 大猿全解除: the remake has no Great Ape state for the party)

    def go(p):  # 201: where the page sends the party (src/zg_b.js runs it when the page is over)
        if p[0] == 0:
            return [{'x': 'zgbGo', 'to': [p[1], p[2], p[3]]}]
        return [{'x': 'zgbGo', 'to': 'back'}]  # variables 13 / 1 / 2: back where the square was

    def pic(p):  # 231 show picture: number, name, origin, x, y, zoom
        f = file(p[1])
        assert f, p[1]
        return [{'x': 'pic', 'n': p[0], 'name': f, 'o': p[2], 'px': p[4], 'py': p[5], 'zoom': p[6]}]

    EXTRA.update({
        117: ce, 355: code355, 655: code355, 201: go, 231: pic,
        235: lambda p: [{'x': 'erase', 'n': p[0]}],
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        251: lambda p: [{'x': 'zgbSeStop'}],
        315: lambda p: [{'x': 'exp', 'id': SUPER.get(p[0], p[0]), 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(bgm=True)
    raw = {p['condition']['variable_value']: p['list'] for p in ev7['23']['pages'] if p['condition']['variable_valid']}
    speakers = set()

    def fix(ns):
        out = []
        for n in ns:
            if 'say' in n:
                who, text = n['say'][0], n['say'][1]
                if not who and not text.strip():
                    continue  # (a window of 「\^」 only: it closes by itself)
                speakers.add(who)
                n = {'say': [who, text] + ([f'zgb:{who}'] if who in faces else [])}
            for k in ('then', 'else', 'loop'):
                if k in n:
                    n[k] = fix(n[k])
            if 'branches' in n:
                n['branches'] = [fix(b) for b in n['branches']]
            if 'choice' in n:  # (src/zg_b.js: the answers in one row at the bottom, the window closed)
                out.append({'x': 'zgbAsk'})
            out.append(n)
        return out

    pages = {}
    for v in PAGES:
        pages[str(v)] = [{'v41': v}] + fix(z3['nodes_of'](village_loop(raw[v]), {}))
    EXTRA.clear()
    EXTRA.update(keep_extra)
    OPTS.clear()
    OPTS.update(keep_opts)
    unknown = sorted(w for w in speakers if w and w not in faces and w != '？')
    assert not unknown, unknown
    z['pages'].update({f'zgb:{k}': v for k, v in pages.items()})
    world['faces'].update({f'zgb:{k}': v for k, v in faces.items()})

    # ---------- enemies, their moves ----------
    edb, sdb = D('enemies'), D('skills')
    sk = lambda sid: world['skills'][sid] if sid in world['skills'] else world['skills'][str(sid)]
    for eid in FOES + sorted(FORMS.values()):
        e = enemy(eid)
        name = edb[eid]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        assert e['sprite'] and e['portrait'], name
        e['face'] = [F3, eid - 100]  # Z3_顔敵: one row per enemy from 100
        e['name'] = e['name'].replace('変', '變')  # (薩博(変身)(强): s2t leaves the Japanese form)
        if eid in FORMS.values():
            e['size'] = 192
            e['regen'] = int(re.search(r'PARAM_HPRECOVER\[(\d+)', edb[eid]['note']).group(1))
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (edb[eid]['drop_item1'], edb[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
        for a in e['actions']:
            sid = a['skill']
            if sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
            if sid in FOE_MOVES and ('(' in sk(sid)['name'] or ')' in sk(sid)['name'] or sid >= 550):
                sk(sid)['name'] = FOE_MOVES[sid]

    # ---------- the people of ZG (zga brings them first) ----------
    for aid, (row, name, sheet, skills, ray) in ACTORS.items():
        if aid in world['actors'] or str(aid) in world['actors']:
            continue
        a = actor(aid, row, name, f'Z3_戦闘_{sheet}.png', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills, ray)
        a['sprite'] = file(f'Z3_戦闘_{sheet}')
        a['special'] = file(f'Z3_戦闘_必殺技_{sheet}')
        assert a['sprite'] and a['special'], sheet
        if aid in (26, 32):
            a['ss'] = {26: 25, 32: 16}[aid]  # (the base actor, as 14 / 18 / 19)
        world['actors'][aid] = a
    for aid in list(ACTORS) + list(ANDROID_SKILLS):
        for sid in (ACTORS[aid][3] if aid in ACTORS else ANDROID_SKILLS[aid]) + [194, 245]:
            if sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
    sk(245)['ss'] = True  # スーパーサイヤ人変身 (未來悟飯: as 29 / 59)
    # 尻尾切る (element 25): the moves of the party here that turn the Great Ape back (all.rb 68895; Trunks's 剣攻撃,
    # 18's 気円斬 …)
    for k, v in world['skills'].items():
        if int(k) < 300 and 25 in sdb[int(k)]['element_set']:
            v['tail'] = True

    # ---------- battles ----------
    consts, names = build_z3.bgm_names(src)
    battles = {}
    for no, (foes, row, bgm, nxt) in BATTLES.items():
        z['battles'][str(no)] = {'foes': foes, 'bgm': names[bgm]}
        battles[str(no)] = {'backdrop': f'bg/z3_battle_{row}.png', 'next': nxt}

    # ---------- the chapter's data ----------
    birds = []
    for b in BIRDS:
        birds.append(dict(b))
    z['zgb'] = {
        'scenes': scenes, 'battles': battles, 'tileEvents': tile_events, 'v17': {str(k): v for k, v in V17.items()},
        'birds': birds, 'bird': 'Graphics/Characters/!bigsize_anime.png',
        'start': {'map': '103', 'x': 24, 'y': 23},  # page 6171
        'hall': {'map': '96', 'x': 18, 'y': 3},  # page 9932: the ZG hall of the 時之間
        'party': [3, 16, 27, 28, 29, 30],
        'androids': ANDROID_SKILLS, 'ce9': {str(k): v[3] for k, v in ACTORS.items()},
        'sheets': {'p3': P3, 'clothes': file('Z3_顔味方_衣替え'), 'long': file('Z3_顔味方_トランクス長髪'),
                   'zg': file('ZG_顔味方')},
        # character_output_all mode 26 (all.rb 167997: 外伝編 全員集合)
        'all26': [3, 14, 4, 5, 18, 12, 19, 17, 20, 25, 26, 6, 7, 8, 9, 16, 32, 27, 28, 29, 30, 10, 24, 15, 21, 22, 23],
    }
    z['titles']['zgb'] = 'ZG　四個毀滅瓦斯產生裝置'

    # ---------- assets: the scenes' pictures, music, sounds ----------
    pics = {P3, E3, F3, CARD, z['zgb']['bird']} | {v for v in z['zgb']['sheets'].values() if v}
    for d in scenes.values():
        if d['bg']:
            pics.add(d['bg'])
        pics |= {it[0] for it in d['ene'] + d['play']}
    for p in pages.values():
        for n in walk_nodes(p):
            if n.get('x') == 'pic':
                pics.add(n['name'])
    for eid in FOES + list(FORMS.values()):
        pics |= {world['enemies'][eid]['sprite'], world['enemies'][eid]['portrait']}
    pics.add(file('Z2_戦闘_必殺技_敵_达列斯'))  # the Great Ape's head in Turles's 大猿変身 film (anime_pattern 1744)
    for aid in ACTORS:
        a = world['actors'].get(aid) or world['actors'].get(str(aid))
        pics |= {a['sprite'], a['special']}
    se, bgm = set(), set()
    for p in pages.values():
        for n in walk_nodes(p):
            if isinstance(n.get('se'), str):
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
    bgm |= {b['bgm'] for b in z['battles'].values() if b.get('bgm')} | {world['maps'][str(m)]['bgm'] for m in MAPS}
    se |= {'ZG 鳥が飛び去る', 'ZG ピラミッド現れる', 'Z1 入る'}
    audio = os.path.join(root, 'game', 'Audio')
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {p for p in pics if p})


def walk_nodes(nodes):
    for n in nodes:
        yield n
        for k in ('then', 'else', 'loop'):
            yield from walk_nodes(n.get(k, []))
        for b in n.get('branches', []):
            yield from walk_nodes(b)
