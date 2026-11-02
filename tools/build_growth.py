"""Character growth data (src/growth.js): passive skills (スキル), their level tables and texts.

world.growth = {
  cards:   {item: skill}  skill cards whose skill is ported
  skills:  {id: {n name, m manual, sp SP to learn, cap CAP to set, ord list order, same [same-effect ids], up next level,
                 old previous level, share settable as an 追加技能, fx {effect columns}}}   (_chaskill.csv)
  typical: {actor: [[level, skill, slot], ...]}   固有技能 by level (008_Share_Sub_skill.rb get_typical_skill)
  first:   {actor: [slot 0, 1, 2]}   固有技能 set at the start (set_typical_skill_first, all.rb 3312)
  boss:    [enemy ids]   enemies treated as a boss ($data_enemies[id].element_ranks[22] == 1; the others are 3, normal):
                         最終決戦 / 最終決戦改 work against these, 征服 against the others
}
Only the skill families the Z1 cast can get are kept: their 固有技能 families, plus 必殺の一撃 and 激怒 (skill cards).
"""
import re

# get_typical_skill (008_Share_Sub_skill.rb:3554): [level, skill no, slot]; a slot takes the skill when it holds the
# skill's previous level (cha_old_skill_no), so each battle moves a slot one step.
TYPICAL = {
    3: [(3, 2, 0), (5, 48, 1), (8, 3, 0), (10, 49, 1), (12, 13, 2), (16, 4, 0), (21, 50, 1), (24, 14, 2), (27, 89, 0),
        (35, 149, 1), (42, 15, 2), (49, 90, 0), (56, 150, 1), (63, 101, 2), (69, 91, 0), (76, 151, 1), (83, 102, 2),
        (90, 92, 0), (98, 152, 1)],
    4: [(3, 35, 0), (8, 13, 1), (12, 14, 1), (16, 15, 1), (25, 101, 1), (34, 102, 1), (43, 34, 2), (60, 103, 1),
        (77, 104, 1), (94, 105, 1)],
    5: [(3, 61, 0), (5, 2, 1), (9, 13, 2), (12, 62, 0), (16, 3, 1), (20, 14, 2), (25, 63, 0), (32, 4, 1), (39, 15, 2),
        (46, 167, 0), (54, 89, 1), (62, 101, 2), (70, 168, 0), (77, 90, 1), (84, 102, 2), (92, 169, 0), (99, 91, 1)],
    6: [(3, 13, 0), (5, 25, 1), (9, 14, 0), (13, 26, 1), (17, 15, 0), (21, 27, 1), (26, 101, 0), (30, 119, 1),
        (37, 34, 2), (45, 102, 0), (52, 120, 1), (60, 103, 0), (67, 121, 1), (74, 104, 0), (82, 122, 1), (90, 105, 0),
        (99, 123, 1)],
    7: [(3, 13, 0), (5, 16, 1), (8, 14, 0), (12, 17, 1), (16, 15, 0), (20, 18, 1), (24, 101, 0), (27, 107, 1),
        (30, 34, 2), (37, 102, 0), (44, 108, 1), (50, 103, 0), (58, 109, 1), (65, 104, 0), (72, 110, 1), (78, 105, 0),
        (85, 111, 1), (92, 106, 0)],
    8: [(3, 13, 0), (5, 58, 1), (9, 14, 0), (13, 59, 1), (17, 60, 1), (21, 15, 0), (25, 161, 1), (30, 101, 0),
        (35, 34, 2), (43, 162, 1), (50, 102, 0), (58, 163, 1), (65, 103, 0), (71, 164, 1), (79, 104, 0), (86, 165, 1),
        (94, 105, 0)],
    9: [(4, 13, 0), (6, 39, 1), (10, 14, 0), (14, 40, 1), (18, 41, 1), (22, 15, 0), (28, 131, 1), (33, 101, 0),
        (38, 34, 2), (46, 132, 1), (53, 102, 0), (60, 133, 1), (67, 103, 0), (73, 134, 1), (80, 104, 0), (87, 135, 1),
        (95, 105, 0)],
}
# バーダック (16, and 32 超サイヤ人): 最終決戦, サイヤ人の魂, 鋼鉄のこぶし (all.rb 5404)
TYPICAL[16] = TYPICAL[32] = [
    (3, 8, 0), (5, 5, 1), (16, 48, 2), (19, 6, 1), (23, 49, 2), (27, 7, 1), (36, 50, 2), (47, 95, 1), (55, 149, 2),
    (62, 96, 1), (71, 150, 2), (80, 97, 1), (89, 151, 2), (99, 98, 1)]
# set_typical_skill_first: バーダック starts with 最終決戦 / サイヤ人魂3 / 鋼鉄のこぶし2 (not in his Z1 story, variable 43 = 101).
# The original sets actor 16 only; here 32 is the same member (src/supersaiyan.js), so both.
FIRST = {16: [8, 7, 49], 32: [8, 7, 49]}
# the other members' tables, read from get_typical_skill (all.rb 3554-6695; levels up to 99 like the ones above —
# above 99 needs the second lap; Goku's 地球育ちのサイヤ人 678-686 under switch 1312 replaces slot 2's Z戦士の絆 at run
# time: src/growth.js typicalRun, all.rb 3598-3787)
TYPICAL[10] = [  # チチ
    (4, 77, 0), (8, 70, 1), (13, 78, 0), (17, 71, 1), (22, 79, 0), (27, 72, 1), (31, 197, 0), (33, 34, 2),
    (41, 185, 1), (49, 198, 0), (56, 186, 1), (63, 199, 0), (70, 187, 1), (77, 200, 0), (83, 188, 1), (89, 201, 0),
    (95, 189, 1)]
TYPICAL[12] = [  # ベジータ
    (10, 9, 0), (13, 2, 1), (16, 31, 2), (19, 3, 1), (23, 32, 2), (27, 4, 1), (34, 33, 2), (40, 428, 0), (48, 89, 1),
    (58, 125, 2), (70, 90, 1), (81, 126, 2), (90, 91, 1), (99, 429, 0)]
TYPICAL[14] = [  # 超悟空
    (3, 5, 0), (5, 48, 1), (8, 6, 0), (10, 49, 1), (12, 13, 2), (16, 7, 0), (21, 50, 1), (24, 14, 2), (27, 95, 0),
    (35, 149, 1), (42, 15, 2), (49, 96, 0), (56, 150, 1), (63, 101, 2), (69, 97, 0), (76, 151, 1), (83, 102, 2),
    (90, 98, 0), (98, 152, 1)]
TYPICAL[15] = [  # 若者
    (10, 10, 0), (13, 25, 1), (19, 26, 1), (28, 27, 1), (32, 34, 2), (38, 119, 1), (51, 12, 0), (57, 120, 1),
    (65, 121, 1), (73, 122, 1), (81, 123, 1), (90, 124, 1)]
TYPICAL[17] = [  # トランクス
    (4, 336, 0), (7, 2, 1), (10, 13, 2), (14, 337, 0), (19, 3, 1), (22, 14, 2), (26, 4, 1), (33, 338, 0),
    (40, 15, 2), (47, 89, 1), (54, 339, 0), (61, 101, 2), (68, 90, 1), (74, 340, 0), (82, 102, 2), (90, 91, 1),
    (98, 341, 0)]
TYPICAL[18] = [  # 超悟飯
    (3, 61, 0), (5, 5, 1), (9, 13, 2), (12, 62, 0), (16, 6, 1), (20, 14, 2), (25, 63, 0), (32, 7, 1), (39, 15, 2),
    (46, 167, 0), (54, 95, 1), (62, 101, 2), (70, 168, 0), (77, 96, 1), (84, 102, 2), (92, 169, 0), (99, 97, 1)]
TYPICAL[19] = [  # 超ベジータ
    (10, 9, 0), (13, 5, 1), (16, 31, 2), (19, 6, 1), (23, 32, 2), (27, 7, 1), (34, 33, 2), (40, 428, 0), (48, 95, 1),
    (58, 125, 2), (70, 96, 1), (81, 126, 2), (90, 97, 1), (99, 429, 0)]
TYPICAL[20] = [  # 超トランクス
    (4, 336, 0), (7, 2, 1), (10, 13, 2), (14, 337, 0), (19, 6, 1), (22, 14, 2), (26, 7, 1), (33, 338, 0),
    (40, 15, 2), (47, 95, 1), (54, 339, 0), (61, 101, 2), (68, 96, 1), (74, 340, 0), (82, 102, 2), (90, 97, 1),
    (98, 341, 0)]
TYPICAL[21] = [  # 18号
    (4, 423, 0), (8, 31, 1), (12, 13, 2), (20, 32, 1), (28, 32, 2), (36, 33, 1), (44, 424, 0), (52, 33, 2),
    (60, 125, 1), (68, 339, 0), (75, 126, 1), (82, 90, 1), (90, 127, 1), (98, 126, 2)]
TYPICAL[22] = [  # 17号
    (4, 423, 0), (8, 31, 1), (12, 13, 2), (20, 32, 1), (28, 32, 2), (36, 33, 1), (43, 424, 0), (50, 33, 2),
    (60, 125, 1), (69, 339, 0), (77, 126, 1), (85, 90, 1), (93, 127, 1)]
TYPICAL[23] = [  # 16号
    (1, 57, 0), (4, 423, 1), (8, 48, 2), (15, 49, 2), (23, 50, 2), (31, 149, 2), (43, 150, 2), (57, 424, 1),
    (70, 151, 2), (84, 425, 1), (95, 426, 0)]
TYPICAL[24] = [  # 亀仙人
    (3, 13, 1), (6, 39, 2), (9, 687, 0), (13, 14, 1), (17, 688, 0), (21, 40, 2), (26, 15, 1), (33, 41, 2),
    (39, 689, 0), (45, 101, 1), (51, 131, 2), (57, 690, 0), (64, 102, 1), (70, 132, 2), (76, 691, 0), (82, 103, 1),
    (88, 133, 2), (95, 692, 0)]
TYPICAL[25] = [  # 未来悟飯
    (4, 354, 0), (7, 2, 1), (10, 13, 2), (14, 355, 0), (19, 3, 1), (24, 32, 2), (32, 4, 1), (40, 356, 0),
    (47, 33, 2), (55, 89, 1), (63, 357, 0), (71, 101, 2), (78, 90, 1), (86, 358, 0), (94, 102, 2)]
TYPICAL[26] = [  # 超未来悟飯
    (4, 354, 0), (7, 5, 1), (10, 13, 2), (14, 355, 0), (19, 6, 1), (24, 32, 2), (32, 7, 1), (40, 356, 0),
    (47, 33, 2), (55, 95, 1), (63, 357, 0), (71, 101, 2), (78, 96, 1), (86, 358, 0), (94, 102, 2)]
TYPICAL[27] = [  # トーマ
    (3, 5, 0), (7, 80, 1), (11, 48, 2), (15, 6, 0), (18, 81, 1), (21, 49, 2), (27, 7, 0), (33, 82, 1), (39, 50, 2),
    (45, 95, 0), (50, 83, 1), (57, 149, 2), (64, 96, 0), (71, 84, 1), (78, 150, 2), (85, 97, 0), (92, 85, 1),
    (99, 151, 2)]
TYPICAL[28] = [  # セリパ
    (3, 5, 0), (7, 80, 1), (11, 31, 2), (15, 6, 0), (18, 81, 1), (21, 32, 2), (27, 7, 0), (33, 82, 1), (39, 33, 2),
    (45, 95, 0), (50, 83, 1), (57, 125, 2), (64, 96, 0), (71, 84, 1), (78, 126, 2), (85, 97, 0), (92, 85, 1),
    (99, 127, 2)]
TYPICAL[29] = [  # トテッポ
    (3, 5, 0), (7, 80, 1), (11, 48, 2), (15, 6, 0), (18, 81, 1), (21, 49, 2), (27, 7, 0), (33, 82, 1), (39, 50, 2),
    (45, 95, 0), (50, 83, 1), (57, 149, 2), (64, 96, 0), (71, 84, 1), (78, 150, 2), (85, 97, 0), (92, 85, 1),
    (99, 151, 2)]
TYPICAL[30] = [  # パンブーキン
    (3, 5, 0), (7, 80, 1), (11, 48, 2), (15, 6, 0), (18, 81, 1), (21, 49, 2), (27, 7, 0), (33, 82, 1), (39, 50, 2),
    (45, 95, 0), (50, 83, 1), (57, 149, 2), (64, 96, 0), (71, 84, 1), (78, 150, 2), (85, 97, 0), (92, 85, 1),
    (99, 151, 2)]
# set_typical_skill_first (all.rb 3312): the 固有 slots a member starts with (0 = none)
FIRST.update({10: [77, 70, 0], 24: [687, 14, 39], 12: [9, 3, 31], 27: [7, 82, 49], 28: [7, 82, 33], 29: [7, 82, 49],
              30: [7, 82, 49], 17: [339, 90, 102], 21: [424, 33, 34], 22: [424, 33, 34], 23: [426, 425, 151],
              25: [358, 91, 103]})
EXTRA = [280, 22, 618, 670, 538,  # 必殺の一撃, 激怒, 一か八か (skill cards), 最終決戦改 (ZG 6131), 征服 (card 167 チルド)
         38, 678]  # 真の力 (超2 悟飯, on_off_super_saiyazin 5), 地球育ちのサイヤ人 1-9 (悟空, switch 1312)
FX = {  # effect columns (get_cha_skill_manual shows them under ＊＊ 效果詳細 ＊＊)
    'cha_skill_a_kouka': 'a', 'cha_skill_g_kouka': 'g', 'cha_skill_hp_kaihuku': 'hp', 'cha_skill_hp_kaihuku_mozi': 'hpm',
    'cha_skill_ki_kaihuku': 'ki', 'cha_skill_ki_kaihuku_mozi': 'kim', 'cha_skill_hatudouritu': 'rate',
    'cha_skill_hp_shohi': 'hps', 'cha_skill_hp_shohi_mozi': 'hpsm', 'cha_skill_ki_shohi': 'kis',
    'cha_skill_ki_shohi_mozi': 'kism', 'cha_skill_a_hoshi': 'ah', 'cha_skill_g_hoshi': 'gh', 'cha_skill_bairitu': 'b',
    'cha_skill_bairitu_mozi': 'bm'}


def ids(v):
    return [int(x) for x in re.split('[`,]', str(v)) if x not in ('', '0')]


def add(world, h):
    D, s2t = h['D'], h['s2t']
    rows = D('chaskill')
    head = rows[0]
    table = {r[0]: dict(zip(head, r)) for r in rows[1:]}
    keep = set()
    for sid in [s for t in TYPICAL.values() for _, s, _ in t] + [s for f in FIRST.values() for s in f if s] + EXTRA:
        keep |= {sid, *ids(table[sid]['cha_skill_same_no'])}
    out = {}
    for sid in sorted(keep):
        r = table[sid]
        if r['cha_skill_botu_flag']:
            continue
        fx = {k: (s2t(v) if isinstance(v, str) else v) for c, k in FX.items() if (v := r[c]) not in (0, '0', '')}
        out[sid] = {'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                    'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                    'same': ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                    'old': ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
    for eid, e in world['enemies'].items():  # SP reward = the enemy's max MP (docs/battle-rules.md §6)
        e['sp'] = int(h['enemies_db'][int(eid)]['maxmp'])
    boss = [i for i, e in enumerate(h['enemies_db']) if e and e['element_ranks']['data'][22] == 1]
    # skill cards (Items element 32, base_damage = the skill): using one adds the skill to the 追加技能 list
    items = D('items')
    cards = {i: items[i]['base_damage'] for i in range(1, len(items))
             if items[i] and 32 in items[i]['element_set'] and items[i]['base_damage'] in out}
    world['growth'] = {'skills': out, 'cards': cards, 'typical': {a: [list(x) for x in t] for a, t in TYPICAL.items()},
                       'first': FIRST, 'boss': boss}
