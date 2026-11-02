"""Z1 battle backgrounds as the original draws them: one 640×100 strip of Z1_戦闘_背景 ($Battle_MapID, chosen by the
ground tile under the player: set_battle_map, all.rb 165938) under a black sky. Each row becomes a 400×600 portrait
backdrop like assets/bg/z2_battle_*.png (tools/build_z2a.py); src/main.js z1Backdrop picks the row."""
import os
from PIL import Image


def add(world, h):
    root = h['root']
    strips = Image.open(os.path.join(root, 'game', 'Graphics', 'Pictures', 'Z1_戦闘_背景.PNG')).convert('RGB')
    for row in range(12):
        bd = Image.new('RGB', (400, 600), (0, 0, 0))
        bd.paste(strips.crop((120, 100 * row, 520, 100 * row + 100)), (0, 450))
        bd.save(os.path.join(root, 'assets', 'bg', f'z1_battle_{row}.png'), optimize=True)
