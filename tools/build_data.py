#!/usr/bin/env python3
"""Builds data/world.json (maps, party, enemies, skills, story text) from the JSON dumped by tools/extract.rb.

Text is converted to Traditional Chinese here, at build time (tools/s2t.py).
"""
import json, os, sys
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

# Interactive spots, found from the building tiles on the map (layer 2). Text is written for this version.
POI_KINDS = {
    208: {'label': '進入龜仙屋', 'effect': 'rest', 'lines': [['龜仙人', '回來啦！　先在這裡好好休息一下吧。'], ['', 'HP 和 KI 全部恢復了！　（已自動存檔）']]},
    209: {'label': '拜訪民家', 'effect': None, 'lines': None},
    210: {'label': '拜訪布爾瑪', 'effect': 'rest', 'lines': [['布爾瑪', '孫悟空！？　悟飯被抓走了！？'], ['布爾瑪', '那個長尾巴的傢伙在東北邊的山區！\n先在我家休息一下再出發吧！'], ['', 'HP 和 KI 全部恢復了！　（已自動存檔）']]},
    211: {'label': '調查坑洞', 'effect': None, 'lines': [['', '地面被炸出一個巨大的坑洞……\n是那個賽亞人的太空艙降落的痕跡！']]},
    212: {'label': '在祠堂修行', 'effect': 'ki', 'lines': [['', '在古老的祠堂靜下心來修行……'], ['', '全員的 KI 恢復了！']]},
    3: {'label': '記錄', 'effect': 'save', 'lines': [['', '這是一個 Z 標記。\n在這裡記錄了冒險的進度。']]},
}
VILLAGERS = [
    [['村民', '聽說有個長尾巴的怪人從天上掉下來…\n還一拳打倒了好幾個人！']],
    [['老奶奶', '最近怪物變多了，\n連甜菜人都跑到村子附近來了。']],
    [['小孩', '哇！是會飛的人耶！\n可以載我一起飛嗎？']],
    [['村民', '東北邊的山裡\n好像有一股很可怕的氣息……']],
    [['商人', '路上的怪物雖然弱，\n但打多了就會變強喔！　（多戰鬥可以升級）']],
    [['村民', '卡片上跟自己流派一樣的字\n打起來特別有力喔！']],
]


def pois(m):
    out, v = [], 0
    for i, t in enumerate(m['layers'][2]):
        k = POI_KINDS.get(t)
        if not k:
            continue
        x, y = i % m['w'], i // m['w']
        if y >= m['h']:
            continue
        lines = k['lines']
        if t == 209:
            lines = VILLAGERS[v % len(VILLAGERS)]
            v += 1
        out.append({'x': x, 'y': y, 'label': k['label'], 'effect': k['effect'], 'lines': lines})
    return out


world = {
    'passages': D('system')['passages'],
    'maps': {'1': build_map(1, rows=28)},
    'pois': {'1': pois(build_map(1, rows=28))},
    'start': {'x': 16, 'y': 17},
    'titleBgm': 'Z1 オープニング',
    'party': [3, 4],
    'actors': {3: actor(3, 0, '悟空', 'Z1_戦闘_ゴクウ.PNG', 'Z1_戦闘_必殺技_エネルギー波.PNG', PARTY_SKILLS[3]),
               4: actor(4, 1, '比克', 'Z1_戦闘_ピッコロ.PNG', 'Z1_戦闘_必殺技_エネルギー波(緑).PNG', PARTY_SKILLS[4], 'green')},
    'enemies': {eid: enemy(eid) for eid in ENEMIES},
    'skills': {sid: skill(sid) for sid in sorted({x for v in PARTY_SKILLS.values() for x in v} | {301, 302, 305, 306, 310, 311, 384})},
    'encounters': {'1': [1, 2, 4, 5]},
    'boss': {'x': 58, 'y': 5, 'enemy': 10},
    # condensed from the original opening (Map007 event 1); already Traditional Chinese
    'story': {
        # the full original opening story is played by src/opening.js (world.opening); this is the controls hint after it
        'intro': [
            ['', '拖曳畫面任何地方就能飛行。\n拉蒂茲在地圖的右上方！'],
        ],
        'boss': [
            ['拉蒂茲', '哦？　卡卡羅特　你改變主意了嗎？'],
            ['悟空', '把悟飯還給我！！'],
            ['拉蒂茲', '哼…　還帶著那個綠色的傢伙\n就憑你們兩個 也想贏我？'],
            ['比克', '少廢話！　上吧 孫悟空！！'],
        ],
        'ending': [
            ['拉蒂茲', '不…不可能…\n我…竟然會輸給你們…'],
            ['悟空', '悟飯！　沒事吧！'],
            ['悟飯', '爸爸！！'],
            ['', '悟空與比克 打倒了拉蒂茲！\n但是 更強大的賽亞人已經在前往地球的路上……'],
        ],
    },
}
# the title animation and opening story (src/opening.js)
from opening_data import build as build_opening  # noqa: E402
world['opening'] = build_opening(D, s2t)
json.dump(world, open(os.path.join(root, 'data', 'world.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('world.json written')
