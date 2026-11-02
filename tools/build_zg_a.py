"""ZG 本編 前段（事件 23 頁 6000～6171：ZG 開始、巴達克一夥篇，地圖 100～102）：ZG 時之間的門 9931 — world.json data
(read by src/zg_a.js), added by tools/build_timeroom.py. Plan: docs/zg-plan.md; the whole flow is in docs/zg-a.md.

The original (Map007 event 23 「Z外伝」, one page per value of variable 41):
  door 9931 of map 96 (event 22 page 9931): variable 41 = 6000 → page 6000 「在通关之前无法回到时之间　要移动吗？」
    (switch 850 on: back into ZG where it was left — CE157 / CE168, variables 371-375; switch 586: may start at the
    dark planet, map 110) → 6001: CE166 (the time room's party aside, variable 22 = 3), CE159, CE230, CE170, party
    [3,5,4], Goku a Super Saiyan; the destruction gas, Arbee and Kinkarn → battle 6021 → 6031 (Trunks, the time
    machine) → 6041 (planet Plant: Bardock) → 6061 (Bardock's crew, variable 40 = 1, CE228) → map 100 (6,24)
  map 100 (space) (5,4) → 6071 → map 101 (11,5); map 101 Turles (34,21) → 6081 → battle 6086 → 6091 → map 102
    (5,17); map 102 Slug (51,13) → 6111 → battle 6116 → 6121 → map 100 (35,14); map 100 (5,27) (switch 597) → 6131
    (Frieza; Bardock, Goku and Trunks arrive; CE66 Bardock a Super Saiyan) → battle 6141 → 6151 (back home, the
    time machine again) → 6171 (the future: Gohan, Bulma, No. 16; everyone; the teams) → map 103 (24,23): zgb.
Scenes: z1field 6001-6178 read straight from research/all.rb (picture / rect / add_chr / set_character_face /
character_output) into world.z3.zga.scenes, drawn by src/zg_a.js. The squares: 145_Event_Check.rb `when 100`-`102`
(all.rb 186011), the encounters 140_Field_Main.rb (all.rb 165763), battle_process 6021-6141 (all.rb 183147).
"""
import os
import re

from PIL import Image

PAGES = [6001, 6031, 6041, 6061, 6071, 6081, 6091, 6111, 6121, 6131, 6151, 6171]  # (6000 is the door: src/zg_a.js)
BATTLES = {  # battle_process: enemies, $Battle_MapID on the sheet of variable 301 (2: Z3_戦闘_背景, 1: Z2_)
    6021: {'foes': [159, 155], 'bg': 'bg/z3_battle_14.png', 'bgm': 19},  # アービーとキンカーン (ZG平原, ZG 中ボス戦)
    6086: {'foes': [69, 65, 59, 66, 67, 68], 'bg': 'bg/z3_battle_5.png', 'bgm': 'bgm_no_ZMove_marugoto'},  # ターレス軍 (Z3砂漠)
    6116: {'foes': [72, 73, 60, 74, 75], 'bg': 'bg/z2_battle_2.png', 'bgm': 'bgm_no_ZMove_genkidama'},  # スラッグ軍 (Z2ナメック星)
    6141: {'foes': [101], 'bg': 'bg/z2_battle_0.png', 'bgm': 'bgm_no_ZTVSP_sorid_full3'},  # フリーザフルパワー (Z2惑星)
}
NEXT = {6021: 6031, 6086: 6091, 6116: 6121, 6141: 6151}  # variable 95: the page after the battle

# the original screen (143_Event_Main.rb initialize)
IVARS = {'@z1_scrollscenex': 64, '@z1_scrollsceney': 46, '@ene1_x': 288, '@ene1_y': 78, '@play_x': 288, '@play_y': 306}

# 145_Event_Check.rb `when 100` / `101` / `102` (the training squares are commented out there)
SQUARES = {
    100: {'card': [(14, 13), (8, 26), (26, 19)], 'inn': [(4, 13), (4, 22), (34, 17)]},
    101: {'card': [(4, 7), (22, 25), (28, 27), (43, 10)], 'inn': [(12, 7), (26, 6), (29, 20)]},
    102: {'card': [(8, 14), (14, 28), (27, 11), (28, 16), (50, 3), (50, 27)], 'inn': [(3, 13), (24, 11), (22, 30), (30, 19), (51, 24)]},
}
STORY = [  # [map, (x, y), label, page, when]
    (100, (5, 4), '前往達列斯所在的星球', 6071, [['sw', 597, False]]),
    (100, (5, 27), '前往弗利薩所在的星球', 6131, [['sw', 597, True]]),
    (101, (34, 21), '前往達列斯那裡', 6081, None),
    (102, (51, 13), '前往史拉格那裡', 6111, None),
]
INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (variable 41 = 11: 143-146 「フリーザ軍医者休憩」)
CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}  # chk_card
# 140_Field_Main.rb: rand(3)+3 of these, rand((6*battle_enc)) (the remake's common step count)
AREAS = {'100': {'pool': [32, 35, 38, 41, 42], 'n': [3, 5]},
         '101': {'pool': [33, 36, 39, 42, 44, 47], 'n': [3, 5]},
         '102': {'pool': [33, 36, 39, 42, 44, 47, 76], 'n': [3, 5]}}
ROWS = {100: 29, 101: 32, 102: 32}  # (the rows drawn on: below them only black and the original's control events)
# set_battle_map, scenario_progress 1 (variable 301 = 1 on maps 100 / 102): the Z2_戦闘_背景 row by the ground tile
Z2_TILES = [((2048,), 0), ((1543, 1551, 1580, 1581, 1588, 1590, 1596, 1598), 2), ((1575,), 3), ((1542,), 5)]

# the party members of this part (CE9; the 大猿変身 moves 251 / 262 / 270 / 278 left out: the remake has no Great Ape
# for the party) and the moves they may learn later in ZG
CREW = {27: ('多瑪', 'トーマ', [246, 248, 247, 249]), 28: ('莎莉巴', 'セリパ', [255, 257, 256, 259]),
        29: ('多達布', 'トテッポ', [265, 267, 266, 268]), 30: ('普普堅', 'パンブーキン', [273, 275, 274, 276])}
CREW_BEST = {27: 250, 28: 260, 29: 269, 30: 277}  # CE9 / CE169 / CE170: the strongest moves (switch 629 / 631 / 633 / 635)
FUTURE = {25: ('悟飯', 'ゴハン(未来)', [236, 237, 238, 240, 241, 245]), 26: ('悟飯', 'ゴハン(未来超)', [236, 237, 238, 240, 241, 242])}
SS_BARDOCK = [147, 148, 149, 151, 152, 155]
# the database names the moves only in Japanese / simplified Chinese: the words the earlier chapters use
MOVE_NAMES = {155: '超級復仇標槍', 246: '能量波', 247: '多重能量波', 248: '大能量波', 249: '火焰狙擊', 250: '全功率火焰狙擊',
              255: '能量波', 256: '多重能量波', 257: '大能量彈', 259: '歇斯底里的賽亞女士', 260: '狩獵之箭',
              265: '能量波', 266: '多重能量波', 267: '大能量波', 268: '憤怒攻擊', 269: '憤怒加農',
              273: '能量波', 274: '多重能量波', 275: '大能量波', 276: '巨型彈射', 277: '巨型加農'}
# the enemies of these battles and areas: Z2 sheets (Z2_顔敵 row = id − 30) / Z3 sheets (Z3_顔敵 row = id − 100)
Z2_ENEMIES = [65, 66, 67, 68, 69, 72, 73, 74, 75, 76]
Z3_ENEMIES = [155, 159]
ENEMY_MOVES = {550: '能量波', 552: '能量波', 553: '能量吸收', 625: '能量波', 626: '氣圓斬', 627: '行星炸彈', 629: '能量波', 630: '宇宙攻擊',
               632: '能量波', 633: '爆發波', 634: '流星球', 636: '能量波', 637: '雙重能量波', 639: '能量波', 640: '雙重能量波',
               646: '能量波', 647: '邪惡類星體', 648: '伸長手臂', 650: '能量波', 651: '邪惡重力', 653: '能量波', 654: '邪惡彗星',
               655: '青蛙攻擊', 657: '能量波', 658: '邪惡衝擊', 660: '能量波', 661: '安基拉與梅達瑪茶'}

P = lambda n: f'Graphics/Pictures/{n}.PNG'
P2, F2, P3, E3, F3, CARD = P('Z2_顔味方'), P('Z2_顔敵'), P('Z3_顔味方'), P('Z3_顔イベント'), P('Z3_顔敵'), P('顔カード')
# who speaks with which face: the Z3 sheets, the Z2 ones while variable 40 = 1 (the crew's part, pages 6061-6131)
FACES = {'悟空': (P3, 0), '比克': (P3, 1), '悟飯': (P3, 2), '克林': (P3, 3), '雅木茶': (P3, 4), '餃子': (P3, 6), '琪琪': (P3, 7),
         '貝吉塔': (P3, 9), '巴達克': (P3, 13), '特蘭克斯': (P3, 14), '18號': (P3, 18), '17號': (P3, 19), '16號': (P3, 20),
         '龜仙人': (P3, 21), '未來悟飯': (P3, 22), '多瑪': (P3, 24), '莎莉巴': (P3, 25), '多達布': (P3, 26), '普普堅': (P3, 27),
         '布爾瑪': (CARD, 8, 2), '波波': (CARD, 12, 2), '弗利薩': (F3, 1), '貝利': (E3, 64), '伊帕納': (E3, 63), '普蘭特人': (E3, 66),
         '達列斯': (F2, 29), '史拉格': (F2, 30), '薩博': (F2, 15), '多多利亞': (F2, 13)}
NO_FACE = ('？', '男')  # (not named yet: the original shows no one; the opening's ？ face is Raditz's shadow)
FACES2 = {'多瑪': (P2, 24), '莎莉巴': (P2, 25), '多達布': (P2, 26), '普普堅': (P2, 27), '弗利薩': (F2, 23), '巴達克': (P2, 13)}
# the future (scenes 6171-6174): Gohan is the future one, Bulma the older one
FUTURE_FACES = {'悟飯': (P3, 22), '布爾瑪': (E3, 26)}


# ---------- the scenes: z1field read from all.rb ----------
def z1field_blocks(src):
    """when-number → its lines, for the whole of Event_Main#z1field"""
    lines = src.split('\n')
    start = next(i for i, l in enumerate(lines) if 'def z1field event_no' in l)
    blocks, cur = {}, None
    for l in lines[start + 1:]:
        if l.startswith('  def '):
            break
        m = re.match(r'^    when ([\d, ]+)\s*(#.*)?$', l)
        if m:
            cur = []
            for n in m.group(1).replace(' ', '').split(','):
                if n:
                    blocks[int(n)] = cur
            continue
        if cur is not None:
            cur.append(l)
    return blocks


def at(expr):
    e = expr.replace(' ', '')
    for k, v in sorted(IVARS.items(), key=lambda kv: -len(kv[0])):
        e = e.replace(k, str(v))
    if not re.fullmatch(r'[\d+\-*()]+', e):
        raise ValueError(expr)
    return eval(e)


def scene_of(body, file, size):
    """one z1field scene → {bg, ene: [[pic, sx, sy, w, h, dx, dy]] (dx / dy from @ene1_x / @ene1_y), play: [[pic, sx,
    sy, dx, line]] (under the scene: line 1 = @play_y + 64), out: null | {dy, all}}; '@cf' = set_character_face
    (src/zg_a.js picks the sheet by the era and the clothes, as the original does)"""
    pic, rect, d = None, None, {'bg': None, 'ene': [], 'play': [], 'out': None}
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
            rect = [at(x) for x in m.group(1).split(',')]
            continue
        m = re.match(r'rect,picture = set_character_face (\d+),(\d+),1$', t)
        if m:
            pic, rect = '@cf', [64 * int(m.group(1)), 64 * int(m.group(2)), 64, 64]
            continue
        m = re.match(r'add_chr\((.+?),(.+?),picture,rect\)$', t)
        if m:
            x, y = m.group(1), m.group(2)
            if x.startswith('@z1_scrollscenex'):
                d['bg'] = pic
            elif '@play_y' in y:
                d['play'].append([pic, rect[0], rect[1], at(x) - 288, (at(y) - 306) // 64])
            else:  # in the scene: faces at @ene1_x / @ene1_y, the time machine over the scroll window
                w, h = rect[2], rect[3]
                if pic != '@cf':  # (a rect past the picture's edge: only what is there)
                    pw, ph = size(pic)
                    w, h = min(w, pw - rect[0]), min(h, ph - rect[1])
                d['ene'].append([pic, rect[0], rect[1], w, h, at(x) - 288, at(y) - 78])
            continue
        m = re.match(r'character_output(_all)?\s*([\d, ]*)$', t)
        if m:
            args = [int(a) for a in m.group(2).replace(' ', '').split(',') if a]
            d['out'] = {'dy': args[2] if len(args) > 2 else 0}
            if m.group(1):
                d['out']['all'] = args[3]
            continue
        raise ValueError(t)
    return d


# ---------- the pages ----------
def converter(h, z3):
    """EXTRA / OPTS for these pages (filled while they are converted, then cleared); the nodes zga… are src/zg_a.js's"""
    script, D = h['script'], h['D']
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')
    import build_z3  # noqa: E402  (already loaded: it calls build_timeroom, which calls this file)

    def code355(p):  # the script lines (355 and their continuation lines 655)
        t = p[0].strip()
        if t.startswith('#') or not t:
            return []
        m = re.match(r'(on|off)_super_saiyazin (\d+)', t)
        if m:
            return [{'x': 'zgaSs', 'no': int(m.group(2)), 'on': m.group(1) == 'on'}]
        if re.match(r'\$partyc\s*=\s*\[', t):
            return [{'x': 'zgaParty', 'ids': [int(x) for x in re.findall(r'\d+', t)]}]
        m = re.match(r'\$partyc\.(unshift|push|delete)\((\d+)\)$', t)
        if m:
            return [{'x': 'zgaMember', 'op': m.group(1), 'id': int(m.group(2))}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        m = re.match(r'\$game_actors\[(\d+)\]\.mp = 0$', t)
        if m:  # 演出としてKIを0にしておく
            return [{'x': 'zgaKi0', 'id': int(m.group(1))}]
        m = re.match(r'cha_tec_puls (\d+),0,3,(\d+)', t)
        if m:
            return [{'x': 'uses', 'map': {m.group(1): int(m.group(2))}}]
        m = re.match(r'\$cardi_max = (\d+)$', t)
        if m:
            return [{'x': 'zgaCardi', 'n': int(m.group(1))}]
        if t == 'chk_scenario_progress':
            return [{'x': 'zgaEra'}]
        return []  # ($eve, set_skn, the window switches 38 / 39, the $chadead loops, set_typical_skill 670: see docs)

    def ce(p):
        n = p[0]
        if n in (170, 169, 228, 230):  # 外伝の変数初期化 / 一味必殺技確認 / 一味初回加入調整 / 未来悟飯技熟練度: inline
            return script(build_z3.resolve_jumps(cdb[n]['list']))
        named = {166: 'zgaKeep', 159: 'zgaSsOff', 39: 'zgaLead', 9: 'zgaSkills', 66: 'zgaBardockSs'}
        return [{'x': named[n]}] if n in named else []  # (CE160: no Great Apes here)

    def exp(p):
        if p[0] == 32:  # (the Super Saiyan Bardock is Bardock: one member)
            return []
        return [{'x': 'exp', 'id': p[0], 'n': p[3] if p[1] == 0 else -p[3]}]
    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        251: lambda p: [{'x': 'zgaSeStop'}],
        201: lambda p: [{'x': 'zgaGo', 'to': p[1:4]}],
        315: exp,
        318: lambda p: [] if p[2] in (251, 262, 270, 278) else [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(bgm=True, shakeSw=True)

    def done():
        EXTRA.clear()
        OPTS.update(bgm=False, shakeSw=False)
    return done


def speaker_faces(nodes, v):
    """the face of each line by who speaks and where the story is (variable 41: the future 6171-6174; variable 40: the
    Z2 sheets for the crew's part)"""
    st = {'v': v, 'era': 1 if 6061 <= v <= 6131 else 2}

    def key(who):
        if 6171 <= st['v'] <= 6174 and who in FUTURE_FACES:
            return 'zgaF:' + who
        if st['era'] == 1 and who in FACES2:
            return 'zga2:' + who
        return 'zga:' + who if who in FACES or who in NO_FACE else None

    def walk(ns):
        out = []
        for n in ns:
            if n.get('var') and n['var'][0] == 41:
                st['v'] = n['var'][2] if n['var'][1] == 0 else st['v'] + (n['var'][2] if n['var'][1] == 1 else -n['var'][2])
            if n.get('var') and n['var'][0] == 40 and n['var'][1] == 0:
                st['era'] = n['var'][2]
            if 'say' in n:
                who, text = n['say'][0], n['say'][1]
                k = key(who)
                n = {'say': [who, text] + ([k] if k else [])}
            for f in ('then', 'else', 'loop'):
                if f in n:
                    n = dict(n, **{f: walk(n[f])})
            if 'branches' in n:
                n = dict(n, branches=[walk(b) for b in n['branches']])
            out.append(n)
        return out
    return walk(nodes)


def door_text(lst, s2t):
    """page 6000: its lines and choices (the rest of the page is src/zg_a.js)"""
    msgs, choices, cur = [], [], None
    for c in lst:
        if c['code'] == 101:
            cur = []
            msgs.append(cur)
        elif c['code'] == 401:
            cur.append(s2t(c['parameters'][0]))
        elif c['code'] == 102:
            choices.append([s2t(x) for x in c['parameters'][0]])
    return {'ask': '\n'.join(msgs[0]), 'askDark': '\n'.join(msgs[1]), 'yesNo': choices[0], 'dark': choices[1],
            'bgm': next(c['parameters'][0]['name'] for c in lst if c['code'] == 241)}


def add(world, h, z3, tr):
    build_map, D, s2t, enemy, skill, actor, root = (h[k] for k in ('build_map', 'D', 's2t', 'enemy', 'skill', 'actor', 'root'))
    file = z3['file']
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    sizes = {}

    def size(path):
        if path not in sizes:
            sizes[path] = Image.open(os.path.join(root, 'game', path)).size
        return sizes[path]
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()

    # ---------- the scenes ----------
    blocks = z1field_blocks(src)
    scenes = {str(n): scene_of(blocks[n], file, size) for n in range(6001, 6179) if n in blocks and n not in BATTLES}

    # ---------- the pages ----------
    ev23 = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['23']['pages'] if p['condition']['variable_valid']}
    done = converter(h, z3)
    pages = {f'zga:{v}': speaker_faces([{'v41': v}] + z3['nodes_of'](ev23[v], faces={}), v) for v in PAGES}
    done()
    world['z3']['pages'].update(pages)
    faces = {f'zga:{k}': list(v) for k, v in FACES.items()}
    faces.update({f'zga2:{k}': list(v) for k, v in FACES2.items()})
    faces.update({f'zgaF:{k}': list(v) for k, v in FUTURE_FACES.items()})
    # (NO_FACE: 'zga:？' / 'zga:男' are keys with no face behind them, so the box shows none — not the opening's ？)
    world['faces'].update(faces)

    # ---------- the maps, their squares and encounters ----------
    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        m['ev'] = tr['map_events'](D, mid, rows, tr['sheets'])
        m['walk'] = True  # (the original walks here: map events 2 主人公 — the crew has no flying sprite)
        world['maps'][str(mid)] = m
    world['areas'].update(AREAS)
    sq = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    for mid, s in SQUARES.items():
        world['pois'][str(mid)] = sq(s['card'], CARD_SQ) + sq(s['inn'], INN)
    for mid, (x, y), label, page, when in STORY:
        world['pois'][str(mid)].append({'x': x, 'y': y, 'label': label, 'chapter': 'zga', 'page': page, **({'when': when} if when else {})})
    # the map events by tile, for the Z3 battle backgrounds of map 101 (variable 301 = 2: src/z3.js z3BackdropAt)
    best = {}
    for k, e in D('map101')['events'].items():
        g = e['pages'][0]['graphic']
        if int(k) > 4 and g.get('character_name'):
            key = f"{e['x']},{e['y']}"
            if key not in best or int(k) > best[key][0]:
                best[key] = (int(k), [g['character_name'], g['character_index'], g['direction']])
    world['z3']['tileEvents']['101'] = {k: v[1] for k, v in best.items()}

    # ---------- the party members ----------
    sdb = D('skills')
    h['SKILL_NAMES'].update({k: v for k, v in MOVE_NAMES.items()})
    learnable = set(SS_BARDOCK) | {s for _, _, sk in CREW.values() for s in sk} | set(CREW_BEST.values()) \
        | {s for _, _, sk in FUTURE.values() for s in sk}
    for sid in sorted(learnable):
        world['skills'].setdefault(sid, skill(sid))
        if sid in MOVE_NAMES:
            world['skills'][sid]['name'] = MOVE_NAMES[sid]
    for aid, (name, jp, skills) in CREW.items():
        world['actors'].setdefault(aid, dict(actor(aid, aid - 3, name, f'Z2_戦闘_{jp}.png', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills),
                                             special=f'Graphics/Pictures/Z2_戦闘_必殺技_{jp}.png'))
    for aid, (name, jp, skills) in FUTURE.items():
        world['actors'].setdefault(aid, dict(actor(aid, aid - 3, name, f'Z3_戦闘_{jp}.png', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills),
                                             special=f'Graphics/Pictures/Z3_戦闘_必殺技_{jp}.png'))
    world['actors'][26].setdefault('ss', 25)
    world['actors'].setdefault(32, dict(actor(32, 29, '巴達克', 'Z3_戦闘_バーダック(超).PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', SS_BARDOCK),
                                        special='Graphics/Pictures/Z3_戦闘_必殺技_バーダック(超).png', ss=16))
    for a in (25, 26, 27, 28, 29, 30, 32):
        for k in ('sprite', 'special'):
            assert os.path.exists(os.path.join(root, 'game', world['actors'][a][k])), world['actors'][a][k]

    # ---------- the enemies ----------
    edb = D('enemies')
    moves = set()
    for eid in Z2_ENEMIES + Z3_ENEMIES:
        e = enemy(eid)
        name, era = edb[eid]['name'], 'Z2' if eid in Z2_ENEMIES else 'Z3'
        e['sprite'] = file(f'{era}_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'{era}_戦闘_敵_{name}')
        assert e['sprite'] and e['portrait'], name
        e['face'] = [F2, eid - 30] if era == 'Z2' else [F3, eid - 100]
        world['enemies'].setdefault(eid, e)
        moves |= {a['skill_id'] for a in edb[eid]['actions'] if a['kind'] == 1}
        world['drops'].setdefault(eid, [[d['item_id'], d['denominator']] for d in (edb[eid]['drop_item1'], edb[eid]['drop_item2'])
                                        if d['kind'] == 1 and d['item_id'] in world['items']])
    for sid in sorted(moves):
        if sid not in world['skills'] and str(sid) not in world['skills']:
            world['skills'][sid] = skill(sid)
            if sid in ENEMY_MOVES:
                world['skills'][sid]['name'] = ENEMY_MOVES[sid]

    # ---------- the battles ----------
    consts, names = __import__('build_z3').bgm_names(src)
    for no, b in BATTLES.items():
        n = b['bgm'] if isinstance(b['bgm'], int) else consts[b['bgm']]
        world['z3']['battles'][str(no)] = {'foes': b['foes'], 'bgm': names[n]}
    tiles = {str(t): r for ts, r in Z2_TILES for t in ts}

    # ---------- CE66 (Bardock's Super Saiyan pictures: the back, Trunks' three auras, his two bodies at x 178 − 146) ----------
    ss = {'back': file('Z3_スーパーサイヤ人_バック'), 'auras': [file(f'Z3_スーパーサイヤ人_トランクス_気{k}') for k in (1, 2, 3)],
          'body': [file(f'Z3_スーパーサイヤ人バーダック{k}') for k in (1, 2)], 'x': 178 - 146}
    sheets = {'p2': P2, 'p3': P3, 'kit2': file('Z2_顔味方_衣替'), 'clothes': file('Z3_顔味方_衣替え'),
              'long': file('Z3_顔味方_トランクス長髪'), 'zg': file('ZG_顔味方')}

    door = door_text(ev23[6000], s2t)
    world['z3']['titles']['zga'] = 'Z 外傳'
    world['z3']['zga'] = {
        'scenes': scenes, 'battles': {str(k): {'backdrop': b['bg'], 'next': NEXT[k]} for k, b in BATTLES.items()},
        'tiles': tiles, 'ss': ss, 'sheets': sheets, 'text': door,
        'door': tr['GO'](96, 18, 2), 'back': tr['GO'](96, 18, 3), 'dark': tr['GO'](110, 2, 21), 'next': tr['GO'](103, 24, 23),
        'crew': {str(k): v[2] for k, v in CREW.items()}, 'best': {str(k): v for k, v in CREW_BEST.items()},
        'goals': {'143': s2t('巴达克的同伴在悲伤之后…'), '144': s2t('背叛弗利萨的人'), '145': s2t('多玛他们的困惑'),
                  '146': s2t('弗利萨的谋划…')},  # (Scene_Db_Menu 概況: variable 43)
    }

    # ---------- what the pages and scenes need (tools/copy_assets.py) ----------
    used = {it[0] for d in scenes.values() for it in d['ene'] + d['play'] if it[0] != '@cf'} | {d['bg'] for d in scenes.values() if d['bg']}
    used |= set(sheets.values()) | {ss['back'], *ss['auras'], *ss['body'], P2, P3, E3, F3, F2, CARD}
    assert None not in used, used
    se, bgm = set(), set()

    def walk(x):
        if isinstance(x, dict):
            if isinstance(x.get('se'), str):
                se.add(x['se'])
            if isinstance(x.get('bgm'), str) and x['bgm']:
                bgm.add(x['bgm'])
            if isinstance(x.get('bgs'), str) and x['bgs']:
                pass  # (tools/copy_assets.py copies the BGS it finds)
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(pages)
    bgm |= {b['bgm'] for k, b in world['z3']['battles'].items() if k in {str(n) for n in BATTLES}} | {door['bgm']}
    audio = os.path.join(root, 'game', 'Audio')
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se | {'Z3 変身', 'Z1 飛ぶ', 'Z1 入る', 'Z1 スカウター音'}
                                                        if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | used | {'Graphics/Characters/chara1.png', 'Graphics/Characters/chara3.png'})
    assert os.path.isdir(pics)
