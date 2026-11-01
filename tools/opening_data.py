"""The Z1 opening story for src/opening.js, from the original Map007 event 1 (page for variable 41 >= 1).

Keeps the event's top-level commands in order: text boxes, `$eve.z1opening n` scene changes (143_Event_Main.rb),
waits, the screen flash and sound effects. Text is converted to Traditional Chinese; the message codes \\| (wait 1 s)
and \\. (wait 1/4 s) are kept for the typewriter. The Chinese fan-translation notice at the start is left out.
"""
import re

# speaker -> [face sheet, row] (the 64×64 faces the original shows in these scenes, 143_Event_Main.rb)
PARTY, EVENT, FOE = 'Graphics/Pictures/Z1_顔味方.PNG', 'Graphics/Pictures/Z1_顔イベント.PNG', 'Graphics/Pictures/Z1_顔敵.PNG'
FACES = {'悟空': [PARTY, 0], '比克': [PARTY, 1], '悟飯': [EVENT, 0], '龜仙人': [EVENT, 1], '拉蒂茲': [FOE, 10],
         '？': [FOE, 10]}  # the stranger is Raditz; his face is the one on screen


def box(lines, s2t):
    text = s2t('\n'.join(lines))
    m = re.match(r'^([^「\n]{1,6})「(.*)」\s*$', text, re.S)
    if not m:
        return ['', text]
    who, body = m.group(1), m.group(2)
    # continuation lines are indented with full-width spaces to sit under the opening bracket
    body = '\n'.join(l.lstrip('　 ') for l in body.split('\n'))
    return [who, body]


def build(D, s2t):
    page = next(p for p in D('map007')['events']['1']['pages'] if p['condition']['variable_valid'])['list']
    out, i = [], 0
    while i < len(page):
        c = page[i]
        code, p = c['code'], c['parameters']
        i += 1
        if c['indent'] != 0:
            continue
        if code == 101:
            lines = []
            while i < len(page) and page[i]['code'] == 401:
                lines.append(page[i]['parameters'][0])
                i += 1
            if re.search('汉化|交流群', ''.join(lines)):
                continue
            out.append({'say': box(lines, s2t)})
        elif code == 355 and p[0].startswith('$eve.z1opening'):
            out.append({'scene': int(p[0].split()[1])})
        elif code == 355 and p[0].startswith('set_start_val'):
            break  # the rest sets up the party and moves to the field
        elif code == 230:
            out.append({'wait': p[0]})
        elif code == 224:
            out.append({'flash': p[1]})
        elif code == 250:
            out.append({'se': p[0]['name']})
    return {'story': out, 'faces': FACES}
