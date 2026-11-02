"""Battle backgrounds for the portrait layout: the original draws one 640×100 strip under a black sky, which leaves a
black gap between the strip and the windows below on a tall phone. Each strip's foreground ground was generated once
(GPT, from the strip itself, then cut to the strip's width and quantized: assets/bg/ground/<z1|z2|z3>_<row>.png, made
by tools/make_bg_ground.py) and is put under it here. The strip itself stays the original's, untouched; every
400×600 backdrop whose strip (rows 450-550) matches a row of Z1/Z2/Z3_戦闘_背景 becomes 400×800."""
import glob
import os
from PIL import Image

SHEETS = {'z1': 'Z1_戦闘_背景.PNG', 'z2': 'Z2_戦闘_背景.PNG', 'z3': 'Z3_戦闘_背景.PNG'}


def add(world, h):
    root = h['root']
    pics = os.path.join(root, 'game', 'Graphics', 'Pictures')
    rows = {}
    for key, name in SHEETS.items():
        im = Image.open(os.path.join(pics, name)).convert('RGB')
        for r in range(im.height // 100):
            rows.setdefault(im.crop((120, 100 * r, 520, 100 * r + 100)).tobytes(), (key, r))
    n = 0
    for f in glob.glob(os.path.join(root, 'assets', 'bg', '*.png')):
        im = Image.open(f)
        if im.size != (400, 600):
            continue
        hit = rows.get(im.convert('RGB').crop((0, 450, 400, 550)).tobytes())
        g = hit and os.path.join(root, 'assets', 'bg', 'ground', f'{hit[0]}_{hit[1]}.png')
        if not g or not os.path.exists(g):
            continue
        ground = Image.open(g).convert('RGB')
        out = Image.new('RGB', (400, 800), (0, 0, 0))
        out.paste(im.convert('RGB').crop((0, 0, 400, 550)), (0, 0))
        y = 550
        while y < 800:
            out.paste(ground, (0, y))
            y += ground.height
        out.save(f, optimize=True)
        n += 1
    print(f'battle backgrounds extended: {n}')
