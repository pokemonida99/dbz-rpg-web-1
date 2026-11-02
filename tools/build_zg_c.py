"""ZG 本編 後段（事件 23 頁 6431～6999：布布克島（力紐姆）、克恩星、奧特星、暗黑行星，地圖 105、108～110） — world.json data
(read by src/zg_c.js), added by tools/build_timeroom.py. Plan: docs/zg-plan.md; the whole part with its sources: docs/zg-c.md.

The original: Map007 event 23 「ZG本編」 pages 6431-6999 (variable 41), the scenes 143_Event_Main.rb z1field 6431-6769
(all.rb 181975-182520), the spots of maps 105 / 108-110 (145_Event_Check.rb `when 105` … `when 110`, all.rb 186188-186460),
their encounters (140_Field_Main.rb `when 105` … `when 110`, all.rb 165820), battle_process 6516-6721 (all.rb 183203),
common events 69 / 92-95 (the films), 171 / 182 / 157 / 168 (back to the 時之間, page 9932):
  start (page 6421 has ended): map 105 (4,33), variable 43 = 173
  map 105 (variable 43 = 173): 村 (7..8,31..32) 6431 (a menu: 姐姐 / 男孩子 (switch 826 off) / 離開); 洞穴 (5,3) 6441;
       鉱山 (53..54,2..3) 6451 (皮拉夫一夥: switch 827 off); 火山 (39..40,12..13) 6471; 別荘 (53..54,27..28) 6461 (紫晶石)
       → 6481 (布爾瑪家, the ship CE92, the space storm, 界王) → map 108 (52,39), variable 43 = 175
  map 108 克恩星: 派瑞之城 (45..46,32..33) 6491 (a menu; 星之貝殼 for the 紫晶石: switch 833); 預言者 (24,12) 6501;
       洞穴 (5,3, switch 830) 6511 → battle 6516 (the Ginyu Force) → 6521 (破魔的指環); switch 833 → the pirate ship
       (map 108 event 88) → 6531 → map 109 (5,5), variable 43 = 181
  map 109 奧特星: 海盜船 (31..32,11) 6541; 庫阿鎮 (13,16, switch 835) 6551; 漩渦 (49..50,28..29) 6561 → (switch 838)
       battle 6566 (齊爾德) → 6571 (破魔的珍珠, the dark planet) → map 110 (2,21), variable 43 = 186
  map 110 暗黑行星: the guard robots A-E (pages 6611-6615, switches 840-844) → battle 6616 each → 6621 (CE93: all five →
       switch 845, the door opens); the door (28,18) 6601 until then; 怨念增幅裝置 (28..29,14..15) 6631 → battle 6641
       (萊奇) → 6651 (CE94 哈奇亞克) → battle 6671 → 6681 → battle 6701 (奧佐特) → 6711 (CE69) → battle 6721 → 6731 →
       6751 (CE95) → 6761 (the ending: switch 586, variable 41 = 9932) → page 9932 → map 96 (18,3)
  the 時の間へ移動 squares (105 (4,34) with 43 = 173, 108 (52,40), 109 (5,4), 110 (1,21)) → CE171 → page 9932
"""
import os
import re

from PIL import Image

MAPS = ('105', '108', '109', '110')
ROWS = 52  # (row 52 holds the original's control events)
# the battles of this part (battle_process): enemies, $Battle_MapID (Z3_戦闘_背景, switch 466: variable 301 = 2)
BATTLES = {6516: ([250, 251, 247, 248, 249], 27), 6566: ([252], 19), 6616: ([213, 171, 213], 18), 6641: ([172], 18),
           6671: ([173], 18), 6701: ([154], 18), 6721: ([253], 18)}
# the extra-attack switches each page sets before its battle (25 the last one standing, 26 30 % HP, 27 40 %, 28 two
# standing, 29 50 %) and the menu songs it unlocks (195 / 198 / 199) — kept as the pages set them
# the field encounters (140_Field_Main.rb): pool, [lo, hi]
AREAS = {'105': ([155, 159, 162], [3, 5]), '105zgc': ([156, 160, 163, 228], [3, 6]),
         '108': ([157, 161, 164, 165, 167, 228], [3, 6]), '109': ([157, 161, 164, 165, 166, 167, 168, 228], [3, 6]),
         '110': ([157, 161, 164, 165, 166, 167, 168], [3, 6]), '110late': ([165, 166, 167, 168, 169, 170], [4, 7])}
FOES = sorted({e for b in BATTLES.values() for e in b[0]} | {e for a in AREAS.values() for e in a[0]})
# the enemies' moves (the database has Japanese names only): the words the earlier chapters use
FOE_MOVES = {'エネルギー波': '能量波', '強力エネルギー波': '強力能量波', '連続エネルギー波': '連續能量波', 'スーパーエネルギー波': '超級能量波',
             '爆発波': '爆發波', '超能力': '超能力', 'デスボール': '死亡球', 'テイルザンバー': '尾刃斬', 'ガードンクラッシャー': '加登粉碎',
             'キルドライバー': '殺戮驅動', 'フリーザカッター': '弗利薩切割', 'ビッグスマッシャー': '大粉碎', 'イレイサーショック': '消除衝擊',
             'リベンジャーチャージ': '復仇衝鋒', 'リベンジャーカノン': '復仇加農砲', 'ミストかめはめ波': '迷霧龜派氣功',
             'ミストばくれつまこうほう': '迷霧爆裂魔光砲', 'ミストませんこう': '迷霧魔閃光', 'ミストギャリック砲': '迷霧咖哩砲',
             'ミスト刀攻撃': '迷霧刀擊', 'イグナイトビジョン': '點燃幻象', 'カオスバースト': '混沌爆發', 'ラッシュ': '連打',
             'パワードレイン': '能量吸取', '魔光砲': '魔光砲', 'エネルギー波 ': '能量波'}

P = lambda n: f'Graphics/Pictures/{n}'
# who speaks with which face (the dialogue box): Z3_顔味方 row = actor id - 3; 顔カード column 2 = Z3 (z1field 6422 界王
# row 25, 6423 布爾瑪 8 / 布利夫 36, 6452 皮拉夫 72 / 阿修 90 / 小舞 91); Z3_顔イベント (6432 姐姐 33, 6436 男孩子 13, 6492
# 派瑞人 45, 6502 預言者 43, 6541 海盜 44, 6552 奧托星人 46, 6562 海精靈 47); Z3_顔敵 = enemy id - 100 (6512 基紐 147,
# 6563 齊爾德 152, 6611 護衛機器人 71, 6633 萊奇 72, 6692 奧佐特 54)
FACES = lambda P3, E3, F3, CARD: {
    '未來悟飯': [P3, 22], '多瑪': [P3, 24], '莎莉巴': [P3, 25], '多達布': [P3, 26], '普普堅': [P3, 27], '青年': [P3, 12],
    '特蘭克斯': [P3, 14], '16號': [P3, 20], '17號': [P3, 19], '18號': [P3, 18],
    '界王': [CARD, 25, 2], '布爾瑪': [CARD, 8, 2], '布利夫': [CARD, 36, 2], '皮拉夫': [CARD, 72, 2], '阿修': [CARD, 90, 2], '小舞': [CARD, 91, 2],
    '姐姐': [E3, 33], '男孩子': [E3, 13], '派瑞人': [E3, 45], '預言者': [E3, 43], '海盜': [E3, 44], '奧托星人': [E3, 46],
    '奧托星人人': [E3, 46], '海精靈': [E3, 47],
    '基紐': [F3, 147], '齊爾德': [F3, 152], '護衛機器人': [F3, 71], '萊奇': [F3, 72], '奧佐特': [F3, 54]}
NARRATION = ('悟空向布爾瑪他們', 'Ｚ戰士們', '皮拉夫把紫晶石', '遠處傳來', '萊奇以極快', '多瑪他們乘坐', '未來悟飯也乘坐', '巴達克回到', '就這樣')


def add(world, h, z3, tr):
    build_map, enemy, skill, actor, script, D, s2t, root = (h[k] for k in ('build_map', 'enemy', 'skill', 'actor', 'script', 'D', 's2t', 'root'))
    file = z3['file']
    P3, E3, F3, CARD = z3['P3'], z3['E3'], z3['F3'], z3['CARD']
    z = world['z3']
    GO = tr['GO']

    # ---------- maps (105 is the middle part's too: whoever comes first builds it, the same way) ----------
    sheets = set()
    for mid in MAPS:
        if mid in world['maps']:
            continue
        m = build_map(int(mid), rows=ROWS)
        m['ev'] = tr['map_events'](D, int(mid), ROWS, sheets)
        world['maps'][mid] = m
    # the guard robots of map 110 (events 6-10: bigsize_chara character 0 facing left, 64×64 frames, until switches 840-844):
    # drawn as boss markers from a half-size copy of their frames (the field draws 32×32 frames)
    big = Image.open(os.path.join(root, 'game', 'Graphics', 'Characters', 'bigsize_chara.png')).convert('RGBA')
    robot = Image.new('RGBA', (96, 32))
    for f in range(3):
        robot.paste(big.crop((64 * f, 64, 64 * f + 64, 128)).resize((32, 32), Image.NEAREST), (32 * f, 0))
    robot.save(os.path.join(root, 'assets', 'bg', 'zgc_guard.png'), optimize=True)
    world['maps']['110']['ev'] = [e for e in world['maps']['110']['ev'] if not (e[2] and e[2][0][1] and isinstance(e[2][0][1], list)
                                                                                 and e[2][0][1][0] == 'bigsize_chara')]
    world['bosses']['110'] = [{'x': x, 'y': y, 'sheet': 'bg/zgc_guard.png', 'index': 0, 'flag': f'zgcGuard{k}', 'key': f'guard{k}',
                               'page': pg, 'when': ['sw', sw, False]}
                              for k, x, y, pg, sw in (('A', 12, 4, 6611, 840), ('B', 13, 30, 6612, 841), ('C', 50, 4, 6613, 842),
                                                      ('D', 31, 35, 6614, 843), ('E', 49, 39, 6615, 844))]

    # ---------- spots (145_Event_Check.rb) ----------
    INN = {'label': '進入旅館', 'event': 'z2inn', 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    ZG = ['var', 43, 173, 0]  # map 105: the squares are this part's while variable 43 = 173 (リキニュウムのシナリオ)

    def spot(xy, label, pg, when=None):
        xs, ys = xy
        return [dict({'x': x, 'y': y, 'label': label, 'chapter': 'zgc', 'page': pg}, **({'when': when} if when else {}))
                for x in xs for y in ys]
    common = {
        '105': at([(8, 5), (6, 23), (35, 32), (48, 9)], SHOP) + at([(8, 4), (16, 28), (36, 3), (41, 23)], TRAIN)
        + at([(8, 1), (11, 26), (29, 14), (53, 22)], INN),
        '108': at([(3, 8), (6, 40), (29, 12), (49, 2), (53, 34)], SHOP)
        + at([(5, 21), (9, 40), (19, 4), (29, 33), (47, 2), (39, 13), (51, 28)], TRAIN) + at([(9, 16), (31, 21), (45, 2), (47, 39)], INN),
        '109': at([(29, 12), (49, 7), (51, 7), (49, 36)], SHOP) + at([(11, 12), (50, 8), (10, 39), (46, 36)], TRAIN)
        + at([(17, 22), (6, 39), (50, 6)], INN),
        '110': at([(8, 25), (46, 16)], SHOP) + at([(10, 25), (46, 14)], TRAIN) + at([(9, 26), (47, 15)], INN)
        + [{'x': 26, 'y': 13, 'label': '卡片商店', 'chapter': 'zgc', 'page': 'card50'}],  # カード特殊: variable 44 = 50
    }
    story = {
        '105': spot(([7, 8], [31, 32]), '進入村子', 6431, ZG) + spot(([5], [3]), '進入洞穴', 6441, [ZG, ['sw', 818, True]])
        + spot(([53, 54], [2, 3]), '前往礦山', 6451, ZG) + spot(([39, 40], [12, 13]), '前往火山', 6471, ZG)
        + spot(([53, 54], [27, 28]), '前往別墅', 6461, ZG) + spot(([4], [34]), '時之間', 9932, ZG),
        '108': spot(([45, 46], [32, 33]), '進入派瑞之城', 6491) + spot(([24], [12]), '前往預言者之塔', 6501)
        + spot(([5], [3]), '進入洞穴', 6511, ['sw', 830, True]) + spot(([52], [40]), '時之間', 9932),
        '109': spot(([31, 32], [11]), '前往海盜船', 6541) + spot(([13], [16]), '進入庫阿鎮', 6551, ['sw', 835, True])
        + spot(([49, 50], [28, 29]), '前往漩渦', 6561) + spot(([5], [4]), '時之間', 9932),
        '110': spot(([28], [18]), '調查門', 6601, ['sw', 845, False]) + spot(([28, 29], [14, 15]), '前往怨念增幅裝置', 6631)
        + spot(([1], [21]), '時之間', 9932),
    }
    for mid in MAPS:
        lst = world['pois'].setdefault(mid, [])
        have = {(p['x'], p['y'], p.get('effect')) for p in lst if not p.get('chapter')}
        lst += [p for p in common[mid] if (p['x'], p['y'], p.get('effect')) not in have]
        lst += story[mid]
    # 140_Field_Main.rb: map 105 has another set while variable 43 = 173 (src/zg_c.js sets the size too), map 110 another
    # once switch 845 is on (src/zg_c.js swaps it in)
    pool, n = AREAS['105']
    world['areas'].setdefault('105', {'pool': pool, 'n': n})
    world['areas']['105']['late'] = {'var43': 173, 'pool': AREAS['105zgc'][0]}
    for mid in ('108', '109', '110'):
        world['areas'][mid] = {'pool': AREAS[mid][0], 'n': AREAS[mid][1]}

    # ---------- enemies (Z3 sheets; Z3_顔敵 row = id - 100) and the moves' names ----------
    enemies_db, sdb = D('enemies'), D('skills')
    sk = lambda sid: world['skills'][sid] if sid in world['skills'] else world['skills'][str(sid)]
    for eid in FOES:
        if eid in world['enemies'] or str(eid) in world['enemies']:
            continue
        e = enemy(eid)
        name = enemies_db[eid]['name']
        e['sprite'] = file(f'Z3_戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'Z3_戦闘_敵_{name}')
        assert e['sprite'] and e['portrait'], name
        e['face'] = [F3, eid - 100]
        e['name'] = e['name'].replace('変', '變')  # (the database name keeps the Japanese 変: 奥佐特(変身))
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
    for eid in FOES:
        for a in enemies_db[eid]['actions']:
            sid = a['skill_id']
            if sid and str(sid) not in world['skills'] and sid not in world['skills']:
                world['skills'][sid] = skill(sid)
            jp = re.sub(r'^.*\)', '', sdb[sid]['name']).replace('一般兵 ', '')
            if jp in FOE_MOVES:
                sk(sid)['name'] = FOE_MOVES[jp]

    # ---------- the battles (battle_process): enemies, music, background ----------
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    import build_z3  # noqa: E402  (its battle-music table)
    consts, names = build_z3.bgm_names(src)
    bp = src[src.index('def battle_process event_no'):]
    bp = bp[:bp.index('\n  def ', 10)]
    for no, (foes, row) in BATTLES.items():
        body = re.search(rf'\n\s*when {no} [^\n]*\n(.*?)(?=\n\s{{4}}when |\n\s{{4}}end)', bp, re.S).group(1)
        got = [int(x) for x in re.findall(r'\d+', re.search(r'\$battleenemy = \[([^\]]*)\]', body).group(1))]
        assert got == foes and f'$Battle_MapID = {row}' in body, (no, got)
        v = re.search(r'set_bgm = (\$?\w+)', body).group(1)  # (the first: variable 319 = 0, no song before the battle)
        b = {'foes': foes, 'bgm': names[consts[v[1:]] if v.startswith('$') else int(v)], 'backdrop': f'bg/z3_battle_{row}.png'}
        z['battles'][str(no)] = b
    world['extraBgm'] = sorted(set(world['extraBgm']) | {b['bgm'] for k, b in z['battles'].items() if int(k) in BATTLES})

    # ---------- the people who are in ZG (the first part, zga, brings them; here only if it has not) ----------
    def one(aid, name, jp, skills, **more):
        if aid in world['actors'] or str(aid) in world['actors']:
            return
        a = actor(aid, aid - 3, name, file(f'Z3_戦闘_{jp}').split('/')[-1], 'Z1_戦闘_必殺技_エネルギー波.PNG', skills)
        a['special'] = file(f'Z3_戦闘_必殺技_{jp}')
        a.update(more)
        world['actors'][aid] = a
        for sid in skills:
            if sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
    # CE9 必殺技設定 (the moves each knows when ZG starts; their strongest one comes with CE169)
    one(25, '未來悟飯', 'ゴハン(未来)', [236, 237, 238, 240, 241])
    one(27, '多瑪', 'トーマ', [246, 248, 247, 249])
    one(28, '莎莉巴', 'セリパ', [255, 257, 256, 259])
    one(29, '多達布', 'トテッポ', [265, 267, 266, 268])
    one(30, '普普堅', 'パンブーキン', [273, 275, 274, 276])

    # ---------- the story pages ----------
    faces = dict(z3['faces'], **FACES(P3, E3, F3, CARD))
    world['faces'].update({'z3:' + k: v for k, v in faces.items()})
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    cdb = D('commonevents')
    pics = set()

    def code355(p):
        t = p[0].strip()
        if t == 'all_charecter_recovery':
            return [{'x': 'recover'}]  # (src/z2scenes.js: everyone, the bench too)
        return []  # ($eve, update_party_detail_status, the switch 882 toggles: nothing to do here)

    def ce(p):
        n = p[0]
        if n == 92:  # ZG宇宙船発進 (pictures moved by variables: src/zg_c.js)
            return [{'x': 'zgcFilm', 'name': 'shipLaunch'}]
        if n == 95:  # ZG宇宙船地球に到着
            return [{'x': 'zgcFilm', 'name': 'shipEarth'}]
        if n == 94:  # ZGハッチヒャック登場イベント (769 frames of pictures)
            return [{'x': 'zgcFilm', 'name': 'hatch'}]
        if n == 69:  # オゾットから巨大化へ変身 (→ CE45, the transformation template)
            return [{'x': 'zgcFilm', 'name': 'ozotto'}]
        if n == 93:  # ZGゴッドガードン撃破チェック: all five → switch 845
            return script(cdb[93]['list'])
        if n == 159:  # 超サイヤ人全解除
            return [{'x': 'zgcSsOff'}]
        return []  # (CE160 大猿解除, CE173 / 174 倍速: nothing to do here)

    def pic(p):  # 231 show picture: number, name, origin, (constant) x, y, zoom (variables resolved beforehand: fixed())
        name = file(p[1]) or P(p[1] + '.png')
        pics.add(name)
        return [{'x': 'pic', 'n': p[0], 'name': name, 'o': p[2], 'px': p[4], 'py': p[5], 'zoom': p[6]}]

    EXTRA.update({
        117: ce, 355: code355, 655: code355,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        231: pic, 235: lambda p: [{'x': 'erase', 'n': p[0]}],
    })

    def fixed(lst):
        """231 with its place in variables (361 / 362, set just before by 122): the constants they hold"""
        v, out = {}, []
        for c in lst:
            p = c['parameters']
            if c['code'] == 122 and p[3] == 0 and p[2] == 0:
                v[p[0]] = p[4]
            if c['code'] == 231 and p[3] == 1:
                c = dict(c, parameters=p[:3] + [0, v.get(p[4], 0), v.get(p[5], 0)] + p[6:])
            out.append(c)
        return out

    def menu(lst):
        """118 label … a choice whose branches 119 back to the label and whose last one leaves: one 112 loop of it (the
        last answer breaks out), so the menu is asked again (src/cutscene.js {loop} / {brk})"""
        k = next((i for i, c in enumerate(lst) if c['code'] == 118), None)
        if k is None:
            return lst
        label = lst[k]['parameters'][0]
        end = next(i for i in range(k, len(lst)) if lst[i]['code'] == 404 and lst[i]['indent'] == 0)
        last = max(i for i in range(k, end) if lst[i]['code'] == 402 and lst[i]['indent'] == 0)
        body = []
        for i in range(k + 1, end + 1):
            c = lst[i]
            if c['code'] == 119 and c['parameters'][0] == label:
                continue
            body.append(dict(c, indent=c['indent'] + 1))
            if i == last:
                body.append({'code': 113, 'indent': 2, 'parameters': []})
        return lst[:k] + [{'code': 112, 'indent': 0, 'parameters': []}] + body + [{'code': 413, 'indent': 0, 'parameters': []}] + lst[end + 1:]

    raw = {p['condition']['variable_value']: p['list'] for p in D('map007')['events']['23']['pages'] if p['condition']['variable_valid']}

    def mark_battles(ns):
        """{var: [41, 0, N]} {z1field} for a battle of battle_process → {x: 'zgcFight', no: N} and the end of the page
        (src/zg_c.js runs the battle and the page after it, as the original does by variable 95 and map 7)"""
        out, last = [], None
        for n in ns:
            if n.get('var') and n['var'][0] == 41 and n['var'][1] == 0:
                last = n['var'][2]
            if n.get('z1field') and last in BATTLES:
                out += [{'x': 'zgcFight', 'no': last}, {'end': True}]
                return out
            for k in ('then', 'else', 'loop'):
                if k in n:
                    n[k] = mark_battles(n[k])
            if 'branches' in n:
                n['branches'] = [mark_battles(b) for b in n['branches']]
            out.append(n)
        return out

    def narration(ns):
        for n in ns:
            if 'say' in n and n['say'][0] and n['say'][0] not in faces and n['say'][0] != '？' and n['say'][0].startswith(NARRATION):
                n['say'] = ['', n['say'][1]]
            for k in ('then', 'else', 'loop'):
                narration(n.get(k, []))
            for b in n.get('branches', []):
                narration(b)
        return ns

    def page(v):
        return [{'v41': v}] + narration(mark_battles(z3['nodes_of'](menu(fixed(raw[v])), faces)))

    PAGES = (6431, 6441, 6451, 6461, 6471, 6481, 6491, 6501, 6511, 6521, 6531, 6541, 6551, 6561, 6571, 6601,
             6611, 6612, 6613, 6614, 6615, 6621, 6631, 6651, 6681, 6711, 6731, 6751, 6761)
    pages = {f'zgc:{v}': page(v) for v in PAGES}
    # page 9932 (ＺＧ⇒時の間: CE182, CE157, CE168, variable 43 = 999 …) and the pirate ship (map 108 event 88) are the
    # flow's (src/zg_c.js)
    EXTRA.clear()
    z['pages'].update(pages)

    # the speakers of these pages: every one with a face, or narration
    speakers = set()

    def who(ns):
        for n in ns:
            if 'say' in n:
                speakers.add(n['say'][0])
            for k in ('then', 'else', 'loop'):
                who(n.get(k, []))
            for b in n.get('branches', []):
                who(b)
    for p in pages.values():
        who(p)
    missing = sorted(x for x in speakers if x and x != '？' and x not in faces)
    assert not missing, missing

    # ---------- the part ----------
    z['zgc'] = {
        'start': GO(105, 4, 33),  # page 6421: variables 1 / 2 = 4 / 33, map 105
        'map108': GO(108, 52, 39), 'map109': GO(109, 5, 5), 'map110': GO(110, 2, 21),  # pages 6481 / 6531 / 6571
        'hall': GO(96, 18, 3),  # page 9932
        'party': [3, 4, 5, 16, 17, 12, 25, 6, 7],  # page 6391 ($partyc), the party when this part begins
        'late110': {'pool': AREAS['110late'][0], 'n': AREAS['110late'][1]},
        'n105': AREAS['105zgc'][1],
    }

    # ---------- assets: the scenes' pictures, the films, music, sounds ----------
    bgs = ['ZG_背景_町1', 'ZG_背景_草原', 'ZG_背景_ピラフの別荘', 'ZG_背景_溶岩2', 'ZG_背景_ブルマの家', 'ZG_背景_宇宙船',
           'ZG_背景_界王星', 'ZG_背景_町_クーン星', 'ZG_背景_洞窟3', 'ZG_背景_洞窟2', 'ZG_背景_海3', 'ZG_背景_クアーの町',
           'ZG_背景_怨念増幅装置(影)', 'ZG_背景_洞窟6', 'ZG_背景_怨念増幅装置', 'Z3_背景_タイムマシンp2',
           'Z3_スーパーサイヤ人_バック', 'Z3_スーパーサイヤ人フルパワー_ブロリー_気1', 'Z3_スーパーサイヤ人フルパワー_ブロリー_気2',
           'Z3_スーパーサイヤ人フルパワー_ブロリー_気3', 'Z3_オゾット変身_1', 'Z3_オゾット変身_2', '集合絵_修正', '集合絵_追加', '文字_END',
           'ZG_イベント_海賊船_1', 'ZG_イベント_海賊船_2', 'ZG_イベント_宇宙船_中', 'ZG_イベント_宇宙船_大', 'ZG_イベント_宇宙船_特大'] \
        + [f'ZG_イベント_宇宙船_{k:02d}' for k in range(1, 22)]
    scene_pics = {file(n) for n in bgs}
    assert None not in scene_pics, [n for n in bgs if not file(n)]
    # CE94: hatc_touzyo/ (the body 001-769, the backgrounds above / below 1-4, the flashes)
    hdir = os.path.join(root, 'game', 'Graphics', 'Pictures', 'hatc_touzyo')
    hatch = sorted(P(f'hatc_touzyo/{n}') for n in os.listdir(hdir) if n.lower().endswith('.png'))
    z['zgc']['hatch'] = {'dir': P('hatc_touzyo/'), 'body': [f'{k:03d}' for k in range(1, 770)]}
    assert all(P(f'hatc_touzyo/ZG_イベント_ハッチ登場_{k:03d}.png') in hatch for k in range(1, 770))
    se, bgm = set(), set()

    def walk(nodes):
        for n in nodes:
            if 'se' in n:
                se.add(n['se'])
            if n.get('bgm'):
                bgm.add(n['bgm'])
            if n.get('x') == 'bgm' and n.get('name'):
                bgm.add(n['name'])
            for k in ('then', 'else', 'loop'):
                walk(n.get(k, []))
            for b in n.get('branches', []):
                walk(b)
    for p in pages.values():
        walk(p)
    se |= {'ZG SE062', 'ZG SE061', 'Z2 宇宙船移動', 'Z3 変身', 'Z1 入る'}
    audio = os.path.join(root, 'game', 'Audio')
    world['extraBgm'] = sorted(set(world['extraBgm']) | bgm | {world['maps'][m]['bgm'] for m in MAPS})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics | scene_pics | set(hatch) | {P3, E3, F3, CARD}
                                    | {f'Graphics/Characters/{n}.png' for n in sheets}
                                    | {world['enemies'][i][k] for i in FOES for k in ('sprite', 'portrait')}
                                    | {a[k] for i in (25, 27, 28, 29, 30) for a in [world['actors'].get(i) or world['actors'].get(str(i))] if a
                                       for k in ('sprite', 'special')})
