"""Field systems of the original, added to world.json by tools/build_data.py (build_field.add(world, globals())).

  training squares  145_Event_Check.rb chk_training: with variable 40 = 0 (Z1) a training square always runs
                    variable 41 = 31 → Scene_Db_Speed_Training (src/training.js). Map 1 has ten squares (a 3×3 hall
                    around the inn at (53,20) plus (30,5) and (25,20)); Snake Way three, the Sansho area four.
  Pumpkin, Broccoli map 1 (47,11) var41 54 / sw43 and (50,5) var41 56 / sw44: the original's lines, then a battle
                    with enemy 5 / 6 (143_Event_Main.rb battle_process 55 / 57); the square stays empty once beaten.
  情報              var41 41 (Map007 event 1): the fortune teller, then Scene_Db_battle_history / Scene_Db_enemy_history.
                    world.bestiary = the Z1 enemies in the order get_ene_history_list sorts them (spi).
  概況              Scene_Story_So_Far texts for variable 43 = 0 (before the radar) … 3 (Sansho area).
  雷達              Scene_Dragon_Radar points at the map events drawn with walk_anime (map 1 EV008, map 8 EV005).
"""

STORY = {  # Scene_Story_So_Far put_story (the Chinese edition), by variable 43
    0: """地球面临了最大的危机！
悟空的亲哥哥赛亚人拉蒂兹
前来侵略地球！

拉迪兹把悟空的儿子悟饭当成人质
企图迫使悟空加入他的队伍！！
悟空一个人根本无法打赢他！！

就在那时，一位意想不到的人物现身！那就是宿命的对手比克！
对于比克来说，这个可怕的赛亚人成了他野心的障碍！
终于，地球上最强的搭档诞生！！
赶紧用龙珠雷达找到悟饭吧！！！""",
    1: """用布尔玛给的龙珠雷达，总算找到了悟饭的位置！
悟空和比克能够打败强大的赛亚人
从拉蒂兹手中解救出悟饭吗！？""",
    2: """为了前往界王处接受训练
悟空必须赶紧走过漫长漫长的蛇道！
加快脚步，悟空！
而且，更强大的赛亚人也会在一年后来到地球！""",
    3: """为了拯救地球的危机，必须收集龙珠！
然而，新的敌人正瞄准这些龙珠！
他们是企图征服世界的卡里克军团！
绝不能把龙珠交给他们！
Ｚ战士们分成三组，开始了旅程！
向北方出发的Z战士们是……""",
}

TRAINING = {  # chk_training squares (145_Event_Check.rb)
    '1': [(30, 5), (25, 20), (52, 19), (53, 19), (54, 19), (52, 20), (54, 20), (52, 21), (53, 21), (54, 21)],
    '5': [(15, 24), (32, 23), (54, 16)],
    '8': [(4, 17), (52, 6), (54, 6), (57, 22)],
}
RADAR = {'1': [(58, 3)], '8': [(63, 31)]}  # map events with walk_anime on (what the radar shows)

# Scene_Db_Speed_Training texts, in the order the scene shows them
TRAINING_TEXT = {
    'pick': ['用确定按钮选择修行的角色吧！', '不修行的话请按下取消按钮！'],
    'rule1': ['这是锻炼速度和敏捷性的修行！', '出任意一个「流派」或者「星数」同样的卡片即可！', '如果流派为「气」，则打出任意流派都行！'],
    'rule2': ['通过回数越多，获得的经验也就越多！', '确定按钮　开始　取消按钮　结束！'],
    'play': ['出任意一个「流派」或者「星数」同样的卡片即可！'],
    'next': ['确定按钮　继续　取消按钮　结束！'],
    'fail': '修行失败！！', 'failHalf': '修行失败！！　取得经验值减半！',
    'cheer': [(0, '从现在开始！'), (3, '小菜一碟！'), (5, '加油啊！'), (9, '还差得远！'), (14, '不要输！'), (19, '拿出毅力吧！！'), (999, '更上一层楼吧！！！')],
}


def add(world, h):
    ev, enemy, s2t = h['ev'], h['enemy'], h['s2t']
    enemies_db, FACE_FOE = h['enemies_db'], h['FACE_FOE']

    # ---------- training squares: replace the KI-recovery stand-ins with the original squares ----------
    for mid, spots in TRAINING.items():
        pois = [p for p in world['pois'].get(mid, []) if p.get('effect') != 'ki']
        pois += [{'x': x, 'y': y, 'label': '修行', 'effect': 'training'} for x, y in spots]
        world['pois'][mid] = pois

    # ---------- Pumpkin and Broccoli (map 1) ----------
    world['enemies'][6] = enemy(6)
    for (x, y), page, eid, sw in (((47, 11), 54, 5, 43), ((50, 5), 56, 6, 44)):
        world['events'][str(page)] = ev(page)
        world['pois']['1'].append({'x': x, 'y': y, 'label': '迎戰' + s2t(enemies_db[eid]['name']), 'event': page,
                                   'fight': eid, 'gone': sw, 'bgm': 'Z1 戦闘前'})
    world['faces']['帕布金'] = [FACE_FOE, 5]  # the event spells Pumpkin differently from the enemy database

    # ---------- 情報: the fortune teller (var41 41) and the enemy list ----------
    # the page loops (code 112) round its choice, which script() does not nest, so it is taken apart here:
    # the first-visit lines (sw32), the question, and the choice (戰鬥記錄 → var41 42, 敵人情報 → 43, 離開)
    page = ev(41)
    first = next(n for n in page if 'if' in n)['then']
    world['fortune'] = {'first': [n['say'] for n in first if 'say' in n], 'ask': next(n['say'] for n in page if 'say' in n),
                        'choice': next(n['choice'] for n in page if 'choice' in n)}
    world['faces']['占卜婆婆'] = ['Graphics/Pictures/顔カード.PNG', 18]  # z1field 41: 顔カード row 18, column = var 40
    order = {}
    for eid, e in enumerate(enemies_db):
        if e and 0 < eid < 30 and e['name'] and not e['levitate']:
            order[e['spi']] = eid  # get_ene_history_list: $tmp_ene_order[spi] = id (a later id with the same spi wins)
    world['bestiary'] = [{'id': eid, 'name': s2t(enemies_db[eid]['name']), 'maxhp': enemies_db[eid]['maxhp'],
                          'school': int(enemies_db[eid]['hit']) - 1, 'exp': int(enemies_db[eid]['exp']),
                          'gold': int(enemies_db[eid]['gold']), 'sp': int(enemies_db[eid]['maxmp']),
                          'drops': [d['item_id'] for d in (enemies_db[eid]['drop_item1'], enemies_db[eid]['drop_item2']) if d['kind'] == 1]}
                         for _, eid in sorted(order.items())]

    world['story'] = dict(world['story'], soFar={k: s2t(v) for k, v in STORY.items()})
    world['radar'] = RADAR
    world['trainingText'] = {k: ([[n, s2t(t)] for n, t in v] if k == 'cheer' else [s2t(t) for t in v] if isinstance(v, list) else s2t(v))
                             for k, v in TRAINING_TEXT.items()}
    # music and sounds src/training.js, src/fieldmenu.js play (copied by tools/copy_assets.py)
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {'Z1 修行', 'Z1 戦闘前', 'Z1 あらすじ', 'Z2 ドラゴンレーダー', 'DB2 イベント04',
                                                               'Z1 戦闘2', 'Z1 戦闘ボス2(ベジータ)'})
    world['fieldSe'] = ['Z2 アイテム取得', 'Z1 完了', 'Z1 出る', 'Z3 敵発見', 'ZSSD 敵発見(GXSCC音源Ver)', 'GBZ2 戦闘開始']
    world['fieldPictures'] = ['Graphics/Pictures/顔カード.PNG', 'Graphics/Pictures/Z1_背景_スクロール_海.PNG',
                              'Graphics/Pictures/Z1_イベント_ゴクウとゴハン.PNG', 'Graphics/Pictures/ドラゴンレーダー.PNG',
                              'Graphics/Pictures/ドラゴンレーダー_ドラゴンボール.PNG']
