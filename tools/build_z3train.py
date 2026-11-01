"""Z3 的修行小遊戲（流派一致修行・Z3 重力修行） — the assets of src/z3train.js (docs/z3-training.md), added by
tools/build_z3.py so tools/copy_assets.py copies them:
the card sheet, digits and cursor icons, the battle-animation flashes, the trainees' Z3 faces and battle sprites,
the gravity machine and the cut-in strip; the sounds; the BGM (Z3 修行, and ZSB1 天界のテーマ for the Z4 line-ups).
"""


def add(world, h, z3):
    P = lambda n: f'Graphics/Pictures/{n}.PNG'
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | {P(n) for n in (
        'カード関係', '数字英語', 'アイコン', '戦闘アニメ', 'Z3_顔味方', 'Z3_修行_重力装置', 'Z3_味方カットイン',
        'Z3_戦闘_ゴクウ', 'Z3_戦闘_ゴハン', 'Z3_戦闘_ピッコロ', 'Z3_戦闘_ベジータ',
        'Z3_戦闘_クリリン', 'Z3_戦闘_ヤムチャ', 'Z3_戦闘_テンシンハン', 'Z3_戦闘_チャオズ')})
    world['fieldSe'] = sorted(set(world.get('fieldSe', [])) | {
        'Z3 決定', 'Z3 カーソル移動', 'Z3 経験値取得', 'Z1 完了', 'Z1 ダメージ', 'Z1 レベルアップ'})
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {'Z3 修行', 'ZSB1 天界のテーマ(GB音源Ver)'})
