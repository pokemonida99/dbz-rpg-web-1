"""第二輪（docs/laps-plan.md）的資料：world.laps. Called from tools/build_data.py after everything else.

Each part has its own function below, so the parallel sessions don't touch the same lines.
"""


def add_a(world, h):
    """分工 A：入口與繼承。"""


def add_b(world, h):
    """分工 B：周回規則。"""


def add_c(world, h):
    """分工 C：覺醒頭目。"""


def add(world, h):
    world['laps'] = {}
    add_a(world, h)
    add_b(world, h)
    add_c(world, h)
