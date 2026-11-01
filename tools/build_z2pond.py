"""The pond Dragon Ball mini-game of Z2 (Namek, story page 419 「池のドラゴンボール」), added to world.json as
world['pond'] for src/z2pond.js. Rules and sources: docs/z2-pond.md.

Everything is read from the original data (tools/extract.rb must have dumped maps 7, 19, 25, 112-116):
  Map007 event 2 page 419: the rules text, then CE 79 picks the pattern and the player is sent to
     (variable 376 map, 377 x, 378 y), facing down.
  CE 79: variable 380 = rand(variable 379) + 1 (379 = 6, set by CE 34) → one of six maps / start tiles.
  CE 75 (autorun on each pattern map): timer 20 s, the player's graphic action_chara index 1, move speed 4.
  CE 77 (parallel): y == 0 → the timer back to 20 s (SE 'Z3 回復' the first frame, switch 99 on, which turns the
     invisible events 82-97 on row 0 solid); y == 1 → switch 99 off; timer ≤ 0 s → 悟飯「从头开始吧……」, map 19,
     which sends the player back to the pattern's start (the map is set up again: the rocks go back).
  CE 78 / the pattern maps' own rock pages: action button on a rock → it moves one tile the way the player faces.
  Event 18 (tile 260, the Dragon Ball): action button → CE 76 (variable 41 = 420, back to the story).
"""

ROCK_TILE, BALL_TILE = 469, 260
DIRS = {2: 'down', 4: 'left', 6: 'right', 8: 'up'}
ROUTE = {1: 2, 2: 4, 3: 6, 4: 8}  # move command code → direction


def add(world, h):
    D, s2t, build_map, boxes = h['D'], h['s2t'], h['build_map'], h['boxes']
    ce = D('commonevents')

    def cmds(lst, code):
        return [c['parameters'] for c in lst if c['code'] == code]

    # ---------- CE 79: the six patterns ----------
    patterns, cur = [], None
    for c in ce[79]['list']:
        p = c['parameters']
        if c['code'] == 111 and p[:3] == [1, 380, 0]:
            cur = {'n': p[3]}
            patterns.append(cur)
        elif c['code'] == 122 and cur is not None and p[0] in (376, 377, 378):
            cur[{376: 'map', 377: 'x', 378: 'y'}[p[0]]] = p[4]
        elif c['code'] == 119 and cur is not None:
            cur = None
    patterns.sort(key=lambda q: q['n'])
    # variable 379 (the number of patterns) is set by CE 34
    nmax = next(p[4] for c in ce[34]['list'] if c['code'] == 122 for p in [c['parameters']] if p[0] == 379)
    assert nmax == len(patterns), (nmax, len(patterns))
    # Map 19: back to (376, 377, 378) facing the direction it names
    back = next(p for e in D('map019')['events'].values() for pg in e['pages'] for p in cmds(pg['list'], 201))
    start_dir = back[4]

    # ---------- CE 75 / 77 / 76 ----------
    ce75 = ce[75]['list']
    timer = next(p[1] for p in cmds(ce75, 124) if p[0] == 0)
    gfx = next(p for p in cmds(ce75, 322))  # [actor, character name, index, face, face index]
    speed = next(mc['parameters'][0] for p in cmds(ce75, 205) for mc in p[1]['list'] if mc['code'] == 29)
    ce77 = ce[77]['list']
    breath_se = cmds(ce77, 250)[0][0]['name']
    k = next(i for i, c in enumerate(ce77) if c['code'] == 101)
    restart = boxes([c['parameters'][0] for c in ce77[k + 1:] if c['code'] == 401][:1])
    var41 = next(p[4] for p in cmds(ce[76]['list'], 122) if p[0] == 41)
    ce78_skip = all(p[1]['skippable'] for p in cmds(ce[78]['list'], 205))

    # ---------- the pattern maps ----------
    maps, bgm = {}, None
    for q in patterns:
        m = D('map%03d' % q['map'])
        built = build_map(q['map'])
        bgm = bgm or built['bgm']
        rocks, ball, surface = [], None, []
        for eid, e in sorted(m['events'].items(), key=lambda kv: int(kv[0])):
            pg = e['pages']
            g = pg[0]['graphic']['tile_id']
            if g == ROCK_TILE:
                lst = pg[0]['list']
                if any(c['code'] == 117 and c['parameters'][0] == 78 for c in lst):
                    skip = ce78_skip
                else:  # the rock's own copy of CE 78 (map 25, two on map 112): not skippable — it keeps trying
                    routes = cmds(lst, 205)
                    assert {ROUTE[p[1]['list'][0]['code']] for p in routes} == {2, 4, 6, 8}
                    skip = all(p[1]['skippable'] for p in routes)
                rocks.append([e['x'], e['y'], 0 if skip else 1, pg[0]['move_speed']])
            elif g == BALL_TILE:
                assert any(c['code'] == 117 and c['parameters'][0] == 76 for c in pg[0]['list'])
                ball = [e['x'], e['y']]
            elif len(pg) == 2 and pg[1]['condition']['switch1_valid'] and pg[1]['condition']['switch1_id'] == 99:
                # invisible events on the surface row: below the player normally (they still stop rocks),
                # solid while switch 99 is on (after breathing, until the player is back on row 1)
                surface.append([e['x'], e['y']])
            # (event 2: the autorun / parallel caller of CE 75 / 77, in the wall corner)
        maps[str(q['map'])] = built
        q.update(rocks=rocks, ball=ball, surface=surface)

    # the rules, as page 419 explains them before the dive (narration lines, after Gohan's)
    p419 = next(pg for pg in D('map007')['events']['2']['pages']
                if pg['condition']['variable_valid'] and pg['condition']['variable_value'] == 419)
    rules, lines = [], []
    for c in p419['list']:
        if c['code'] == 401:
            lines.append(c['parameters'][0])
        elif lines:
            rules += boxes(lines)
            lines = []
        if c['code'] == 117:  # CE 79: the dive
            break
    rules = [b for b in rules if not b[0]][-2:]  # the two narration windows with the controls / the timer

    world['pond'] = {
        'patterns': patterns,        # [{n, map, x, y, rocks: [[x, y, keepTrying, speed]], ball: [x, y], surface: [[x, y]]}]
        'maps': maps,                # build_map() of each pattern map (20×15)
        'startDir': start_dir,       # 2 = down (RPG Maker directions)
        'timer': timer,              # seconds
        'speed': speed,              # the player's move speed (4: 16 frames a tile)
        'chara': 'Graphics/Characters/%s.png' % gfx[1], 'charaIndex': gfx[2],
        'rockTile': ROCK_TILE, 'ballTile': BALL_TILE,
        'bgm': bgm, 'breathSe': breath_se,
        'restart': restart,          # [[who, text]]
        'var41': var41,
        'rules': rules,
    }
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {bgm})
    world['fieldSe'] = sorted(set(world.get('fieldSe', [])) | {breath_se})
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | {world['pond']['chara']})
