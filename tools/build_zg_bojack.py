"""銀河危機（事件 24，頁 5500～5650，地圖 97～99）＋帕伊庫漢（事件 28）＋布歐（事件 29）＋鬥技場（事件 19）：ZG 時之間的門
9911／9941／9951、大廳的鬥技場 — world.json data (read by src/zg_bojack.js), added by tools/build_timeroom.py.
Plan: docs/zg-plan.md; the whole flow with the original's sources is in docs/zg-bojack.md.

The original:
  9911 (Map007 event 22) → variable 41 = 5500 → event 24 (「銀河ギリギリ!!ぶっちぎりの凄い奴」):
    5500  variable 22 = 2; switch 590 off: 「在通關之前無法回到時之間 / 要移動嗎？」 → CE166 (the 時之間 party kept in
          $tmp_partyc[2]) → 5501; 590 on (the story under way, left half way): CE157 + CE168 (that party swapped with
          the Bojack one) → map 99 (46,20) once 591 and 592 are on, else map 97 (7,33)
    5501  the story (z1field 1100 / 5501-5503), $partyc = [5,6,17,4,12,7,8,9,10], everyone healed → map 97 (7,33)
    map 97: Bujin & Gokua (61,11) 5511 → battle 5516 → 5521; map 98: Zangya & Bido (35,22) 5531 → 5536 → 5541; both
    beaten → 5551 → map 99 (46,20); the squares between the two maps 5561-5564; map 99: Bojack (26,2) 5571 → 5576 →
    5581 (Bojack's full power, Goku from the other world, Gohan's Super Saiyan 2: skill 54 instead of 53) → 5591 →
    5601 (switches 360 / 590 off, 593 / 766 on, variable 41 = 9912) → event 22 page 9912: CE182, CE157, CE168 → map 96
    (8,3). 590 is on from 5501 to 5601 only.
    Switch 581 (the door's 「打倒」 mark) is turned on in 5581, before the last battle.
    The way back from map 97 (7,34) / map 99 (47,20) is 9912 too (the original lets the party leave half way).
  9941 → 7101 「從這個區域可以感受到強烈的戰意……」 → 7111 Paikuhan (switch 587, battle 7116) → 7121 → 9942 (map 96 (23,3))
  9951 → 7201 「…異常強大的邪惡氣息……」 → 7211 Buu (switch 600, battle 7216) → 7221 → 9952 (map 96 (28,3))
  鬥技場 (map 58 (22,5)) → 90001: the first time CE277; 「要參加競技場嗎？」 → Scene_Db_Battle_arena (the rank list,
    all.rb 160404) → 90011 three rounds (90012 / 90022 / 90032: battle_arena_ene_set, all.rb 1323) → 90041 the
    prizes (CE191), the new ranks (set_btl_arena_fight_rank, all.rb 1044), the music switches; lost → 90051.
    Rank 69 (Arale, variable 343) and 70-91 (覚醒 bosses, switch 876) are one battle each.
"""
import json
import os
import re
import subprocess

from PIL import Image

KEY = 'zgbojack'
GO = lambda m, x, y: {'map': str(m), 'x': x, 'y': y}
P = lambda n: f'Graphics/Pictures/{n}'

# the pages this part plays: Map007 event → variable 41 values
PAGES = {'24': [5500, 5501, 5511, 5521, 5531, 5541, 5551, 5571, 5581, 5601],
         '28': [7101, 7111, 7121], '29': [7201, 7211, 7221],
         '19': [90001, 90011, 90021, 90031, 90041, 90051, 90911]}
# battle_process (all.rb 183120-183255): enemies, $Battle_MapID (Z3_戦闘_背景 row; Paikuhan / Buu: Z1_戦闘_背景 row 5
# 「Z1あの世」, variable 301 = 0), set_bgm with variable 319 = 0 (no music before the battle)
BATTLES = {5516: {'foes': [147, 144], 'row': 1, 'bgm': 15}, 5536: {'foes': [145, 146], 'row': 6, 'bgm': 15},
           5576: {'foes': [144, 145, 142, 146, 147], 'row': 34, 'bgm': '$bgm_no_ZMove_M1619'},
           5591: {'foes': [143], 'row': 34, 'bgm': '$bgm_no_ZMove_raizing'},
           7116: {'foes': [215], 'z1row': 5, 'bgm': '$bgm_no_ZPS2_Z3_ore'},
           7216: {'foes': [254], 'z1row': 5, 'bgm': '$bgm_no_ZSPM_SSurvivor'}}
# 145_Event_Check.rb `when 97` / `98` / `99` (all.rb 185915-186010)
SPOTS = {
    97: {'card': [(10, 5), (18, 26), (46, 6), (34, 37), (62, 41)], 'inn': [(16, 10), (12, 30), (46, 9), (32, 39)],
         'train': [(7, 8), (13, 24), (53, 7), (31, 37), (65, 40)]},
    98: {'card': [(6, 6), (23, 2), (25, 27), (24, 42), (36, 40), (49, 8), (46, 19), (49, 32)],
         'inn': [(3, 11), (3, 39), (28, 30), (32, 22), (40, 11), (40, 21), (58, 3), (68, 38)],
         'train': [(8, 11), (9, 43), (26, 15), (26, 32), (33, 15), (41, 32), (43, 27), (57, 9)]},
    99: {'card': [(15, 3), (27, 21), (32, 3), (35, 11)], 'inn': [(7, 10), (22, 13), (34, 8), (36, 9), (43, 21)],
         'train': [(17, 3), (28, 17), (32, 6), (38, 17)]},
}
CARD40 = (99, 47, 15)  # カード特殊: variable 44 = 40 first
# the story squares: map, (x, y), label, the page, when
STORY = [
    (97, (61, 11), '和布欽、哥高亞戰鬥', 'bujin', ['sw', 591, False]),  # 5511
    (98, (35, 22), '和贊佳、比度戰鬥', 'zangya', ['sw', 592, False]),  # 5531
    (99, (26, 2), '和波傑克戰鬥', 'bojack', None),  # 5571 (no switch: he can be fought again)
    (97, (12, 8), '前往贊佳那邊', 'warp:5561', None), (97, (63, 36), '前往贊佳那邊', 'warp:5562', None),
    (98, (29, 21), '前往布欽那邊', 'warp:5563', None), (98, (46, 21), '前往布欽那邊', 'warp:5564', None),
    (97, (7, 34), '回到時之間', 'back', None), (99, (47, 20), '回到時之間', 'back', None),  # 9912
]
WARPS = {'5561': GO(98, 29, 22), '5562': GO(98, 46, 22), '5563': GO(97, 12, 9), '5564': GO(97, 63, 37)}
ROWS = {97: 55, 98: 55, 99: 34}  # (the last row holds the original's control events)
# 140_Field_Main.rb `when 97..99`: 3-5 of them; map 99 adds 206
AREAS = {'97': {'pool': [198, 200, 202, 204], 'n': [3, 5]}, '98': {'pool': [198, 200, 202, 204], 'n': [3, 5]},
         '99': {'pool': [198, 200, 202, 204, 206], 'n': [3, 5]}}
# who speaks with which face: [sheet, row, column]
P3, E3, F3, CARD = P('Z3_顔味方.PNG'), P('Z3_顔イベント.PNG'), P('Z3_顔敵.PNG'), P('顔カード.PNG')
FACES = {'撒旦': [P3, 28], '男': [E3, 10], '特蘭克斯': [P3, 14], '波傑克': [F3, 42], '布欽': [F3, 47], '哥高亞': [F3, 44],
         '贊佳': [F3, 45], '比度': [F3, 46], '界王': [CARD, 25, 2], '烏龍': [CARD, 20, 2], '排骨飯': [F3, 115],
         '布歐': [F3, 154], '阿拉蕾': [F3, 53], '波波': [CARD, 12, 2], '主持人': [CARD, 69, 2]}
# the enemies' moves (the database has Japanese names only, 「ボー)エネルギー波」): worded as the earlier chapters do
# (tools/build_z4e.py FOE_MOVES); the battle films use the closest earlier ones (src/zg_bojack.js addMoves)
FOE_MOVES = {
    'エネルギー波': '能量波', '連続エネルギー波': '連續能量波', '強力エネルギー波': '強力能量波', '連続強力エネルギー波': '連續強力能量波',
    'スーパーエネルギー波': '超級能量波', 'ダブルエネルギー波': '雙重能量波', '連続エネルギー弾': '連續能量彈', '爆発波': '爆發波',
    '超爆発波': '超爆發波', 'ラッシュ': '猛攻', 'ダブルアタック': '雙重攻擊', '超能力': '超能力', '単体超能力': '超能力',
    '合体超能力': '合體超能力', 'かめはめ波': '龜派氣功', 'どどんぱ': '洞洞波', 'スーパーどどんぱ': '超級洞洞波', '気円斬': '氣圓斬',
    '魔光砲': '魔光砲', '刀攻撃': '刀攻擊', 'カタナ攻撃': '刀攻擊', '大猿変身': '大猿變身', '巨大化': '巨大化',
    'フリーザカッター': '弗利薩切割', 'デスボール': '死亡球', 'スーパーノヴァ': '超新星', 'デッドゾーン': '死亡地帶',
    'プラネットボム': '行星炸彈', 'メテオボール': '流星球', 'コズミックアタック': '宇宙攻擊',
    'グランドスマッシャー': '大地粉碎', 'ギャラテクタイラント': '銀河暴君', 'ギャラティックバスター': '銀河破壞者',
    'ギャラクティックアタック': '銀河攻擊', 'スカイザッパー': '天空斬', 'ギャラクティッククラッシュ': '銀河粉碎',
    'イレイザーキャノン': '抹殺砲', 'イレイザーブロウ': '抹殺打擊', 'イレイサーショック': '抹殺衝擊', 'スローイングブラスター': '投擲衝擊',
    'オメガブラスター': '終極衝擊', 'ビッグスマッシャー': '巨大粉碎', 'イグナイトビジョン': '點火幻象', 'カオスバースト': '混沌爆裂',
    'ネイズバインドウェーブ': '束縛波', 'ドーレテリブルラッシュ': '恐怖猛攻', 'サウザーブレードスラッシュ': '光刃斬',
    'エビルクエーサー': '邪惡類星體', '手が伸びる': '伸長手臂', 'アンギラとメダマッチャ': '合體攻擊', 'エビルグラビティ': '邪惡重力',
    'エビルコメット': '邪惡彗星', 'カエル攻撃': '青蛙攻擊', 'エビルインパクト': '邪惡衝擊',
    'ミストかめはめ波': '幻影龜派氣功', 'ミストばくれつまこうほう': '幻影爆裂魔光砲', 'ミストませんこう': '幻影魔閃光',
    'ミストギャリック砲': '幻影伽力克炮', 'ミスト刀攻撃': '幻影刀攻擊', 'パワードレイン': '能量吸取', 'テイルザンバー': '尾巴斬',
    'ガードンクラッシャー': '加登粉碎', 'キルドライバー': '殺戮打樁', 'リベンジャーチャージ': '復仇者衝鋒', 'リベンジャーカノン': '復仇者砲',
    'ウンチ攻撃': '便便攻擊', '岩攻撃': '岩石攻擊', 'キーン': '奇——恩', 'ブンブン': '嗡嗡', 'んちゃ砲': '嗯恰砲', 'プロレスごっこ': '摔角遊戲',
    '超体当たり': '超級衝撞', 'サンダーフラッシュ': '雷電閃光', '巻きつき攻撃': '纏繞攻擊', 'お菓子光線': '糖果光線',
}


def add(world, h, z3, tr):
    build_map, D, s2t, enemy, skill, root = (h[k] for k in ('build_map', 'D', 's2t', 'enemy', 'skill', 'root'))
    file = z3['file']
    ev7 = D('map007')['events']
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    consts, names = h['build_z3'].bgm_names(src) if 'build_z3' in h else __import__('build_z3').bgm_names(src)
    bgm_of = lambda v: names.get(consts.get(v[1:]) if isinstance(v, str) else v)
    edb, sdb = D('enemies'), D('skills')
    z = world['z3']

    # ---------- the pages ----------
    faces = dict(z3['faces'])
    faces.update(FACES)
    world['faces'].update({'z3:' + k: v for k, v in FACES.items()})
    EXTRA, OPTS = h['EXTRA'], h['OPTS']
    keep_extra, keep_opts = dict(EXTRA), dict(OPTS)

    def code355(p):
        t = p[0].strip()
        if re.match(r'\$partyc\s*=\s*\[', t):
            ids = [int(x) for x in re.findall(r'\d+', t)]
            return [{'partyc': ids}, {'x': 'zgbjParty', 'ids': ids}]
        if t == 'all_charecter_recovery':
            return [{'x': 'recover', 'id': 0}]
        m = re.match(r'set_btl_arena_fight_rank (\w+)$', t)
        if m:  # 0: every rank again (90001); crnum: the one just cleared (90041)
            return [{'x': 'zgbjRanks', 'from': int(m.group(1)) if m.group(1).isdigit() else 'v282'}]
        if t.startswith('$btl_arena_fight_rank_clear_num[crnum'):
            return [{'x': 'zgbjClear'}]
        return []

    def ce(p):
        n = p[0]
        if n == 159:
            return [{'x': 'zgbjSsOff'}]  # 超サイヤ人全解除
        if n == 166:
            return [{'x': 'zgbjKeep'}]  # 現在パーティーをtempへ格納
        if n == 277:  # バトルアリーナ (the first visit): its lines
            return h['script'](D('commonevents')[277]['list'])
        if n in (191, 192, 193, 194):
            return [{'x': 'zgbjCE', 'n': n}]  # the arena's common events (src/zg_bojack.js)
        return []  # (CE39 / 61 / 157 / 168: the remake keeps these itself)

    EXTRA.update({
        355: code355, 655: code355, 117: ce,
        221: lambda p: [{'fadeout': 30}], 222: lambda p: [{'x': 'fadein'}],
        318: lambda p: [{'x': 'skill', 'id': p[0], 'learn': p[1] == 0, 'skill': p[2]}],
        201: lambda p: [{'x': 'zgbjGo', 'to': [p[1], p[2], p[3]] if p[0] == 0 else 'var'}],
    })
    OPTS.update(bgm=True, shakeSw=True)
    pages = {}
    for evno, vals in PAGES.items():
        raw = {p['condition']['variable_value']: p['list'] for p in ev7[evno]['pages'] if p['condition']['variable_valid']}
        for v in vals:
            pages[f'zgbj:{v}'] = [{'v41': v}] + z3['nodes_of'](inline_labels(raw[v]), faces)
    EXTRA.clear()
    EXTRA.update(keep_extra)
    OPTS.clear()
    OPTS.update(keep_opts)
    # pages that end in a battle_process (5511 / 5531 / 5571 / 5581 / 7111 / 7211, 90011-90031): the part before the
    # z1field of the battle step, kept whole; the flow in src/zg_bojack.js plays them and runs the battle itself
    z['pages'].update(pages)

    # ---------- the enemies (the Z3 sheets by their simplified names) and their moves ----------
    arena = arena_sets(root)
    want = set()
    for b in BATTLES.values():
        want |= set(b['foes'])
    for rk in arena.values():
        for rd in rk.values():
            for x in rd:
                want |= set(x['foes'])
    for eid in sorted(want):
        if str(eid) in world['enemies'] or eid in world['enemies']:
            continue
        name = edb[eid]['name']
        era = 'Z2_' if eid < 101 else 'Z3_'
        e = enemy(eid)
        e['sprite'] = file(f'{era}戦闘_必殺技_敵_{name}')
        e['portrait'] = file(f'{era}戦闘_敵_{name}')
        assert e['sprite'] and e['portrait'], (eid, name)
        if eid >= 101:
            e['face'] = [F3, eid - 100]
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (edb[eid]['drop_item1'], edb[eid]['drop_item2'])
                               if d['kind'] == 1 and d['item_id'] in world['items']]
        for a in edb[eid]['actions']:
            sid = a['skill_id']
            if sid and sid not in world['skills'] and str(sid) not in world['skills']:
                world['skills'][sid] = skill(sid)
                jp = sdb[sid]['name'].split(')')[-1].strip()
                jp = jp.split(' ')[-1] if ' ' in jp else jp  # 「アンギラ エビルクエーサー」
                if jp in FOE_MOVES:
                    world['skills'][sid]['name'] = FOE_MOVES[jp]

    # ---------- the story battles ----------
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    z1 = Image.open(os.path.join(pics, 'Z1_戦闘_背景.PNG')).convert('RGB')
    bd = Image.new('RGB', (400, 600), (0, 0, 0))
    bd.paste(z1.crop((120, 500, 520, 600)), (0, 450))
    bd.save(os.path.join(root, 'assets', 'bg', 'zgbj_z1_5.png'), optimize=True)
    for no, b in BATTLES.items():
        z['battles'][str(no)] = {'foes': b['foes'], 'bgm': bgm_of(b['bgm']),
                                 'backdrop': f'bg/z3_battle_{b["row"]}.png' if 'row' in b else 'bg/zgbj_z1_5.png'}

    # ---------- maps 97-99 ----------
    sheets = set()
    for mid, rows in ROWS.items():
        m = build_map(mid, rows=rows)
        # the bosses' map events stand there (enemy5.png: Bujin / Zangya until 591 / 592; Bojack always)
        m['ev'] = tr['map_events'](D, mid, rows, sheets)
        world['maps'][str(mid)] = m
    world['areas'].update(AREAS)
    INN = {'label': '進入旅館', 'event': 11, 'effect': 'rest'}
    SHOP = {'label': '卡片商店', 'effect': 'shop'}
    TRAIN = {'label': '修行', 'effect': 'training'}
    at = lambda spots, kind: [dict(kind, x=x, y=y) for x, y in spots]
    for mid, sp in SPOTS.items():
        world['pois'][str(mid)] = at(sp['card'], SHOP) + at(sp['inn'], INN) + at(sp['train'], TRAIN)
    world['pois']['99'].append({'x': CARD40[1], 'y': CARD40[2], 'label': '卡片商店', 'chapter': KEY, 'page': 'card40'})
    for mid, (x, y), label, page, when in STORY:
        p = {'x': x, 'y': y, 'label': label, 'chapter': KEY, 'page': page}
        if when:
            p['when'] = when
        world['pois'][str(mid)].append(p)
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {f'Graphics/Characters/{n}.png' for n in sheets})

    # ---------- the arena ----------
    ranks = {}
    for rank, rounds in arena.items():
        rs = []
        for rd in ('1', '2', '3'):
            rolls = [x for x in rounds[rd] if x['foes']]
            if not rolls:
                break
            rs.append([{'foes': x['foes'], 'bgm': names.get(x['bgm']), **{f'sw{n}': True for n in x['sw']}} for x in rolls])
        ranks[rank] = rs
    world['zgBojack'] = {
        'start': GO(97, 7, 33), 'boss99': GO(99, 46, 20), 'back': GO(96, 8, 3), 'warps': WARPS,
        'paikuhan': GO(96, 23, 3), 'buu': GO(96, 28, 3),
        'arena': {'ranks': ranks, 'names': arena_names(src, s2t), 'unlock': arena_unlock(src), 'prizes': arena_prizes(D, s2t),
                  'cards': arena_cards(D), 'bg': world['timeroom']['practiceBg'], 'bgm': 'Z2 天下一武道会'},
        'text': {
            'title': s2t('银河ギリギリ!!ぶっちぎりの凄い奴'),
            'goal97': '目標：' + s2t('神秘的银河战士!!') + '（打倒布欽、哥高亞與贊佳、比度）',
            'goal99': '目標：' + s2t('银河的边缘！！绝顶厉害的家伙') + '（前往北方的波傑克）',
        },
    }

    # ---------- the music, sounds and pictures ----------
    bgm, se = set(), set()

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
    bgm |= {b['bgm'] for b in z['battles'].values() if b.get('bgm')}
    bgm |= {x['bgm'] for rs in ranks.values() for rd in rs for x in rd if x.get('bgm')}
    bgm |= {world['maps'][str(m)]['bgm'] for m in ROWS} | {'Z2 天下一武道会', 'Z2 天下一武道会優勝', 'Z2 ゲームオーバー', 'FCJ1 ペンギン村', 'ZSSD フリーザのテーマ'}
    se |= {'Z1 飛ぶ', 'Z1 アイテム取得', 'DB2 アイテム取得', 'DB3 SE035', 'Z1 出る', 'Z1 入る', 'DB3 天下一武道会優勝_ショート', 'DB3 ダッシュ'}
    audio = os.path.join(root, 'game', 'Audio')
    world['extraBgm'] = sorted(set(world['extraBgm']) | {n for n in bgm if n and os.path.exists(os.path.join(audio, 'BGM', n + '.ogg'))})
    world['fieldSe'] = sorted(set(world['fieldSe']) | {n for n in se if os.path.exists(os.path.join(audio, 'SE', n + '.ogg'))})
    scene = ['Z3_背景_界王星']
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {file(n) for n in scene} | {P3, E3, F3, CARD})


def inline_labels(lst):
    """119 jump → a copy of what follows its 118 label up to the end of that label's branch (90041 「通常の勝利」);
    tools/build_z3.py resolve_jumps would copy to the end of the page, as the label has no 終了 after it"""
    labels = {}
    for k, c in enumerate(lst):
        if c['code'] == 118:
            ind, body = c['indent'], []
            for d in lst[k + 1:]:
                if d['indent'] < ind or (d['code'] == 0 and d['indent'] == ind):
                    break
                body.append(d)
            labels[c['parameters'][0]] = (ind, body)
    out = []
    for c in lst:
        if c['code'] == 119 and c['parameters'][0] in labels:
            ind, body = labels[c['parameters'][0]]
            out += [dict(d, indent=d['indent'] - ind + c['indent']) for d in body]
        elif c['code'] != 118:
            out.append(c)
    return out


# battle_arena_ene_set is a long nest of ifs on variables 282 (rank), 283 (round), 281 (rand(3)+1) and 319: Ruby runs
# the original method itself for every case, with rand fixed to each roll in turn
ARENA_RB = r"""
require 'json'
src = File.read(ARGV[0], encoding: 'utf-8')
lines = src.lines
s = lines.index { |l| l =~ /^  def battle_arena_ene_set/ }
e = (s + 1...lines.size).find { |k| lines[k] =~ /^  end/ }
src.scan(/^\s*\$(bgm_no_\w+)\s*=\s*(\d+)/) { |n, v| eval("$#{n} = #{v}") unless eval("$#{n}") }
class Vars < Hash; def [](k); fetch(k, 0); end; end
$roll = 1
module Kernel; def rand(n); $roll - 1; end; end
eval(lines[s..e].join)
out = {}
(1..91).each do |rank|
  out[rank] = {}
  (1..3).each do |round|
    out[rank][round] = (1..3).map do |roll|
      $roll = roll
      $game_variables = Vars.new
      $game_variables[282] = rank; $game_variables[283] = round; $game_variables[319] = 0; $game_variables[40] = 2
      $game_switches = Hash.new(false)
      $battleenemy = []
      battle_arena_ene_set
      { 'foes' => $battleenemy.dup, 'bgm' => $set_btlarn_bgm, 'sw' => $game_switches.select { |k, v| v }.keys }
    end
  end
end
puts JSON.generate(out)
"""


def arena_sets(root):
    """battle_arena_ene_set run by Ruby for every rank, round and roll (variable 281 = 1-3, 319 = 0):
    {rank: {round: [{foes, bgm, sw}, …]}}"""
    out = subprocess.run(['ruby', '-', os.path.join(root, 'research', 'all.rb')], input=ARENA_RB,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def arena_names(src, s2t):
    """get_btl_arena_fight_name (all.rb 850): {rank: name}"""
    body = src[src.index('def get_btl_arena_fight_name'):]
    body = body[:body.index('return fight_name')]
    return {int(n): s2t(t) for n, t in re.findall(r'when (\d+)[^\n]*\n\s*fight_name = "([^"]*)"', body)}


def arena_unlock(src):
    """set_btl_arena_fight_rank (all.rb 1044): {cleared rank x: [[rank that opens (index x + k = rank x + k + 1),
    the switches any of which is needed, extra: 'laps' (a second play-through)], …]}"""
    body = src[src.index('def set_btl_arena_fight_rank'):]
    body = body[:body.index('\n  end\n')]
    out, cur = {}, []
    for line in body.split('\n'):
        t = line.split('#')[0].strip()
        m = re.match(r'when (\d+)(?:\.\.(\d+))?$', t)
        if m:
            cur = list(range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1))
            for x in cur:
                out.setdefault(x, [])
            continue
        m = re.match(r'\$btl_arena_fight_rank\[x(?:\+(\d+))?\] = true if (.*)$', t)
        if m and cur:
            k, cond = int(m.group(1) or 0), m.group(2)
            sws = sorted({int(n) for n in re.findall(r'\$game_switches\[(\d+)\] == true', cond)})
            laps = '$game_laps' in cond
            for x in cur:
                out[x].append({'k': k, 'sw': sws, 'all': '||' not in cond, 'laps': laps})
    return out


def arena_prizes(D, s2t):
    """CE191 (the prizes, variables 291-300 by the rank in variable 284): {rank: {fix: {var: card}, first: {…},
    rand: [[var, %, card], …]}}; ranks ≥ 70 share one entry ('70')"""
    lst = D('commonevents')[191]['list']
    out, cur, common = {}, None, {}
    k = 0
    while k < len(lst):
        c = lst[k]
        code, p = c['code'], c['parameters']
        if code == 118:
            break
        if code == 111 and p[0] == 1 and p[1] == 284:
            cur = {'fix': dict(common), 'first': {}, 'rand': []}
            key = str(p[3]) if p[4] == 0 else 'ge%d' % p[3]
            out[key] = cur
            k += 1
            continue
        if code in (355, 655):
            # a script: plain sets, the first-time block, rand blocks
            block = [p[0]]
            k += 1
            while k < len(lst) and lst[k]['code'] == 655:
                block.append(lst[k]['parameters'][0])
                k += 1
            mode, pct = None, None
            for t in block:
                t = t.split('#')[0].strip()
                if t.startswith('if $btl_arena_first_item_get'):
                    mode = 'first'
                elif t.startswith('if rand(99)+1 <='):
                    mode, pct = 'rand', int(t.split('<=')[1])
                elif t == 'end':
                    mode = None
                m = re.match(r'\$game_variables\[(\d+)\] = (\d+)$', t)
                if m:
                    v, n = int(m.group(1)), int(m.group(2))
                    if cur is None:
                        common[v] = n
                    elif mode == 'first':
                        cur['first'][v] = n
                    elif mode == 'rand':
                        cur['rand'].append([v, pct, n])
                    else:
                        cur['fix'][v] = n
            continue
        if code == 412 and c['indent'] == 0:
            cur = None
        k += 1
    return out


def arena_cards(D):
    """CE192: the cards handed out for the arena (lose_allitem, then these): [[card, n, rank ≥]]"""
    out, need = [], 0
    for c in D('commonevents')[192]['list']:
        if c['code'] == 111 and c['parameters'][1] == 282:
            need = c['parameters'][3]
        elif c['code'] == 111 and c['parameters'][0] == 0:
            need = ('sw', c['parameters'][1])
        elif c['code'] == 412:
            need = 0
        elif c['code'] == 126:
            out.append([c['parameters'][0], c['parameters'][3], need])
    return out
