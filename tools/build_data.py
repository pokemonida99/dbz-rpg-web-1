#!/usr/bin/env python3
"""Builds data/world.json (maps, party, enemies, skills, story text) from the JSON dumped by tools/extract.rb.

Text is converted to Traditional Chinese here, at build time (tools/s2t.py).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from s2t import s2t  # noqa: E402

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda n: json.load(open(os.path.join(root, 'data', n + '.json'), encoding='utf-8'))


def table(t):
    return t['data'], t['x'], t['y'], t['z']


def build_map(mid, rows=None):
    m = D('map%03d' % mid)
    data, w, h, z = table(m['data'])
    h = rows or h
    layers = [[data[x + (y + k * m['data']['y']) * w] for y in range(h) for x in range(w)] for k in range(z)]
    return {'w': w, 'h': h, 'layers': layers, 'bgm': m['bgm']['name']}


actors = D('actors')
classes = D('classes')


skills_db = D('skills')
enemies_db = D('enemies')


def exp_curve(basis, infl, final=99):
    """Level curve from KGC_LimitBreak (153_KGC_LimitBreak.rb:414), see docs/battle-rules.md §6."""
    m, n, exp = float(basis), 0.75 + infl / 200.0, [0, 0]
    lv, num = [28, 61, 100], [2500, 4500, 6500]
    for i in range(2, final + 1):
        e = exp[i - 1] + int(m)
        for k in range(3):
            if i >= lv[k]:
                e += num[k] * (i - lv[k]) + (e - exp[i - 1]) // 95
                if k > 0:
                    e += num[k] * (i - lv[k])
        exp.append(e)
        m *= 1 + n
        n *= 0.9
    return exp


def actor(aid, face, name, sprite, beam, skills, ray='orange'):
    a = actors[aid]
    t = a['parameters']
    params = [[t['data'][k + lv * t['x']] for k in range(6)] for lv in range(t['y'])]
    return {'name': name, 'face': face, 'school': a['class_id'] - 1, 'level': a['initial_level'],
            'params': params, 'exp': exp_curve(a['exp_basis'], a['exp_inflation']),
            'sprite': 'Graphics/Pictures/' + sprite, 'beam': 'Graphics/Pictures/' + beam, 'skills': skills,
            # special-move sheet (the original builds it as "戦闘_必殺技_" + name) and the colour of its ki
            'special': 'Graphics/Pictures/' + sprite.replace('Z1_戦闘_', 'Z1_戦闘_必殺技_'), 'ray': ray}


# enemy skill names are Japanese-only in the data
SKILL_NAMES = {301: '麻痺液', 302: '能量彈', 305: '能量波', 306: '貫光線', 310: '能量波', 311: '強力能量波', 384: '大猿變身'}


def skill(sid):
    k = skills_db[sid]
    return {'id': sid, 'name': SKILL_NAMES.get(sid) or s2t(k['description'] or k['name']), 'power': k['base_damage'],
            'ki': k['mp_cost'], 'all': k['scope'] == 2, 'noDamage': 11 in k['element_set']}


def enemy(eid):
    e = enemies_db[eid]
    return {'name': s2t(e['name']), 'maxhp': e['maxhp'], 'atk': e['atk'], 'def': e['def'], 'agi': e['agi'],
            'school': int(e['hit']) - 1, 'eva': max(1, int(e['eva'])), 'exp': int(e['exp']), 'gold': int(e['gold']),
            'actions': [{'skill': a['skill_id'], 'cond': a['condition_type'], 'param': a['condition_param2']} for a in e['actions']],
            # the original builds the file name from the (simplified) database name
            'sprite': 'Graphics/Pictures/Z1_戦闘_必殺技_敵_' + e['name'] + '.PNG',
            'portrait': 'Graphics/Pictures/Z1_戦闘_敵_' + e['name'] + '.PNG', 'faceRight': False}


ENEMIES = [1, 2, 4, 5, 10]  # Raditz-area field enemies + Raditz
PARTY_SKILLS = {3: [1, 2, 5], 4: [31, 33, 34, 35, 36]}  # what Goku / Piccolo know at the start of Z1

# ---------- original events → data the game runs (src/events.js) ----------
# The original's story text lives in Map007 event 1, one page per value of variable 41; the field decides which
# page to run from the spot the player stands on (145_Event_Check.rb). Pages are converted command by command
# (text, branches, switches, variables, sounds, choices) so no line of the original is dropped.
ESC = re.compile(r'\\[|.><^!]|\\[NV]\[\d+\]')
SPEAKER = re.compile(r'^([^「」\s　]{1,8})「(.*)$', re.S)


def boxes(lines):
    """One message window → [[speaker, text], ...] ('' = narration). 「」 are dropped, indents trimmed."""
    out, open_ = [], False  # open_: the last speaker's 「 is not closed yet
    for raw in lines:
        t = s2t(ESC.sub('', raw)).rstrip()
        m = SPEAKER.match(t)
        body = t.strip('　 ')
        if m and not re.search('」.', m.group(2)):  # 獲得「…」的卡片 is narration, not a speaker
            out.append([m.group(1), m.group(2)])
            open_ = not m.group(2).endswith('」')
        elif body and out and (open_ or not out[-1][0]):
            out[-1][1] += '\n' + body
            open_ = open_ and not body.endswith('」')
        elif body:
            out.append(['', body])
            open_ = False
    for b in out:
        b[1] = b[1].rstrip('　 ')
        if b[0] and b[1].endswith('」'):
            b[1] = b[1][:-1]
    return out


def cond(p):
    if p[0] == 0:  # switch is ON (0) / OFF (1)
        return ['sw', p[1], p[2] == 0]
    if p[0] == 1 and p[2] == 0:  # variable vs constant: == >= <= > < !=
        return ['var', p[1], p[3], p[4]]
    return ['never']


def script(lst):
    i = 0

    def block(ind):
        nonlocal i
        out = []
        while i < len(lst):
            c = lst[i]
            code, p = c['code'], c['parameters']
            if c['indent'] < ind:
                return out
            if code == 101:
                i += 1
                lines = []
                while i < len(lst) and lst[i]['code'] == 401:
                    lines.append(lst[i]['parameters'][0])
                    i += 1
                for b in boxes(lines):
                    out.append({'say': b})
                continue
            if code == 111:
                i += 1
                node = {'if': cond(p), 'then': block(ind + 1), 'else': []}
                if i < len(lst) and lst[i]['code'] == 411:
                    i += 1
                    node['else'] = block(ind + 1)
                if i < len(lst) and lst[i]['code'] == 412:
                    i += 1
                out.append(node)
                continue
            if code == 102:
                i += 1
                node = {'choice': [s2t(x) for x in p[0]], 'branches': [[] for _ in p[0]]}
                while i < len(lst) and lst[i]['code'] in (402, 403):
                    k = lst[i]['parameters'][0] if lst[i]['code'] == 402 else None
                    i += 1
                    body = block(ind + 1)
                    if k is not None:
                        node['branches'][k] = body
                if i < len(lst) and lst[i]['code'] == 404:
                    i += 1
                out.append(node)
                continue
            if code == 121:
                out.append({'sw': [p[0], p[1], p[2] == 0]})
            elif code == 122 and p[3] == 0:
                out.append({'var': [p[0], p[2], p[4]]})  # op: 0 set, 1 add, 2 sub
            elif code == 250:
                out.append({'se': p[0]['name']})
            elif code == 126:
                out.append({'item': [p[0], -p[3] if p[1] else p[3]]})
            elif code == 119 and p[0] == '終了':
                out.append({'end': True})
            i += 1
        return out

    return block(0)


EVENT_PAGES = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['1']['pages'] if p['condition']['variable_valid']}
ev = lambda v: script(EVENT_PAGES[v])

# Map 1 spots (145_Event_Check.rb "Z1フィールド1"), with the original event each one runs. `effect` is what this
# version adds on top: rest = full HP/KI + save, ki = KI only, save = save only.
INNS = [(13, 21), (30, 15), (2, 11), (19, 5), (44, 11), (53, 20)]
CARD_SHOPS = [(7, 3), (30, 9), (57, 19), (61, 27)]  # card shops in the original; save points here for now
TRAINING = [(30, 5), (25, 20), (53, 19)]  # training halls in the original; KI recovery here for now
MAP1_SPOTS = [
    {'x': 15, 'y': 16, 'label': '進入龜仙屋', 'event': 51, 'effect': 'rest'},
    {'x': 2, 'y': 12, 'label': '拜訪布爾瑪', 'event': 52, 'effect': 'rest'},
    {'x': 41, 'y': 21, 'label': '和海龜說話', 'event': 53},
    {'x': 33, 'y': 2, 'label': '和村民說話', 'event': 76},
    {'x': 50, 'y': 12, 'label': '和村民說話', 'event': 77},
    {'x': 26, 'y': 2, 'label': '和村民說話', 'event': 78},
] + [{'x': x, 'y': y, 'label': '進入旅館', 'event': 11, 'effect': 'rest'} for x, y in INNS] \
  + [{'x': x, 'y': y, 'label': '記錄', 'effect': 'save', 'lines': [['', '這是一個 Z 標記。\n在這裡記錄了冒險的進度。']]} for x, y in CARD_SHOPS] \
  + [{'x': x, 'y': y, 'label': '在修行場修行', 'effect': 'ki', 'lines': [['', '在修行場靜下心來修行……'], ['', '全員的 KI 恢復了！']]} for x, y in TRAINING]
# the opening (page for variable 41 = 1), without the Chinese fan-translation notice at its start
INTRO = [n for n in ev(1) if not ('say' in n and re.search('漢化|交流群|翻譯|付費', n['say'][1]))]
for _n in INTRO:  # the stranger is Raditz: the original shows his face in these scenes; [who, text, face]
    if 'say' in _n and _n['say'][0] == '？':
        _n['say'].append('拉蒂茲')
INTRO.append({'say': ['', '拖曳畫面任何地方就能飛行。\n拉蒂茲在地圖的右上方！']})  # this version's controls
# after Raditz (variable 41 = 60): up to the Saiyans setting off for Earth; the rest is the next chapter
_after = ev(60)
_cut = next(k for k, n in enumerate(_after) if 'say' in n and '開始向地球移動' in n['say'][1])
ENDING = _after[:_cut + 1]
EVENTS = {str(v): ev(v) for v in {s['event'] for s in MAP1_SPOTS if 'event' in s} | {58, 60}}

# Who gets which face in the dialogue box (Z1_顔味方 = party, Z1_顔イベント = others, Z1_顔敵 row = enemy id);
# rows from 143_Event_Main.rb.
FACE_PARTY, FACE_EVENT, FACE_FOE = 'Graphics/Pictures/Z1_顔味方.PNG', 'Graphics/Pictures/Z1_顔イベント.PNG', 'Graphics/Pictures/Z1_顔敵.PNG'
FACES = {s2t(n): [FACE_PARTY, r] for n, r in [('悟空', 0), ('比克', 1), ('克林', 3), ('天津饭', 5), ('饺子', 6)]}
FACES.update({s2t(n): [FACE_EVENT, r] for n, r in [
    ('悟饭', 0), ('龟仙人', 1), ('蛇姫', 2), ('布尔玛', 3), ('普尔', 5), ('卡林大人', 8), ('波波', 10), ('爷爷', 11),
    ('天神', 14), ('琪琪', 15), ('界王', 18), ('神龙', 19), ('乌龙', 20), ('海龟', 29), ('牛魔王', 30)]})
for eid, e in enumerate(enemies_db):
    if e and 0 < eid < 30 and e['name']:
        FACES.setdefault(s2t(e['name']), [FACE_FOE, eid])


world = {
    'passages': D('system')['passages'],
    'maps': {'1': build_map(1, rows=28)},
    'pois': {'1': MAP1_SPOTS},
    'events': EVENTS,
    'faces': FACES,
    'start': {'x': 16, 'y': 17},
    'titleBgm': 'Z1 オープニング',
    'party': [3, 4],
    'actors': {3: actor(3, 0, '悟空', 'Z1_戦闘_ゴクウ.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', PARTY_SKILLS[3]),
               4: actor(4, 1, '比克', 'Z1_戦闘_ピッコロ.PNG', 'Z1_戦闘_必殺技_エネルギー波(緑).PNG', PARTY_SKILLS[4], 'green')},
    'enemies': {eid: enemy(eid) for eid in ENEMIES},
    'skills': {sid: skill(sid) for sid in sorted({x for v in PARTY_SKILLS.values() for x in v} | {301, 302, 305, 306, 310, 311, 384})},
    'encounters': {'1': [1, 2, 4, 5]},
    'boss': {'x': 58, 'y': 5, 'enemy': 10},
    # the original story text (Map007 event 1): the opening, before and after Raditz
    'story': {'intro': INTRO, 'boss': EVENTS['58'], 'ending': ENDING},
}
import build_chapter2  # noqa: E402  (chapter 2: Snake Way and the Sansho area)
build_chapter2.add(world, globals())
json.dump(world, open(os.path.join(root, 'data', 'world.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('world.json written')
