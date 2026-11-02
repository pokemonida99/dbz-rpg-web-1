"""大工程 skc (docs/skc.md, src/skills_d.js): world.skc = {
  drop2: {enemy id: [item id, denominator]}   the enemy's second drop (Enemies drop_item2, kind 1): カードドロップ makes only
                                              this one likelier (all.rb 51428 get_card_drop_add)
}
and world.growth.cards for the skc skill cards (CARDS) whose skill came into world.growth.skills after build_growth made the
list (光の旅 620 and 刺し違える覚悟 634: tools/build_sys.py).
Called at the end of build_data.py, once every chapter has added its enemies, drops and skills.
"""

# tools/build_items.py BASE (大工程 skc)
CARDS = [65, 66, 94, 95, 99, 101, 102, 108, 111, 115, 116, 117, 118, 143, 146, 147, 149, 150, 152, 158, 159, 161, 163, 164,
         185, 188, 189, 190, 191, 192, 193, 208, 209, 210, 213]


def add(world, h):
    edb = h['enemies_db']
    drop2 = {}
    for eid in world['enemies']:
        e = edb[int(eid)] if int(eid) < len(edb) else None
        d = e and e['drop_item2']
        if d and d['kind'] == 1 and any(x == [d['item_id'], d['denominator']] for x in world['drops'].get(eid, [])):
            drop2[eid] = [d['item_id'], d['denominator']]
    world['skc'] = {'drop2': drop2}
    items, g = h['D']('items'), world['growth']
    have = {int(k) for k in g['skills']}
    for i in CARDS:
        it = items[i]
        assert str(i) in world['items'] or i in world['items'], i
        if 32 in it['element_set'] and it['base_damage'] in have:
            g['cards'][i] = it['base_damage']
