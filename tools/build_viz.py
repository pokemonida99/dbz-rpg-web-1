"""Part viz of docs/batch2-plan.md (the small visual gaps): called at the end of tools/build_data.py, after every chapter.

  - assets/ui/faces_ape_z1.png: Z1_顔味方 with 悟飯's row from Z1_顔大猿 (set_character_face, all.rb 19769), for the
    battle status while he is the Great Ape (src/viz.js)
  - assets/ui/cards_z2.png / cards_z3.png / cards_zg.png: カード関係 with the card face, the attack stars, the school frame
    and the blink frames of that part of the story moved onto the Z1 places (set_card_frame, all.rb 14062: set 2 Z2,
    set 3 Z3 and on, set 4 ZG = variable 43 151-200), aliased in world.era (src/era.js), so every screen that draws a
    card follows
  - world.viz.trArea: the 時之間 areas' names (story_string, all.rb 35461-35506) for the HUD (src/timeroom.js trGoal)
  - world.viz.anims: RPG Maker animations played on the map (Animations.rvdata: 4 宇宙船到着1フレ, map 36 event 15)
  - map events: the '!bigsize_anime' 96×64 sheet on map 1 (EV009, Gohan's 「たすけて」 by the pod, while Raditz stands),
    map 90's door (event 6, tile 782) and the animated floor round the core (events 39-53, animap1) until switch 575
"""
import os
import re

from PIL import Image

CARDS = 'Graphics/Pictures/カード関係.PNG'
P = lambda n: f'Graphics/Pictures/{n}'
# set_card_frame: [n, x, y, w, h] per set — 0 face, 2 attack stars (8 × 32), 4 school frame, 5-9 blink frames
CARD_SETS = {
    'z2': [(0, 448, 96, 64, 96)],
    'z3': [(0, 512, 96, 64, 96), (2, 0, 272, 256, 32), (4, 64, 192, 64, 32), (5, 896, 96, 64, 96), (7, 1024, 96, 64, 96),
           (9, 1152, 96, 64, 96)],
    'zg': [(0, 640, 96, 64, 96), (2, 0, 304, 256, 32), (4, 128, 192, 64, 32), (5, 896, 96, 64, 96), (7, 1024, 96, 64, 96),
           (8, 1216, 96, 64, 96), (9, 1280, 96, 64, 96)],
}
Z1_AT = {0: (0, 96), 2: (0, 0), 4: (0, 192), 5: (128, 96), 7: (256, 96), 8: (320, 96), 9: (384, 96)}


def keyed(path):
    """an original picture with its colour-key transparency (tRNS) as real alpha"""
    im = Image.open(path)
    key = im.info.get('transparency')
    im = im.convert('RGBA')
    if isinstance(key, tuple):
        px = [(r, g, b, 0) if (r, g, b) == key[:3] else (r, g, b, a) for r, g, b, a in im.getdata()]
        im.putdata(px)
    return im


def add(world, h):
    root, D, s2t = h['root'], h['D'], h['s2t']
    game, ui = os.path.join(root, 'game'), os.path.join(root, 'assets', 'ui')
    os.makedirs(ui, exist_ok=True)
    viz = world.setdefault('viz', {})

    # ---------- the Great Ape's face ----------
    faces = keyed(os.path.join(game, P('Z1_顔味方.PNG')))
    ape = keyed(os.path.join(game, P('Z1_顔大猿.PNG')))
    faces.paste(ape.crop((0, 128, ape.width, 192)), (0, 128))
    faces.save(os.path.join(ui, 'faces_ape_z1.png'), optimize=True)

    # ---------- the card faces of each part ----------
    sheet = keyed(os.path.join(game, CARDS))
    for era, parts in CARD_SETS.items():
        out = sheet.copy()
        for n, x, y, w, hh in parts:
            cell = sheet.crop((x, y, x + w, y + hh))
            for at in [Z1_AT[n]] + ([(448, 96)] if n == 0 else []):  # (src/battle.js draws the Z2 face from 448)
                out.paste(Image.new('RGBA', (w, hh)), at)
                out.paste(cell, at)
        out.save(os.path.join(ui, f'cards_{era}.png'), optimize=True)
    world['era'].setdefault('1', {})[CARDS] = 'ui/cards_z2.png'
    world['era'].setdefault('2', {})[CARDS] = 'ui/cards_z3.png'
    world['era']['zg'] = {CARDS: 'ui/cards_zg.png'}

    # ---------- the 時之間 areas' names (story_string) ----------
    rb = open(os.path.join(root, 'research', 'all.rb'), encoding='utf-8').read()
    viz['trArea'] = {int(n): s2t(t) for n, t in re.findall(r'when (9[0-3]\d) #時の間:[^\n]*\n\s*story_string \+= "([^"]+)"', rb)}

    # ---------- RPG Maker animations on the map ----------
    anims = D('animations')
    viz['anims'] = {}
    for aid in (4,):
        a = anims[aid]
        frames = []
        for f in a['frames']:
            cd = f['cell_data']
            n = cd['x']
            frames.append([[cd['data'][i + n * j] for j in range(8)] for i in range(n)])  # pattern x y zoom angle mirror opacity blend
        viz['anims'][aid] = {'pics': [f'Graphics/Animations/{a["animation1_name"]}.png', f'Graphics/Animations/{a["animation2_name"]}.png'],
                             'pos': a['position'], 'frames': frames}

    # ---------- map events ----------
    import build_timeroom
    cond = build_timeroom.cond

    def events(mid, ids):
        out = []
        for k, e in sorted(D('map%03d' % mid)['events'].items(), key=lambda kv: int(kv[0])):
            if int(k) not in ids:
                continue
            pages = []
            for p in e['pages']:
                g = p['graphic']
                gfx = g['tile_id'] or ([g['character_name'], g['character_index'], g['direction'], g['pattern']]
                                       + ([p['move_speed']] if p['step_anime'] else []) if g['character_name'] else 0)
                pages.append([cond(p['condition']), gfx, p['priority_type'], int(p['through'])])
            out.append([e['x'], e['y'], pages])
        return out
    # map 1 EV009: shown while Raditz is there (switch 41 in the original; here until he is beaten: state.flags.bossDone)
    ev1 = events(1, {9})
    for e in ev1:
        for pg in e[2]:
            pg[0] = [['flag', 'bossDone', False]] if pg[0] == [['sw', 41, True]] else pg[0]
    world['maps']['1']['ev'] = ev1
    world['maps']['90']['ev'] = events(90, {6} | set(range(39, 54)))

    world['fieldPictures'] = sorted(set(world['fieldPictures']) | {
        P('戦闘_Sコンボ表示枠.PNG'), 'Graphics/Characters/!bigsize_anime.png', 'Graphics/Characters/animap1.png',
        *[p for a in viz['anims'].values() for p in a['pics']],
        *[P(f'hatc_touzyo/ZG_イベント_ハッチ登場_背景色_{n}.PNG') for n in (127, 188, 255)]})
