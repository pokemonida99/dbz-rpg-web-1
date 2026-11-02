"""One-off: cut the generated ground of each battle strip (GPT images gen_<z1|z2|z3>_<row>.png, made from the strip
itself) to the strip's 400-px crop and the original's palette size → assets/bg/ground/<key>_<row>.png (tools/build_bgext.py).
python3 tools/make_bg_ground.py <dir with gen_*.png>"""
import glob
import os
import re
import sys
from PIL import Image

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in sorted(glob.glob(os.path.join(sys.argv[1], 'gen_*.png'))):
    key, row = re.match(r'gen_(z\d)_(\d+)\.png', os.path.basename(f)).groups()
    g = Image.open(f).convert('RGB')
    W, H = g.size
    px = g.load()
    lit = lambda y: sum(1 for x in range(0, W, 4) if sum(px[x, y]) > 120) / len(range(0, W, 4))
    # the first fully lit row under the reproduced strip; a strip that fills its own width (forest, sea, city) would
    # stop the search inside itself, so not above 74 % of the height (where the prompt puts the strip's foot)
    hz = next((y for y in range(int(H * 0.74), H - 8) if lit(y) > 0.97 and lit(y + 6) > 0.97), int(H * 0.78))
    x0, x1 = round(W * 120 / 640), round(W * 520 / 640)
    ground = g.crop((x0, hz, x1, H))
    ground = ground.resize((400, round(ground.height * 400 / ground.width)), Image.NEAREST).quantize(32).convert('RGB')
    ground.save(os.path.join(root, 'assets', 'bg', 'ground', f'{key}_{row}.png'), optimize=True)
    print(key, row, 'horizon', hz, 'height', ground.height)
