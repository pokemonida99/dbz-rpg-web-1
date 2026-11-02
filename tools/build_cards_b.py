"""卡片效果 B：141 喜歡角色變更（喜歡的角色系統）、142 悟空、144 比克、148 克林、151 貝吉塔、153 沙維扎、156 快速龍、160 威洛、169 外星人、173 氣墊車、197 修行之石、203 重力裝置、211 悟空(B)、212 克林(B) — world.json data (read by src/cards_b.js), added by tools/build_cards_ext.py. Plan: docs/cards-plan.md.

world.cardsB = {
  fav:  the texts of the favourite-character pages (Map007 event 1 page 23 「お気に入りキャラ設定1」, page 25 「…設定3」),
        {key: text}; \\N[\\V[104]] / \\N[\\V[105]] are left as {old} / {new} for src/cards_b.js
  info: common event 263 「お気に入りキャラ説明」 (the first use of card 141), one text a window (the 周回 one dropped)
  zp:   the CAP → ZP window of card 203 (Scene_Db_Status output_captozp_result, all.rb 43077), {key: text}
  sure: enemies whose card always matches their school (Enemies element 45): とっさの機転 leaves them alone
}
The skill cards' skills join world.growth.skills here too (see SKILLS).
"""
import re

ESC = re.compile(r'\\[|.><^!]')
NAME = re.compile(r'\\N\[\\V\[(\d+)\]\]')


def text(s2t, lines):
    t = '\n'.join(s2t(ESC.sub('', ln)).rstrip() for ln in lines)
    return NAME.sub(lambda m: {'104': '{old}', '105': '{new}'}[m.group(1)], t)


def windows(s2t, lst):
    """the message windows of an event list, in order: [text, ...]"""
    out, cur = [], None
    for c in lst:
        if c['code'] == 101:
            cur = []
            out.append(cur)
        elif c['code'] == 401 and cur is not None:
            cur.append(c['parameters'][0])
        else:
            cur = None
    return [text(s2t, w) for w in out]


# skill cards (Items element 32, base_damage = the skill) whose skills this file adds: item → the family's levels
SKILLS = {
    142: [54, 73, 365, 366],                      # 捨て身
    144: [271, 272, 273, 274, 275, 276, 277, 278, 279],  # かばう
    148: [291, 292, 293, 294, 295, 296, 297, 298, 299],  # 気を練る
    151: [56],                                    # とっさの機転
    153: [239, 240, 241, 242, 243, 244, 245, 246, 247],  # 連撃
    160: [45, 46, 47, 143, 144, 145, 146, 147, 148],     # 不屈の闘志
    211: [19, 20, 21, 113, 114, 115, 116, 117, 118],     # 残像拳
    212: [671, 672, 673, 674, 675, 676, 677],     # 連携
}


def add(world, h):
    D, s2t = h['D'], h['s2t']
    ev = D('map007')['events']
    ev = ev['1'] if isinstance(ev, dict) else ev[1]
    p23, p25 = (windows(s2t, ev['pages'][n - 1]['list']) for n in (23, 25))
    # page 23: [now, ask]; page 25: [none, change, set, ok?, set (done), continue?]
    fav = {'now': p23[0], 'ask': p23[1], 'none': p25[0], 'change': p25[1], 'set': p25[2], 'ok': p25[3],
           'done': p25[4], 'again': p25[5]}
    info = windows(s2t, D('commonevents')[263]['list'])[:3]  # the fourth is for 周回 play (switch 860)
    zp = {k: s2t(v) for k, v in {
        'rate': 'CAP：{cap}点 转换　ZP：{zp}点', 'how': '请用上下按钮决定要转换的 CAP 数量',
        'have': '持有CAP：{have}', 'use': '使用CAP：{cap}　获得ZP：{zp}', 'yes': '是', 'no': '否'}.items()}
    # enemies whose card always matches their school (element 45 = 100 %): とっさの機転 can't change their card
    sure = [i for i, e in enumerate(D('enemies')) if e and e['element_ranks']['data'][45] == 1]
    world['cardsB'] = {'fav': fav, 'info': info, 'zp': zp, 'sure': sure}

    # the skill cards' skills: same columns as tools/build_growth.py
    import build_growth  # noqa: E402
    rows = D('chaskill')
    head = rows[0]
    table = {r[0]: dict(zip(head, r)) for r in rows[1:]}
    out = world['growth']['skills']
    for item, fam in SKILLS.items():
        for sid in fam:
            r = table[sid]
            fx = {k: (s2t(v) if isinstance(v, str) else v) for c, k in build_growth.FX.items()
                  if (v := r[c]) not in (0, '0', '')}
            out[sid] = {'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                        'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                        'same': build_growth.ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                        'old': build_growth.ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
        world['growth']['cards'][item] = fam[0]
