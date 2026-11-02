"""絕望的反抗（Map007 事件 12，頁 3500～）＋另一個結局（事件 13，頁 3801～）：Z4 時之間的門 9781／9791，地圖 55 — world.json
data (read by src/tr_future.js), added by tools/build_timeroom.py. Plan: docs/zg-plan.md; the whole flow is in
docs/tr-future.md.

The original:
  door 9781 of the Z4 hall (map 85 (38,2), open with switch 458): variable 41 = 3500 → Map007 event 12
    3500 「在通关之前无法回到时之间　要移动吗？」 (否: one square down) → 3501 (CE230, CE166, party [25]: 未来悟飯) → 3521
    → 3571 → map 55 (14,40); 145_Event_Check.rb `when 55`: (56-57, 5-6) → 3621 → battle_process 3631 (17号,
    18号; variable 94 = 4 turns, a loss goes on too: variable 239) → 3641 (by switches 142 / 143) → set_battle_event 14
    (a film) → 3661 → 3681 (switch 569: the next door opens) → CE167 → 9782 (CE182, map 85 (38,3))
  door 9791 (43,2), open with switch 569: variable 41 = 3801 → event 13: 3801 (CE62, CE166, party [17], CE213 the tank
    top) → 3821 (CE212 the battle suit) → set_battle_event 15 → 3841 → set_battle_event 16 → 3861 (switches 437, 570 …,
    CE179 when switch 459 is on) → CE167, CE210, CE61 → 9792 (CE182, map 85 (43,3))
Scenes: 143_Event_Main.rb z1field 3501-3694 / 3801-3862 (all.rb 178609-179320), drawn by src/tr_future.js.
"""
import os
import re
import sys

KEY = 'trfuture'
P = lambda n: f'Graphics/Pictures/{n}'
PAGES1 = [3500, 3501, 3521, 3571, 3621, 3641, 3661, 3681]  # Map007 event 12
PAGES2 = [3801, 3821, 3841, 3861]  # event 13
SPLIT = {3621}  # pages that end in a battle_process: [before, after]
# battle_process 3631 (all.rb 183094): 17号 and 18号, $Battle_MapID = 1, set_bgm = $bgm_no_ZSA2_bgm01_for_gb
BATTLE = {'no': 3631, 'foes': [125, 124], 'row': 1, 'bgm': 'bgm_no_ZSA2_bgm01_for_gb'}
# map 55 events 34 / 35 (enemy1.png character 5, facing left / right): 145_Event_Check.rb `when 55` (56-57, 5-6) → 3621
ANDROIDS = [{'x': 56, 'y': 6, 'index': 5, 'row': 1, 'key': '3621'}, {'x': 57, 'y': 6, 'index': 5, 'row': 2, 'key': '3621'}]
# set_battle_event 14 / 15 / 16 (all.rb 52803): who attacks whom ($attack_order: 0.. the party, 10.. the enemies;
# actions 1 = a plain attack, 188 = ヒートドームアタック (move 178), the enemies' 429 = a strong wave: 18号's 453)
FILMS = {
    3651: {'party': 26, 'foes': [124, 125], 'acts': [[True, 0, None], [True, 1, None], [False, 0, 453]]},
    3831: {'party': 20, 'foes': [127, 127], 'acts': [[True, 0, None], [True, 0, None], [False, 0, None], [True, 0, None],
                                                     [True, 0, None], [False, 1, None], [True, 0, None]]},
    3851: {'party': 20, 'foes': [127], 'acts': [[True, 0, 178]]},
}
# CE49 / 51 / 53 / 55 (→ CE45): the auras at (178,128) (variables 97 / 98), the two bodies at (99, 100) (CE53 / 55: 146 px left)
TRANSFORM = {
    49: {'aura': 'トランクス', 'body': ['Z3_スーパーサイヤ人トランクス1', 'Z3_スーパーサイヤ人トランクス2'], 'x': 178},
    51: {'aura': '悟空', 'body': ['Z3_スーパーサイヤ人未来悟飯1', 'Z3_スーパーサイヤ人未来悟飯2'], 'x': 178},
    53: {'aura': 'トランクス', 'body': ['Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ）_01', 'Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ）_02'], 'x': 32},
    55: {'aura': 'トランクス', 'body': ['Z3_スーパーサイヤ人トランクス（戦闘服・髪結）_01', 'Z3_スーパーサイヤ人トランクス（戦闘服・髪結）_02'], 'x': 32},
}
INLINE = {62, 61, 179, 210, 211, 212, 213, 214}  # common events converted as they are (switches, variable 173, moves)
# CE9 必殺技設定 (未来悟飯 / 超未来悟飯), CE230 (their uses: cha_tec_puls, once — switch 450)
GOHAN = {25: [236, 237, 238, 240, 241, 245], 26: [236, 237, 238, 240, 241, 242]}
GOHAN_USES = {236: 600, 237: 400, 238: 300, 240: 200, 241: 150, 242: 100, 245: 50}


def faces_of(z3):
    """the speakers' faces (the original's message boxes have none; the remake shows the one the scene draws):
    who → [[from variable 41, face], …] (the last one at or below the scene number shown)"""
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    zg, long_, kit = P('ZG_顔味方.PNG'), P('Z3_顔味方_トランクス長髪.PNG'), P('Z3_顔味方_衣替え.png')
    return {
        '悟飯': [(0, [P3, 2]), (3521, [E3, 30]), (3575, [E3, 31]), (3591, [P3, 22]), (3641, [P3, 23]), (3661, [P3, 22])],
        '特蘭克斯': [(0, [E3, 16]), (3521, [E3, 29]), (3671, [P3, 14]), (3674, [P3, 17]), (3683, [P3, 14]),
                  (3801, [kit, 13]), (3806, [kit, 14]), (3814, [kit, 13]), (3821, [long_, 1]), (3827, [zg, 17]), (3862, [long_, 1])],
        '布爾瑪': [(0, [E3, 26]), (3821, [E3, 57])], '琪琪': [(0, [E3, 27])], '牛魔王': [(0, [E3, 28])],
        '17號': [(0, [F3, 25])], '18號': [(0, [F3, 24])], '沙魯': [(0, [F3, 27])],
        '克林': [(0, [P3, 3])], '貝吉塔': [(0, [P3, 9])],
        '龜仙人': [(0, [CARD, 9, 2])], '烏龍': [(0, [CARD, 20, 2])], '普爾': [(0, [CARD, 11, 2])],
        '男': [(0, [E3, 0])], '女': [(0, [E3, 4])], '老人': [(0, [E3, 12])],
    }


def add(world, h, z3, tr):
    build_map, D, s2t, actor, skill, script, root = (h[k] for k in ('build_map', 'D', 's2t', 'actor', 'skill', 'script', 'root'))
    file = z3['file']
    sys.path.insert(0, os.path.dirname(__file__))
    import build_z3  # noqa: E402  (bgm_names)
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    cdb = D('commonevents')
    ev7 = D('map007')['events']

    # ---------- 未来悟飯 (25) / 超未来悟飯 (26): only if they are not there yet (tools/build_zg_a.py defines them; as
    # tools/build_z4f.py does for 18 / 21 / 23): CE9's moves, the Z3 battle sheets ----------
    have = lambda d, k: k in d or str(k) in d
    for aid, jp in ((25, 'ゴハン(未来)'), (26, 'ゴハン(未来超)')):
        if have(world['actors'], aid):
            continue
        a = actor(aid, aid - 3, '未來悟飯', f'Z3_戦闘_{jp}.png', 'Z1_戦闘_必殺技_エネルギー波.PNG', GOHAN[aid], ray='green')
        a['special'] = file(f'Z3_戦闘_必殺技_{jp}')
        assert a['special'] and file(f'Z3_戦闘_{jp}') == a['sprite'], jp
        if aid == 26:
            a['ss'] = 25
        world['actors'][aid] = a
    for sid in sorted(set(GOHAN[25] + GOHAN[26]) | {178, 181}):
        if not have(world['skills'], sid):
            world['skills'][sid] = skill(sid)
            if sid == 245:
                world['skills'][sid].update(name='超賽變身', ss=True)  # (like 29 / 133: no damage, the user turns)

    # ---------- map 55 Z4未来悟飯編: the field after page 3601 (no encounters, only 17号 and 18号 at the top) ----------
    m = build_map(55, rows=59)  # (row 59: the original's control events)
    m['ev'] = [e for e in tr['map_events'](D, 55, 59, tr['sheets']) if (e[0], e[1]) not in {(56, 6), (57, 6)}]
    world['maps']['55'] = m
    world['areas']['55'] = None
    world['bosses']['55'] = [dict(b, sheet='Graphics/Characters/enemy1.png') for b in ANDROIDS]

    # ---------- the pages ----------
    EXTRA, OPTS = h['EXTRA'], h['OPTS']

    def code355(p):
        t = p[0].strip()
        if re.match(r'\$partyc\s*=\s*\[', t):
            ids = [int(x) for x in re.findall(r'\d+', t)]
            return [{'partyc': ids}, {'x': 'trfParty', 'ids': ids}]
        m = re.match(r'(on|off)_super_saiyazin (\d+)$', t)
        if m:
            return [{'x': 'trfSs', 'no': int(m.group(2)), 'on': m.group(1) == 'on'}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        return []  # ($eve, $chadead, all_charecter_recovery_giri, $game_variables[42]: src/tr_future.js keeps them)

    def ce(p):
        n = p[0]
        if n in TRANSFORM:
            return [{'x': 'trfTransform', 'ce': n}]
        if n == 230:
            return [{'x': 'trfUses'}]
        if n in INLINE:
            return script(cdb[n]['list'])
        return []  # (CE166 / 167 / 182: src/tr_future.js keeps and puts back the party)

    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        223: lambda p: [{'x': 'trfTone', 'white': p[0][0] > 0, 'frames': p[1], 'wait': p[2]}],  # (white / back to normal)
        122: lambda p: [{'x': 'trfVarVar', 'to': p[0], 'from': p[4]}] if p[3] == 1 and p[2] == 0 else [],
        251: lambda p: [{'x': 'trfSeStop'}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    faces = faces_of(z3)
    used = {}

    def speak(ns, v41):
        """say[2] = the speaker's face by the scene number (variable 41) the page has reached"""
        for n in ns:
            if 'v41' in n:
                v41 = n['v41']
            if n.get('var') and n['var'][0] == 41:
                v41 = n['var'][2] if n['var'][1] == 0 else v41 + (n['var'][2] if n['var'][1] == 1 else -n['var'][2])
            if 'say' in n and n['say'][0] in faces:
                who = n['say'][0]
                k = max(i for i, (lo, _) in enumerate(faces[who]) if lo <= v41)
                key = f'{KEY}:{who}:{k}'
                used[key] = faces[who][k][1]
                n['say'] = [who, n['say'][1], key]
            for k in ('then', 'else', 'loop'):
                if k in n:
                    v41 = speak(n[k], v41)
            for b in n.get('branches', []):
                speak(b, v41)
        return v41

    def page(raw, v):
        ns = [{'v41': v}] + z3['nodes_of'](raw[v], faces={})
        speak(ns, v)
        return ns

    raw12 = {p['condition']['variable_value']: p['list'] for p in ev7['12']['pages'] if p['condition']['variable_valid']}
    raw13 = {p['condition']['variable_value']: p['list'] for p in ev7['13']['pages'] if p['condition']['variable_valid']}
    pages = {}
    for raw, vs in ((raw12, PAGES1), (raw13, PAGES2)):
        for v in vs:
            ns = page(raw, v)
            pages[f'{KEY}:{v}'] = z3['split_battle'](ns) if v in SPLIT else ns
    EXTRA.clear()
    OPTS.update(bgm=False, shakeSw=False)
    world['z3']['pages'].update(pages)
    world['faces'].update(used)

    # ---------- the battle, the films ----------
    consts, names = build_z3.bgm_names(src)
    b = {'foes': BATTLE['foes']}
    if consts.get(BATTLE['bgm']) in names:
        b['bgm'] = names[consts[BATTLE['bgm']]]
    world['z3']['battles'][str(BATTLE['no'])] = b
    battlers = {
        26: [P('Z3_戦闘_ゴハン(未来超).png'), P('Z3_戦闘_必殺技_ゴハン(未来超).png')],
        20: [P('ZG_戦闘_トランクス(超).PNG'), P('ZG_戦闘_必殺技_トランクス(超).PNG')],  # (variable 173 = 1: the battle suit)
    }
    for v in battlers.values():
        for p in v:
            assert file(os.path.splitext(p.split('/')[-1])[0]) == p, p
    films = {str(no): dict(f, sheets=battlers[f['party']]) for no, f in FILMS.items()}
    transform = {}
    for n, t in TRANSFORM.items():
        auras = [file(f'Z3_スーパーサイヤ人_{t["aura"]}_気{k}') for k in (1, 2, 3)]
        bodies = [file(x) for x in t['body']]
        assert None not in auras + bodies, n
        transform[str(n)] = {'auras': auras, 'bodies': bodies, 'x': t['x']}

    # ---------- the rest ----------
    t = {'goal': '目標：' + s2t('对绝望的反抗!! 残存的超级战士') + '（前往東北方的人造人那裡）'}
    world['trFuture'] = {
        'start': {'map': '55', 'x': 14, 'y': 40},  # the end of page 3571
        'back1': {'map': '85', 'x': 38, 'y': 3}, 'back2': {'map': '85', 'x': 43, 'y': 3},  # 9782 / 9792
        'backdrop': f'bg/z3_battle_{BATTLE["row"]}.png', 'films': films, 'transform': transform,
        'filmBackdrop': 'bg/z3_battle_1.png',  # ($Battle_MapID = 1 for all three)
        'uses': GOHAN_USES, 'ssBack': file('Z3_スーパーサイヤ人_バック'), 'text': t,
    }

    # ---------- what the scenes and films need (tools/copy_assets.py) ----------
    names_ = ['ZG_背景_ゴクウの家', 'Z3_背景_街', 'Z3_背景_草原', 'Z3_背景_タイムマシンp2', 'ZG_背景_ブルマの家',
              'ZG_顔味方', 'Z3_顔味方_トランクス長髪', 'Z3_顔味方_衣替え', 'Z3_スーパーサイヤ人_バック']
    pics = {file(n) for n in names_} | {z3['P3'], z3['E3'], z3['F3'], z3['CARD']}
    assert None not in pics, [n for n in names_ if not file(n)]
    pics |= {p for v in battlers.values() for p in v} | {p for x in transform.values() for p in x['auras'] + x['bodies']}
    pics |= {(world['actors'].get(a) or world['actors'][str(a)])[k] for a in (25, 26) for k in ('sprite', 'special')} | {'Graphics/Characters/enemy1.png'}
    pics |= {world['enemies'][e][k] for e in (124, 125, 127) for k in ('sprite', 'portrait')}
    se, bgm = {'Z1 敵発見', 'Z3 変身', 'Z1 入る'}, {m['bgm'], 'DB3 イベント06'} | ({b['bgm']} if 'bgm' in b else set())

    def walk(x):
        if isinstance(x, dict):
            if isinstance(x.get('se'), str):
                se.add(x['se'])
            if isinstance(x.get('bgm'), str) and x['bgm']:
                bgm.add(x['bgm'])
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(pages)
    audio = os.path.join(root, 'game', 'Audio')
    missing = [n for n in se if not os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))] + \
              [n for n in bgm if not os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))]
    assert not missing, missing
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm)
    world['fieldSe'] = sorted(set(world['fieldSe']) | se)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)
