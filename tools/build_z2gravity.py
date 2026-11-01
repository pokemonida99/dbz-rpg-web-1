"""Assets of the Z2 gravity training (src/gravitytraining.js, the original's 114 Scene_Db_Gravity_Training).

Call add(world, h) from tools/build_data.py (after the chapter builders) so tools/copy_assets.py copies them:
the machine / King Kai backgrounds, the 重力○倍 plate, the Z2 battle sprites of the trainees (Goku, Piccolo),
the sounds and the training BGM by scenario (variable 40: Z1 / Z2 / Z3 修行).
"""


def add(world, h=None):
    P = lambda n: f'Graphics/Pictures/{n}.PNG'
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | {P(n) for n in (
        'Z2_修行_重力_背景', 'Z2_修行_界王重力_背景', 'Z2_修行_重力_文字',
        'Z2_戦闘_ゴクウ', 'Z2_戦闘_ピッコロ',
        'カード関係', '数字英語', 'Z1_顔味方')})
    world['fieldSe'] = sorted(set(world.get('fieldSe', [])) | {
        'Z3 決定', 'Z3 カーソル移動', 'Z3 エラー', 'Z1 ダメージ', 'Z2 アイテム取得', 'Z1 レベルアップ', 'Z1 出る'})
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {'Z1 修行', 'Z2 修行', 'Z3 修行'})
