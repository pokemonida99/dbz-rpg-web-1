"""ZG 的概況（前情提要，分工 ovw）: world.z3.zgRecap, read by src/zg_recap.js; added by tools/build_timeroom.py after the
ZG parts. docs/zg-recap.md has the whole of it.

The original: the field menu's あらすじ (var 43 < 901) and a load (variable 40 = 1 / 2) both go to Map007 event 2 page
201, which picks a common event by variable 43 (Scene_Story_So_Far is only for 0-20 / 101). From variable 43 = 111 on —
the stories the time room starts (docs/zg-plan.md) — that is:
  111 未来悟飯編 CE141 · 121 ブロリー編 CE142 · 126 / 127 ボージャック編 CE143 / CE144 (BGM ZArrang_前回のあらすじ)
  143-146 ZG バーダック一味編 CE231-234 (BGM Z2 あらすじ, variable 41 = 1100 first)
  151 … 186 ZG 本編 CE238-246 (グランドアポロン, 西の砂漠, ブンブク島, 氷の大陸, 西の都, ブンブク島(リキニュウム), クーン星,
  オクター星, 暗黒惑星; BGM ZArrang_前回のあらすじ)
Each common event draws z1field scenes (variable 41) under its narration: the story's own (6177, 6223 …), black (1100),
the party (1099) / everyone (1098, character_output_all 26) and the ones made for it, 6771-6775 (all.rb 182521). The
scenes are read from all.rb the way tools/build_zg_a.py reads its own (scene_of) and kept under numbers of their own
(OFFSET + the original's), so they never clash with the scenes the story chapters register; src/zg_a.js draws them.
(The Paikuhan / Buu / Arale fights set variable 43 = 801, which page 201 has no common event for: no 概況, as in the
original.)
"""
import os

from PIL import Image

import build_zg_a

OFFSET = 1000000  # z1field numbers of these scenes (src/zg_recap.js registers them; the original's + OFFSET)
FIRST, LAST = 111, 899  # the part of page 201 this covers (variable 43): from 未来悟飯編 up to the time room (999)


def add(world, h, z3, tr):
    D, root = h['D'], h['root']
    file = z3['file']
    sizes = {}

    def size(path):
        if path not in sizes:
            sizes[path] = Image.open(os.path.join(root, 'game', path)).size
        return sizes[path]

    # Map007 event 2 page 201: `if variable 43 == v` → its BGM, variable 41, common event
    page = next(p['list'] for p in D('map007')['events']['2']['pages']
                if p['condition']['variable_valid'] and p['condition']['variable_value'] == 201)
    picks, cur = {}, None
    for c in page:
        k, p = c['code'], c['parameters']
        if k == 111 and c['indent'] == 1 and p[0] == 1 and p[1] == 43 and p[2] == 0 and FIRST <= p[3] <= LAST:
            cur = picks[p[3]] = {}
        elif k == 412 and c['indent'] == 1:
            cur = None
        elif cur is not None:
            if k == 241:
                cur['bgm'] = p[0]['name']
            elif k == 122 and p[0] == 41 and p[2] == 0:
                cur['v41'] = p[4]
            elif k == 117:
                cur['ce'] = p[0]

    ce = D('commonevents')
    get = (lambda i: ce[str(i)]) if isinstance(ce, dict) else (lambda i: ce[i])
    blocks = build_zg_a.z1field_blocks(open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read())
    recap, used = {}, set()
    for v43, pk in sorted(picks.items()):
        nodes = z3['nodes_of'](get(pk['ce'])['list'], faces={})
        # variable 41 is the scene number: move it to this part's own numbers, and note every scene drawn
        v41 = pk.get('v41')

        def walk(ns):
            nonlocal v41
            for n in ns:
                if 'v41' in n:
                    v41 = n['v41']
                    n['v41'] += OFFSET
                elif n.get('var') and n['var'][0] == 41:
                    op, x = n['var'][1], n['var'][2]
                    if op == 0:
                        v41 = x
                        n['var'] = [41, 0, x + OFFSET]
                    else:
                        v41 += x if op == 1 else -x
                elif n.get('z1field'):
                    assert v41 is not None, (v43, pk)
                    used.add(v41)
                for k in ('then', 'else'):
                    walk(n.get(k, []))
        walk(nodes)
        if 'v41' in pk:
            nodes.insert(0, {'v41': pk['v41'] + OFFSET})
        recap[str(v43)] = {'bgm': pk['bgm'], 'ce': pk['ce'], 'nodes': nodes}

    scenes = {str(n + OFFSET): build_zg_a.scene_of(blocks[n], file, size) for n in sorted(used)}
    world['z3']['zgRecap'] = {'recap': recap, 'scenes': scenes}

    pics = {it[0] for d in scenes.values() for it in d['ene'] + d['play'] if it[0] != '@cf'} | {d['bg'] for d in scenes.values() if d['bg']}
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | pics)
    world['extraBgm'] = sorted(set(world['extraBgm']) | {r['bgm'] for r in recap.values()})
