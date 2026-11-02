"""劇情與系統的小缺口（第二批分工 sys，docs/batch2-plan.md、docs/sys.md）: world.sys and a few fixes to world.json, read
by src/sys.js. Added by tools/build_timeroom.py after the ZG parts (the 概況 needs tools/build_z3.py's helpers).

  scouter   enemies the スカウター can't read (element 17 / 30: the androids, Cell) and the ones that break it (element
            16), all.rb 48324 / 48423 — unless 神探測器 (switch 490, card 205)
  squares   「カード特殊」 card squares: variable 44 = 10 / 20 before chk_card (145_Event_Check.rb 184095 …): poi.v44
  cards     the skill cards the card shop adds after a boss / an arena rank (Items base_damage → world.growth.cards)
  recap     Z3 / Z4 概況 (Map007 event 2 page 201, variable 43 = 51-96 → CE101-137): world.z3.z34Recap, scenes from
            all.rb z1field drawn by src/zg_a.js drawZgScene under the original's number + OFFSET
  names     the enemy moves whose names the database only has in Japanese
  bgm       戰鬥ＢＧＭ / 戰鬥前ＢＧＭ (Scene_Db_Option): set_battle_bgm_name / set_battle_ready_bgm_name (all.rb 10547 /
            11156) and the unlock rules chk_battle_bgm_on / chk_battle_ready_bgm_on (11637 / 12045)
"""
import os
import re

from PIL import Image

import build_growth
import build_zg_a

OFFSET = 2000000  # z1field numbers of the Z3 / Z4 概況 scenes here (the original's + OFFSET; ZG's are + 1000000)
RECAP = (51, 110)  # page 201's branches for variable 43 (Z3 51-61, Z4 81-96); 65-69 are tools/build_z3b.py's
Z3B_RECAP = range(65, 70)

# 145_Event_Check.rb カード特殊: (map, x, y) → variable 44 (184095 184123 184236 184899 184960 185221)
SPECIAL = {('63', 59, 18): 10, ('64', 3, 7): 10, ('71', 10, 69): 20, ('15', 59, 18): 10, ('51', 3, 7): 10, ('29', 10, 69): 20}

# the shop's 「打倒 X 後追加」 skill cards (tools/build_cards_square.py BONUS; the other four are src/sys.js's)
SKILL_CARDS = [194, 187, 207, 184, 195, 162, 165, 166, 167]

# the moves the database names in Japanese only (description empty): the part after the user's name, translated as
# the other parts did (tools/build_zg_bojack.py FOE_MOVES, tools/build_zg_c.py)
MOVES = {'エネルギー波': '能量波', '連続エネルギー波': '連續能量波', '強力エネルギー波': '強力能量波',
         '連続強力エネルギー波': '連續強力能量波', '連続エネルギー弾': '連續能量彈', 'ラッシュ': '連打',
         'ダブルアタック': '雙重攻擊', 'カタナ攻撃(強)': '刀攻擊(強)', 'デッドゾーン': '死亡地帶',
         '氷結攻撃全体': '冰結攻擊(全體)'}
KANA = re.compile('[぀-ヿ]')


def add(world, h, z3, tr):
    D, root = h['D'], h['root']
    out = world.setdefault('sys', {})

    # ---------- scouter ----------
    enemies = D('enemies')
    el = lambda e, n: e['element_ranks']['data'][n] == 1  # (element rank A)
    out['scouter'] = {'cant': [e['id'] for e in enemies if e and (el(e, 17) or el(e, 30))],
                      'burst': [e['id'] for e in enemies if e and el(e, 16)]}

    # ---------- カード特殊 ----------
    for (m, x, y), v in SPECIAL.items():
        p = next(p for p in world['pois'][m] if p['x'] == x and p['y'] == y and p.get('effect') == 'shop')
        p['v44'] = v

    # ---------- the skill cards (as tools/build_cards_story.py) ----------
    items = D('items')
    rows = D('chaskill')
    table = {r[0]: dict(zip(rows[0], r)) for r in rows[1:]}
    g = world['growth']
    for card in SKILL_CARDS:
        assert str(card) in world['items'] or card in world['items'], card  # (tools/build_items.py BASE)
        sid = items[card]['base_damage']
        for k in [sid, *build_growth.ids(table[sid]['cha_skill_same_no'])]:
            if str(k) in g['skills'] or k in g['skills']:
                continue
            r = table[k]
            fx = {c2: (h['s2t'](v) if isinstance(v, str) else v) for c, c2 in build_growth.FX.items() if (v := r[c]) not in (0, '0', '')}
            g['skills'][k] = {'n': h['s2t'](r['cha_skill_mozi_set']), 'm': h['s2t'](r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                              'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                              'same': build_growth.ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                              'old': build_growth.ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
        g['cards'][card] = sid

    # ---------- move names ----------
    db = D('skills')
    for sid, sk in world['skills'].items():
        if KANA.search(sk['name']):
            raw = db[int(sid)]['name']  # '(user)move', 'user)move' or 'user(move' (エビ(氷結攻撃全体)
            base = raw.split(')', 1)[1] if ')' in raw else raw.split('(', 1)[1]
            assert base in MOVES, (sid, raw)
            sk['name'] = MOVES[base]

    recaps(world, h, z3)
    bgm(world, root)


# ---------- Z3 / Z4 概況 ----------
def recaps(world, h, z3):
    D, root = h['D'], h['root']
    file = z3['file']
    sizes = {}

    def size(path):
        if path not in sizes:
            sizes[path] = Image.open(os.path.join(root, 'game', path)).size
        return sizes[path]

    page = next(p['list'] for p in D('map007')['events']['2']['pages']
                if p['condition']['variable_valid'] and p['condition']['variable_value'] == 201)
    picks, cur = {}, None
    for c in page:
        k, p = c['code'], c['parameters']
        if k == 111 and c['indent'] == 1 and p[0] == 1 and p[1] == 43 and p[2] == 0 and RECAP[0] <= p[3] <= RECAP[1] \
                and p[3] not in Z3B_RECAP:
            cur = picks[p[3]] = {}
        elif k == 412 and c['indent'] == 1:
            cur = None
        elif cur is not None:
            if k == 241:
                cur['bgm'] = p[0]['name']
            elif k == 117:
                cur['ce'] = p[0]
    ce = D('commonevents')
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    src = re.sub(r'^=begin.*?^=end[^\n]*', '', src, flags=re.S | re.M)  # (2438: a =begin … =end after it)
    blocks = build_zg_a.z1field_blocks(src)
    recap, scenes, inc = {}, {}, {}
    for v43, pk in sorted(picks.items()):
        nodes = z3['nodes_of'](ce[pk['ce']]['list'], faces={})
        v41 = None

        def walk(ns):
            nonlocal v41
            out = []
            for n in ns:
                if n.get('var') and n['var'][0] == 41:
                    op, x = n['var'][1], n['var'][2]
                    if op == 0:
                        v41 = x
                        n = {'var': [41, 0, x + OFFSET]}
                    else:
                        v41 += x if op == 1 else -x
                elif 'v41' in n:
                    v41 = n['v41']
                    n = {'v41': v41 + OFFSET}
                for k in ('then', 'else'):
                    if k in n:
                        n[k] = walk(n[k])
                out.append(n)
                if n.get('z1field'):
                    if v41 not in scenes:
                        scenes[v41], inc[v41] = scene34(blocks.get(v41, []), file, size)
                    if inc[v41]:  # `$game_variables[41] += 1` at the end of the scene: the next call draws the next one
                        v41 += 1
                        out.append({'var': [41, 1, 1]})
            return out
        recap[str(v43)] = {'bgm': pk['bgm'], 'ce': pk['ce'], 'nodes': walk(nodes)}
    world['z3']['z34Recap'] = {'recap': recap, 'scenes': {str(n + OFFSET): d for n, d in sorted(scenes.items())}}
    pics = {it[0] for d in scenes.values() for it in d['ene'] + d['play'] if not it[0].startswith('@')} | {d['bg'] for d in scenes.values() if d['bg']}
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)
    world['extraBgm'] = sorted(set(world['extraBgm']) | {r['bgm'] for r in recap.values()})


def scene34(body, file, size):
    """a z1field scene → (build_zg_a.scene_of's format, whether it moves variable 41 on); also: `$partyc[k]` faces
    (['@pc', k, 0, 64, 64, dx, dy]: the k-th of the party), a `for x in 0..n - 1` row of faces, an unknown number (2722:
    nothing, as clear_chr leaves it)"""
    lines, inc, local = [], False, {}
    i = 0
    while i < len(body):
        t = body[i].split('#')[0].strip()
        i += 1
        if t == '$game_variables[41] += 1':
            inc = True
            continue
        m = re.match(r'([a-z_]\w*) = (\d+)$', t)
        if m:  # a local number (temptekiput = 9)
            local[m.group(1)] = int(m.group(2))
            continue
        m = re.match(r'for x in 0\.\.(.+)$', t)
        if m:
            n = build_zg_a.at(sub(m.group(1), local)) + 1
            loop = []
            while body[i].split('#')[0].strip() != 'end':
                loop.append(body[i].split('#')[0].strip())
                i += 1
            i += 1
            for x in range(n):
                lines += [sub(l, {**local, 'x': x}) for l in loop]
            continue
        m = re.match(r'rect,picture = set_character_face 0,\$partyc\[(\d+)\]-3,1$', t)
        if m:  # (marked as row 9000 + k, turned into '@pc' below)
            lines.append(f'rect,picture = set_character_face 0,{9000 + int(m.group(1))},1')
            continue
        lines.append(t)
    d = build_zg_a.scene_of(lines, file, size)
    for it in d['ene'] + d['play']:
        if it[0] == '@cf' and it[2] >= 64 * 9000:
            it[0], it[1], it[2] = '@pc', it[2] // 64 - 9000, 0
    return d, inc


def sub(t, names):
    for k, v in sorted(names.items(), key=lambda kv: -len(kv[0])):
        t = re.sub(rf'\b{k}\b', str(v), t)
    return t


# ---------- battle music ----------
def bgm(world, root):
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    lines = src.split('\n')
    consts = {m.group(1): int(m.group(2)) for m in re.finditer(r'^\$(bgm_no_\w+)\s*=\s*(\d+)', src, re.M)}
    num = lambda k: int(k) if k.isdigit() else consts[k.lstrip('$')]

    def body(defname):
        start = next(i for i, l in enumerate(lines) if re.match(rf'\s*def {defname}\b', l))
        end = next(i for i in range(start + 1, len(lines)) if re.match(r'^  (def |#-)', lines[i]))
        return lines[start + 1:end]

    def names(defname):
        out, cur = {}, None
        for l in body(defname):
            m = re.match(r'^    when (\S+)\s*(#.*)?$', l)
            if m:
                cur = num(m.group(1))
                continue
            m = re.search(r'_modetype\s+(\$\w+ \+ )?"([^"]*)"', l)
            if cur is not None and m:
                out[cur] = [None if m.group(1) else m.group(2), None]  # ($btl_user_name + "1": the player's own files)
            m = re.search(r'return\s+"([^"]*)"', l)
            if cur is not None and m and cur in out:
                out[cur][1] = m.group(1)
        return {k: v for k, v in out.items() if k <= 1 or (v[0] and os.path.exists(os.path.join(root, 'game', 'Audio', 'BGM', v[0] + '.ogg')))}

    def rules(defname, var):
        """the `if …` blocks: [[or-terms], [numbers], on] — terms ['sw', n, on] / ['v40', k] (variable 40 >= k)"""
        out, stack = [], []
        b = body(defname)
        for k, l in enumerate(b):
            t = l.split('#')[0].strip()
            if t.startswith('if '):
                if 'FileTest' in t or '$max_battle_bgm' in t:  # (the player's own files; the base rule: battleMax)
                    stack.append(None)
                    continue
                terms = []
                for part in t[3:].split('||'):
                    part = part.strip()
                    m = re.fullmatch(r'\$game_switches\[(\d+)\](?:\s*==\s*(true|false))?', part)
                    if m:
                        terms.append(['sw', int(m.group(1)), m.group(2) != 'false'])
                        continue
                    m = re.fullmatch(r'\$game_variables\[40\]\s*>=\s*(\d+)', part)
                    assert m, part
                    terms.append(['v40', int(m.group(1))])
                stack.append([terms, [], True])
                out.append(stack[-1])
            elif t == 'end' and stack:
                stack.pop()
            elif stack and stack[-1] is not None:
                m = re.fullmatch(rf'\${var}\[(.+)\] = (true|false)', t)
                if m and m.group(1) == 'x':
                    loop = next(re.fullmatch(r'for x in (\d+)\.\.(\d+)', b[j].strip()) for j in range(k - 1, -1, -1) if b[j].strip().startswith('for'))
                    stack[-1][1] += list(range(int(loop.group(1)), int(loop.group(2)) + 1))
                    stack[-1][2] = m.group(2) == 'true'
                elif m:
                    stack[-1][1].append(num(m.group(1)))
                    stack[-1][2] = m.group(2) == 'true'
        return [r for r in out if r[1]]

    battle, ready = names('set_battle_bgm_name'), names('set_battle_ready_bgm_name')
    world['sys']['bgm'] = {
        # $max_battle_bgm by variable 40 (chk_scenario_progress, all.rb 20298): numbers up to it are on
        'battle': {str(k): v for k, v in sorted(battle.items())}, 'battleMax': [11, 13, 16, 22],
        'battleRules': rules('chk_battle_bgm_on', 'battle_bgm_on'),
        'ready': {str(k): v for k, v in sorted(ready.items())}, 'readyBase': [0, 2, 3, 4, 5],  # (12056)
        'readyRules': rules('chk_battle_ready_bgm_on', 'battle_ready_bgm_on'),
    }
    files = {v[0] for v in list(battle.values()) + list(ready.values()) if v[0]}
    world['extraBgm'] = sorted(set(world['extraBgm']) | files)
