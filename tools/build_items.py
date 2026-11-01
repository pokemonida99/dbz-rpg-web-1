"""Item cards (アイテムカード / 特殊卡片) for world.json, from the original Items DB and scripts.

Called from build_data.py: build_items.add(world, globals()). Adds
  world.items     {id: {name, desc, price, rank, occ, all, hp, mp, kind, icon, order}}
  world.cardShop  the Z1 card-shop goods (040_Game_Interpreter.rb z1_cardlist, the ones this version can use)
  world.drops     {enemy id: [[item id, 1/denominator], ...]} (Enemies drop_item1/2, kind 1)
  world.itemSe    sounds the card effects play (copied by copy_assets.py)
and writes assets/ui/item_cards.png: the Z1 column of 顔カード.PNG (005_Icon.rb put_icon rows), one 64×64 icon per
entry of world.items, 10 to a row, in `icon` order.
"""
import os
from PIL import Image

# Every card that can be had in chapters 1-2 (drops, events, the Z1 card shop) plus the battle cards whose effects
# are as simple (33 最長老, 40 超神水, 41 戰鬥服, 51 藍鬼, 52 紅鬼, 53 少年, 54 卡納薩星人, 64 必殺技).
IDS = list(range(1, 27)) + [28, 29, 30, 32, 33, 34, 40, 41, 45, 49, 50, 51, 52, 53, 54, 64, 70, 72, 75, 80, 84, 87]
# z1_cardlist (040_Game_Interpreter.rb) without the cards for systems this version doesn't have yet
# (skill / SP / ZP cards 72 82 83 88 90 96 100 103 211 212, synthesis 35 36, map-square cards 198-200,
#  airplane 76, ghost 121 — the remake has no "KO'd but HP > 0" state)
SHOP = [9, 10, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 34, 45, 49, 50, 70, 75, 80, 84, 87]
# 005_Icon.rb put_icon: rows that differ from id - 1
ICON_ROW = {13: 37, 14: 12, 15: 13, 16: 14, 17: 15, 18: 16, 19: 17, 20: 18, 21: 35, 22: 33, 23: 19, 24: 20, 25: 21,
            26: 34, 27: 22, 28: 36, 29: 23, 30: 24, 31: 38, 32: 25, 33: 30, 34: 26, 35: 27, 36: 28, 37: 29, 38: 31,
            39: 32, 40: 39, 41: 40, 42: 41, 43: 42, 44: 43, 45: 44}
for i in range(46, 71):
    ICON_ROW[i] = i - 1
SE = ['Z3 回復', 'Z2 カードアップ', 'Z1 パワーアップ', 'Z1 アイテム取得', 'Z1 刀', 'Z1 飛ぶ', 'Z1 高速移動', 'Z1 歩く音',
      'Z3 レベルアップ', 'Z3 決定', 'Z3 エラー', 'Z3 カーソル移動']
# effects with no target (Scene_Db_Card other_card_run / change_card_run on the whole hand)
OTHER = {21: 'cardAll', 22: 'cardAll', 24: 'cardAll', 26: 'cardAll', 28: 'other', 29: 'other', 34: 'other',
         45: 'other', 70: 'other', 80: 'other'}
UNUSABLE = {1, 2, 3, 4, 5, 6, 7, 8, 72}  # the radar, the dragon balls, 悟飯(C) (skill slots)


def add(world, h):
    D, s2t, root = h['D'], h['s2t'], h['root']
    items = D('items')
    out = {}
    for k, i in enumerate(IDS):
        it = items[i]
        el = it['element_set']
        rank = next((r for e, r in ((5, 'S'), (6, 'A'), (7, 'B'), (8, 'C')) if e in el), None)
        if i in UNUSABLE:
            kind = 'none'
        elif it['hp_recovery_rate'] or it['mp_recovery_rate']:
            kind = 'heal'
        elif 3 in el:
            kind = 'foe'
        elif i in OTHER:
            kind = OTHER[i]
        elif el and el[0] == 2:
            kind = 'member'
        elif el and el[0] == 1:
            kind = 'card'
        else:
            kind = 'other'
        out[i] = {'name': s2t(it['name']), 'desc': s2t(it['note'].replace('\r', '')), 'price': it['price'], 'rank': rank,
                  'occ': it['occasion'], 'all': it['scope'] == 8, 'hp': it['hp_recovery_rate'], 'mp': it['mp_recovery_rate'],
                  'kind': kind, 'icon': k, 'order': it['speed']}
    world['items'] = out
    world['cardShop'] = sorted(SHOP, key=lambda i: items[i]['speed'])
    enemies = D('enemies')
    world['drops'] = {eid: [[d['item_id'], d['denominator']] for d in (enemies[int(eid)]['drop_item1'], enemies[int(eid)]['drop_item2'])
                            if d['kind'] == 1 and d['item_id'] in out]
                      for eid in world['enemies']}
    world['itemSe'] = SE
    sheet = Image.open(os.path.join(root, 'game', 'Graphics', 'Pictures', '顔カード.PNG')).convert('RGBA')
    icons = Image.new('RGBA', (640, 64 * ((len(IDS) + 9) // 10)))
    for k, i in enumerate(IDS):
        r = ICON_ROW.get(i, i - 1)
        icons.paste(sheet.crop((0, 64 * r, 64, 64 * r + 64)), (64 * (k % 10), 64 * (k // 10)))
    os.makedirs(os.path.join(root, 'assets', 'ui'), exist_ok=True)
    icons.save(os.path.join(root, 'assets', 'ui', 'item_cards.png'), optimize=True)
