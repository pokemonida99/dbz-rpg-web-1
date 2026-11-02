"""Simplified -> Traditional (Taiwan) using the OpenCC-derived table built for the original web port."""
import json, os
_t = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 's2t.json'), encoding='utf-8'))
_t['phrases']['美克星'] = '美克星'  # 那美克星 (Namek), not 克星 → 剋星 (nemesis)
_t['phrases']['干的'] = '幹的'  # 是你們幹的 / 幹得漂亮 (the table's 干的 → 乾的 is "dry"); 相干的 keeps its own phrase
_t['phrases']['相干'] = '相干'
_t['phrases']['干得'] = '幹得'  # 你們幹得很好 (also 干得很: the table has 乾得很)
_t['phrases']['干得很'] = '幹得很'
_t['phrases']['是只'] = '是只'  # 但是只能 / 看來是只能 (the table's 是只 → 是隻 is the measure word)
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
