"""劇情與特殊卡片：38 波倫加、48 未來特效藥、57 藥草、58 瀉藥、59 炸藥、62 任意卡、63 交換、68 顛倒、78 筋斗雲、125～133 重要物品與撒旦的簽名、140 芭蕉扇、145 20號、155 弗利薩(S)、168 時間君、171 恐龍 — world.json data (read by src/cards_story.js), added by tools/build_cards_ext.py. Plan: docs/cards-plan.md.

- 57 藥草 / 58 瀉藥 / 59 炸藥: story items. Their element set is [9] with no recovery, so chk_card_run sends them to
  other_card_run, which has no case for them (all.rb 147293: else → false): the original never lets them be used. → kind 'none'.
- skill cards 63 交換 (skill 421), 68 顛倒 (422), 145 20號 (吸收(攻撃) 260), 155 弗利薩(S) (見下す 393, levels 393-401):
  Items element 32, base_damage = the skill (other_card_run, all.rb 146483). The skills join world.growth.skills the way
  tools/build_growth.py builds them, the cards world.growth.cards (src/growth.js registers them as skill cards); the
  battle effects are in src/cards_story.js.
- world.drops: enemies added to world.enemies after tools/build_items.py ran (chapter bosses) got no drops; the original's
  get_item_card drops for every enemy (Enemies drop_item1/2).
"""
import build_growth

NONE = [57, 58, 59]
SKILL_CARDS = [63, 68, 145, 155]


def add(world, h):
    D, s2t = h['D'], h['s2t']
    items = D('items')
    for i in NONE:
        world['items'][str(i) if str(i) in world['items'] else i]['kind'] = 'none'
    rows = D('chaskill')
    head = rows[0]
    table = {r[0]: dict(zip(head, r)) for r in rows[1:]}
    g = world['growth']
    for card in SKILL_CARDS:
        sid = items[card]['base_damage']
        for k in [sid, *build_growth.ids(table[sid]['cha_skill_same_no'])]:
            r = table[k]
            fx = {c2: (s2t(v) if isinstance(v, str) else v) for c, c2 in build_growth.FX.items() if (v := r[c]) not in (0, '0', '')}
            g['skills'][k] = {'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                              'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                              'same': build_growth.ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                              'old': build_growth.ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
        g['cards'][card] = sid
    enemies = D('enemies')
    for eid in world['enemies']:
        if eid in world['drops']:
            continue
        e = enemies[int(eid)]
        world['drops'][eid] = [[d['item_id'], d['denominator']] for d in (e['drop_item1'], e['drop_item2'])
                               if d['kind'] == 1 and (d['item_id'] in world['items'] or str(d['item_id']) in world['items'])]
