"""巴達克篇 Z1／Z2（門 9151、9351：Map007 事件 4、10，地圖 31、54、65） — world.json data (read by src/tr_bardock.js),
added by tools/build_timeroom.py. Plan: docs/timeroom-plan.md; the whole flow is in docs/tr-bardock.md.

The original:
  Z1 (door 9151 of map 59): variable 41 = 800 → Map007 event 4 (event 14 is the old copy, action-button pages that
    never run) pages 800-881 → CE161 (the Bardock part's own actors / skills / cards: Share.main_z1bar_varchange),
    the opening scenes (z1field 801-822) → map 31 (46,73): the Kame House 841, Raditz 831 → battle 832 → 833 (the end:
    switch 525, variable 41 = 9152 → event 17 page 9152: CE162, CE182, map 59 (28,3)), Popo 851 → battle 852 → 853 /
    861, the cave (map 65) 871-874, its boss 881 → battle 882. 145_Event_Check.rb `when 31` / `when 65`.
  Z2 (door 9351 of map 66): variable 41 = 3000 → event 10 pages 3000-3181 → CE163 (party [16]) → the story (z1field
    3001-3188, set_battle_event 12 / 13 films) → map 53 / 52 (the two pods pass each other: their event 15) → map 54
    (6,36): the space area, the goal (16-18, 2-3) 3161 → 3171 → 3181 → CE164 → map 66 (28,3). `when 54`.
Scenes: z1field (143_Event_Main.rb) is read straight from research/all.rb: every add_chr / for-loop / bgm / se becomes
a list of drawing steps (world.trBardock.scenes), drawn by src/tr_bardock.js.
"""
import os
import re

from PIL import Image

Z1_PAGES = [800, 801, 811, 831, 833, 841, 851, 853, 861, 881]  # Map007 event 4
Z2_PAGES = [3000, 3001, 3021, 3031, 3041, 3061, 3081, 3091, 3101, 3111, 3161, 3181]  # Map007 event 10
SCENES = [(800, 899), (3000, 3199)]  # z1field cases drawn by these pages

# the original screen: 143_Event_Main.rb initialize (the scene window, the face above / the faces under it)
IVARS = {'@z1_scenex': 224, '@z1_sceney': 46, '@z1_scrollscenex': 64, '@z1_scrollsceney': 46,
         '@ene1_x': 288, '@ene1_y': 78, '@play_x': 288, '@play_y': 306}
PLAY_Y = 306

# 145_Event_Check.rb `when 31` / `when 65` / `when 54`
SPOTS = {
    31: {'card': [(32, 53), (31, 30), (20, 19), (53, 2), (54, 3)], 'train': [(28, 55), (19, 9), (53, 3), (54, 2)],
         'inn': [(38, 60), (14, 36), (52, 30), (10, 15), (29, 4)]},
    65: {'card': [(13, 22), (27, 7)], 'train': [(5, 16), (17, 14)], 'inn': []},
    54: {'card': [], 'train': [], 'inn': [(11, 31), (23, 13)]},
}
INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (variable 41 = 11)
CARD_SQ = {'label': '卡片商店', 'effect': 'shop'}  # chk_card
TRAIN = {'label': '修行', 'effect': 'training'}  # chk_training
# the story squares: [map, [(x, y), …], label, page]
STORY = [
    (31, [(46, 72)], '進入龜仙屋', 'trbdKame'),  # 841
    (31, [(15, 6), (15, 7), (16, 7)], '前往拉蒂茲那裡', 'trbdRaditz'),  # 831
    (31, [(33, 26)], '前往波波先生那裡', 'trbdPopo'),  # 851 / 861 (switch 526)
    (31, [(22, 17)], '進入洞窟', 'trbdCave'),  # 871 → map 65 (34,24)
    (31, [(18, 12)], '進入洞窟', 'trbdCave'),  # 872 → map 65 (5,4)
    (65, [(34, 23)], '離開洞窟', 'trbdCave'),  # 873 → map 31 (22,18)
    (65, [(5, 3)], '離開洞窟', 'trbdCave'),  # 874 → map 31 (18,13)
    (65, [(7, 10)], '洞窟深處', 'trbdCaveBoss', [['sw', 527, False], ['sw', 526, True]]),  # 881
    (54, [(16, 2), (17, 2), (18, 2), (16, 3), (17, 3), (18, 3)], '前往弗利薩的宇宙船', 'trbdFrieza'),  # 3161
]
CAVE = {'22,17': [65, 34, 24], '18,12': [65, 5, 4], '34,23': [31, 22, 18], '5,3': [31, 18, 13]}  # pages 871-874
# 140_Field_Main.rb: `when 1,5,60,65,31` (Raditz area: 1-3, a party of one 1-2) and `when 54`
AREAS = {'31': {'pool': [1, 2, 4, 5], 'n': [1, 3], 'size': {'1': [1, 2]}}, '65': {'pool': [1, 2, 4, 5], 'n': [1, 3], 'size': {'1': [1, 2]}},
         '54': {'pool': [31, 34, 37, 61, 62, 63, 64], 'n': [1, 3]}, '52': None, '53': None}
ROWS = {31: 89, 65: 39, 54: 54, 52: 44, 53: 44}  # (below: the original's control events)
# battle_process 832 / 852 / 882 ($Battle_MapID: the Z1_戦闘_背景 row), set_battle_map scenario_progress 0 by tile
BATTLES = {832: {'foes': [19], 'row': 0, 'bgm': 10}, 852: {'foes': [2, 2, 2, 2, 2, 2], 'row': 0}, 882: {'foes': [2, 2, 3, 3, 2, 2], 'row': 11}}
Z1_TILE_ROWS = [((1537, 1545), 0), (tuple(range(1576, 1580)) + (1584, 1585, 1586, 1592, 1593, 1594), 5), ((1538, 1546), 2),
                ((1539, 1547), 3), ((1540, 1548), 4), ((1541, 1549), 7), ((1542,), 11), (tuple(range(1560, 1575)), 1), ((1556,), 10)]
# set_battle_event 12 / 13 (all.rb 52771): Bardock (school 5) against 惑星戦士1 (61) / Frieza (53), action 179 / 180
FILMS = {3071: {'foe': 61}, 3171: {'foe': 53}}
# who speaks with which face (the original shows none in these pages; the remake's message box does, by speaker)
P = lambda n: f'Graphics/Pictures/{n}.PNG'
FACES1 = {'巴達克': (P('Z1_顔味方'), 13), '悟空': (P('Z1_顔味方'), 0), '比克': (P('Z1_顔味方'), 1), '克林': (P('Z1_顔味方'), 3),
          '悟飯': (P('Z1_顔イベント'), 0), '龜仙人': (P('Z1_顔イベント'), 1), '布爾瑪': (P('Z1_顔イベント'), 3), '波波': (P('Z1_顔イベント'), 10),
          '拉蒂茲': (P('Z1_顔敵'), 10), '球根人': (P('Z1_顔敵'), 2), '栽培人': (P('Z1_顔敵'), 3)}
FACES2 = {'巴達克': (P('Z2_顔味方'), 13), '多瑪': (P('Z2_顔味方'), 24), '莎莉巴': (P('Z2_顔味方'), 25), '多達布': (P('Z2_顔味方'), 26),
          '普普堅': (P('Z2_顔味方'), 27), '弗利薩': (P('Z2_顔敵'), 23), '薩博': (P('Z2_顔敵'), 15), '多多利亞': (P('Z2_顔敵'), 13),
          '惑星戦士': (P('Z2_顔敵'), 31), '貝吉塔': (P('Z2_顔イベント'), 10), '那巴': (P('Z2_顔イベント'), 12),
          '醫師': (P('Z2_顔イベント'), 8), '醫生': (P('Z2_顔イベント'), 8), '卡納薩星人': (P('Z2_顔イベント'), 5),
          '孫悟飯': (P('顔カード'), 24, 1), '栽培人': (P('Z1_顔敵'), 3)}


def z1field_cases(src):
    """143_Event_Main.rb z1field: {case number: its body lines} (the top-level `when`s only)"""
    body = src[src.index('  def z1field event_no'):]
    body = body[:body.index('\n  def ', 10)]
    out, cur = {}, None
    for line in body.split('\n'):
        m = re.match(r'^ {3,4}when ([0-9][0-9 ,.]*)', line)
        if m:
            cur = []
            for part in m.group(1).split(','):
                part = part.strip()
                if '..' in part:
                    a, b = part.split('..')
                    for n in range(int(a), int(b) + 1):
                        out[n] = cur
                elif part:
                    out[int(part)] = cur
            continue
        if re.match(r'^ {4}end\s*$', line) or re.match(r'^ {4}else\s*$', line):
            cur = None
            continue
        if cur is not None:
            cur.append(line)
    return out


def scene_ops(lines, file, warn):
    """a z1field body → drawing steps for src/tr_bardock.js:
    ['pic', item]   add_chr: {p: path, x, y, r: [sx, sy, w, h]} (or cf: [column, row] = set_character_face), line: under the scene
    ['anim', from, to, keep, items, next]   for x in from..to … Graphics.update (values linear in x: [a, b] = a + b·x)
    ['out'] character_output  ['bgm', name]  ['se', name]  ['next', n] variable 41 += n  ['leave', id]  ['film']"""
    ops, k = [], 0
    pic, pic2, rect, rect2, cf = None, None, None, None, None

    def expr(e, x=None):
        e = e.strip()
        for v, n in sorted(IVARS.items(), key=lambda kv: -len(kv[0])):
            e = e.replace(v, str(n))
        if re.search(r'[^0-9x+\-*/() ]', e):
            raise ValueError(e)
        return eval(e, {}, {'x': x if x is not None else 0})

    def lin(e, loop):
        if not loop or not re.search(r'\bx\b', e):
            return expr(e)
        a, b, c = expr(e, 0), expr(e, 1), expr(e, 2)
        assert c - a == 2 * (b - a), e
        return [a, b - a]

    def block(lines, loop):
        nonlocal pic, pic2, rect, rect2, cf
        out, i, nxt = [], 0, 0
        while i < len(lines):
            raw = lines[i]
            t = raw.split('#')[0].strip() if not raw.strip().startswith('Audio') else raw.strip()
            i += 1
            if not t:
                continue
            m = re.match(r'for x in (\d+)\.\.(\d+)$', t)
            if m:
                ind = len(raw) - len(raw.lstrip())
                body, depth = [], 0
                while i < len(lines):
                    l2 = lines[i]
                    i += 1
                    s2 = l2.split('#')[0].strip()
                    if re.match(r'(if|for|case|while)\b', s2):
                        depth += 1
                    if s2 == 'end':
                        if depth == 0 and len(l2) - len(l2.lstrip()) <= ind:
                            break
                        depth -= 1
                    body.append(l2)
                a, b = int(m.group(1)), int(m.group(2))
                anim = any('Graphics.update' in l for l in body)
                items, n = block(body, True)
                if anim:
                    keep = any(re.match(r'\s*if x != \d+', l) for l in body)
                    out.append(['anim', a, b, keep, [it[1] for it in items if it[0] == 'pic'], n])
                else:  # the same pictures side by side (z1field 851: six of them)
                    for x in range(a, b + 1):
                        for it in items:
                            if it[0] == 'pic':
                                it = dict(it[1])
                                for key in ('x', 'y'):
                                    if isinstance(it[key], list):
                                        it[key] = it[key][0] + it[key][1] * x
                                out.append(['pic', it])
                    nxt += n * (b - a + 1)
                continue
            if re.match(r'(if x != \d+|clear_chr|end|Graphics\.update|#.*|color = .*|@chr_sprite\[\d+\].*|\$game_progress = 0)$', t) \
                    or t.startswith('#') or t.startswith('screen.start_tone_change'):
                continue
            m = re.match(r'picture(2?) ?= ?"([^"]+)"', t)
            if m:
                if m.group(1):
                    pic2 = m.group(2)
                else:
                    pic, cf = m.group(2), None
                continue
            m = re.match(r'rect(2?) = Rect\.new\((.+)\)', t)
            if m:
                parts = [p.strip() for p in m.group(2).split(',')]
                v = [lin(p, loop) for p in parts]
                if m.group(1):
                    rect2 = v
                else:
                    rect, cf = v, None
                continue
            m = re.match(r'rect,picture = set_character_face (\d+),(\d+),1$', t)
            if m:
                cf, pic, rect = [int(m.group(1)), int(m.group(2))], None, None
                continue
            m = re.match(r'add_chr\((.+),(.+),(picture2?),(rect2?)\)$', t)
            if m:
                x, y = lin(m.group(1), loop), lin(m.group(2), loop)
                two = m.group(3) == 'picture2'
                if two or not cf:
                    name = pic2 if two else pic
                    if name == 'z1_bg':  # the mask over the screen above the scene window (the clip does it here)
                        continue
                    path = file(name)
                    if not path:
                        warn.append(f'no picture {name}')
                        continue
                    it = {'p': path, 'r': rect2 if two else rect}
                else:
                    it = {'cf': cf}
                y0 = y[0] if isinstance(y, list) else y
                if 'play_y' in m.group(2):
                    it['line'] = (y0 - PLAY_Y) // 64
                    y = 0
                it['x'], it['y'] = x, y
                out.append(['pic', it])
                continue
            if t == 'character_output':
                out.append(['out'])
                continue
            m = re.match(r'Audio\.bgm_play\("Audio/BGM/" ?\+ ?"([^"]+)"\)', t)
            if m:
                out.append(['bgm', m.group(1)])
                continue
            m = re.match(r'Audio\.se_play\("Audio/SE/" ?\+ ?"([^"]+)"\)', t)
            if m:
                out.append(['se', m.group(1)])
                continue
            if t == '$game_variables[41] += 1':
                if loop:
                    nxt += 1
                else:
                    out.append(['next', 1])
                continue
            m = re.match(r'\$partyc\.delete\((\d+)\)$', t)
            if m:
                out.append(['leave', int(m.group(1))])
                continue
            if t.startswith('$chadead.delete_at'):
                continue
            if t in ('battle_process(event_no)', 'set_battle_event'):
                out.append(['film'] if t == 'set_battle_event' else ['battle'])
                continue
            warn.append(t)
        return out, nxt

    body, n = block(lines, False)
    ops += body
    if n:
        ops.append(['next', n])
    return ops


def add(world, h, z3, tr):
    build_map, D, s2t, enemy, skill, root = (h[k] for k in ('build_map', 'D', 's2t', 'enemy', 'skill', 'root'))
    nodes_of, file = z3['nodes_of'], z3['file']
    ev7 = D('map007')['events']
    ce = {c['id']: c for c in D('commonevents') if c}
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()

    # ---------- the scenes (z1field) ----------
    cases, warn, scenes = z1field_cases(src), [], {}
    for lo, hi in SCENES:
        for n in range(lo, hi + 1):
            if n in cases:
                ops = scene_ops(cases[n], file, warn)
                if ops:
                    scenes[str(n)] = ops
    assert not warn, warn
    pictures = sorted({it['p'] for ops in scenes.values() for op in ops
                       for it in ([op[1]] if op[0] == 'pic' else op[4] if op[0] == 'anim' else []) if 'p' in it})
    pictures += [file(n) for n in ('Z2_顔味方', 'Z2_顔味方_衣替', 'Z1_顔味方', 'Z2_顔イベント', 'Z2_顔敵', '顔カード')]

    # ---------- the pages ----------
    opts, extra = h['OPTS'], h['EXTRA']
    keep_extra, keep_opts = dict(extra), dict(opts)

    def script_line(p):
        t = p[0].strip()
        if t == '$eve.allcardexchange':
            return [{'x': 'trbdHand'}]
        if t == 'all_charecter_recovery':
            return [{'x': 'trbdHeal'}]
        m = re.match(r'\$partyc = \[([\d, ]+)\]$', t)
        if m:
            return [{'x': 'trbdParty', 'ids': [int(n) for n in m.group(1).split(',')]}]
        return []

    extra.update({
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        117: lambda p: [{'x': 'trbdCE', 'n': p[0]}],  # CE160-164 (src/tr_bardock.js does them)
        201: lambda p: [{'x': 'trbdGo', 'to': p[1:4] if p[0] == 0 else 'back'}],  # where the page sends the party
        251: lambda p: [{'x': 'trbdSeStop'}],
        355: script_line, 655: script_line,
    })
    opts.update(bgm=True, shakeSw=True)

    def conv(lst, faces, key):
        ns = nodes_of(lst, faces={})

        def fix(ns):
            for n in ns:
                if 'say' in n:
                    who = n['say'][0]
                    n['say'] = [who, n['say'][1]] + ([f'{key}:{who}'] if who in faces else [])
                for k in ('then', 'else', 'loop'):
                    if k in n:
                        fix(n[k])
                for b in n.get('branches', []):
                    fix(b)
            return ns
        return fix(ns)

    pages = {}
    raw4 = {p['condition']['variable_value']: p['list'] for p in ev7['4']['pages'] if p['condition']['variable_valid']}
    raw10 = {p['condition']['variable_value']: p['list'] for p in ev7['10']['pages'] if p['condition']['variable_valid']}
    for v in Z1_PAGES:
        pages[str(v)] = [{'v41': v}] + conv(raw4[v], FACES1, 'trbd1')
    for v in Z2_PAGES:
        pages[str(v)] = [{'v41': v}] + conv(raw10[v], FACES2, 'trbd2')
    opts.clear()
    opts.update(keep_opts)
    extra.clear()
    extra.update(keep_extra)

    # ---------- maps, spots, encounters ----------
    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        m['ev'] = tr['map_events'](D, mid, rows, tr['sheets'])
        world['maps'][str(mid)] = m
    world['areas'].update(AREAS)
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    for mid, sp in SPOTS.items():
        world['pois'][str(mid)] = at(sp['card'], CARD_SQ) + at(sp['inn'], INN) + at(sp['train'], TRAIN)
    for mid, squares, label, page, *when in STORY:
        for x, y in squares:
            world['pois'][str(mid)].append({'x': x, 'y': y, 'label': label, 'chapter': 'tr', 'page': page, **({'when': when[0]} if when else {})})

    # the pods of maps 53 / 52 (event 1 Bardock's, event 16 Kakarot's: tile graphics) and how they move (event 15)
    pods = {}
    for mid in (53, 52):
        e = D('map%03d' % mid)['events']
        pods[str(mid)] = {'bardock': [e['1']['x'], e['1']['y'], e['1']['pages'][0]['graphic']['tile_id']],
                          'kakarot': [e['16']['x'], e['16']['y'], e['16']['pages'][0]['graphic']['tile_id']],
                          'wait': next(c['parameters'][0] for c in e['15']['pages'][0]['list'] if c['code'] == 230)}

    # ---------- enemies, skills, battle backgrounds ----------
    enemies_db = D('enemies')
    e = enemy(19)  # コピーラディッツ (battle 832): Raditz's pictures
    e.update({k: world['enemies'][10][k] for k in ('sprite', 'portrait', 'name') if k in world['enemies'][10]})
    if 'face' in world['enemies'][10]:
        e['face'] = world['enemies'][10]['face']
    world['enemies'][19] = e
    for eid in range(61, 65):  # 惑星戦士 1-4 (map 54, the film)
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = file(f'Z2_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z2_戦闘_敵_{name}')
        e['face'] = [P('Z2_顔敵'), 31 + eid - 61]
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
    h['SKILL_NAMES'].update({159: '能量波', 160: '大能量波', 161: '爆發波', 162: '賽亞精神', 163: '復仇標槍'})
    for sid in (159, 160, 161, 162, 163):
        world['skills'][sid] = skill(sid)
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    strips = Image.open(os.path.join(pics, 'Z1_戦闘_背景.PNG')).convert('RGB')
    rows = sorted({r for _, r in Z1_TILE_ROWS} | {b['row'] for b in BATTLES.values()})
    for row in rows:
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strips.crop((120, 100 * row, 520, 100 * row + 100)), (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'trbd_z1_{row}.png'), optimize=True)
    tiles = {str(t): r for ts, r in Z1_TILE_ROWS for t in ts}

    consts, names = h['build_z3'].bgm_names(src) if 'build_z3' in h else ({}, {})
    battles = {}
    for no, b in BATTLES.items():
        battles[str(no)] = {'foes': b['foes'], 'backdrop': f'bg/trbd_z1_{b["row"]}.png'}
        if 'bgm' in b and b['bgm'] in names:
            battles[str(no)]['bgm'] = names[b['bgm']]

    # ---------- faces, the rest ----------
    world['faces'].update({f'trbd1:{k}': list(v) for k, v in FACES1.items()})
    world['faces'].update({f'trbd2:{k}': list(v) for k, v in FACES2.items()})
    t = {
        'ask': s2t('在通关之前无法回到时之间'), 'yes': '是', 'no': '否',
    }
    world['trBardock'] = {
        'scenes': scenes, 'pages': pages, 'pictures': [p for p in pictures if p], 'battles': battles, 'tiles': tiles,
        'films': FILMS, 'pods': pods, 'cave': CAVE, 'text': t,
        'z1': {'start': GO(31, 46, 73), 'back': GO(59, 28, 3), 'door': GO(59, 28, 2)},
        'z2': {'start': GO(54, 6, 36), 'back': GO(66, 28, 3), 'door': GO(66, 28, 2)},
        'ce161': ce_info(ce[161]), 'ce163': ce_info(ce[163]),
    }

    # ---------- what the pages and scenes need (tools/copy_assets.py) ----------
    bgm, se = set(), set()

    def walk(x):
        if isinstance(x, dict):
            if isinstance(x.get('se'), str):
                se.add(x['se'])
            if isinstance(x.get('bgm'), str) and x['bgm']:
                bgm.add(x['bgm'])
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            if len(x) == 2 and x[0] in ('bgm', 'se') and isinstance(x[1], str):
                (bgm if x[0] == 'bgm' else se).add(x[1])
            for v in x:
                walk(v)
    walk(pages)
    walk(scenes)
    bgm |= {b['bgm'] for b in battles.values() if 'bgm' in b}
    audio = os.path.join(root, 'game', 'Audio')
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se | {'Z2 宇宙船移動', 'Z1 入る', 'Z1 出る'}
                                                        if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | set(world['trBardock']['pictures'])
                                    | {'Graphics/System/TileB.png', 'Graphics/System/TileC.png'})


GO = lambda m, x, y: {'map': str(m), 'x': x, 'y': y}


def ce_info(c):
    """the learn / forget commands (318) of CE161 / CE163: [[actor, learn?, skill], …]"""
    return [[x['parameters'][0], x['parameters'][1] == 0, x['parameters'][2]] for x in c['list'] if x['code'] == 318]
