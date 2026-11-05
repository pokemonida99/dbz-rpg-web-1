"""第二輪（docs/laps-plan.md）的資料：world.laps. Called from tools/build_data.py after everything else.

Each part has its own function below, so the parallel sessions don't touch the same lines.
"""
import json
import os

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
    """分工 C：覺醒頭目。"""


def add(world, h):
    world['laps'] = {}
    add_a(world, h)
    add_b(world, h)
    add_c(world, h)
