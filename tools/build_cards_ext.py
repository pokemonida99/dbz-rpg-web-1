"""The card / training-square parts (docs/cards-plan.md), each in its own file; called at the end of tools/build_data.py
(after every chapter, so all enemies, maps and story pages are there)."""


def add(world, h):
    import build_training_more  # noqa: E402
    build_training_more.add(world, h)
    import build_cards_square  # noqa: E402
    build_cards_square.add(world, h)
    import build_cards_a  # noqa: E402
    build_cards_a.add(world, h)
    import build_cards_b  # noqa: E402
    build_cards_b.add(world, h)
    import build_cards_story  # noqa: E402
    build_cards_story.add(world, h)
