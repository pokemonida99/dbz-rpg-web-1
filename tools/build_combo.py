"""S-combo (Sコンボ / 組合技) data → data/combos.json, for src/combo.js.

Source: the original _scombo.csv (game/Data/_scombo.rvdata, dumped to data/scombo.json by tools/extract.rb) and the
skill database. Loaded in the original by set_scombo (010_Share.rb:4080). Columns per row:
  scombo_no (skill id of the combo), get_flag / new_flag (switches: learned / learned this battle), cha_count,
  cha (actor ids, `-separated), flag_tec (the move each participant must pick), skill_level_num (times each of
  those moves must have been used), card_attack_num / card_gard_num (minimum attack / guard value of each
  participant's card, 0-based like $carda: 1 = ★2), chk_flag/_no/_process/_value (an extra switch or variable
  condition), ssaiya / oozaru columns (Super Saiyan and giant variants), scenario_progress (minimum var 40).

Only the rows open in Z1 (scenario progress 0, no extra switch) whose participants are the Z1 fighters 3-9 are kept;
the Super Saiyan rows (actors 14 / 18) are duplicates for later chapters.
Usage: python3 tools/build_combo.py   (after `ruby tools/extract.rb game/Data data`)
"""
import json, os
from s2t import s2t

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = json.load(open(os.path.join(root, 'data', 'scombo.json'), encoding='utf-8'))
skills = {k['id']: k for k in json.load(open(os.path.join(root, 'data', 'skills.json'), encoding='utf-8')) if k}
Z1 = set(range(3, 10))


def ints(v):
    return [int(x) for x in str(v).split('`')]


head, out, seen = rows[0], [], set()
for r in rows[1:]:
    d = dict(zip(head, r))
    cha = ints(d['scombo_cha'])
    if int(d['scombo_chk_scenario_progress']) > 0 or int(d['scombo_chk_flag']) != 0 or not set(cha) <= Z1:
        continue
    no = int(d['scombo_no'])
    if no in seen:
        continue
    seen.add(no)
    k = skills[no]
    out.append({
        'id': no,
        'name': s2t(k['description'] or k['name']),
        'power': k['base_damage'],
        'stun': 12 in k['element_set'],  # 超能力気功砲 also freezes the enemy (element 12)
        'cha': cha,
        'tec': ints(d['scombo_flag_tec']),
        'uses': ints(d['scombo_skill_level_num']),
        'atk': ints(d['scombo_card_attack_num']),
        'grd': ints(d['scombo_card_gard_num']),
    })
# the participants' moves, for the combo list (names) and the damage (power with proficiency)
moves = {sid: {'name': s2t(skills[sid]['description'] or skills[sid]['name']), 'power': skills[sid]['base_damage'],
               'ki': skills[sid]['mp_cost']} for c in out for sid in c['tec']}
# skills whose use counts are kept equal (message2, set_skill_level 102:88126), e.g. 元気玉 19 / 26
sync = {k['id']: [int(x) for x in k['message2'].split(',')] for k in skills.values() if k['id'] < 100 and k['message2']}
json.dump({'combos': out, 'moves': moves, 'sync': sync}, open(os.path.join(root, 'data', 'combos.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(len(out), 'combos:', ', '.join(c['name'] for c in out))
