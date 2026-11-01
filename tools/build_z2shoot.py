"""The Z2 shooting mini-game (src/z2shoot.js, the original's ボスアクション TBoss_Scene): its art and sounds.

Call add(world, globals()) from tools/build_data.py so that tools/copy_assets.py copies them.
Only what the scene really shows or plays is listed. The original's script also names ebullet1 (enemy bullet
type 1), pbullet1-3 (the player's shots: commented out), Ice9 / Explosion1 / Up / Heal5 / Water4 (enemy hit,
enemy destroyed, charge, shots 2 and 3) and the MEs Victory1 / Shock, but none of them can happen in this game.
"""


def add(world, h=None):
    world['fieldPictures'] = sorted(set(world.get('fieldPictures', [])) | {
        'Graphics/Pictures/shoot1.png',              # the player (0,0) and Dodoria (32,0), 32×32 each
        'Graphics/Pictures/Z2_シューティング背景.png',  # the scrolling ground strip, 640×60
        'Graphics/Pictures/アイコン.PNG',             # icon (96,0): the progress marks between Ｇ and Ｓ
        'Graphics/System/ebullet2.png',              # Dodoria's energy balls (index 0), 32×32
        'Graphics/System/effect1.png',               # the hit flash, 32×32
    })
    world['fieldSe'] = sorted(set(world.get('fieldSe', [])) | {'Z1 爆発1', 'Z3 エネルギー波'})
    world['extraBgm'] = sorted(set(world.get('extraBgm', [])) | {'GBZ2 ミニゲーム2'})
