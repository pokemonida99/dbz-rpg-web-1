"""Z3 第五章 人造人間（地圖 40） — world.json data, added by tools/build_z3.py (read by src/z3e.js). docs/z3e.md has the
whole chapter with the original's sources.

The original: Map007 event 5 「イベント実行Z3」 pages 46-57 (variable 41 = 1326-1421) and 72 (1582 ウーロン), the scenes
143_Event_Main.rb z1field 1326-1421 / 1582 (all.rb 174805-175385), the spots of map 40 (145_Event_Check.rb `when 40`,
all.rb 185604), its encounters (140_Field_Main.rb `when 40,77`, all.rb 165627) and battle_process 1342 / 1363 / 1372 /
1390 (all.rb 182986):
  1326 (page 46) the day the androids come: Bulma and baby Trunks, Yajirobe's senzu, his car blown up → map 40 (5,56);
       variable 308 / 309 = (64,13): where No. 20 is (the page sets them, all.rb Event_Check reads them)
  map 40: the first stop that is no spot → 1335 Goku's heart attack (unless the 未来の薬 was used: switch 428),
       Chi-Chi (switch 555) or Roshi takes his place; until No. 20 is found, one stop in three → 1421 (someone points
       the way to him); (64,13) → 1341 → battle 1342 → 1351 Trunks is back; (61,33) the lab → 1356;
       (9,10) Nos. 17, 18, 16 → 1361 → battle 1363 → 1371 → battle 1372 → 1376 (won) / 1381 (lost, either battle)
  1383 (page 55) Piccolo fuses with Kami, meets Cell → battle 1390 (Piccolo alone, 4 turns, enemy damage × 0.5)
  1401 (page 56) Cell's 太陽拳, the ending cut-ins → variable 41 = 2001 (Z4)
"""
import os
from PIL import Image

MAP = '40'
P = lambda n: f'Graphics/Pictures/{n}'
SUPER = {14, 18, 19, 20, 26, 32}  # the Super Saiyan actors: the remake keeps one member per character (src/supersaiyan.js)
# z1field speakers of these pages who are not in the party / enemy tables (tools/build_z3.py PARTY_FACES): 顔カード
# column 2 = Z3, Z3_顔敵 row = enemy id - 100 (z1field 1328 / 1329 / 1383 / 1401 / 1582 draw them)
CARD_FACES = {'布爾瑪': 8, '天神': 10, '波波': 12, '烏龍': 20, '亞奇洛貝': 23}
# 1421: \N[1] is a passer-by ($game_variables[307] = rand(3) + 1: オジサン, 少年, オバサン; Z3_顔イベント rows 0 / 1 / 4)
PASSERS = [['大叔', 0], ['少年', 1], ['大嬸', 4]]
# the enemies' moves in these battles (the database has Japanese names only): the words the earlier chapters use
FOE_MOVES = {'エネルギー波': '能量波', '強力エネルギー波': '強力能量波', '連続エネルギー波': '連續能量波',
             'ドレインライフ': '吸取生命', 'かめはめ波': '龜派氣功', '魔貫光殺砲': '魔貫光殺砲', '太陽拳': '太陽拳'}


def add(world, h, z3):
    build_map, enemy, skill, actor, s2t, script, D, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 's2t', 'script', 'D', 'root'))
    file = z3['file']
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']

    # ---------- map 40 ----------
    world['maps'][MAP] = build_map(40, rows=69)  # the last row holds the original's control events only
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois'][MAP] = [
        {'x': 16, 'y': 21, 'label': '卡片商店', 'chapter': 'z3e', 'kind': 'card30'},  # カード特殊: variable 44 = 30
        {'x': 18, 'y': 13, 'label': '和烏龍說話', 'chapter': 'z3e', 'kind': 'oolong'},  # 1582
        # No. 20 (variables 308 / 309, set by page 46): nothing to see on the original's map either
        {'x': 64, 'y': 13, 'label': '調查這一帶', 'chapter': 'z3e', 'kind': 'no20', 'when': ['sw', 426, False]},
        {'x': 61, 'y': 33, 'label': '進入研究所', 'chapter': 'z3e', 'kind': 'lab', 'when': [['sw', 426, True], ['sw', 427, False]]},
    ] + at([(21, 19), (8, 48), (45, 45), (59, 4)], SHOP) + at([(9, 43), (57, 36)], INN) \
      + at([(24, 44), (52, 54), (49, 6), (21, 11)], TRAIN)
    # (the 時の間 squares (24,10), (10,54), (68,15) wait for the 時之間)
    # Nos. 17 / 18 / 16 (map 40 event 112: enemy1.png character 5 once switch 427 is on)
    world['bosses'][MAP] = [{'x': 9, 'y': 10, 'index': 5, 'flag': 'z3e17', 'key': 'a17', 'when': [['sw', 427, True], ['sw', 431, False]]}]
    # 140_Field_Main.rb `when 40,77`: 2-5 of 金科人・甜菜人(改)・球根人(改)・栽培人(改)
    world['areas'][MAP] = {'pool': [137, 174, 175, 176], 'n': [2, 5]}

    # (the battle backgrounds: src/z3.js z3Backdrop picks them as set_battle_map does)

    # ---------- enemies the shared part does not have: 174-176 (Z3 sheets), and the moves' names ----------
    enemies_db, sdb = D('enemies'), D('skills')
    for eid in (174, 175, 176):
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        e['face'] = [F3, eid - 100]
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            if sid and str(sid) not in world['skills'] and sid not in world['skills']:
                world['skills'][sid] = skill(sid)
    for eid in (122, 123, 124, 125, 126, 127):
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            jp = sdb[sid]['name'].split(')')[-1]
            if sid in world['skills'] and jp in FOE_MOVES:
                world['skills'][sid]['name'] = FOE_MOVES[jp]

    # ---------- Trunks (17 / 20): the third chapter brings him; here only if it has not ----------
    tr = lambda aid, jp, skills: dict(actor(aid, aid - 3, '特南克斯', f'Z3_戦闘_{jp}.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills),
                                      special=P(f'Z3_戦闘_必殺技_{jp}.PNG'))
    world['actors'].setdefault(17, tr(17, 'トランクス', [171, 172, 173]))
    if 20 not in world['actors'] and '20' not in world['actors']:
        world['actors'][20] = dict(tr(20, 'トランクス(超)', [171, 172, 173]), ss=17)
    # Piccolo learns 爆裂波 / 激烈光弾 / 魔空包囲弾 at the fusion (page 55)
    for sid in (171, 172, 173, 174, 176, 177, 185, 32, 39, 40):
        if sid not in world['skills'] and str(sid) not in world['skills']:
            world['skills'][sid] = skill(sid)
    world['skills'][185]['ss'] = True  # スーパーサイヤ人変身 (as 29)

    # ---------- the story pages ----------
    faces = dict(z3['faces'])
    faces.update({k: [CARD, r, 2] for k, r in CARD_FACES.items()})
    faces.update({'沙魯': [F3, 27], '怪物': [F3, 27], '特蘭克斯': [P3, 14]})  # (the pages write 特兰克斯: 特蘭克斯)
    for name, r in PASSERS:
        faces[name] = [E3, r]
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})

    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')

    def code355(p):  # the script lines of these pages (355 and its continuation lines 655)
        import re
        t = p[0].strip()
        if t.startswith('off_super_saiyazin'):
            return [{'x': 'z3eSsOff', 'no': int(t.split()[1])}]
        if re.match(r'\$partyc\s*=\s*\[', t):
            ids = [int(x) for x in re.findall(r'\d+', t)]
            return [{'partyc': ids}, {'x': 'z3eParty', 'ids': ids}]
        if re.match(r'\$partyc\s*<<\s*\d+', t):
            i = int(re.findall(r'\d+', t)[0])
            return [{'partycAdd': i}, {'x': 'z3eJoin', 'id': i}]
        if t.startswith('$partyc.delete('):
            return [{'x': 'leave', 'id': int(re.findall(r'\d+', t)[0])}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        if t.startswith('get_skill'):
            a, b = (int(x) for x in re.findall(r'\d+', t))
            return [{'x': 'z3eGetSkill', 'id': a, 'skill': b}]
        if t.replace(' ', '') == '$game_variables[82]=0.5':  # 敵からのダメージを半分にする (src/z3e.js passes it to the battle)
            return [{'var': [82, 0, 0.5]}]
        return []

    def ce(p):
        n = p[0]
        if n == 14:  # ドラゴンボール使用
            return [{'item': [i, -99]} for i in range(2, 9)]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        if n == 272:  # オプションのSコンボ優先度: Oolong's explanation, as it is (one box per window: its lines quote
            # 「指定順序」, which script() would take for a speaker)
            out = []
            for c in cdb[272]['list']:
                if c['code'] == 101:
                    out.append({'say': ['', '']})
                elif c['code'] == 401:
                    line = s2t(c['parameters'][0]).strip()
                    out[-1]['say'][1] += ('\n' if out[-1]['say'][1] else '') + line
            return out
        return []  # (CE173 / 174 倍速不可 / 可: the remake has no fast mode)

    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        315: lambda p: [] if p[0] in SUPER else [{'x': 'exp', 'id': p[0], 'n': p[3] if p[1] == 0 else -p[3]}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        249: lambda p: [{'x': 'z3eMe', 'name': p[0]['name']}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    raw = z3['raw']

    def page(v, lst=None):
        return [{'v41': v}] + z3['nodes_of'](lst if lst is not None else raw[v], faces)

    def passer(lst):
        """page 57: \\N[1] is the passer-by z1field 1421 names; src/z3e.js puts the name in"""
        return [dict(c, parameters=[c['parameters'][0].replace('\\N[1]', '＠')]) if c['code'] == 401 else c for c in lst]

    pages = {str(v): page(v) for v in (1326, 1335, 1341, 1351, 1356, 1361, 1371, 1376, 1381, 1383, 1401, 1582)}
    pages['1421'] = page(1421, passer(raw[1421]))
    EXTRA.clear()
    OPTS.update(bgm=False, shakeSw=False)
    world['z3']['pages'].update({'z3e' + k: v for k, v in pages.items()})

    # ---------- the chapter ----------
    world['z3']['titles']['z3e'] = 'Z3　第五章　人造人間'
    world['z3']['z3e'] = {
        'start': {'map': MAP, 'x': 5, 'y': 56},
        'passers': PASSERS,
        'backdrops': {'1342': 'bg/z3_battle_1.png', '1363': 'bg/z3_battle_4.png', '1372': 'bg/z3_battle_4.png', '1390': 'bg/z3_battle_9.png'},
        'end': 'Z3　完',
        # what the original opens after Z3 (variable 41 = 2001: Z4, CE180): shown on the title screen
        'unlocks': ['Z4：人造人間・沙魯篇的後續', '時之間的新區域（「通知！」卡）'],
        # z1field 1351 / 1384 cha_tec_puls: move counts
        'uses1351': {171: 300, 172: 150, 173: 150, 174: 100, 176: 50, 177: 30, 185: 10},
        'uses1384': {31: 30, 33: 25, 34: 20, 35: 15, 36: 10},
    }

    # ---------- assets: the scenes' pictures, music, sounds ----------
    names = ['Z3_背景_草原', 'Z3_背景_砂漠', 'Z3_背景_山', 'Z3_背景_研究所', 'Z3_背景_天界', 'Z3_背景_街', 'Z3_スーパーサイヤ人_バック',
             'ZD_セル登場', 'Z3_味方カットイン', 'Z3_敵カットイン', 'Z3_背景_エンディング_セル1', 'Z3_背景_エンディング_セル2',
             'Z3_必殺技_カットイン_太陽拳(セル第１形態)', 'Z3_戦闘_必殺技_背景_上(茶)', 'Z3_戦闘_必殺技_背景_下(加工)(茶)',
             'Z3_戦闘_敵_沙鲁(第１形态)', 'Z3_戦闘_ピッコロ', 'Z3_戦闘_必殺技_気を溜める(青)']
    pics = {file(n) for n in names} | {P3, E3, F3, CARD}
    assert None not in pics, [n for n in names if not file(n)]
    # z1field 1384: the temple goes dark in three steps (Tone -85 / -170 / -255) before the fusion
    sky = Image.open(os.path.join(root, 'game', file('Z3_背景_天界'))).convert('RGB')
    for k in (1, 2):
        dark = sky.point(lambda v: max(0, v - 85 * k))
        dark.save(os.path.join(root, 'assets', 'bg', f'z3e_tenkai_{k}.png'), optimize=True)
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
            if 'se' in n:
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
            for k in ('then', 'else'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    for p in pages.values():
        walk(p)
    se |= {'Z1 飛ぶ', 'Z3 変身', 'Z3 決定'}
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {'Z3 フィールド1', 'ZD イベント4', 'GBZ1 イベント7'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics | {'Audio/ME/Z3 今度はオラがやる.ogg'})

