"""S-combo (Sコンボ / 組合技) data → data/combos.json, for src/combo.js.

Source: the original _scombo.csv (game/Data/_scombo.rvdata, dumped to data/scombo.json by tools/extract.rb) and the
skill database. Loaded in the original by set_scombo (all.rb 12573). Columns per row:
  scombo_no (skill id of the combo), get_flag / new_flag (switches: learned / learned this battle), cha_count,
  cha (actor ids, `-separated), flag_tec (the move each participant must pick), skill_level_num (times each of
  those moves must have been used), card_attack_num / card_gard_num (minimum attack / guard value of each
  participant's card, 0-based like $carda: 1 = ★2), chk_flag/_no/_process/_value (an extra switch (1) or variable (2)
  condition), chk_flag_ssaiya/_cha/_put (the combo list shows the row only while that Super Saiyan actor is in the
  party (put 0) / is not (put 1); the battle check ignores it, all.rb 8850 / 144088), chk_flag_oozaru_put (1: every
  participant must be the Great Ape, 0: none may be, all.rb 140476), scenario_progress (minimum variable 40).

All 252 rows are kept, in the original's order (a combo id may have several rows: the base and the Super Saiyan
forms are different actors, 3 悟空 / 14 超悟空 …). Rows whose switch nothing in the original turns on (511 眠れる力,
519, 769, 1118, 1122, 1123, 1132, 1147, 1171, 1173, 1191) stay closed, like there.

`catchUp`: the switches the original sets on loading a save (CE34 後から追加設定, its Sコンボ part; called by Map007
event 1 pages 2 / 3) and the move swaps of CE205 (Sコンボ切り替えチェック: 悟飯's 激烈魔閃光 53 or 超かめはめ波 54,
特蘭克斯's 177 or 178), as condition / switch nodes for src/combo.js — plus the remake's own: switch 112 (気の開放),
set on Map007 event 2 page 3 when Z2 starts, which the remake's Z2 does not play.
Usage: python3 tools/build_combo.py   (after `ruby tools/extract.rb game/Data data`)
"""
import json, os, re
from s2t import s2t

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = json.load(open(os.path.join(root, 'data', 'scombo.json'), encoding='utf-8'))
skills = {k['id']: k for k in json.load(open(os.path.join(root, 'data', 'skills.json'), encoding='utf-8')) if k}
ce = json.load(open(os.path.join(root, 'data', 'commonevents.json'), encoding='utf-8'))


def ints(v):
    return [int(x) for x in str(v).split('`')]


def name(sid):
    return s2t(skills[sid]['description'] or skills[sid]['name'])


head, out = rows[0], []
for r in rows[1:]:
    d = dict(zip(head, r))
    no, flag = int(d['scombo_no']), int(d['scombo_chk_flag'])
    k = skills[no]
    row = {
        'id': no,
        'name': name(no),
        'power': k['base_damage'],
        'stun': 12 in k['element_set'],  # 超能力気功砲 also freezes the enemy (element 12)
        **({'tail': True} if 25 in k['element_set'] else {}),  # 繰気円斬 cuts a Great Ape's tail (element 25, all.rb 68895)
        'cha': ints(d['scombo_cha']),
        'tec': ints(d['scombo_flag_tec']),
        'uses': ints(d['scombo_skill_level_num']),
        'atk': ints(d['scombo_card_attack_num']),
        'grd': ints(d['scombo_card_gard_num']),
    }
    if flag == 1:
        row['sw'] = int(d['scombo_chk_flag_no'])
    elif flag == 2:  # (no row uses it; get_scombo_list: 0 equal, 1 at least, 2 at most)
        row['v'] = [int(d['scombo_chk_flag_no']), int(d['scombo_chk_flag_process']), int(d['scombo_chk_flag_value'])]
    if int(d['scombo_chk_scenario_progress']):
        row['era'] = int(d['scombo_chk_scenario_progress'])
    if d['scombo_chk_flag_ssaiya'] not in (0, '0', False, None, ''):
        row['ss'] = [int(d['scombo_chk_flag_ssaiya_cha']), int(d['scombo_chk_flag_ssaiya_put'])]
    if int(d['scombo_chk_flag_oozaru_put']):
        row['ape'] = True
    out.append(row)


# ---------- CE34 (its Sコンボ part) and CE205 → nodes ----------
# {'if': cond, 'then': [...], 'else': [...]} / {'sw': [from, to, on]}; cond: ['sw', n, on] | ['var', n, value, op]
# (op as RPG Maker: 0 =, 1 ≥, 2 ≤, 3 >, 4 <, 5 ≠) | ['any', [switches]] (a script `$game_switches[a] || …`) |
# ['knows', actor, skill]
def cond(p):
    if p[0] == 0:
        return ['sw', p[1], p[2] == 0]
    if p[0] == 1 and p[2] == 0:
        return ['var', p[1], p[3], p[4]]
    if p[0] == 4 and p[2] == 2:
        return ['knows', p[1], p[3]]
    if p[0] == 12:
        sws = [int(x) for x in re.findall(r'\$game_switches\[(\d+)\]', p[1])]
        assert sws and re.fullmatch(r'(\s*\$game_switches\[\d+\]\s*(\|\|)?)+', p[1]), p
        return ['any', sws]
    raise ValueError(p)


def nodes(lst):
    i = 0

    def block(ind):
        nonlocal i
        res = []
        while i < len(lst):
            c = lst[i]
            if c['indent'] < ind:
                return res
            code, p = c['code'], c['parameters']
            if code == 111:
                i += 1
                node = {'if': cond(p), 'then': block(ind + 1), 'else': []}
                if i < len(lst) and lst[i]['code'] == 411:
                    i += 1
                    node['else'] = block(ind + 1)
                if i < len(lst) and lst[i]['code'] == 412:
                    i += 1
                res.append(node)
                continue
            if code == 121:
                res.append({'sw': [p[0], p[1], p[2] == 0]})
            # (355 / 655 tecchg_player_scombo_priority: the player's own combo order, not in the remake; 108 / 408 notes)
            i += 1
        return res
    return block(0)


lst = ce[34]['list']
start = next(k for k, c in enumerate(lst) if c['code'] == 408 and 'Sコンボ' in c['parameters'][0])
end = next(k for k, c in enumerate(lst) if k > start and c['code'] == 408 and 'フラグ' in c['parameters'][0])
catch = [{'if': ['var', 40, 1, 1], 'then': [{'sw': [112, 112, True]}], 'else': []}]  # (Map007 event 2 page 3)
catch += nodes([c for c in lst[start + 2:end - 1]])
catch += nodes(ce[205]['list'])

# the participants' moves, for the combo list (names) and the damage (power with proficiency)
moves = {sid: {'name': name(sid), 'power': skills[sid]['base_damage'], 'ki': skills[sid]['mp_cost']}
         for c in out for sid in c['tec']}
# skills whose use counts are kept equal (message2, set_skill_level 102:88126), e.g. 元気玉 19 / 26
sync = {k['id']: [int(x) for x in k['message2'].split(',')] for k in skills.values() if k['id'] < 100 and k['message2']}
json.dump({'combos': out, 'moves': moves, 'sync': sync, 'catchUp': catch},
          open(os.path.join(root, 'data', 'combos.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'rows,', len({c['id'] for c in out}), 'combos,', len(catch), 'catch-up nodes')
