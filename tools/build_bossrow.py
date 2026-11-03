"""Boss markers on the maps: the original's enemy*.png sheets keep a different character in each direction row of a
block (enemy1 block 1: down = Sansho's man, left = the Saibaman; block 2 left = Nappa; block 3 left = Vegeta; block 4:
Frieza's forms by direction), and the map events pick one with their direction. A marker built without `row` drew the
down row; here it takes the row of the original event's page at its square: the page with the same sheet and index,
the one whose variable 41 / 43 condition matches the marker's `when` when there are several (src/field.js draws
row `row`). Markers that set `row` themselves are left alone."""
import json
import os

DIR_ROW = {2: 0, 4: 1, 6: 2, 8: 3}


def add(world, h):
    root, D = h['root'], h['D']
    n = 0
    for mid, b in world.get('bosses', {}).items():
        try:
            evs = D(f'map{int(mid):03d}')['events']
        except Exception:
            continue
        evs = [e for e in (evs.values() if isinstance(evs, dict) else evs) if e]
        for x in (b if isinstance(b, list) else [b]):
            if 'row' in x:
                continue
            sheet = os.path.splitext(os.path.basename(x.get('sheet') or 'Graphics/Characters/enemy1.png'))[0]
            k = x.get('index', 0)
            when = x.get('when') or []
            if when and not isinstance(when[0], list):
                when = [when]
            want = {c[1]: c[2] for c in when if len(c) >= 3 and c[0] == 'var'}
            pages = [p for e in evs if abs(e['x'] - x['x']) <= 1 and e['y'] == x['y'] for p in e['pages']
                     if p['graphic']['character_name'] == sheet and p['graphic']['character_index'] == k]
            if not pages:
                continue
            pick = [p for p in pages if p['condition'].get('variable_valid') and want.get(p['condition']['variable_id']) == p['condition']['variable_value']]
            dirs = {p['graphic']['direction'] for p in (pick or pages)}
            if len(dirs) != 1:
                continue
            row = DIR_ROW.get(dirs.pop(), 0)
            if row:
                x['row'] = row
                n += 1
    print(f'boss markers turned to the original row: {n}')
