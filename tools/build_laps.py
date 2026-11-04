"""第二輪（docs/laps-plan.md）的資料：world.laps. Called from tools/build_data.py after everything else.

Each part has its own function below, so the parallel sessions don't touch the same lines.
"""


def add_a(world, h):
    """分工 A：入口與繼承。"""


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
