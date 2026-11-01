#!/usr/bin/env python3
"""Copies the original assets this build uses into assets/ (deployable), from the original game folder.

Usage: copy_assets.py <original game folder>   e.g. ../dbz-rpg-web-dist/game
The list is the art referenced by data/world.json plus the fixed files below; keep it in sync with src/.
"""
import json, os, shutil, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
world = json.load(open(os.path.join(root, 'data', 'world.json'), encoding='utf-8'))

files = {f'Graphics/System/{n}.png' for n in ['TileA1', 'TileA2', 'TileA3', 'TileA4', 'TileA5', 'TileB', 'TileC', 'TileD', 'TileE', 'Title']}
files |= {'Graphics/Characters/chara_fly1.png', 'Graphics/Characters/enemy1.png', 'Graphics/Pictures/GBZ1 顔アイコン.PNG',
          'Graphics/Pictures/Z1_戦闘_背景.PNG', 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波_敵_中.PNG',
          'Graphics/Pictures/カード関係.PNG', 'Graphics/System/Z1_Window.png',
          # the original battle screen: party / enemy faces, digits and HP/KI letters, cursor icons
          'Graphics/Pictures/Z1_顔味方.PNG', 'Graphics/Pictures/Z1_顔敵.PNG', 'Graphics/Pictures/数字英語.PNG', 'Graphics/Pictures/アイコン.PNG'}
for a in world['actors'].values():
    files |= {a['sprite'], a['beam'], a['special']}
files |= {f[0] for f in world['faces'].values()}  # dialogue faces
for e in world['enemies'].values():
    files |= {e['sprite'], e['portrait']}
bgm = {m['bgm'] for m in world['maps'].values()} | set(world.get('extraBgm', [])) | {world['titleBgm'], 'Z1 戦闘1', 'Z1 戦闘ボス1(中ボス)'}
files |= {f'Audio/BGM/{n}.ogg' for n in bgm}
se = ['Z1 敵発見', 'Z1 エネルギー波', 'Z1 エネルギー波2', 'Z1 打撃', 'Z1 避ける', 'Z1 ダメージ', 'GBZ1 ファンファーレ1', 'Z1 レベルアップ']
files |= {f'Audio/SE/{n}.ogg' for n in se + world.get('itemSe', [])}
# the battle film (src/anime.js): every pic('…') and the ANIME_SOUNDS list
import re  # noqa: E402
anime = open(os.path.join(root, 'src', 'anime.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", anime)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", anime.split('export const ANIME_SOUNDS')[1])}
# the opening (src/opening.js): its pictures and sounds, and the faces / sounds named in world.opening
opening = open(os.path.join(root, 'src', 'opening.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\(`?'?([^'`$]+\.(?:PNG|png))", opening)}
files |= {f'Graphics/Pictures/z1_{k}{i}.{"png" if (k in ("opnami",) or (k, i) == ("opdb", 7)) else "PNG"}'
          for k, n in [('opnami', 3), ('ophikaru', 4), ('opdb', 7), ('oputyuu', 18), ('utyuusen', 10)] for i in range(1, n + 1)}
files |= {'Graphics/Pictures/z1_opkumo.png'}
files |= {f'Graphics/Pictures/Z1_背景_{n}.PNG' for n in re.findall(r"BG\('([^']+)'\)", opening)}
files |= {f'Graphics/Pictures/Z1_背景_{w}_スカウター{i}.PNG' for w in ['山', '平野'] for i in (1, 2)}
files |= {f'Graphics/Pictures/Z1_イベント_{n}.PNG' for n in re.findall(r"EV\('([^']+)'\)", opening)}
files |= {f[0] for f in world['opening']['faces'].values()}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"se\('([^']+)'\)", opening)}
files |= {f'Audio/SE/{n["se"]}.ogg' for n in world['opening']['story'] if 'se' in n}
files |= {f'Audio/BGM/{n}.ogg' for n in re.findall(r"playBgm\('([^']+)'\)", opening)}

total = 0
for f in sorted(files):
    s = os.path.join(src, f)
    if not os.path.exists(s):
        sys.exit(f'missing: {f}')
    d = os.path.join(root, 'assets', f)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copyfile(s, d)
    total += os.path.getsize(d)
# UI frame for CSS border-image: the window border part (64,0,64,64) of the Z1 window skin
from PIL import Image  # noqa: E402
skin = Image.open(os.path.join(src, 'Graphics/System/Z1_Window.png')).convert('RGBA')
os.makedirs(os.path.join(root, 'assets', 'ui'), exist_ok=True)
skin.crop((64, 0, 128, 64)).save(os.path.join(root, 'assets', 'ui', 'frame.png'))
print(len(files), 'files,', total // 1024, 'KB')
