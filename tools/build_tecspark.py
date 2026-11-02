"""ひらめき (閃き必殺技) data → world.tecspark, for src/combo.js; called at the end of tools/build_data.py.

Source: the original _tecspark.csv (game/Data/_tecspark.rvdata, dumped to data/tecspark.json by tools/extract.rb), loaded
by set_tecspark (all.rb 12495). Columns per row: tecspark_no (the move learned), get_flag / new_flag (switches: learned /
learned this battle), cha (actor), flag_tec (the move that may turn into it), skill_level_num (uses it needs),
card_attack_num / card_gard_num (minimum card stars, 0-based), chk_flag (0 none, 1 switch, 2 variable) / _no / _process
(0 ==, 1 >=, 2 <=) / _value, acquisition_rate (%), scenario_progress (minimum variable 40).
The learned moves are added to world.skills (most of them are not anyone's move yet), with the tail flag of element 25.
"""


def add(world, h):
    D, skill = h['D'], h['skill']
    rows = D('tecspark')
    sdb = D('skills')
    head, out = rows[0], []
    for r in rows[1:]:
        d = dict(zip(head, r))
        flag = int(d['tecspark_chk_flag'])
        out.append({
            'no': int(d['tecspark_no']), 'get': int(d['tecspark_get_flag']), 'new': int(d['tecspark_new_flag']),
            'cha': int(d['tecspark_cha']), 'tec': int(d['tecspark_flag_tec']), 'uses': int(d['tecspark_skill_level_num']),
            'atk': int(d['tecspark_card_attack_num']), 'grd': int(d['tecspark_card_gard_num']),
            'rate': int(d['tecspark_chk_acquisition_rate']), 'era': int(d['tecspark_chk_scenario_progress']),
            # chk_flag 1: switch no must be on; 2: variable no compared (process 0 ==, 1 >=, 2 <=) with value
            **({'chk': [flag, int(d['tecspark_chk_flag_no']), int(d['tecspark_chk_flag_process']), d['tecspark_chk_flag_value']]} if flag else {}),
        })
        no = out[-1]['no']
        if no not in world['skills'] and str(no) not in world['skills']:
            world['skills'][no] = skill(no)
        if 25 in sdb[no]['element_set']:
            (world['skills'].get(no) or world['skills'][str(no)])['tail'] = True  # 尻尾切る (all.rb 68895)
    world['tecspark'] = out
