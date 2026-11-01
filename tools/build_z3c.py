"""Z3 第三章 弗利薩復仇・特南克斯（地圖 36） — world.json data, added by tools/build_z3.py (read by src/z3c.js).
docs/z3cd.md has the original's pages, scenes and what this version does with them.

Map007 event 5 pages (variable 41) of this chapter, in the order they play:
  1230 (page 19)  time passes, Frieza and King Cold land; the Z fighters ($partyc = [4,12,5,6,7,8,9], z1field 1236)
                  → battle 1237 (Mecha Frieza, enemy 102: variable 94 = 4 — over after four turns; switch 18 敵必ず回避:
                  the party's attacks all miss) → variable 95 = 1240
  1240 (page 20)  the mysterious boy ($partyc = [17], on_super_saiyazin 4) → z1field 1241 set_battle_event
                  (variable 96 = 1: Trunks against Mecha Frieza, a film) → variable 95 = 1246
  1246 (page 21)  King Cold and the sword, z1field 1247 (Z3_コルド撃破_修正), the party back (1249) → map 36 (18,25)
  map 36          event 15 (autorun): the space pod lands (event 1 falls 15 tiles, the screen shakes), Goku steps out
                  → variable 41 + 1 = 1250 → map 7
  1250 (page 22)  Goku, +620000 EXP, $partyc = [3]; CE46 (Goku turns Super Saiyan) and CE49 (Trunks) → z1field 1255
                  set_battle_event (variable 96 = 2: Goku against Trunks, a film) → 1256
  1256 (page 23)  the future, the medicine, the time machine (z1field 1259: Goku's move counts), Cooler's men set off,
                  Vegeta goes to Capsule Corporation → $partyc = [12], variable 42 = 12, 43 = 54, card 48,
                  map 37 (8,9) → 第四章 (src/z3d.js)

The pages and the next chapter's are converted by convert() below (tools/build_z3d.py uses it too): the commands the
shared converter drops (fades, tints, quakes, EXP, moves, the party lines of the scripts, the Super Saiyan, the common
events) become nodes src/z3c.js / src/z2scenes.js play.
"""
import json
import os
import re

P = lambda n: f'Graphics/Pictures/{n}'

# the speakers of chapters 3 and 4 that have no Z3 face yet in tools/build_z3.py ([sheet, row, column]):
# 顔カード column 2 = Z3; Z3_顔イベント rows from z1field (おじさん 0, 少年 1, 謎の男 2, ブルマ 5, コルド 6)
def faces_of(z3):
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    return {
        '界王大人': [CARD, 25, 2], '庫爾德': [E3, 6], '少年': [P3, 14], '特蘭克斯': [P3, 14], '布里夫': [CARD, 36, 2],
        '村民': [E3, 0], '布爾瑪': [E3, 5], '神龍': [CARD, 16, 2], '蘭琪': [CARD, 34, 0],
    }


# 315 Change EXP to a Super Saiyan form: the original gives it to both forms; here the form not in use is copied from
# the other when it changes (src/supersaiyan.js), so the base form's share is the one that counts
SS_BASE = {14: 3, 18: 5, 19: 12, 20: 17, 26: 25, 32: 16}


def convert(h, z3, faces):
    """→ page(v, lst=None): a page of event 5 (or any command list) as story nodes, with this chapter pair's commands."""
    script, D = h['script'], h['D']
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    ce_db = D('commonevents')
    films = {46: 'goku', 48: 'vegeta', 49: 'trunks', 50: 'cooler'}  # CE46 / 48 / 49 / 50 → CE45 超サイヤ人変身テンプレート

    def ce(p):
        n = p[0]
        if n in films:
            return [{'x': 'z3Transform', 'who': films[n]}]
        if n == 180:  # 時の間新エリア開放 (and its notice card)
            return [{'sw': [483, 483, True]}, {'item': [67, 1]}]
        if n == 14:  # ドラゴンボール使用
            return [{'item': [i, -99]} for i in range(2, 9)]
        if n == 184:  # Z3ドラゴンボールを発見: the ball of variable 240
            return script(ce_db[184]['list'])
        if n == 39:  # 先頭キャラを取得 (variable 42 = $partyc[0])
            return [{'x': 'z3cdLead'}]
        return []  # CE40 流派一致修行用カード生成: the training makes its own cards (src/z3train.js)

    def code355(p):
        t = p[0].strip()
        if t == 'all_charecter_recovery':
            return [{'x': 'recover'}]  # (src/z2scenes.js: everyone, the bench too)
        if re.match(r'\$partyc\s*=\s*\[', t):
            return [{'x': 'z3cdParty', 'ids': [int(x) for x in re.findall(r'\d+', t)]}]
        if re.match(r'\$partyc\s*<<\s*\d+', t):
            return [{'x': 'z3cdJoin', 'id': int(re.findall(r'\d+', t)[0])}]
        m = re.match(r'(on|off)_super_saiyazin (\d+)', t)
        if m:
            return [{'x': 'z3cdSs', 'no': int(m.group(2)), 'on': m.group(1) == 'on'}]
        if t == 'allcardexchange':
            return [{'x': 'z3cdHand'}]
        if t.startswith('$game_variables[42] = $partyc[0]'):
            return [{'x': 'z3cdLead'}]
        if t.startswith('#ZP取得'):  # page 58: $zp[x] += 1500 for everyone
            return [{'x': 'z3cdZp', 'n': 1500}]
        if t == '#z3cdAgain':  # page 58: 119 選択肢1ページ (the wish menu once more; marked by z3d_wishes)
            return [{'x': 'z3cdAgain'}]
        return []

    def exp(p):  # 315: actor, 0 increase / 1 decrease, operand type, value
        aid = SS_BASE.get(p[0], p[0])
        return [{'x': 'exp', 'id': aid, 'n': p[3] if p[1] == 0 else -p[3], 'ss': p[0] in SS_BASE}]

    EXTRA.update({
        117: ce, 355: code355, 655: code355, 315: exp,
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        223: lambda p: [{'x': 'z3cdTint', 'dark': p[0][0] < 0}],  # tint the screen black (-255) / back
        225: lambda p: [{'x': 'quake', 'dur': p[2]}],
        242: lambda p: [{'bgmFade': p[0]}], 251: lambda p: [{'x': 'z3cdSeStop'}],
        125: lambda p: [{'x': 'z3cdGold', 'n': p[2] if p[0] == 0 else -p[2]}],  # 信用點 (this version's CAP)
    })
    OPTS.update(shakeSw=True)

    def fix(ns):
        out = []
        for n in ns:
            if n.get('x') == 'exp' and n.pop('ss'):  # the same EXP twice (base and Super Saiyan form): once
                if out and out[-1].get('x') == 'exp' and out[-1]['id'] == n['id']:
                    continue
            if n.get('var') and n['var'][0] == 25:  # variable 25 (CAP) is this version's 信用點
                n = {'x': 'z3cdGold', 'n': n['var'][2] if n['var'][1] == 1 else -n['var'][2]}
            for k in ('then', 'else'):
                if k in n:
                    n[k] = fix(n[k])
            if 'branches' in n:
                n['branches'] = [fix(b) for b in n['branches']]
            out.append(n)
        return out

    def page(v, lst=None):
        return ([{'v41': v}] if lst is None else []) + fix(z3['nodes_of'](z3['raw'][v] if lst is None else lst, faces))

    def done():
        EXTRA.clear()
        OPTS.update(shakeSw=False)
    return page, done


def mend(obj):
    """tools/s2t.py's slips in these pages: 克 → 剋 (那美克星 → 那美剋星, 比克死了 → 比剋死了), 只能 → 隻能, 干的 → 乾的"""
    t = json.dumps(obj, ensure_ascii=False)
    for a, b in (('美剋', '美克'), ('比剋', '比克'), ('是隻能', '是只能'), ('少年乾的', '少年幹的')):
        t = t.replace(a, b)
    return json.loads(t)


def speakers(nodes, acc):
    for n in nodes if isinstance(nodes, list) else [nodes]:
        if isinstance(n, dict):
            if 'say' in n:
                acc.add(n['say'][0])
            for k in ('then', 'else'):
                speakers(n.get(k, []), acc)
            for b in n.get('branches', []):
                speakers(b, acc)
    return acc


def walk_sounds(nodes, se, bgm):
    for n in nodes:
        if not isinstance(n, dict):
            continue
        if 'se' in n:
            se.add(n['se'])
        if n.get('bgm'):
            bgm.add(n['bgm'])
        for k in ('then', 'else'):
            walk_sounds(n.get(k, []), se, bgm)
        for b in n.get('branches', []):
            walk_sounds(b, se, bgm)


def assets(world, root, js_name, file):
    """the pictures / music / sounds a chapter file names: pic('…') paths, bgm: '…', se: '…' / se('…')"""
    js = open(os.path.join(root, 'src', js_name), encoding='utf-8').read()
    names = set(re.findall(r"pic\('([^']+)'\)", js)) | set(re.findall(r"'(Z3_[^'/$]+\.(?:PNG|png))'", js))
    for n in names:  # (the extension's case matters on GitHub Pages)
        assert file(os.path.splitext(n)[0]) == P(n), f'{n}: the file is {file(os.path.splitext(n)[0])}'
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {P(n) for n in names})
    world['extraBgm'] = sorted(set(world['extraBgm']) | set(re.findall(r"bgm: '([^']+)'", js)))
    world['fieldSe'] = sorted(set(world['fieldSe']) | set(re.findall(r"(?:se: |se\()'([^']+)'", js)))


def add(world, h, z3):
    build_map, actor, skill, D, root = (h[k] for k in ('build_map', 'actor', 'skill', 'D', 'root'))
    split_battle = z3['split_battle']
    z = world['z3']

    # ---------- people: 特南克斯 (17), 超級特南克斯 (20), 超級貝吉塔 (19) ----------
    # CE9 必殺技設定 (17 / 20: 171 174 176; CE61 トランクス技切り替え with variable 173 = 0, his own clothes: the sword,
    # 172 177; 19: 121 123 124, + 125 from page 1319 on), the Z3 battle sheets
    z3actor = lambda aid, name, jp, skills: dict(
        actor(aid, aid - 3, name, f'Z3_戦闘_{jp}', 'Z1_戦闘_必殺技_エネルギー波.PNG', skills),
        special=z3['file'](f'Z3_戦闘_必殺技_{os.path.splitext(jp)[0]}'))
    trunks = [171, 172, 174, 176, 177]
    world['actors'][17] = z3actor(17, '特蘭克斯', 'トランクス.PNG', trunks)
    world['actors'][20] = z3actor(20, '特蘭克斯', 'トランクス(超).PNG', trunks)
    world['actors'][20]['ss'] = 17
    world['actors'][19] = z3actor(19, '貝吉塔', 'ベジータ(超).PNG', [121, 123, 124])
    world['actors'][19]['ss'] = 12
    for sid in trunks + [121, 123, 124, 125, 130, 133]:
        world['skills'][sid] = skill(sid)
    world['skills'][133]['ss'] = True  # ベジータのスーパーサイヤ人変身 (like 29: no damage, the user turns)

    # ---------- map 36 (悟空到着: only the pod landing, no squares) ----------
    world['maps']['36'] = build_map(36, rows=40)
    world['areas']['36'] = None

    # ---------- the story pages ----------
    faces = dict(z3['faces'], **faces_of(z3))
    page, done = convert(h, z3, faces)
    pages = {str(v): page(v) for v in (1240, 1246, 1250, 1256)}
    pages['1230'] = split_battle(page(1230))
    done()
    pages = mend(pages)
    # Frieza is the mechanical one in this chapter (Z3_顔敵 row 2)
    pages = json.loads(json.dumps(pages, ensure_ascii=False).replace('"z3:弗利薩"', '"z3:弗利薩(機械)"'))
    z['pages'].update(pages)
    world['faces'].update({'z3:' + k: v for k, v in faces_of(z3).items()})
    z['faces'].update(faces_of(z3))

    z['titles']['z3c'] = 'Z3　第三章　弗利薩復仇・特南克斯'
    z['goals']['36'] = ''
    z['z3c'] = {
        'party1236': [4, 12, 5, 6, 7, 8, 9],  # z1field 1236 / 1249 / 1261: the Z fighters
        'mecha': {'turns': 4, 'backdrop': 'bg/z3_battle_1.png'},  # battle 1237: variable 94 = 4, $Battle_MapID = 1
        'pod': {'map': '36', 'x': 18, 'y': 25, 'from': [18, 12], 'to': [18, 27], 'goku': [18, 27]},  # map 36 events 1, 16
        'uses1259': {2: 70, 5: 50, 6: 40, 7: 30, 18: 25, 19: 20, 26: 20, 29: 15},  # z1field 1259 cha_tec_puls (Goku)
        # set_battle_event (all.rb 52515): 1 Trunks against Mecha Frieza (enemy 102), 2 Goku against Trunks (134 ×2)
        'duels': {'1241': {'party': 20, 'foe': 102, 'backdrop': 'bg/z3_battle_1.png'},
                  '1255': {'party': 14, 'foe': 134, 'backdrop': 'bg/z3_battle_1.png'}},
        'next': {'map': '37', 'x': 8, 'y': 9, 'party': [12]},  # page 1256: $partyc = [12], variable 42 = 12
    }
    se, bgm = set(), set()
    for v in pages.values():
        for part in (v if v and isinstance(v[0], list) else [v]):
            walk_sounds(part, se, bgm)
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {'Z3 イベント2', 'ZArrang_hope03_トランクスのテーマ(仮'})
    world['fieldSe'] = sorted(set(world['fieldSe']) | se | {'Z3 変身', 'Z3 宇宙船到着', 'Z3 トランクスエネルギー波', 'Z1 飛ぶ'})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {'Graphics/Characters/chara2.png', 'Graphics/System/TileB.png'}
                                    | {f'Graphics/Characters/chara_fly{k}.png' for k in (2, 3, 4, 5)}  # (src/field.js FLY_MORE)
                                    | {world['enemies'][i][k] for i in (102, 134) for k in ('sprite', 'portrait')})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {z3['file'](f'Z3_スーパーサイヤ人_{n}_気{k}') for n in ('悟空', 'ベジータ', 'トランクス') for k in (1, 2, 3)})
    assets(world, root, 'z3c.js', z3['file'])
