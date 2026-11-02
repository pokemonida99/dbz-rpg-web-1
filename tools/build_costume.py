"""換裝 (衣替え): the map sprites of the clothes and the pictures src/costume.js names; the DB3 staff roll (src/db3ed.js)
(docs/costume.md).

The rules themselves (set_character_face all.rb 19758, set_battle_character_name 19414, set_dress 20018, set_map_cha
20249) are code in src/costume.js. Here: the leader's sprite while flying in the Z3 era (map 33 event 5 「飛行キャラ」, the
pages with a clothes switch: 382 悟空バトルスーツ, 386 悟飯バトルスーツ, 445 悟飯短髪, 131 トランクス長髪, 388 悟飯超2) and on
foot (map 44 event 2 「主人公」, the 精神と時の部屋: 382 / 386), in page order (a later page wins); and the faces / battle
sheets src/costume.js names, checked against the original's files (the case of .png / .PNG as on disk) and deployed.
"""
import json
import os
import re

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pages(m, ev):
    """[lead (variable 42), [switches], sheet, character] of the event's pages with a switch besides 19 (flying)."""
    out = []
    for pg in json.load(open(os.path.join(root, 'data', f'map{m:03d}.json'), encoding='utf-8'))['events'][str(ev)]['pages']:
        c, g = pg['condition'], pg['graphic']
        sws = [c[k + '_id'] for k in ('switch1', 'switch2') if c[k + '_valid'] and c[k + '_id'] != 19]
        if c['variable_valid'] and c['variable_id'] == 42 and sws and g['character_name']:
            out.append([c['variable_value'], sws, g['character_name'], g['character_index']])
    return out


def foe_order():
    """the DB3 staff roll's enemies (Z_db3ed all.rb 23873): get_ene_history_list (every named enemy by its spi) after
    update_eneput_flag (20990) — [id, group] for the ones it may show; src/db3ed.js checks the group's switches:
    base (Z1, Z2, バーダック編; levitate hides), z3 (switch 119 or 860), z4 (431 or 860), post (570 and 459, or 860),
    zg (599, 850 or 586, or 860), gaiden (586 or 860); lap (the 周回 bosses, element 51) only on a second round: left out"""
    out = []
    for k, e in enumerate(json.load(open(os.path.join(root, 'data', 'enemies.json'), encoding='utf-8'))):
        if not k or not e or not e['name']:
            continue
        r, c = e['element_ranks']['data'], None
        if r[34] == 1 or r[35] == 1 or r[36] == 1:
            c = 'base'
        if r[37] == 1:
            c = 'z3'
        if r[38] == 1:
            c = 'z4'
        if r[39] == 1:
            c = 'post'
        if r[40] == 1 or r[41] == 1:
            c = 'zg'
        if r[42] == 1 or r[43] == 1 or r[44] == 1:
            c = 'gaiden'
        if r[51] == 1:
            c = None
        if c and not (c in ('base', 'z3', 'z4') and e['levitate']):
            out.append((e['spi'], k, c))
    return [[k, c] for _, k, c in sorted(out)]


def add(world, g=None):
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    on_disk = {f.lower(): f for f in os.listdir(pics)}
    js = open(os.path.join(root, 'src', 'costume.js'), encoding='utf-8').read()
    used = set()
    for name in sorted(set(re.findall(r"'((?:Z1|Z2|Z3|ZG)_[^']+\.(?:png|PNG))'", js))):
        real = on_disk.get(name.lower())
        if real is None:
            raise SystemExit(f'build_costume: missing picture {name}')
        if real != name:
            raise SystemExit(f'build_costume: {name} is {real} on disk')
        used.add('Graphics/Pictures/' + name)
    world['costume'] = {'fly': pages(33, 5), 'walk': pages(44, 2)}
    # the Willow chapter's page 941 calls CE271 衣装チェンジの説明 right after 「龜仙人加入了隊伍！！」 (the 時之間's 説明 list has
    # it as tr:info271)
    nodes = world['willow']['bio'][0]['nodes']
    k = next(i for i, n in enumerate(nodes) if n.get('say') == ['', '龜仙人加入了隊伍！！'])
    if nodes[k + 1:k + 2] != world['z3']['pages']['tr:info271'][:1]:
        nodes[k + 1:k + 1] = world['z3']['pages']['tr:info271']
    # set_skn_color 1: the window skin's pixel (0,0) fills the shown cards (the time room's skin: Z3_Window)
    from PIL import Image
    px = Image.open(os.path.join(root, 'game', 'Graphics', 'System', 'Z3_Window.png')).convert('RGB').getpixel((0, 0))
    world['db3ed'] = {'foes': foe_order(), 'bgm': 'DB3 エンディング', 'back': '#%02x%02x%02x' % px}
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {'DB3 エンディング'})
    used |= {f'Graphics/Pictures/{n}' for n in ('Z1_顔敵.PNG', 'Z2_顔敵.PNG', 'Z3_顔敵.PNG')}
    se = set(world.get('fieldSe', [])) | {'Z3 アタリ'}
    world['fieldSe'] = sorted(se)
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | used
                                    | {f'Graphics/Characters/{n}.png' for n in ('chara3', 'chara_fly1', 'chara_fly3', 'chara_fly4', 'chara_fly5')})
