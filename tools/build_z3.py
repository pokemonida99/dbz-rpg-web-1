"""Z3 (人造人間編 and what comes before it) — the shared part, added by tools/build_data.py (world['z3'], read by
src/z3.js and the chapter files src/z3a.js … src/z3e.js). docs/z3-plan.md has the whole story order.

The Z3 story is Map007 event 5 「イベント実行Z3」, one page per value of variable 41 (as in Z2); the spots are
145_Event_Check.rb (maps 33-40, 78-82), the scenes 143_Event_Main.rb z1field 1100-1591, the battles battle_process.
The order of play is not the order of the numbers: 1100 → 1160-1220 (map 33 / 34) → Porunga (map 35) → 1440-1571
(魔凶星編, maps 78-82) → 1230-1266 (map 36) → 1266-1326 (maps 37-39) → 1326-1420 (map 40) → variable 41 = 2001 (Z4).

This file builds what every chapter needs:
  - the Z3 art (src/era.js, variable 40 = 2): Z1_/Z2_ sheets → their Z3_ versions, the Z3 card icons
  - the Z3 enemies (101-140, 177-188) with their Z3 battle sheets, faces (Z3_顔敵 row = id - 100), skills, drops
  - world.z3.battles: every Z3 battle of battle_process (enemies, music by name)
  - world.z3.pages: every page of event 5 as story nodes (speakers get 'z3:' faces)
  - Z3 battle backgrounds (Z3_戦闘_背景 strips, assets/bg/z3_battle_<row>.png)
  - helpers for the chapter builders (tools/build_z3a.py … build_z3e.py: `add(world, h, z3)`), which add their maps,
    spots, scenes' assets and anything else of their own.
"""
import os
import re
import unicodedata
from PIL import Image

P = lambda n: f'Graphics/Pictures/{n}.PNG'
P3, E3, F3, CARD = P('Z3_顔味方'), P('Z3_顔イベント'), P('Z3_顔敵'), P('顔カード')

# Z3 battles (battle_process, all.rb 182900-183000): the story step that runs it → the enemies (the time-room numbers
# 95xx are the same battles again and belong to 時の間)
BATTLES = {
    1107: [101], 1197: [131, 108, 110], 1216: [105, 108, 109],
    1472: [183, 177, 183], 1492: [184, 179, 184], 1512: [184, 180, 184], 1532: [185, 178, 185],
    1556: [186, 181, 187, 188], 1565: [177, 178, 182, 179, 180],
    1237: [102], 1271: [108, 105, 109], 1273: [132, 105, 110],
    1283: [108, 105, 110], 1286: [105, 110, 108], 1289: [110, 108, 105], 1296: [133, 108, 105, 112, 115, 118],
    1318: [116, 119, 113], 1322: [120], 1325: [121],
    1342: [123, 122], 1363: [125, 124], 1372: [126], 1390: [127],
    # Z4 (セル編, Map007 event 7: docs/z4-plan.md)
    2015: [208, 209, 210, 211], 2123: [127], 2153: [127], 2188: [128], 2256: [128],
    2726: [136], 2736: [136, 136, 136], 2765: [213, 213], 2782: [213, 214, 213],
    2832: [235, 141, 236], 2842: [234, 140, 234], 2852: [237, 138, 237], 2871: [139],
    2463: [129], 2464: [130, 130, 130, 130, 129, 130, 130, 130, 130], 2481: [129],
    2561: [130, 130, 130, 130, 135, 130, 130, 130, 130],
}
# the Z3 and Z4 enemies (the story battles above and the field encounters of 140_Field_Main.rb for maps 33-48, 78-93)
Z3_ENEMIES = sorted(set(range(101, 141)) | set(range(177, 189)) | {148, 174, 175, 176, 189, 193, 207, 212}
                    | set(range(197, 207)) | set(range(208, 215)) | set(range(234, 238)) | {135})

# who speaks with which face (the remake's dialogue box): Z3_顔味方 row = actor id - 3; the chapters add the others
# (Z3_顔イベント / 顔カード column 2 = Z3) to world.z3.faces in their own builders
PARTY_FACES = {'悟空': 3, '比克': 4, '悟飯': 5, '克林': 6, '雅木茶': 7, '天津飯': 8, '餃子': 9, '琪琪': 10, '貝吉塔': 12,
               '特南克斯': 17, '龜仙人': 24, '巴達克': 16}
NARRATION = ('獲得了', '悟飯找到了')


def resolve_jumps(lst):
    """Inlines label jumps (119 to a 118 label other than 終了), as tools/build_z2a.py does."""
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


def bgm_names(src):
    """battle_process set_bgm numbers ($bgm_no_* constants or plain numbers) → BGM file names, from
    set_battle_bgm_name (all.rb 10547: `when N` … `set_battle_bgm_name_modetype "name",mode`)."""
    consts = {m.group(1): int(m.group(2)) for m in re.finditer(r'^\s*\$(bgm_no_\w+)\s*=\s*(\d+)', src, re.M)}
    start = src.index('def set_battle_bgm_name(')
    body = src[start:src.index('\n  def ', start + 10)]
    names, cur = {}, []
    for line in body.split('\n'):
        m = re.match(r'\s*when\s+(.+?)\s*(#.*)?$', line)
        if m:
            cur = []
            for part in m.group(1).split(','):
                part = part.strip()
                if part.startswith('$') and part[1:] in consts:
                    cur.append(consts[part[1:]])
                elif part.isdigit():
                    cur.append(int(part))
            continue
        m = re.search(r'set_battle_bgm_name_modetype "([^"]+)"', line)
        if m and cur:
            for n in cur:
                names.setdefault(n, m.group(1))
            cur = []
    return consts, names


def add(world, h):
    build_map, enemy, skill, actor, s2t, script, D, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D', 'root'))
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    have = {unicodedata.normalize('NFC', n) for n in os.listdir(pics)}  # (macOS: NFD names)

    def file(name):  # a picture's path with the extension it has on disk (None: not there)
        return next((f'Graphics/Pictures/{name}{e}' for e in ('.PNG', '.png') if name + e in have), None)

    # ---------- the era switch (src/era.js): variable 40 = 2 draws the Z3_ sheets ----------
    alias = {}
    era1 = world['era'].get('1', {})
    for src_path in [a['sprite'] for a in world['actors'].values()] + [a['special'] for a in world['actors'].values()] \
            + ['Graphics/Pictures/Z1_顔味方.PNG'] + list(era1.keys()):
        if not src_path.startswith('Graphics/Pictures/'):
            continue
        base = os.path.splitext(src_path.split('/')[-1])[0]
        z3 = file(re.sub(r'^Z[12]_', 'Z3_', base))
        if z3:
            alias[src_path] = z3
            if src_path in era1:  # the Z2 path too (a sheet a Z2 scene set directly)
                alias[era1[src_path]] = z3
    for k, v in era1.items():  # what has no Z3 version keeps the Z2 one
        alias.setdefault(k, v)
    alias['ui/item_cards.png'] = 'ui/item_cards_z3.png'
    world['era']['2'] = alias
    # the card icons of Z3 (005_Icon.rb put_icon: column $game_variables[40] = 2 of 顔カード.PNG)
    icons1 = Image.open(os.path.join(root, 'assets', 'ui', 'item_cards.png'))
    sheet = Image.open(os.path.join(pics, '顔カード.PNG')).convert('RGBA')
    icon_row = h['build_items'].ICON_ROW
    z3img = Image.new('RGBA', icons1.size)
    for i, it in world['items'].items():
        k, r = it['icon'], icon_row.get(int(i), int(i) - 1)
        cell = sheet.crop((128, 64 * r, 192, 64 * r + 64))
        if cell.getbbox() is None:  # no Z3 picture: the Z2 one, then the Z1 one
            cell = sheet.crop((64, 64 * r, 128, 64 * r + 64))
            if cell.getbbox() is None:
                cell = icons1.crop((64 * (k % 10), 64 * (k // 10), 64 * (k % 10) + 64, 64 * (k // 10) + 64))
        z3img.paste(cell, (64 * (k % 10), 64 * (k // 10)))
    z3img.save(os.path.join(root, 'assets', 'ui', 'item_cards_z3.png'), optimize=True)

    # ---------- enemies ----------
    enemies_db = D('enemies')
    skills = set()
    for eid in Z3_ENEMIES:
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        e['face'] = [F3, eid - 100]  # Z3_顔敵: one row per enemy from 100
        world['enemies'][eid] = e
        skills |= {a['skill_id'] for a in enemies_db[eid]['actions']}
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
    for sid in sorted(skills):
        if sid and str(sid) not in world['skills'] and sid not in world['skills']:
            world['skills'][sid] = skill(sid)

    # ---------- battles ----------
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    consts, names = bgm_names(src)
    bp = src[src.index('def battle_process event_no'):]
    bp = bp[:bp.index('\n  def ', 10)]
    battles = {}
    for no, foes in BATTLES.items():
        body = None
        for m in re.finditer(r'\n\s*when ([^\n#]+)[^\n]*\n(.*?)(?=\n\s{4}when |\n\s{4}end)', bp, re.S):
            nums = set()
            for part in m.group(1).split(','):
                part = part.strip()
                if '..' in part:
                    a, b = part.split('..')
                    if a.strip().isdigit() and b.strip().isdigit():
                        nums |= set(range(int(a), int(b) + 1))
                elif part.isdigit():
                    nums.add(int(part))
            if no in nums:
                body = m.group(2)
                break
        b = {'foes': foes}
        if body:
            got = [int(x) for x in re.findall(r'\d+', (re.search(r'\$battleenemy = \[([^\]]*)\]', body) or [None, ''])[1])]
            assert got == foes, (no, got, foes)
            m = re.search(r'set_bgm = (\$?\w+)', body)
            if m:
                v = m.group(1)
                n = consts.get(v[1:]) if v.startswith('$') else int(v)
                if n in names:
                    b['bgm'] = names[n]
            m = re.search(r'set_ready_bgm = (\$?\w+)', body)
            if m and m.group(1)[1:] in consts and consts[m.group(1)[1:]] in names:
                b['ready'] = names[consts[m.group(1)[1:]]]  # the music before the battle (variable 319 = 0)
        battles[str(no)] = b

    # ---------- battle backgrounds: Z3_戦闘_背景 strips (set_battle_map; the chapters pick the rows per tile) ----------
    strips = Image.open(os.path.join(pics, 'Z3_戦闘_背景.PNG')).convert('RGB')
    rows = strips.size[1] // 100
    os.makedirs(os.path.join(root, 'assets', 'bg'), exist_ok=True)
    for row in range(rows):
        strip = strips.crop((120, 100 * row, 520, 100 * row + 100))
        if strip.getbbox() is None:
            continue
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strip, (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'z3_battle_{row}.png'), optimize=True)

    # ---------- the story pages (event 5) ----------
    faces = {k: [P3, v - 3] for k, v in PARTY_FACES.items()}
    for eid in Z3_ENEMIES:
        faces.setdefault(s2t(enemies_db[eid]['name']), [F3, eid - 100])

    def loops(lst):
        """112 loop … 413 repeat-above → one command 9112 holding its body (one indent less), 113 break → 9113:
        script() reads a block by the caller's indent, so a choice inside a loop would swallow its other branches.
        tools/build_data.py EXTRA turns them into {loop: nodes} / {brk: true} (src/cutscene.js runs them)."""
        out, k = [], 0
        while k < len(lst):
            c = lst[k]
            if c['code'] == 112:
                ind, body, k = c['indent'], [], k + 1
                while k < len(lst) and not (lst[k]['code'] == 413 and lst[k]['indent'] == ind):
                    body.append(dict(lst[k], indent=lst[k]['indent'] - ind - 1))
                    k += 1
                out.append({'code': 9112, 'indent': ind, 'parameters': [loops(body)]})
            elif c['code'] == 113:
                out.append(dict(c, code=9113))
            else:
                out.append(c)
            k += 1
        return out

    def nodes_of(lst, faces=faces):
        """script() plus BGM changes ({bgm}) and loops ({loop}); speakers with a Z3 face get say[2] = 'z3:name'."""
        lst = loops(resolve_jumps(lst))
        h['EXTRA'][9112] = lambda p: [{'loop': script(p[0])}]
        h['EXTRA'][9113] = lambda p: [{'brk': True}]
        lst = [dict(c, code=250, parameters=[{'name': '\0BGM' + c['parameters'][0]['name']}]) if c['code'] == 241 else c for c in lst]
        ns = script(lst)

        def fix(ns):
            out = []
            for n in ns:
                if isinstance(n.get('se'), str) and n['se'].startswith('\0BGM'):
                    n = {'bgm': n['se'][4:]}
                if n.get('var') and n['var'][0] == 25:  # CAP is variable 25 in the original, state.zeni here
                    n = {'x': 'cap', 'op': n['var'][1], 'n': n['var'][2]}
                if 'say' in n:
                    who, text = n['say'][0], n['say'][1]
                    if who in NARRATION:
                        n = {'say': ['', f'{who}「{text}」']}
                    elif who in faces or who == '？':
                        n = {'say': [who, text, 'z3:' + who]}
                for k in ('then', 'else', 'loop'):
                    if k in n:
                        n[k] = fix(n[k])
                if 'branches' in n:
                    n['branches'] = [fix(b) for b in n['branches']]
                out.append(n)
            return out
        return fix(ns)

    raw = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['5']['pages'] if p['condition']['variable_valid']}

    def page(v):
        return [{'v41': v}] + nodes_of(raw[v])

    # Z4 (Map007 event 7 「Z4_セル編」): the same tools for its pages
    raw4 = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['7']['pages'] if p['condition']['variable_valid']}

    def page4(v):
        return [{'v41': v}] + nodes_of(raw4[v])

    def split_battle(ns):
        """a page whose last top-level z1field is a battle_process: [before it, after it]"""
        k = max(i for i, n in enumerate(ns) if n.get('z1field'))
        return [ns[:k], ns[k + 1:]]

    # the map events' graphics by tile (get_event_id_and_graphic: the highest event id there, its first page), for the
    # Z3 battle backgrounds of set_battle_map (src/z3.js z3Backdrop)
    tile_events = {}
    for mid in (33, 34, 36, 37, 38, 39, 40, 78, 79, 80, 81, 82, 42, 43, 44, 46, 48, 84, 90, 93):
        ev = D('map%03d' % mid)['events']
        best = {}
        for k, e in ev.items():
            g = e['pages'][0]['graphic']
            if int(k) == 2 or not g.get('character_name'):
                continue
            key = f"{e['x']},{e['y']}"
            if key not in best or int(k) > best[key][0]:
                best[key] = (int(k), [g['character_name'], g['character_index'], g['direction']])
        tile_events[str(mid)] = {k: v[1] for k, v in best.items()}

    world['z3'] = {
        'tileEvents': tile_events,
        'battles': battles,
        'pages': {},  # the chapters put the pages they play here (page(v) / split_battle(page(v)))
        'faces': {},  # 'z3:' faces are in world.faces; this is for the chapters' own tables
        'backdrops': {},  # map → {tile id: Z3_戦闘_背景 row, 'default': row} (the chapters)
        'goals': {},  # map → {variable 43: goal text} or text (the chapters)
        'titles': {},  # chapter key → its title card
        'chapters': ['z3a', 'z3b', 'z3c', 'z3d', 'z3e'],
    }
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    world['extraBgm'] = sorted(set(world['extraBgm']) | {b[k] for b in battles.values() for k in ('bgm', 'ready') if k in b}
                               | {'Z3 戦闘1', 'Z3 イベント1', 'Z3 イベント2', 'Z3 イベント3', 'Z3 イベント4', 'Z3 修行', 'Z3 神龍'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {v for v in alias.values() if v.startswith('Graphics/')} | {P3, E3, F3, CARD})

    z3 = {'page': page, 'split_battle': split_battle, 'nodes_of': nodes_of, 'raw': raw, 'file': file, 'faces': faces,
          'P3': P3, 'E3': E3, 'F3': F3, 'CARD': CARD, 'page4': page4, 'raw4': raw4}
    # ---------- the chapters (each in its own file: one branch each) ----------
    import build_z3a  # noqa: E402  (Z3 第一章 集龍珠！: maps 33, 34, 35)
    build_z3a.add(world, h, z3)
    import build_z3b  # noqa: E402  (Z3 第二章 魔凶星篇: maps 78-82)
    build_z3b.add(world, h, z3)
    import build_z3c  # noqa: E402  (Z3 第三章 弗利薩復仇・特南克斯: map 36)
    build_z3c.add(world, h, z3)
    import build_z3d  # noqa: E402  (Z3 第四章 古拉來襲: maps 37, 38, 39)
    build_z3d.add(world, h, z3)
    import build_z3e  # noqa: E402  (Z3 第五章 人造人間: map 40)
    build_z3e.add(world, h, z3)
    import build_z3train  # noqa: E402  (Z3 的修行小遊戲: 流派一致修行・Z3 重力修行)
    build_z3train.add(world, h, z3)
    # ---------- Z4 (セル編): the same shared part (world.z3), its chapters in their own files (docs/z4-plan.md) ----------
    world['z3']['chapters'] += ['z4a', 'z4b', 'z4c', 'z4d', 'z4e', 'z4f']
    import build_z4a  # noqa: E402  (Z4 第一章 賽魯誕生的秘密: maps 42, 44, 45)
    build_z4a.add(world, h, z3)
    import build_z4b  # noqa: E402  (Z4 第二章 悄悄接近的賽魯: map 43)
    build_z4b.add(world, h, z3)
    import build_z4c  # noqa: E402  (Z4 第三章 新生貝吉塔父子出擊: maps 46, 44)
    build_z4c.add(world, h, z3)
    import build_z4d  # noqa: E402  (Z4 第四章 金屬古拉: maps 84, 90)
    build_z4d.add(world, h, z3)
    import build_z4e  # noqa: E402  (Z4 第五章 人造人間 13 號: maps 44, 93)
    build_z4e.add(world, h, z3)
    import build_z4f  # noqa: E402  (Z4 第六章 賽魯遊戲: maps 48, 49)
    build_z4f.add(world, h, z3)
    # ---------- 時之間 (phase 1: the hall, the era halls, 隊伍變更, 説明, 戦闘練習: src/timeroom.js) ----------
    import build_timeroom  # noqa: E402
    build_timeroom.add(world, h, z3)

    # every sound and song the story pages play (a chapter's own lists may miss some): copied if the original has it
    def walk(x, se, bgm):
        if isinstance(x, dict):
            if isinstance(x.get('se'), str):
                se.add(x['se'])
            if isinstance(x.get('bgm'), str) and x['bgm']:
                bgm.add(x['bgm'])
            if x.get('x') == 'bgm' and x.get('name'):
                bgm.add(x['name'])
            for v in x.values():
                walk(v, se, bgm)
        elif isinstance(x, list):
            for v in x:
                walk(v, se, bgm)
    se, bgm = set(), set()
    walk(world['z3']['pages'], se, bgm)
    audio = os.path.join(root, 'game', 'Audio')
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))})
