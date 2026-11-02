"""卡片效果 A：55 月亮和尾巴、73 皮拉夫、76 飛機、79 老鼠、91 阿修、92 小舞、96 藍將軍、100 小八、107 桃白白、112 鈴鼓、113 銅撥、114 比克(O)、123 木乃伊 — world.json data (read by src/cards_a.js), added by tools/build_cards_ext.py. Plan: docs/cards-plan.md.

world.cardsA = {skills: {card: skill}, tail: [skill]}   the skill cards of this part (Items element 32, base_damage = the
               skill); the moves that cut a tail (element 25: the Great Ape 悟飯 is himself again, all.rb 68955)
Their passive skills, every level of each family (_chaskill.csv cha_skill_same_no), join world.growth.skills in the same
form as tools/build_growth.py, so the 追加技能 list, SP and the 能力 screen take them like the others. Skill 51 大猿変身
(悟飯, Z1) joins world.skills. Sounds / pictures go on the copy lists (tools/copy_assets.py).
"""
import re

CARDS = [73, 91, 92, 96, 100, 107, 112, 113, 114, 123]  # the skill cards here (55, 76, 79 are not)
FX = {
    'cha_skill_a_kouka': 'a', 'cha_skill_g_kouka': 'g', 'cha_skill_hp_kaihuku': 'hp', 'cha_skill_hp_kaihuku_mozi': 'hpm',
    'cha_skill_ki_kaihuku': 'ki', 'cha_skill_ki_kaihuku_mozi': 'kim', 'cha_skill_hatudouritu': 'rate',
    'cha_skill_hp_shohi': 'hps', 'cha_skill_hp_shohi_mozi': 'hpsm', 'cha_skill_ki_shohi': 'kis',
    'cha_skill_ki_shohi_mozi': 'kism', 'cha_skill_a_hoshi': 'ah', 'cha_skill_g_hoshi': 'gh', 'cha_skill_bairitu': 'b',
    'cha_skill_bairitu_mozi': 'bm'}
SE = ['Z1 満月', 'Z1 大猿', 'Z1 パワーアップ', 'DB3 エネルギー波2', 'DB2 アイテム取得', 'Z3 アイテム取得']
PICTURES = ['Graphics/Pictures/Z1_戦闘_ゴハン(大猿)96×96.png', 'Graphics/Pictures/Z1_戦闘_必殺技_ゴハン(大猿)96×96.png']
# バーダック一味's Great Apes (src/cards_a.js APES): Z2_ / Z3_ by variable 40
PICTURES += [f'Graphics/Pictures/{z}_戦闘_{k}{jp}(大猿)96×96.png' for z in ('Z2', 'Z3') for k in ('', '必殺技_')
             for jp in ('トーマ', 'セリパ', 'トテッポ', 'パンブーキン')]


def ids(v):
    return [int(x) for x in re.split('[`,]', str(v)) if x not in ('', '0')]


def add(world, h):
    D, s2t = h['D'], h['s2t']
    rows = D('chaskill')
    table = {r[0]: dict(zip(rows[0], r)) for r in rows[1:]}
    items = D('items')
    cards = {i: items[i]['base_damage'] for i in CARDS}
    out = world['growth']['skills']
    for sid in sorted({s for c in cards.values() for s in [c, *ids(table[c]['cha_skill_same_no'])]}):
        r = table[sid]
        if r['cha_skill_botu_flag'] or sid in out:
            continue
        fx = {k: (s2t(v) if isinstance(v, str) else v) for c, k in FX.items() if (v := r[c]) not in (0, '0', '')}
        out[sid] = {'n': s2t(r['cha_skill_mozi_set']), 'm': s2t(r['cha_skill_manual']), 'sp': r['cha_skill_get_val'],
                    'cap': r['cha_skill_set_get_val'], 'ord': r['cha_skill_order_no'],
                    'same': ids(r['cha_skill_same_no']), 'up': int(r['cha_upgrade_skill_no'] or 0),
                    'old': ids(r['cha_old_skill_no']), 'share': r['cha_skill_share'] == 'TRUE', 'fx': fx}
    tail = [k['id'] for k in D('skills') if k and 25 in k['element_set']]
    world['cardsA'] = {'skills': cards, 'tail': tail}
    world['skills'][51] = h['skill'](51)  # 大猿変身 (悟飯): 月亮和尾巴 in Z1
    world['fieldSe'] = sorted(set(world['fieldSe']) | set(SE))
    world['fieldPictures'] = sorted(set(world['fieldPictures']) | set(PICTURES))
