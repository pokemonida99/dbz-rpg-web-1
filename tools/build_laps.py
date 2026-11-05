"""第二輪（docs/laps-plan.md）的資料：world.laps. Called from tools/build_data.py after everything else.

Each part has its own function below, so the parallel sessions don't touch the same lines.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def add_a(world, h):
    """分工 A：入口與繼承。

    ce9: the moves of CE9 必殺技設定 that a later round has to give back by itself, because the story won't teach them
    again (they hang on switch 861, or on a ひらめき's get_flag): [{id, skill, when: [conditions]}], src/laps.js syncLap.
    comboSw / comboVar: the combos' extra conditions the original carries over with $scombo_chk_flag (all.rb 21540).
    favInfo: the last box of CE263, only shown while switch 860 is on.
    """
    laps, s2t = world['laps'], h['s2t']
    db = h['D']('commonevents')
    ce = lambda n: db[str(n)] if isinstance(db, dict) else db[n]
    gets = {r['get'] for r in world['tecspark']}
    rows, stack = [], []  # stack: (indent, condition) of the branches we are in
    for c in ce(9)['list']:
        code, p, ind = c['code'], c['parameters'], c['indent']
        if code == 412:
            stack = [x for x in stack if x[0] < ind]
        elif code == 411:
            stack = [(i, (['sw', x[1], not x[2]] if x[0] == 'sw' else ['never']) if i == ind else x) for i, x in stack]
        elif code == 111:
            if p[0] == 0:
                cond = ['sw', p[1], p[2] == 0]
            elif p[0] == 1 and p[2] == 0:
                cond = ['var', p[1], p[3], p[4]]
            elif p[0] == 12 and '860' in p[1] and '$game_variables[40] == 2' in p[1]:
                cond = ['var', 40, 2, 0]  # (598 || 586 || 860) && 40 == 2: 860 is on in a later round
            else:
                cond = ['never']
            stack.append((ind, cond))
        elif code == 318 and p[1] == 0:
            when = [x for _, x in stack]
            if any(x[0] == 'sw' and x[2] and (x[1] == 861 or x[1] in gets) for x in when) and ['never'] not in when:
                rows.append({'id': p[0], 'skill': p[2], 'when': when})
    laps['ce9'] = rows
    with open(os.path.join(ROOT, 'data', 'combos.json'), encoding='utf-8') as f:
        combos = json.load(f)['combos']
    laps['comboSw'] = sorted({c['sw'] for c in combos if c.get('sw')})
    laps['comboVar'] = sorted({c['v'][0] for c in combos if c.get('v')})
    box, on = [], False
    for c in ce(263)['list']:
        if c['code'] == 111 and c['parameters'][:2] == [0, 860]:
            on = True
        elif c['code'] == 412:
            on = False
        elif on and c['code'] == 401:
            box.append(s2t(c['parameters'][0]).replace('週迴', '周回'))
    laps['favInfo'] = ['\n'.join(box)]


def add_b(world, h):
    """分工 B：周回規則。The numbers src/laps_rules.js needs for the level curve past 99 (make_exp_list, all.rb 187941), and
    the card square of the 時之間 (map 58, event 61's second page: switch 860; event_check, all.rb 183829)."""
    world['laps']['exp'] = {str(k): [h['actors'][int(k)]['exp_basis'], h['actors'][int(k)]['exp_inflation']] for k in world['actors']}
    world['pois']['58'].append({'x': 23, 'y': 6, 'label': '卡片商店', 'effect': 'shop', 'forceShop': True, 'when': ['sw', 860, True]})


def add_c(world, h):
    """分工 C：覺醒頭目。Enemies 265 / 275 (no arena rank fights them, the original keeps them in its database and its move
    tables, all.rb 124504 / 124564), the attack values set in code, and the whole 図鑑: get_ene_history_list's enemies
    (src/db3ed.js shownFoes picks the ones it shows; build_field's world.bestiary had only the Z1 ones)."""
    import build_costume
    enemy, skill, edb, root = (h[k] for k in ('enemy', 'skill', 'enemies_db', 'root'))
    pics = {f.lower(): f for f in os.listdir(os.path.join(root, 'game', 'Graphics', 'Pictures'))}

    def picture(stem):
        for ext in ('.png', '.PNG'):
            if (stem + ext).lower() in pics:
                return 'Graphics/Pictures/' + pics[(stem + ext).lower()]
        raise SystemExit(f'build_laps: missing picture {stem}')
    for eid in (265, 275):
        e = enemy(eid)
        e['sprite'] = picture(f"Z3_戦闘_必殺技_敵_{edb[eid]['name']}")
        e['portrait'] = picture(f"Z3_戦闘_敵_{edb[eid]['name']}")
        e['face'] = ['Graphics/Pictures/Z3_顔敵.PNG', eid - 100]
        world['enemies'][eid] = e
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (edb[eid]['drop_item1'], edb[eid]['drop_item2'])
                                    if d['kind'] == 1 and d['item_id'] in world['items']]
        for a in edb[eid]['actions']:
            if a['skill_id'] not in world['skills'] and str(a['skill_id']) not in world['skills']:
                world['skills'][a['skill_id']] = skill(a['skill_id'])
    # KGC::LimitBreak.set_enemy_parameters (all.rb 187644): what the database (attack up to 999) can't hold, for 215 / 254 /
    # 153 of the first round too
    src = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    body = src[src.index('def set_enemy_parameters'):]
    set_ = {}
    for k, field, v in re.findall(r'^\s*\$data_enemies\[(\d+)\]\.(atk|exp) = (\d+)', body[:body.index('def revise_enemy_parameters')], re.M):
        (world['enemies'].get(int(k)) or world['enemies'][k])[field] = int(v)
        set_.setdefault(int(k), {})[field] = int(v)
    world['bestiary'] = [{'id': k, 'name': h['s2t'](edb[k]['name']), 'maxhp': edb[k]['maxhp'], 'school': int(edb[k]['hit']) - 1,
                          'exp': set_.get(k, {}).get('exp', int(edb[k]['exp'])), 'gold': int(edb[k]['gold']), 'sp': int(edb[k]['maxmp']),
                          'drops': [d['item_id'] for d in (edb[k]['drop_item1'], edb[k]['drop_item2']) if d['kind'] == 1]}
                         for k, *_ in build_costume.foe_order()]


def add(world, h):
    world['laps'] = {}
    add_a(world, h)
    add_b(world, h)
    add_c(world, h)
