"""卡片格依時代換商品（Scene_Shop 的 z1～zG_cardlist、create_get_card 的 card_id_z1～zg、神經衰弱，變數 44）＋卡片 198／199／200、90／103／157 村人、119 基朗、202 界王星 — world.json data (read by src/cards_square.js and src/cardgames.js), added by tools/build_cards_ext.py. Plan: docs/cards-plan.md, notes: docs/cards-square.md.

world.csq = {
  shop:  {tier: [card, ...]}   040_Game_Interpreter.rb command_302 (all.rb 31668): z1 … zG, zGadd (variable 230 = 1/3/5/7/9/11
                               adds the lists up to that one); the first z1 entry (a second 9) is skipped like the original's loop
  bonus: [[card, cond], ...]   the cards command_302 adds after a boss / an arena rank (only those in world.items)
  lot:   {tier: [card, ...]}   010_Share.rb create_get_card (all.rb 20594): card_id_z1 … card_id_zg, the lottery and
                               concentration prizes (the lists add up the same way; rand(size - 1) never picks the last one)
}
and adds the skills of the skill cards 90 / 103 / 157 / 119 to world.growth (src/growth.js useSkillCard teaches them).
"""
import build_growth

SHOP = {
    'z1': [9, 10, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 34, 35, 36, 45, 49, 50, 70, 72, 75, 76, 80, 82, 83, 84, 87,
           88, 96, 100, 121, 90, 103, 198, 199, 200, 211, 212],
    'z2': [11, 14, 15, 27, 32, 44, 47, 53, 54, 60, 64, 154, 119, 157, 169, 170, 202],
    'z3': [16, 40, 41, 43, 69, 79, 97, 110, 63, 68, 171],
    'z4': [17, 33, 46, 51, 52, 61, 62, 89, 104, 140, 145],
    'zG': [18, 42, 93, 98, 105, 106, 156],
    'zGadd': [38],
}
# command_302: shoplist.concat([n]) if …  (a sw: any of those switches; arena: $btl_arena_fight_rank_clear_num[n] > 0;
# 140 芭蕉扇: variable 40 >= 2 and Chi-Chi (actor 10) has beaten 100 enemies). Switch 860 (second lap) isn't built.
BONUS = [
    [194, {'sw': [44]}], [144, {'sw': [67]}], [187, {'sw': [520]}], [207, {'sw': [528]}], [184, {'sw': [504]}],
    [195, {'sw': [545]}], [173, {'sw': [533]}], [180, {'sw': [828, 586]}], [179, {'sw': [834, 586]}],
    [181, {'sw': [834, 586]}], [201, {'sw': [854]}],
    [155, {'arena': 28}], [73, {'arena': 32}], [162, {'arena': 42}], [165, {'arena': 48}], [166, {'arena': 49}],
    [167, {'arena': 50}],
    [140, {'v40': 2, 'defeats': [10, 100]}],
]
LOT = {
    'z1': [9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 34, 49, 50, 51, 52, 64, 70,
           75, 80, 82, 83, 84, 87, 88, 106, 121, 197],
    'z2': [16, 33, 40, 41, 53, 54, 79, 97, 110],
    'z3': [93, 98, 104, 105, 16, 40, 41, 69, 79, 97, 110, 63, 68, 171],
    'z4': [17, 33, 46, 51, 52, 61, 104, 145],
    'zg': [18, 93, 98, 105, 106, 156],
}
# skill cards (Items element 32, base_damage): 村人A 効果UP(HP), 村人B 効果UP(KI), 村人C 効果UP(H・K), 基朗 気まぐれ
SKILL_CARDS = {90: 431, 103: 440, 157: 449, 119: 390}


def add(world, h):
    items = world['items']
    have = lambda ids: [i for i in ids if str(i) in items or i in items]
    shop = {k: have(v) for k, v in SHOP.items()}
    shop['z1'] = shop['z1'][1:] if SHOP['z1'][0] == SHOP['z1'][1] else shop['z1']  # (the original skips index 0)
    world['csq'] = {'shop': shop, 'bonus': [b for b in BONUS if str(b[0]) in items or b[0] in items],
                    'lot': {k: have(v) for k, v in LOT.items()}}
    if 'ZD カードセット' not in world['itemSe']:  # cards 198-200 (copied by tools/copy_assets.py)
        world['itemSe'].append('ZD カードセット')
    missing = [i for v in list(SHOP.values()) + list(LOT.values()) for i in v if not (str(i) in items or i in items)]
    if missing:
        print('build_cards_square: cards not in world.items:', sorted(set(missing)))

    # the skills (and their whole families: the levels the SP / 追加技能 system moves through), as tools/build_growth.py
    D, s2t = h['D'], h['s2t']
    rows = D('chaskill')
    table = {r[0]: dict(zip(rows[0], r)) for r in rows[1:]}
    g = world['growth']
    for card, sid in SKILL_CARDS.items():
        for x in [sid, *build_growth.ids(table[sid]['cha_skill_same_no'])]:
            r = table[x]
            if r['cha_skill_botu_flag'] or x in g['skills'] or str(x) in g['skills']:
                continue
            fx = {k: (s2t(v) if isinstance(v, str) else v) for c, k in build_growth.FX.items() if (v := r[c]) not in (0, '0', '')}
            g['skills'][x] = {'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                              'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                              'same': build_growth.ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                              'old': build_growth.ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
        g['cards'][card] = sid
