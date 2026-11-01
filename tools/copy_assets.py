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
          'Graphics/Pictures/Z1_戦闘_背景.PNG', 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波_敵_中.PNG'}
for a in world['actors'].values():
    files |= {a['sprite'], a['beam']}
for e in world['enemies'].values():
    files.add(e['sprite'])
bgm = {m['bgm'] for m in world['maps'].values()} | {world['titleBgm'], 'Z1 戦闘1', 'Z1 戦闘ボス1(中ボス)'}
files |= {f'Audio/BGM/{n}.ogg' for n in bgm}
se = ['Z1 敵発見', 'Z1 エネルギー波', 'Z1 エネルギー波2', 'Z1 打撃', 'Z1 避ける', 'Z1 ダメージ', 'GBZ1 ファンファーレ1', 'Z1 レベルアップ']
files |= {f'Audio/SE/{n}.ogg' for n in se}

total = 0
for f in sorted(files):
    s = os.path.join(src, f)
    if not os.path.exists(s):
        sys.exit(f'missing: {f}')
    d = os.path.join(root, 'assets', f)
    os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copyfile(s, d)
    total += os.path.getsize(d)
print(len(files), 'files,', total // 1024, 'KB')
