"""Simplified -> Traditional (Taiwan) using the OpenCC-derived table built for the original web port."""
import json, os
_t = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 's2t.json'), encoding='utf-8'))
_max = max(map(len, _t['phrases']))


def s2t(s):
    out, i = [], 0
    while i < len(s):
        for n in range(min(_max, len(s) - i), 1, -1):
            hit = _t['phrases'].get(s[i:i + n])
            if hit:
                out.append(hit)
                i += n
                break
        else:
            out.append(_t['chars'].get(s[i], s[i]))
            i += 1
    return ''.join(_t['tw'].get(c, c) for c in ''.join(out))
