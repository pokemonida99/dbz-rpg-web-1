"""Z4 第二章 悄悄接近的賽魯（地圖 43） — world.json data, added by tools/build_z3.py (read by src/z4b.js). docs/z4bc.md has
the whole chapter with the original's sources. The helpers here (the scene extractor, the page converter, the androids
as party members) are shared with the third chapter (tools/build_z4c.py).

The original: Map007 event 7 「Z4_セル編」 pages 7-15 (variable 41 = 2091-2181), the scenes 143_Event_Main.rb z1field
2091-2188 (all.rb 175648-176090), the spots of map 43 (145_Event_Check.rb `when 43`, all.rb 185681), its encounters
(140_Field_Main.rb `when 43,88`) and battle_process 2123 / 2153 / 2188, set_battle_event 3-6 (all.rb 52555):
  2091 (page 7)  Piccolo against No. 17 → the film 2092 (variable 96 = 3) → 2093 (page 8): Cell feels them, Kame
                 House, Bulma's controller, Goku and Gohan in the room → 2110 Piccolo tiring, Cell arrives → Tien,
                 Chiaotzu and Yamcha fly off → map 43 (59,5), party [8,9,7]
  map 43 (8,40) / (8,41) (switch 435 off) → 2121 (page 9) → battle 2123 (Piccolo and No. 17 against Cell, 5 turns)
                 → 2131 (page 10) → the film 2132 (Piccolo's 激烈光弾) → 2136 (page 11) → No. 16 alone, map 43 (8,36)
  map 43 the same squares (switch 435 on) → 2151 (page 12) → battle 2153 (No. 16, ×2.5 / enemy ×0.3, 5 turns)
                 → 2156 (page 13) → the film 2157 (Hell's Flash) → 2161 (page 14): No. 17 absorbed (CE67), the film
                 2172 (新気功砲) → 2181 (page 15) → battle 2188 (Tien, Yamcha, Chiaotzu, 4 turns; losing goes on)
                 → variable 41 = 2191: 第三章 (tools/build_z4c.py)
"""
import os
import re

MAP = '43'
P = lambda n: f'Graphics/Pictures/{n}'
# z1field speakers who are not in the shared tables (tools/build_z3.py PARTY_FACES / the enemies): 顔カード column 2
CARD_FACES = {'布爾瑪': 8, '天神': 10, '波波': 12}
# the androids as party members (set_battle_event and the battles of these pages: $partyc = [4,22] / [23]); the
# Z3_顔味方 row is the actor id − 3 as for everyone
ANDROIDS = {21: '18號', 22: '17號', 23: '16號'}
# the enemies' and the androids' moves (the database has Japanese names only): the words the earlier chapters use
MOVE_NAMES = {'エネルギー波': '能量波', '連続エネルギー波': '連續能量波', '複数エネルギー波': '多重能量波', '強力エネルギー波': '強力能量波',
              'かめはめ波': '龜派氣功', 'ビッグバンアタック': '大爆炸攻擊', '太陽拳': '太陽拳', 'ロケットパンチ': '火箭飛拳',
              'ヘルズフラッシュ': '地獄閃光'}
SUPER = {14, 18, 19, 20, 26, 32}  # the Super Saiyan actors (EXP: one member per character, src/supersaiyan.js)


# ---------- the scenes: z1field drawn from all.rb itself (picture / rect / add_chr / set_character_face) ----------
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


def arith(expr, names):
    """@ene1_x+32-64 … with the names given as numbers"""
    e = expr.replace(' ', '')
    for k, v in names.items():
        e = e.replace(k, str(v))
    if not re.fullmatch(r'[\d+\-*()]+', e):
        raise ValueError(expr)
    return eval(e.replace('++', '+'))  # (2131: "@ene1_x++128")


def scene_of(body, file):
    """one simple z1field scene → {bg, ene: [[pic, sx, sy, dx, dy]], play: [[pic, sx, sy, dx, line]], out}; a face from
    set_character_face is pic '@cf' (src/z4b.js picks the sheet by the clothes, as the original does)"""
    pic, rect, d = None, None, {'bg': None, 'ene': [], 'play': [], 'out': False}
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
        m = re.match(r'rect,picture = set_character_face (\d+),(\d+),1$', t)
        if m:
            pic, rect = '@cf', [64 * int(m.group(1)), 64 * int(m.group(2)), 64, 64]
            continue
        if re.match(r'(Audio\.se_play|shake_y =|shake_houkou =|xcount|if xcount|for x in 0\.\.60|if shake_houkou|else$|end$|Graphics\.update|clear_chr)', t):
            d['shake'] = True  # z1field 2164 / 2272: 61 frames of the one face below shaking ±4 every 4 (SE Z2 変身2)
            continue
        m = re.match(r'add_chr\((.+?),(.+?),picture,rect\)$', t)
        if m and '+shake_y' in m.group(2):
            continue
        if m and '-shake_y' in m.group(2):
            d['ene'].append([pic, rect[0], rect[1], arith(m.group(1), {'@ene1_x': 0}), arith(m.group(2).replace('-shake_y', ''), {'@ene1_y': 0}), 1])
            continue
        if m:
            x, y = m.group(1), m.group(2)
            if x.startswith('@z1_scrollscenex'):
                d['bg'] = pic
            elif x.startswith('@z1_scenex'):  # a 192-wide scene picture (the Z1 ones)
                d['bg'], d['narrow'] = pic, True
            elif '@play_y' in y:
                d['play'].append([pic, rect[0], rect[1], arith(x, {'@play_x': 0, '@ene1_x': 0}), 1 if arith(y, {'@play_y': 0}) >= 64 else 0])
            elif '@ene1_y' in y:
                d['ene'].append([pic, rect[0], rect[1], arith(x, {'@play_x': 0, '@ene1_x': 0}), arith(y, {'@ene1_y': 0})])
            else:
                raise ValueError(t)
            continue
        if t == 'character_output':
            d['out'] = True
            continue
        raise ValueError(t)
    return d


def scenes(root, file, lo, hi, skip):
    """the simple scenes lo..hi (the others — battles, films, loops — are drawn by src/z4b.js / z4c.js themselves)"""
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    out = {}
    for n, body in z1field_blocks(src).items():
        if lo <= n <= hi and n not in skip:
            out[str(n)] = scene_of(body, file)
    return out


# ---------- the androids (and the moves of these chapters) ----------
def add_actors(world, h, z3):
    actor, skill, D = h['actor'], h['skill'], h['D']
    for aid, name in ANDROIDS.items():
        jp = name.replace('號', '号')
        a = actor(aid, aid - 3, name, f'Z3_戦闘_{jp}.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', [])
        world['actors'].setdefault(aid, dict(a, special=P(f'Z3_戦闘_必殺技_{jp}.PNG')))
    sdb = D('skills')
    for sid in (35, 39, 40, 85, 125, 130, 133, 173, 178, 181, 191, 192, 193, 201, 202, 203, 211, 212, 213, 214, 215):
        if sid not in world['skills'] and str(sid) not in world['skills']:
            world['skills'][sid] = skill(sid)
    for sid in list(range(191, 194)) + list(range(201, 204)) + list(range(211, 216)) + list(range(434, 445)):
        k = sid if sid in world['skills'] else str(sid)
        jp = sdb[sid]['name'].split(')')[-1]
        if k in world['skills'] and jp in MOVE_NAMES:
            world['skills'][k]['name'] = MOVE_NAMES[jp]


# ---------- the pages ----------
def faces_of(z3):
    F3, CARD, P3 = z3['F3'], z3['CARD'], z3['P3']
    faces = dict(z3['faces'])
    faces.update({k: [CARD, r, 2] for k, r in CARD_FACES.items()})
    faces.update({'沙魯': [F3, 27], '特蘭克斯': [P3, 14]})  # (the pages write 特兰克斯: 特蘭克斯)
    return faces


def converter(h, z3):
    """EXTRA / OPTS for these pages (h['EXTRA'] is filled while they are converted, then cleared); their own nodes
    are named z4… (src/z4b.js has them all)"""
    script, D = h['script'], h['D']
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')
    import build_z3  # noqa: E402  (already loaded: it calls this file)

    def code355(p):  # the script lines (355 and their continuation lines 655)
        t = p[0].strip()
        if t.startswith('#') or not t:
            return []
        m = re.match(r'(on|off)_super_saiyazin (\d+)', t)
        if m:
            return [{'x': 'z4Ss', 'no': int(m.group(2)), 'on': m.group(1) == 'on'}]
        if re.match(r'\$partyc\s*=\s*\[', t):
            ids = [int(x) for x in re.findall(r'\d+', t)]
            return [{'partyc': ids}, {'x': 'z4Party', 'ids': ids}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        m = re.match(r'cha_tec_puls (\d+),0,3,(\d+)', t)
        if m:
            return [{'x': 'uses', 'map': {m.group(1): int(m.group(2))}}]
        m = re.match(r'\$game_variables\[(8[12])\]\s*=\s*([\d.]+)$', t)
        if m:  # 味方 / 敵の攻撃ダメージ n 倍 (src/z4b.js passes them to the battle)
            return [{'var': [int(m.group(1)), 0, float(m.group(2))]}]
        return []  # ($eve = Event_Main.new, dispose_main_window, the $chadead loop: nothing to do here)

    def ce(p):
        n = p[0]
        if n == 36:  # 悟空瞬間移動
            return [{'flash': 15}, {'se': 'Z1 高速移動'}]
        if n in (67, 68):  # セル変身 (CE45 with Cell's pictures)
            return [{'x': 'z4CellForm', 'form': n - 66}]  # (1: セル変身1 → 2, 2: 2 → 3)
        if n == 61:  # トランクス技切り替え (by variable 173 / switch 438)
            return script(build_z3.resolve_jumps(cdb[61]['list']))
        return []  # (CE40: the training makes its own cards)

    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        251: lambda p: [{'x': 'z4SeStop'}],
        315: lambda p: [] if p[0] in SUPER else [{'x': 'exp', 'id': p[0], 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    faces = faces_of(z3)
    raw4 = z3['raw4']

    def page(v):
        return [{'v41': v}] + cell_faces(z3['nodes_of'](raw4[v], faces), v)

    def done():
        EXTRA.clear()
        OPTS.update(bgm=False, shakeSw=False)
    return page, done, faces


def cell_faces(nodes, v):
    """Cell's face in the message box by his form at that point of the story: the first until he absorbs No. 17
    (scene 2167), the second until No. 18 (2275), then the perfect one (Z3_顔敵 rows 27 / 28 / 29)"""
    state = {'v': v}

    def form():
        return '沙魯' if state['v'] < 2167 else '沙魯(第２形態)' if state['v'] < 2275 else '沙魯(完全體)'

    def walk(ns):
        out = []
        for n in ns:
            if n.get('var') and n['var'][0] == 41:
                state['v'] = n['var'][2] if n['var'][1] == 0 else state['v'] + (n['var'][2] if n['var'][1] == 1 else -n['var'][2])
            if 'say' in n and n['say'][0] == '沙魯':
                n = {'say': ['沙魯', n['say'][1], 'z3:' + form()]}
            for k in ('then', 'else', 'loop'):
                if k in n:
                    n = dict(n, **{k: walk(n[k])})
            if 'branches' in n:
                n = dict(n, branches=[walk(b) for b in n['branches']])
            out.append(n)
        return out
    return walk(nodes)


def assets(world, pages, pics):
    """the scenes' pictures, the pages' music and sounds"""
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
            if isinstance(n, list):
                walk(n)
                continue
            if 'se' in n:
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
            for k in ('then', 'else', 'loop'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    for p in pages.values():
        walk(p)
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm)
    world['fieldSe'] = sorted(set(world['fieldSe']) | se | {'Z1 敵発見', 'Z3 変身', 'Z1 飛ぶ'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)  # (the BGS: tools/copy_assets.py finds them)


def scene_pics(sc):
    return {it[0] for d in sc.values() for it in d['ene'] + d['play'] if it[0] != '@cf'} | {d['bg'] for d in sc.values() if d['bg']}


def add(world, h, z3):
    build_map, root = h['build_map'], h['root']
    file = z3['file']

    # ---------- map 43 ----------
    world['maps'][MAP] = build_map(43, rows=59)  # (row 59: the original's control events)
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    # (the card square (77,37) of Event_Check is outside this 65-wide map: copied from map 42, never reached)
    world['pois'][MAP] = at([(4, 8), (51, 36), (14, 42)], SHOP) + at([(62, 11), (10, 5), (8, 46)], INN) \
        + at([(6, 11), (4, 39), (21, 25), (48, 36)], TRAIN)
    # map 43 events 7 (Piccolo, chara2 character 1) at (8,40) and 6 (Cell, enemy1.png character 7) at (8,41): either
    # square → 2121 (switch 435 off) / 2151 (on)
    world['bosses'][MAP] = [
        {'x': 8, 'y': 41, 'index': 7, 'flag': 'z4bDone', 'key': 'cell'},
        {'x': 8, 'y': 40, 'index': 1, 'sheet': 'Graphics/Characters/chara2.png', 'flag': 'z4bDone', 'key': 'cell'},
    ]
    # 140_Field_Main.rb `when 43,88`: 1-3 of these (one while No. 16 is alone)
    world['areas'][MAP] = {'pool': [137, 174, 175, 176, 189, 193, 207, 212], 'n': [1, 3], 'alone': [1, 1]}

    add_actors(world, h, z3)

    # ---------- the pages ----------
    page, done, faces = converter(h, z3)
    pages = {str(v): page(v) for v in (2091, 2093, 2131, 2136, 2156, 2161)}
    pages['2121'] = z3['split_battle'](page(2121))
    pages['2151'] = z3['split_battle'](page(2151))
    pages['2181'] = z3['split_battle'](page(2181))
    done()
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    world['z3']['pages'].update({'z4b' + k: v for k, v in pages.items()})

    # ---------- the scenes, the battle films ----------
    films = {2092: 3, 2132: 4, 2157: 5, 2172: 6}
    sc = scenes(root, file, 2091, 2188, {2123, 2153, 2188} | set(films))
    world['z3']['titles']['z4b'] = 'Z4　第二章　悄悄接近的賽魯'
    world['z3']['z4b'] = {
        'scenes': sc,
        'field': {'map': MAP, 'x': 59, 'y': 5},  # page 8: party [8,9,7]
        'field16': {'map': MAP, 'x': 8, 'y': 36},  # page 11: No. 16 alone
        'backdrop': 'bg/z3_battle_1.png',  # $Battle_MapID = 1 (the battles and the films)
        # the sheets src/z4b.js draws with: set_character_face's clothes, CE45 with Cell's pictures (CE67 / CE68)
        'sheets': {'p3': z3['P3'], 'clothes': file('Z3_顔味方_衣替え'), 'long': file('Z3_顔味方_トランクス長髪'), 'zg': file('ZG_顔味方'),
                   'back': file('Z3_スーパーサイヤ人_バック'), 'auras': [file(f'Z3_スーパーサイヤ人フルパワー_ブロリー_気{k}') for k in (1, 2, 3)],
                   'cells': [file(f'Z3_セル変身{k}') for k in (1, 2, 3)]},
        # set_battle_event (all.rb 52555): who ($partyc) against whom, the actions in $attack_order (p: the party's;
        # skill: $cha_set_action − 10, null = a plain attack; hit: @event_(cha_)atc_hit)
        'films': {
            '2092': {'party': 4, 'foe': 125, 'acts': [[0, None, 0], [1, None, 0], [0, None, 0], [1, None, 0],
                                                       [0, None, 0], [1, 35, 1], [0, None, 0], [1, 40, 0]]},
            '2132': {'party': 4, 'foe': 127, 'acts': [[1, 39, 1]]},
            '2157': {'party': 23, 'foe': 127, 'acts': [[1, None, 1], [0, None, 0], [1, 214, 0], [1, 215, 0]]},
            '2172': {'party': 8, 'foe': 128, 'acts': [[1, 85, 1]]},
        },
    }
    pics = scene_pics(sc) | {z3['P3'], z3['E3'], z3['F3'], z3['CARD'], file('Z3_顔味方_衣替え'), file('Z3_顔味方_トランクス長髪'), file('ZG_顔味方'),
                             file('Z3_スーパーサイヤ人_バック'), 'Graphics/Characters/chara2.png', 'Graphics/Characters/chara_fly4.png'} \
        | {file(f'Z3_セル変身{k}') for k in (1, 2, 3)} | {file(f'Z3_スーパーサイヤ人フルパワー_ブロリー_気{k}') for k in (1, 2, 3)}
    assert None not in pics
    assets(world, pages, pics)
