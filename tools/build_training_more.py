"""修行格：Z3 起原版四種隨機（速度・波波・界王的冷笑話・琪琪，chk_training），原版 Map007 事件 1 頁 31／33／34／35 — world.json data (read by src/training_more.js), added by tools/build_cards_ext.py. Plan: docs/cards-plan.md.

The lines of the three Z3 trainings, as written in the original scenes (research/all.rb), simplified → traditional:
  popo   117_Scene_Db_Popo_Training     (z1field 34)  output_msg / get_exp
  dajare 116_Scene_Db_Dajare_Training   (z1field 33)  @syare_mae / @syare_ato / output_msg / output_tra_msg / get_exp
  chichi 111_Scene_Db_Chi_Chi_Training  (z1field 35)  output_msg / chk_training / get_exp
Rewards lines: {n} is the number. The music, sounds and pictures go to world.extraBgm / fieldSe / fieldPictures
(tools/copy_assets.py copies them).
"""

PICK = ['用确定按钮选择修行的角色吧！', '不修行的话请按下取消按钮！']

POPO = {
    'rule1': ['这是与波波先生的修行！', '有时一动不动，有时行动迅速', '好好捕捉波波先生的动作吧！', '随着波波先生的动作按下方向键！'],
    'rule2': ['在中间的时候不用按下按键！', '你能在20秒捕捉多少次波波先生的动作呢？', '按下决定按钮开始吧！'],
    'go': ['好了，开始修行吧！'],
    'end': ['修行结束！'],
    'rate': '捕捉了{n}%波波先生的动作！',
    'exp': '修行終了！　　获得了{n}经验值！',
    'level': '{name}升到{n}级了！',
    'cap': '获得　{n}　CAP！',
    'sp': '获得　{n}　SP！',
    'zp': '获得　{n}　ZP！',
    'tec': '随机必杀技的使用回数合计增加　{n}　回！',
}

DAJARE = {
    'mae': ['礼物在哪里？', '快递给我？', '被子被我…', '熊来了！', '电话中说道…', '鱼放了屁…'],
    'ato': ['在里屋那里！', '快！递给我！', '背在我背上！', '一副熊样！', '谁也不来接！', '嘭！'],
    'rule': ['这是文字老虎机！', '请巧妙地停止，让界王大人发笑吧！'],
    'play': ['一共有３次机会，逗笑的次数越多，获得的经验也越多！', '开始挑战吧！'],
    # output_tra_msg: @training_result 1-5
    'kaio': [[], ['呵呵呵…　不是', '很有趣的话我不会笑的…'], ['这是什么，完全不行！'], ['我觉得不行', '再讲一次吧…'],
             ['噗噗…　哈哈哈哈哈哈！', '你真是了不起！'], ['这次我不会笑了！', '好了，下一个！']],
    'exp': '修行结束！　　获得{n}经验值！',
    'level': '{name}升到{n}级了！',
    'cap': '获得　{n}　CAP！',
    'sp': '获得　{n}　SP！',
    'zp': '获得　{n}　ZP！',
    'tec': '随机必杀技的使用回数合计增加　{n}　回！',
}

CHICHI = {
    'rule1': ['琪琪会出一张卡', '你需要出一张大于等于那张卡的攻击星数！', '继续可以提高奖励，失败则没有奖励！'],
    'rule2': ['在特别的规则下，琪琪的卡的攻击星数', '为７时可以出１，为８时可以出２！', '※玩家在以上情况不会输哦！', '按确定按钮　开启！'],
    'play': ['想要继续时请按确定按钮', '想要放弃的话请按取消按钮！'],
    'fail': '修行失败！！',
    'master': '完全制霸！！',
    # @chi_chi_msgno 0-10
    'say': {0: '来吧，我随时准备着！', 1: '我用这张卡！', 2: '你会出什么呢？', 3: '哼，现在才刚刚开始！', 4: '要继续吗？',
            8: '真没出息…', 9: '哼，真不争气…！', 10: '对你刮目相看了！'},
    'exp': '修行结束！　　获得了{n}经验值！',
    'level': '{name}升到了{n}级！',
    'cap': '获得CAP　{n}　！',
    'sp': '获得SP　{n}　！',
    'zp': '获得ZP　{n}　！',
    'tec': '随机必杀技的使用回数增加　{n}　回！',
}

P = 'Graphics/Pictures/'
PICTURES = [P + 'Z3_修行_界王ダジャレ.PNG', P + 'Z3_修行_神の神殿_背景.PNG', P + 'Z3_修行_神の神殿_ポポ停止.PNG'] + [
    P + f'Z3_修行_神の神殿_ポポ{m}_{w}.PNG' for m in ('', '移動') for w in ('中央', '奥', '手前')]
SE = ['Z3 アタリ', 'Z3 ハズレ', 'Z3 経験値取得', 'Z3 カーソル移動', 'Z3 決定', 'Z1 ダメージ']
BGM = ['Z3 ミニゲーム', 'Z2 修行', 'Z3 修行']  # the three Z3 trainings; the speed training's Z2 / Z3 music


def add(world, h):
    s2t = h['s2t']

    def conv(v):
        if isinstance(v, str):
            return s2t(v)
        if isinstance(v, list):
            return [conv(x) for x in v]
        if isinstance(v, dict):
            return {k: conv(x) for k, x in v.items()}
        return v

    world['trainingMore'] = {'pick': conv(PICK), 'popo': conv(POPO), 'dajare': conv(DAJARE), 'chichi': conv(CHICHI)}
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | set(BGM))
    world['fieldSe'] = sorted(set(world.get('fieldSe', [])) | set(SE))
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | set(PICTURES))
