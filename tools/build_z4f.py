"""Z4 第六章 賽魯遊戲（地圖 48・49） — world.json data, added by tools/build_z3.py (read by src/z4f.js). docs/z4f.md has the
whole chapter with the original's sources.

The original: Map007 event 7 「Z4_セル編」 page 72 (variable 41 = 2991) and pages 28-40 (2431-2621), the scenes
143_Event_Main.rb z1field 2431-2693 (all.rb 176917-177900), the spots of map 48 (145_Event_Check.rb `when 48`), its
encounters (140_Field_Main.rb `when 48,95`), map 49 「Z4_セルとかめはめ波打ち合い」 (event 1 the film, event 2 the parallel
process that moves its pictures; CE80-90 / CE100) and battle_process 2463 / 2464 / 2481 / 2561:
  2991 (page 72) the 17th day: Goku's house, the temple, the rocks, No. 16 → map 48 (75,63)
  map 48 (44,35) the ring: 2441 Mr. Satan (page 29) → his Dynamite Kick (set_battle_event 9) → 2451 → (44,36);
       again → 2461 (page 31): Goku alone → battle 2463 (10 turns) → 2471 Gohan → battle 2481 (7 turns, enemy damage
       × 0.5) → 2491 No. 16 (set_battle_event 10) → 2511 No. 16 destroyed, Gohan's awakening (set_battle_event 11)
       → 2541 Cell spits out No. 18, self-destructs, Goku, the perfect Cell → battle 2561 → 2571 → map 49 the
       kamehameha duel → 2591 heaven, Shenron, Capsule Corporation → 2602 the end (2691 staff roll, 2693 Roshi)
       (cleared once, switch 458: 2461 offers everyone against Cell → battle 2464 → 2621, the other end)
"""
import os
import re

MAP = '48'
P = lambda n: f'Graphics/Pictures/{n}'
# the pages of event 7 this chapter plays (2991 first: the fifth chapter ends with variable 41 = 2991)
PAGES = (2991, 2441, 2451, 2461, 2471, 2491, 2511, 2541, 2571, 2591, 2602, 2621)
# speakers of these pages who are not in the shared party / enemy tables: 顔カード column 2 = Z3, the Z3 sheets
CARD_FACES = {'牛魔王': 35, '丹迪': 14, '布爾瑪': 8, '波波': 12, '界王': 25, '神龍': 16, '占卜婆婆': 18}
# the enemies' moves in these battles (the database has Japanese names only): the words the earlier chapters use
FOE_MOVES = {'エネルギー波': '能量波', '連続エネルギー波': '連續能量波', 'かめはめ波': '龜派氣功', '爆発波': '爆發波',
             '太陽拳': '太陽拳', '超カメハメは': '超級龜派氣功', '魔貫光殺砲': '魔貫光殺砲'}
# CE57 / CE58: the Super Saiyan (2) Gohan transformation (CE45 with these pictures, the body at x 88)
TRANSFORM = {57: 'gohan1', 58: 'gohan2'}


def merge(lst):
    """355 + its 655 continuation lines → one 355 holding the whole script (the chapter reads scripts as a whole)."""
    out = []
    for c in lst:
        if c['code'] == 655 and out and out[-1]['code'] == 355:
            out[-1] = dict(out[-1], parameters=[out[-1]['parameters'][0] + '\n' + c['parameters'][0]])
        else:
            out.append(c)
    return out


def unwrap(lst):
    """111 [12, '$super_saiyazin_flag[5] != true'] (page 2602, right after off_super_saiyazin_all: always so) → its
    then-branch; script() has no script conditions."""
    out, k = [], 0
    while k < len(lst):
        c = lst[k]
        if c['code'] == 111 and c['parameters'][0] == 12 and 'super_saiyazin_flag[5] != true' in c['parameters'][1]:
            ind, k = c['indent'], k + 1
            while k < len(lst) and not (lst[k]['code'] == 412 and lst[k]['indent'] == ind):
                if lst[k]['code'] != 0 or lst[k]['indent'] > ind:
                    out.append(dict(lst[k], indent=lst[k]['indent'] - 1))
                k += 1
        else:
            out.append(c)
        k += 1
    return out


def script_nodes(t):
    """a page's script (355 with its 655 lines) → story nodes (src/z4f.js), statement by statement"""
    if t.startswith('$eve.z1field'):
        return None  # (build_data.py: the scene)
    lines = [x.strip() for x in t.split('\n')]
    if any(x.startswith('$tmp_partyc = ') for x in lines) or '$partyc = [31]' in t or '$partyc = Marshal.load(Marshal.dump($tmp_partyc))' in t:
        return []  # page 29 / 30: Mr. Satan alone for his kick (the film shows him), the party back after it
    if any(x.startswith('$tmp_partyc2') for x in lines):
        return [{'x': 'z4fKeep'}]  # the party before Goku fights alone; back at the end (page 2602)
    out = []
    goku_alone = 'super_saiyazin_flag[1] == false' in t  # 悟空が超サイヤ人なら超サイヤ人状態で戦闘へ: [3] or [14]
    ids, chano = None, None
    for x in lines:
        x = x.split('#')[0].strip() if not x.startswith('#') else ''
        if not x:
            continue
        m = re.match(r'\$partyc\s*=\s*\[([\d,\s]*)\]', x)
        if m:
            got = [int(v) for v in re.findall(r'\d+', m.group(1))]
            ids = ids if (goku_alone and ids) else got
            continue
        m = re.match(r'chano\s*=\s*(\d+)', x)
        if m:
            chano = int(m.group(1))
        m = re.match(r'\$partyc\.delete\((\w+)\)', x)
        if m:
            out.append({'x': 'z4fLeave', 'id': chano if m.group(1) == 'chano' else int(m.group(1))})
        m = re.match(r'(on|off)_super_saiyazin\(?\s*(\d+)\)?$', x)
        if m:
            out.append({'x': 'z4fSs', 'no': int(m.group(2)), 'on': m.group(1) == 'on'})
        if x == 'off_super_saiyazin_all':
            out.append({'x': 'z4fSsAll'})
        if x == 'all_charecter_recovery':
            out.append({'x': 'recover'})
        if x.startswith('$partyc.unshift('):
            out.append({'x': 'z4fFront', 'id': int(re.findall(r'\d+', x)[0])})
        if x == 'add_cha_last_cellbtl':
            out.append({'x': 'z4fFill'})
        if x.replace(' ', '') == '$game_variables[82]=0.5':  # 敵の攻撃ダメージx倍 (src/z4f.js passes it to the battle)
            out.append({'var': [82, 0, 0.5]})
        if '$tmp_partyc2' in x and x.startswith('$partyc'):
            out.append({'x': 'z4fBack'})
    if ids is not None:
        rec = [n for n in out if n.get('x') == 'recover']
        out = [n for n in out if n.get('x') != 'recover']
        out = out + [{'x': 'z4fParty', 'ids': list(dict.fromkeys(ids))}] + rec[:1]
    return out


def add(world, h, z3):
    build_map, enemy, skill, actor, s2t, script, D, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D', 'root'))
    # (a picture in a folder: zed/ of the staff roll)
    file = lambda n: (P(n + '.PNG') if os.path.exists(os.path.join(root, 'game', P(n + '.PNG'))) else None) if '/' in n else z3['file'](n)
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']

    # ---------- map 48 ----------
    world['maps'][MAP] = build_map(48, rows=84)  # the last row holds the original's control events only
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois'][MAP] = [
        {'x': 38, 'y': 29, 'label': '卡片商店', 'chapter': 'z4f', 'kind': 'card40'},  # カード特殊: variable 44 = 40
    ] + at([(10, 13), (8, 65), (79, 32)], SHOP) + at([(6, 42), (80, 9), (72, 66)], INN) \
      + at([(14, 50), (30, 10), (60, 11), (55, 66)], TRAIN)
    # (the 時の間 squares (17,10), (21,55), (65,12), (69,63) and (44,28) after the clear wait for the 時之間)
    # the ring (44,35): map 48 event 6 「セル」 (enemy1.png character 7) — Mr. Satan first (switch 457), then Cell
    world['bosses'][MAP] = [{'x': 44, 'y': 35, 'index': 7, 'flag': 'z4fRing', 'key': 'ring'}]
    # 140_Field_Main.rb `when 48,95`: 3-6 of 197, 199, 201, 203, 205
    world['areas'][MAP] = {'pool': [197, 199, 201, 203, 205], 'n': [3, 6]}

    # ---------- the actors who join in Z4 (the earlier chapters bring them; here only if they have not) ----------
    def one(aid, face, name, sprite, special, skills, **more):
        if aid in world['actors'] or str(aid) in world['actors']:
            return
        a = actor(aid, face, name, sprite, 'Z1_戦闘_必殺技_エネルギー波.PNG', skills)
        a['special'] = P(special)
        a.update(more)
        world['actors'][aid] = a
    # CE9 必殺技設定 / pages 2121, 2136, 2701: what each knows
    one(18, 15, '悟飯', 'ZG_戦闘_ゴハン(超).PNG', 'ZG_戦闘_必殺技_ゴハン(超).PNG', [46, 47, 48, 53, 52], ss=5, ray='green')
    one(21, 18, '18號', 'Z3_戦闘_18号.PNG', 'Z3_戦闘_必殺技_18号.PNG', [191, 192, 193])
    one(23, 20, '16號', 'Z3_戦闘_16号.PNG', 'Z3_戦闘_必殺技_16号.PNG', [211, 212, 213, 214, 215])
    for sid in (46, 47, 48, 52, 53, 54, 59, 191, 192, 193, 211, 212, 213, 214, 215):
        if sid not in world['skills'] and str(sid) not in world['skills']:
            world['skills'][sid] = skill(sid)
    world['skills'][59]['ss'] = True  # スーパーサイヤ人変身 (as 29)
    # Cell's and Cell Jr.'s moves
    enemies_db, sdb = D('enemies'), D('skills')
    for eid in (129, 130, 135):
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            jp = sdb[sid]['name'].split(')')[-1]
            if sid in world['skills'] and jp in FOE_MOVES:
                world['skills'][sid]['name'] = FOE_MOVES[jp]

    # ---------- the story pages ----------
    faces = dict(z3['faces'])
    faces.update({k: [CARD, r, 2] for k, r in CARD_FACES.items()})
    # (page 2591 writes 主持有 once: a typo of the original, kept; the announcer's face)
    faces.update({'沙魯': [F3, 29], '撒旦': [P3, 28], '主持人': [E3, 10], '主持有': [E3, 10], '16號': [P3, 20], '18號': [P3, 18],
                  '孫悟空': [P3, 0], '特蘭克斯': [P3, 14], '小沙魯': [F3, 30], '琪琪': [P3, 7]})
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})

    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')

    def code355(p):
        got = script_nodes(p[0])
        return got if got is not None else []

    def ce(p):
        n = p[0]
        if n == 36:  # 悟空瞬間移動: the flash and the sound
            return script(cdb[36]['list'])
        if n in TRANSFORM:
            return [{'x': 'z4fTransform', 'who': TRANSFORM[n]}]
        if n == 159:  # 超サイヤ人全解除
            return [{'x': 'z4fSs', 'no': k, 'on': False} for k in (5, 1, 2, 3, 4, 6, 7)]
        if n == 166:  # 現在パーティーをtempへ格納 (the party and who is a Super Saiyan)
            return [{'x': 'z4fStore'}]
        if n == 167:  # tempからパーティーを戻す
            return [{'x': 'z4fRestore'}]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        return []  # CE61 (Trunks' moves by his clothes), CE80 (map 49's variables), CE173 / 174 (倍速), CE185 / 186

    EXTRA.update({
        355: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        249: lambda p: [{'x': 'z4fMe', 'name': p[0]['name']}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    raw4 = z3['raw4']

    def page(v):
        return [{'v41': v}] + z3['nodes_of'](unwrap(merge(raw4[v])), faces)

    pages = {str(v): page(v) for v in PAGES}

    # page 31 (2461): after the clear (switch 458) Cell asks whether everyone fights; the question goes in a part of
    # its own (src/z4f.js plays it in a fresh window, so a skipped page does not answer it)
    # map 49: event 1, the kamehameha duel — its pictures and variables become z4f nodes (src/z4f.js runs event 2,
    # the parallel process that moves them, frame by frame)
    m49 = D('map049')['events']

    def pic(p):  # 231 show picture: number, name, origin (0 top-left, 1 centre), by variables, x, y, zoom x / y, opacity, blend
        return [{'x': 'z4fPic', 'n': p[0], 'name': p[1], 'o': p[2], 'byVar': p[3] == 1, 'px': p[4], 'py': p[5],
                 'zx': p[6], 'zy': p[7], 'op': p[8], 'blend': p[9]}]

    def move(p):  # 232 move picture: number, —, origin, by variables, x, y, zoom x / y, opacity, blend, frames, wait
        return [{'x': 'z4fMove', 'n': p[0], 'o': p[2], 'byVar': p[3] == 1, 'px': p[4], 'py': p[5], 'zx': p[6], 'zy': p[7],
                 'op': p[8], 'dur': p[10], 'wait': p[11]}]

    def code355_49(p):
        out = []
        for x in p[0].split('\n'):
            m = re.match(r'screen\.pictures\[(\d+)\]\.mirror = true', x.strip())
            if m:
                out.append({'x': 'z4fMirror', 'n': int(m.group(1))})
            if x.strip().startswith('screen.pictures[6].zoom_x'):
                out.append({'x': 'z4fBeamZoom'})
        return out

    EXTRA.clear()
    EXTRA.update({
        9122: lambda p: [{'x': 'z4fVar', 'p': p}],  # every variable command of the film (the film's own variables)
        9121: lambda p: [{'x': 'z4fSw', 'a': p[0], 'b': p[1], 'on': p[2] == 0}],  # 77 / 138-140: event 2's pages
        231: pic, 232: move, 235: lambda p: [{'x': 'z4fErase', 'n': p[0]}],
        117: lambda p: [{'x': 'z4fCe', 'n': p[0]}],
        355: code355_49, 221: lambda p: [{'fadeout': 30}], 222: lambda p: [],
    })
    film = [dict(c, code=9122) if c['code'] == 122 else dict(c, code=9121) if c['code'] == 121 else c
            for c in merge(m49['1']['pages'][0]['list'])]
    film = [c for c in film if c['code'] != 201]
    pages['beam'] = z3['nodes_of'](film, faces)
    EXTRA.clear()
    OPTS.update(bgm=False, shakeSw=False)
    world['z3']['pages'].update({'z4f' + k: v for k, v in pages.items()})

    # every speaker has a face (the converter keeps a name it has no face for as it is)
    said = set()

    def speakers(nodes):
        for n in nodes:
            if 'say' in n and n['say'][0]:
                said.add(n['say'][0])
            for k in ('then', 'else', 'loop'):
                speakers(n.get(k, []))
            for b in n.get('branches', []):
                speakers(b)
    for p in pages.values():
        speakers(p)
    missing = sorted(x for x in said if x not in faces and x != '？')
    assert not missing, missing

    # ---------- the chapter ----------
    world['z3']['titles']['z4f'] = 'Z4　第六章　賽魯遊戲'
    world['z3']['goals'][MAP] = '目標：前往賽魯遊戲的擂台'
    world['z3']['z4f'] = {
        'start': {'map': MAP, 'x': 75, 'y': 63},
        'back': {'map': MAP, 'x': 44, 'y': 36},  # page 30: after Mr. Satan
        # battle_process $Battle_MapID: 29 the ring, 1 the plain
        'backdrops': {'2463': 'bg/z3_battle_29.png', '2464': 'bg/z3_battle_29.png', '2481': 'bg/z3_battle_1.png',
                      '2561': 'bg/z3_battle_29.png'},
        # set_battle_event 9 / 10 / 11 (all.rb 52716): who acts, with which move, against Cell (129)
        'duels': {
            '2449': {'party': {'normal': P('Z3_戦闘_サタン.png'), 'special': P('Z3_戦闘_必殺技_サタン.png')}, 'skill': None},
            '2501': {'party': {'normal': P('Z3_戦闘_16号.PNG'), 'special': P('Z3_戦闘_必殺技_16号.PNG')}, 'skill': None},
            '2531': {'party': {'normal': P('ZG_戦闘_ゴハン(超2).png'), 'special': P('ZG_戦闘_必殺技_ゴハン(超2).png')}, 'skill': None},
        },
        'backdrop': 'bg/z3_battle_1.png',
        'end': 'Z4　完',
        # what the original opens after Z4 (page 2602: CE180, 2693 Roshi): shown on the title screen
        'unlocks': ['ZG（待續）：外傳篇（波傑克、達列斯、史拉格……）', '時之間的新區域（「通知！」卡）', '時之間：和賽魯的戰鬥有了變化'],
        # 超サイヤ人2 悟飯 (switch 388 in the original: ZG_顔グラ(ゴハン超1_2) row 2, the ZG battle sheets)
        'ss2': {'face': [P('ZG_顔グラ(ゴハン超1_2).png'), 2], 'sprite': P('ZG_戦闘_ゴハン(超2).png'),
                'special': P('ZG_戦闘_必殺技_ゴハン(超2).png')},
        # add_cha_last_cellbtl (all.rb 12668): who fills the party up to nine for the last battle, in this order
        'fill': [5, 4, 12, 17, 6, 7, 8, 9, 10, 24],
    }

    # ---------- the staff roll (z1field 2691: z_ed_rev1, all.rb 23217) ----------
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    body = src[src.index('def set_staff_roll'):]
    body = body[:body.index('text = text_head')]
    parts = dict(re.findall(r'(text_\w+)\s*=\s*"(.*?)"', body, re.S))
    order = ['text_head', 'text_z1', 'text_interval', 'text_z2', 'text_interval', 'text_z3', 'text_interval', 'text_zd',
             'text_interval', 'text_zg', 'text_interval', 'text_zrpg1', 'text_zrpg2', 'text_interval', 'text_adjust', 'text_foot']
    text = ''.join(parts[k] for k in order)
    world['z3']['z4f']['staff'] = [x.replace(' ', '') for x in text.split('\n')]
    world['z3']['z4f']['staffEnd'] = [x.replace(' ', '') for x in parts['text_end'].split('\n')]

    # ---------- assets: the scenes' pictures, music, sounds ----------
    names = ['ZG_背景_ゴクウの家', 'Z3_背景_天界', 'ZG_背景_グランドアポロン(青空)', 'Z3_背景_セルゲームリング', 'Z3_背景_セル自爆',
             'Z3_背景_界王星', 'Z3_背景_界王星(なし)', 'Z3_背景_カプセルコーポレーション', 'Z3_背景_タイムマシンp2',
             'Z3_シェンロン呼び出し(天界用に編集)', 'Z3_スーパーサイヤ人_バック', 'Z3_スーパーサイヤ人_ベジータ_気1',
             'Z3_スーパーサイヤ人_ベジータ_気2', 'Z3_スーパーサイヤ人_ベジータ_気3', 'Z3_スーパーサイヤ人_ゴハン1',
             'Z3_スーパーサイヤ人_ゴハン2', 'Z3_スーパーサイヤ人_ゴハン3', 'ZG_顔グラ(ゴハン超1_2)', 'Z3_戦闘_サタン',
             'Z3_戦闘_必殺技_サタン', 'Z3_戦闘_16号', 'Z3_戦闘_必殺技_16号', 'ZG_戦闘_ゴハン(超2)', 'ZG_戦闘_必殺技_ゴハン(超2)',
             'ZG_戦闘_ゴハン(超)', 'ZG_戦闘_必殺技_ゴハン(超)', 'Z3_戦闘_18号', 'Z3_戦闘_必殺技_18号',
             'zed/背景1', 'zed/背景2', '集合絵_修正', '文字_Z1_スタッフロール', 'Z3_必殺技_親子カメハメ波', 'ZD_セル撃破1', 'ZD_セル撃破2']
    film_pics = set()

    def walk_pics(nodes):
        for n in nodes:
            if n.get('x') == 'z4fPic':
                film_pics.add(n['name'])
            for k in ('then', 'else', 'loop'):
                walk_pics(n.get(k, []))
    walk_pics(pages['beam'])
    # event 2 (the parallel process) shows these too
    film_pics |= {'ZG_修行_光線打合_衝突_黄', 'ZG_修行_光線打合_衝突_青', 'ZG_修行_光線打合(点滅)'} \
        | {f'ZG_修行_光線打合_火花_{k}' for k in range(1, 13)} \
        | {f'ZG_修行_光線打合_背景_超カメハメ波_{s}_{k}' for s in ('左', '右') for k in (1, 2, 3)}
    world['z3']['z4f']['filmPics'] = {n: file(n) for n in sorted(film_pics)}
    pics = {file(n) for n in names} | set(world['z3']['z4f']['filmPics'].values()) | {P3, E3, F3, CARD}
    assert None not in pics, [n for n in names + sorted(film_pics) if not file(n)]
    world['z3']['z4f']['pics'] = {n: file(n) for n in names}
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
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
    se |= {'Z1 高速移動', 'Z3 変身', 'Z3 決定', 'Z3 稲妻', 'Z3 シェンロン呼び出し', 'Z1 敵発見'}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {'ZSB1 パーフェクトセルのテーマ', 'Z1 エンディング'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics | {'Audio/ME/ZSSD 戦いの終わり.ogg'})
