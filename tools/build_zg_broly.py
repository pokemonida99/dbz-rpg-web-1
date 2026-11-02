"""熱戰・烈戰・超激戰（事件 8，頁 5000～5200，地圖 56）＋Episode of Bardock（事件 25，頁 5701～）：ZG 時之間的門 9902／9921 —
world.json data (world.z3.zgbroly, the 'zgbroly:' pages of world.z3.pages, map 56), read by src/zg_broly.js; added by
tools/build_timeroom.py. Plan: docs/zg-plan.md; the whole part: docs/zg-broly.md.

The original:
  熱戦・烈戦・超激戦 (door 9902 of the ZG hall, map 96 (3,2)): variable 41 = 5000 → Map007 event 8:
    5000  variable 22 = 1; the first time (switch 589 off): CE166 (the 時之間 party aside), 「在通关之前无法回到时之间
          要移动吗？」 是 → 5001 / 否 → back under the door; again (589 on): CE168 (the story party back), map 56 (66,40)
    5001 → 5031 → 5061 → 5081 the story (z1field 5001-5087: King Kai, the interview, Paragus, New Planet Vegeta,
          Broly's past, Broly a Super Saiyan (CE59)) → party [3,4,5,12,17,6,7,8,9], map 56 (66,40)
    map 56 (7,9)/(8,9) Paragus and Broly → 5101 → battle 5111 (Broly 超, enemy 151) → 5121 (CE60 full power, King
          Vegeta's past) → battle 5131 (Broly full power, 152) → 5141 the end (switch 580) → 9903 (CE182, CE157, CE168,
          map 96 (3,3)); map 56 (66,41) → 9903 at any time (the story party is kept for the next visit: CE168)
  Episode of Bardock (door 9921, map 96 (13,2)): variable 41 = 5701 → event 25:
    5701 → 5741 → 5791 the story (z1field 5701-5816: Frieza's Death Ball, planet Plant, Chilled; CE66 Bardock a
          Super Saiyan) → 5801 the film (set_battle_event 18: Bardock against Chilled) → 5811 the end (switches 715,
          595, 585, 1190, Bardock learns 158, CE167) → 9922 (CE182, map 96 (13,3))
Scenes: z1field read straight from research/all.rb (picture / rect / add_chr / set_character_face / character_output
/ character_output_all), drawn by src/zg_broly.js.
"""
import os
import re

MAP = 56
ROWS = 64  # (row 64 holds the original's control events)
P = lambda n: f'Graphics/Pictures/{n}'
BROLY_PAGES = (5001, 5031, 5061, 5081, 5101, 5121, 5141)  # Map007 event 8 (5000: the door's question, src/zg_broly.js)
EOB_PAGES = (5701, 5741, 5791, 5811)  # event 25
SCENES = ((5001, 5143), (5701, 5816))  # the z1field numbers these pages draw
BATTLES = {5111: [151], 5131: [152]}  # battle_process (all.rb 183098): $Battle_MapID 28 (新惑星ベジータ)
FILM = 5801  # set_battle_event 18 (all.rb 52908): 超バーダック (actor 32, action 165) against チルド (238), $Battle_MapID 35
# 145_Event_Check.rb `when 56` (all.rb 185894)
CARDS = [(54, 10)]
INNS = [(16, 10), (56, 44), (71, 12)]
TRAIN = [(4, 30), (41, 28), (73, 33)]
BOSS = [(7, 9), (8, 9)]  # パラガスとブロリー → 5101
BACK = (66, 41)  # 時の間に戻る → 9903
# 140_Field_Main.rb `when 56`: rand(3) + 3 of 148 (戦闘員)
AREA = {'pool': [148], 'n': [3, 5]}
# the enemies' battle sheets (the database names are the Chinese ones; the files are named in Japanese)
FOES = {151: 'ブロリー(超)', 152: 'ブロリー(フルパワー)', 238: 'チルド'}
# their moves (the database has Japanese names only): the words the earlier chapters use; the four of Broly's own are
# this version's (the original shows no name for them)
MOVE_NAMES = {'エネルギー波': '能量波', '連続エネルギー波': '連續能量波', '強力エネルギー波': '強力能量波', '爆発波': '爆發波',
              'イレイザーキャノン': '毀滅砲', 'イレイザーブロウ': '毀滅衝擊', 'スローイングブラスター': '投擲光彈',
              'オメガブラスター': '終極爆破', 'スーパーエネルギー波': '超級能量波', 'デスボール': '死亡球'}
# CE59 / CE60 / CE66 (→ CE45, the 超サイヤ人変身 template): the auras and the two bodies, where they stand (variables 97-100)
FORMS = {
    59: {'auras': ['Z3_スーパーサイヤ人_ブロリー_気1', 'Z3_スーパーサイヤ人_ブロリー_気2', 'Z3_スーパーサイヤ人_ブロリー_気3'], 'ax': 128,
         'bodies': ['Z3_スーパーサイヤ人_ブロリー1', 'Z3_スーパーサイヤ人_ブロリー2'], 'bx': 64},
    60: {'auras': ['Z3_スーパーサイヤ人フルパワー_ブロリー_気1', 'Z3_スーパーサイヤ人フルパワー_ブロリー_気2', 'Z3_スーパーサイヤ人フルパワー_ブロリー_気3'],
         'ax': 88, 'bodies': ['Z3_スーパーサイヤ人_ブロリー2', 'Z3_スーパーサイヤ人_ブロリー3'], 'bx': 64},
    66: {'auras': ['Z3_スーパーサイヤ人_トランクス_気1', 'Z3_スーパーサイヤ人_トランクス_気2', 'Z3_スーパーサイヤ人_トランクス_気3'], 'ax': 178,
         'bodies': ['Z3_スーパーサイヤ人バーダック1', 'Z3_スーパーサイヤ人バーダック2'], 'bx': 32},
}
# speakers of these pages who are not in the shared tables (the dialogue box's face): [sheet, row, column]
CARD = P('顔カード.PNG')
SPEAKERS = {
    '界王大人': [CARD, 25, 2], '界王': [CARD, 25, 2], '遠方的聲音': [CARD, 25, 2], '琪琪': [P('Z3_顔イベント.PNG'), 17],
    '龜仙人': [CARD, 9, 2], '布爾瑪': [CARD, 8, 2], '布爾瑪的媽媽': [CARD, 37, 2], '布利夫': [CARD, 36, 2],
    '悟飯': [P('Z3_顔味方_衣替え.png'), 8], '特蘭克斯': [P('Z3_顔味方_衣替え.png'), 16],
    '戰鬥員': [P('Z3_顔敵.PNG'), 48], '帕拉伽斯': [P('Z3_顔敵.PNG'), 49], '男': [P('Z3_顔敵.PNG'), 49],
    '布羅利': [P('Z3_顔敵.PNG'), 50], '夏莫星人': [P('Z3_顔イベント.PNG'), 58], '教師男': [P('Z3_顔イベント.PNG'), 82],
    '巴達克': [P('Z3_顔味方_衣替え.png'), 11], '齊爾德': [P('Z3_顔敵.PNG'), 138], '伊帕納': [P('Z3_顔イベント.PNG'), 63],
    '貝利': [P('Z3_顔イベント.PNG'), 64], '弗利薩': [P('Z2_顔敵.PNG'), 23], '貝吉塔大王': [P('Z2_顔イベント.PNG'), 11],
    '亀仙人': [CARD, 9, 2], '帕拉伽斯（暗想）': [P('Z3_顔敵.PNG'), 49], '青年': [P('Z3_顔敵.PNG'), 50],
    '多多利亞': [P('Z2_顔敵.PNG'), 13], '薩博': [P('Z2_顔敵.PNG'), 15], '卡比拉': [P('Z3_顔イベント.PNG'), 73],
    '托比': [P('Z3_顔イベント.PNG'), 74], '普蘭特人': [P('Z3_顔イベント.PNG'), 66], '齊爾德的手下': [P('Z3_顔イベント.PNG'), 72],
}
# the same name for someone else in another page: 異星人 is a シャモ星人 (5031) / イパナ (5701), 異星戦士 the soldier
# who tells of the two babies (5061, ネイブル in its scene 5065)
PAGE_SPEAKERS = {5031: {'異星人': [P('Z3_顔イベント.PNG'), 58]}, 5061: {'異星戰士': [P('Z2_顔敵.PNG'), 4]},
                 5701: {'異星人': [P('Z3_顔イベント.PNG'), 63]}}


# ---------- the scenes: z1field from all.rb ----------
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
        if re.match(r'^    (end|else)\s*$', l):
            cur = None
            continue
        if cur is not None:
            cur.append(l)
    return blocks


def arith(expr, names):
    e = expr.replace(' ', '')
    for k, v in names.items():
        e = e.replace(k, str(v))
    if not re.fullmatch(r'[\d+\-*()]+', e):
        raise ValueError(expr)
    return eval(e)


def scene_of(body, file):
    """one z1field scene → {bg, big, ene: [[pic, sx, sy, dx, dy]], play: [[pic, sx, sy, dx, line]], out, all} (dx / dy
    from @ene1_x / @ene1_y = (288,78), @play_x 288; line 1 = @play_y + 64). A face from set_character_face is pic
    '@cf' (src/zg_broly.js picks the sheet by the clothes, as the original does). big: the Z2 216×170 picture."""
    pic, rect, d = None, None, {'bg': None, 'big': None, 'ene': [], 'play': [], 'out': False, 'all': None}
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
        m = re.match(r'add_chr\((.+?),(.+?),picture,rect\)$', t)
        if m:
            x, y = m.group(1), m.group(2)
            if x.startswith('@z1_scrollscenex'):
                d['bg'] = pic
            elif '@' not in x and rect[2] > 64:  # (640-432+4, 0+4): the 216×170 picture of the Z2 scenes
                d['big'] = [pic, rect, arith(x, {}), arith(y, {})]
            elif '@' not in x:  # the faces beside it (at its middle height, 0+4+54)
                d['ene'].append([pic, rect[0], rect[1], arith(x, {}) - 288, arith(y, {}) - 78])
            elif '@play_y' in y:
                d['play'].append([pic, rect[0], rect[1], arith(x, {'@play_x': 0}), 1 if arith(y, {'@play_y': 0}) >= 64 else 0])
            elif '@ene1_y' in y:
                d['ene'].append([pic, rect[0], rect[1], arith(x, {'@ene1_x': 0}), arith(y, {'@ene1_y': 0})])
            else:
                raise ValueError(t)
            continue
        if t == 'character_output':
            d['out'] = True
            continue
        m = re.match(r'character_output_all 0,0,0,(\d+)$', t)
        if m:
            d['all'] = int(m.group(1))
            continue
        if t in ('battle_process(event_no)', 'set_battle_event'):
            return None
        raise ValueError(t)
    return d


# ---------- the pages ----------
def merge(lst):
    """355 + its 655 continuation lines → one 355 holding the whole script"""
    out = []
    for c in lst:
        if c['code'] == 655 and out and out[-1]['code'] == 355:
            out[-1] = dict(out[-1], parameters=[out[-1]['parameters'][0] + '\n' + c['parameters'][0]])
        else:
            out.append(c)
    return out


def script_nodes(t):
    """a page's script (355 with its 655 lines) → story nodes (src/zg_broly.js), line by line"""
    out = []
    for x in t.split('\n'):
        x = x.split('#')[0].strip()
        if not x:
            continue
        m = re.match(r'\$partyc\s*=\s*\[([\d,\s]*)\]$', x)
        if m:
            ids = [int(v) for v in re.findall(r'\d+', m.group(1))]
            out += [{'partyc': ids}, {'x': 'zgbrParty', 'ids': ids}]
        elif x == 'all_charecter_recovery':
            out.append({'x': 'recover', 'id': 0})
        elif re.match(r'on_super_saiyazin (\d+)$', x):
            out.append({'x': 'zgbrSs', 'no': int(x.split()[1]), 'on': True})
    return out  # ($eve = Event_Main.new, dispose_main_window, the $chadead loop, variable 42: nothing to do here)


def add(world, h, z3, tr):
    build_map, enemy, skill, script, D, s2t, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'script', 'D', 's2t', 'root'))
    file, F3 = z3['file'], z3['F3']
    import build_z3  # noqa: E402  (already loaded: it calls build_timeroom, which calls this file)
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    cdb = D('commonevents')
    ev7 = D('map007')['events']

    # ---------- the scenes ----------
    blocks = z1field_blocks(src)
    scenes = {}
    for lo, hi in SCENES:
        for n, body in blocks.items():
            if lo <= n <= hi:
                d = scene_of(body, file)
                if d is not None:
                    scenes[str(n)] = d

    # ---------- the pages ----------
    faces = dict(z3['faces'])
    faces.update(SPEAKERS)
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    keep_extra, keep_opts = dict(EXTRA), dict(OPTS)

    def ce(p):
        n = p[0]
        if n == 36:  # 悟空瞬間移動: the flash and the sound
            return script(cdb[36]['list'])
        if n in FORMS:  # CE59 / 60 ブロリー変身, CE66 バーダック超サイヤ人変身 (CE45)
            return [{'x': 'zgbrForm', 'n': n}]
        if n == 159:  # 超サイヤ人全解除
            return [{'x': 'zgbrSsOff'}]
        if n in (166, 167, 168, 61):  # the party aside / back / swapped; Trunks' moves by his clothes
            return [{'x': 'zgbrCE', 'n': n}]
        return []  # CE39 (the lead's sprite: the field does it)

    def code355(p):
        return script_nodes(p[0])
    EXTRA.update({
        355: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        251: lambda p: [{'x': 'zgbrSeStop'}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        122: lambda p: [{'x': 'zgbrVarVar', 'a': p[0], 'b': p[4]}] if p[3] == 1 else [],  # variable = variable
    })
    OPTS.update(bgm=True, shakeSw=True)
    raw8 = {p['condition']['variable_value']: p['list'] for p in ev7['8']['pages'] if p['condition']['variable_valid']}
    raw25 = {p['condition']['variable_value']: p['list'] for p in ev7['25']['pages'] if p['condition']['variable_valid']}
    pages, said = {}, {}

    broly = {}  # Broly's face as he is at that point of the page: 50, 51 超 (after CE59), 52 full power (after CE60)

    def own(ns, v):  # the speakers' faces under this part's own keys ('zgbr:' / 'zgb5701:' …), not the shared 'z3:' ones
        for n in ns:
            if n.get('x') == 'zgbrForm' and n['n'] in (59, 60):
                broly[v] = 51 if n['n'] == 59 else 52
            if 'say' in n and n['say'][0]:
                who = n['say'][0]
                f = PAGE_SPEAKERS.get(v, {}).get(who)
                key = f'zgbr{v}:{who}' if f else f'zgbr:{who}'
                if who == '布羅利':
                    row = broly.setdefault(v, {5101: 51, 5121: 51}.get(v, 50))
                    f, key = [F3, row], f'zgbr:{who}{row}'
                f = f or faces.get(who)
                n['say'] = n['say'][:2] + ([key] if f else [])
                if f:
                    said[key] = f
            for k in ('then', 'else', 'loop'):
                own(n.get(k, []), v)
            for b in n.get('branches', []):
                own(b, v)
        return ns
    for v in BROLY_PAGES:
        pages[str(v)] = own([{'v41': v}] + z3['nodes_of'](merge(raw8[v]), faces), v)
    for v in EOB_PAGES:
        pages[str(v)] = own([{'v41': v}] + z3['nodes_of'](merge(raw25[v]), faces), v)
    EXTRA.clear()
    EXTRA.update(keep_extra)
    OPTS.clear()
    OPTS.update(keep_opts)
    world['z3']['pages'].update({'zgbroly:' + k: v for k, v in pages.items()})
    world['faces'].update(said)
    # page 5000: the door's question (its 是 / 否 and the rest: src/zg_broly.js)
    ask = next(c for c in raw8[5000] if c['code'] == 101)
    k = raw8[5000].index(ask)
    lines = [c['parameters'][0] for c in raw8[5000][k + 1:] if c['code'] == 401][:2]

    # ---------- map 56 ----------
    m = build_map(MAP, rows=ROWS)
    m['ev'] = tr['map_events'](D, MAP, ROWS, tr['sheets'])  # パラガス (7,9), ブロリー (8,9): enemy5 character 3
    world['maps'][str(MAP)] = m
    world['areas'][str(MAP)] = AREA
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}  # (variable 43 = 121: 卡林大人)
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAINING = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    world['pois'][str(MAP)] = at(CARDS, SHOP) + at(INNS, INN) + at(TRAIN, TRAINING) \
        + [{'x': x, 'y': y, 'label': '前往布羅利那裡', 'chapter': 'zgbroly', 'page': 'boss'} for x, y in BOSS] \
        + [{'x': BACK[0], 'y': BACK[1], 'label': '回到時之間', 'chapter': 'zgbroly', 'page': 'back'}]

    # ---------- enemies, battles ----------
    enemies_db, sdb = D('enemies'), D('skills')
    for eid, name in FOES.items():
        e = enemy(eid)
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        e['face'] = [F3, eid - 100]  # Z3_顔敵: one row per enemy from 100
        assert e['sprite'] and e['portrait'], name
        if eid == 238:  # チルド is only in the film here (the battle tables of the later parts may want him as they need)
            film_foe = {'normal': e['portrait'], 'special': e['sprite']}
            continue
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            if sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
            jp = sdb[sid]['name'].split(')')[-1]
            if jp in MOVE_NAMES:
                world['skills'][sid if sid in world['skills'] else str(sid)]['name'] = MOVE_NAMES[jp]
    # スーパーサイヤ人変身 of Bardock (learned here, CE167): as 29 / 245 — the film 2129 and the change (docs/anim-cd-plan.md ancb)
    world['skills'][158 if 158 in world['skills'] else '158']['ss'] = True
    consts, names = build_z3.bgm_names(src)
    bp = src[src.index('def battle_process event_no'):]
    bp = bp[:bp.index('\n  def ', 10)]
    for no, foes in BATTLES.items():
        body = re.search(r'\n\s*when %d #[^\n]*\n(.*?)(?=\n\s{4}when )' % no, bp, re.S).group(1)
        body = '\n'.join(x.split('#')[0] for x in body.split('\n'))
        got = [int(x) for x in re.findall(r'\d+', re.search(r'\$battleenemy = \[([^\]]*)\]', body).group(1))]
        assert got == foes, (no, got)
        row = int(re.search(r'\$Battle_MapID = (\d+)', body).group(1))
        b = {'foes': foes, 'backdrop': f'bg/z3_battle_{row}.png'}
        m = re.search(r'set_bgm = \$(\w+)', body)
        if m and consts.get(m.group(1)) in names:
            b['bgm'] = names[consts[m.group(1)]]
        world['z3']['battles'][str(no)] = b
    film_bgm = names.get(consts.get('bgm_no_DKN_tyoubardak_btl'))

    # ---------- the part's own data ----------
    sheets = {'p3': z3['P3'], 'clothes': file('Z3_顔味方_衣替え'), 'long': file('Z3_顔味方_トランクス長髪'), 'zg': file('ZG_顔味方'),
              'gohan2': file('ZG_顔グラ(ゴハン超1_2)'), 'roshi': file('Z3_顔味方_亀仙人')}
    forms = {str(n): {'back': file('Z3_スーパーサイヤ人_バック'), 'auras': [file(a) for a in f['auras']], 'ax': f['ax'],
                      'bodies': [file(b) for b in f['bodies']], 'bx': f['bx']} for n, f in FORMS.items()}
    world['z3']['titles']['zgbroly'] = s2t('燃烧!! 热战 烈战 超级战')  # (CE story_string for variable 43 = 121)
    world['z3']['zgbroly'] = {
        'scenes': scenes, 'sheets': sheets, 'forms': forms,
        'ask': [s2t(x) for x in lines],
        'door': {'map': '96', 'x': 3, 'y': 3},  # under the door (9903 / 5000 否)
        'start': {'map': str(MAP), 'x': 66, 'y': 40},
        'eobDoor': {'map': '96', 'x': 13, 'y': 3},  # 9922
        'battles': [str(n) for n in BATTLES],
        # set_battle_event 18: 超バーダック (the Z3 sheets) against チルド, $Battle_MapID 35; action 165 =
        # スーパーファイナルリベンジャー (skill 155): one blow that lands
        'film': {'party': {'normal': file('Z3_戦闘_バーダック(超)'), 'special': file('Z3_戦闘_必殺技_バーダック(超)')}, 'foe': film_foe,
                 'backdrop': 'bg/z3_battle_35.png', 'skill': 155, 'bgm': film_bgm},
    }

    # ---------- assets ----------
    pics = {sheets[k] for k in sheets} | {z3['P3'], z3['E3'], F3, z3['CARD']}
    for d in scenes.values():
        pics |= {x for x in [d['bg'], d['big'] and d['big'][0]] if x}
        pics |= {e[0] for e in d['ene'] + d['play'] if e[0] != '@cf'}
    for f in forms.values():
        pics |= {f['back'], *f['auras'], *f['bodies']}
    pics |= set(world['z3']['zgbroly']['film']['party'].values()) | set(film_foe.values())
    # Broly's own battle films (src/zg_broly.js FP('…'), their sounds)
    js = open(os.path.join(root, 'src', 'zg_broly.js'), encoding='utf-8').read()
    pics |= {P(n) for n in re.findall(r"FP\('([^']+)'\)", js)}
    assert None not in pics and all(os.path.exists(os.path.join(root, 'game', x)) for x in pics), [x for x in pics if not x or not os.path.exists(os.path.join(root, 'game', x))]
    world['z3']['zgbroly']['pictures'] = sorted(pics)
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
    se |= {'Z3 変身', 'Z1 高速移動', 'Z1 入る', 'Z1 出る'} | set(re.findall(r"se\('([^']+)'", js))
    bgm |= {b['bgm'] for n, b in world['z3']['battles'].items() if int(n) in BATTLES and 'bgm' in b} | {'DB3 イベント06', m_bgm(world)}
    if film_bgm:
        bgm.add(film_bgm)
    audio = os.path.join(root, 'game', 'Audio')
    have = lambda kind, n: os.path.exists(os.path.join(audio, kind, n + '.ogg'))
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if n and have('BGM', n)})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se if have('SE', n)})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)


def m_bgm(world):
    return world['maps'][str(MAP)]['bgm']
