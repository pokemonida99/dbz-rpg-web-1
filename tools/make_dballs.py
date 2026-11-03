#!/usr/bin/env python3
"""The seven dragon balls for the loading bar and the title (assets/ui/dballs.png): 7 frames of 32×32, 1 to 7 stars.
The original has no picture of the numbered balls (its cards show glyphs, the opening a Z ball), so they are drawn here
pixel by pixel in the game's own FC style: a 4-shade orange ball, a hard outline, red five-point stars."""
import os
from PIL import Image

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 32
OUT, DARK, BASE, LIGHT, HI = (90, 30, 0), (196, 92, 16), (240, 138, 28), (255, 190, 74), (255, 244, 200)
RED, RED_D = (216, 24, 24), (120, 0, 0)
# a 5×5 star
STAR = ['..#..', '.###.', '#####', '.###.', '#.#.#']
# where the stars sit (top-left of each 5×5), the way the balls are drawn in the anime
SPOTS = {1: [(13, 13)], 2: [(9, 13), (17, 13)], 3: [(13, 9), (9, 16), (17, 16)], 4: [(9, 9), (17, 9), (9, 17), (17, 17)],
         5: [(13, 7), (7, 12), (19, 12), (9, 19), (17, 19)], 6: [(9, 7), (17, 7), (6, 13), (20, 13), (9, 19), (17, 19)],
         7: [(13, 6), (7, 10), (19, 10), (13, 13), (7, 17), (19, 17), (13, 20)]}


def ball(n):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    px = im.load()
    c = (S - 1) / 2
    for y in range(S):
        for x in range(S):
            d = ((x - c) ** 2 + (y - c) ** 2) ** 0.5
            if d > 15.2:
                continue
            if d > 13.8:
                px[x, y] = OUT + (255,)
                continue
            lx, ly = (x - 10) / 12, (y - 9) / 12  # the light from the upper left
            l = (lx * lx + ly * ly) ** 0.5
            px[x, y] = (HI if l < 0.22 else LIGHT if l < 0.55 else BASE if l < 1.05 else DARK) + (255,)
    for sx, sy in SPOTS[n]:
        for j, row in enumerate(STAR):
            for i, ch in enumerate(row):
                if ch == '#':
                    px[sx + i, sy + j] = RED + (255,)
        px[sx + 2, sy + 4] = RED_D + (255,)  # a dark pixel under each star for depth
    return im


sheet = Image.new('RGBA', (S * 7, S), (0, 0, 0, 0))
for n in range(1, 8):
    sheet.paste(ball(n), ((n - 1) * S, 0))
out = os.path.join(root, 'assets', 'ui', 'dballs.png')
sheet.save(out)
print('wrote', out)

# the title's sky: a 128×128 tile of pixel stars (drifts slowly behind the title, src/style.css #title .t-stars)
import random
random.seed(7)
sky = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
px = sky.load()
for i in range(46):
    x, y = random.randrange(128), random.randrange(128)
    px[x, y] = (232, 236, 255, 255) if i % 5 == 0 else (90, 106, 168, 255)
    if i % 11 == 0:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            px[(x + dx) % 128, (y + dy) % 128] = (143, 180, 255, 255)
sky.save(os.path.join(root, 'assets', 'ui', 'stars.png'))
# the boot screen's logo: the original title's DRAGON BALL Z (Graphics/System/Title.png), its black made clear
logo = Image.open(os.path.join(root, 'assets', 'Graphics', 'System', 'Title.png')).convert('RGBA').crop((36, 28, 344, 124))
lp = logo.load()
for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = lp[x, y]
        if r < 24 and g < 24 and b < 40:
            lp[x, y] = (0, 0, 0, 0)
logo.save(os.path.join(root, 'assets', 'ui', 'logo.png'))
