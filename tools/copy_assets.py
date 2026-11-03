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
bgm = {m['bgm'] for m in world['maps'].values() if m['bgm']} | set(world.get('extraBgm', [])) | {world['titleBgm'], 'Z1 戦闘1', 'Z1 戦闘ボス1(中ボス)'}
files |= {f'Audio/BGM/{n}.ogg' for n in bgm}
se = ['Z1 敵発見', 'Z1 エネルギー波', 'Z1 エネルギー波2', 'Z1 打撃', 'Z1 避ける', 'Z1 ダメージ', 'GBZ1 ファンファーレ1', 'Z1 レベルアップ']
files |= {f'Audio/SE/{n}.ogg' for n in se + world.get('itemSe', [])}
files |= {f'Audio/BGM/{n}.ogg' for n in world.get('itemBgm', [])} | set(world.get('itemPictures', []))
# field systems (src/training.js, src/fieldmenu.js): their sounds and pictures
files |= {f'Audio/SE/{n}.ogg' for n in world.get('fieldSe', [])} | set(world.get('fieldPictures', []))
# the battle film (src/anime.js): every pic('…') and the ANIME_SOUNDS list
import re  # noqa: E402
anime = open(os.path.join(root, 'src', 'anime.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", anime)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", anime.split('export const ANIME_SOUNDS')[1])}
# the S-combo films (src/combo-anime.js): mostly the same pictures, a few pic('…') of their own; extra sounds in COMBO_SOUNDS
combo = open(os.path.join(root, 'src', 'combo-anime.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", combo)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", combo.split('export const COMBO_SOUNDS')[1])}
# 悟空・悟飯's move films (src/anime_goku_gohan.js, docs/anim-ab-plan.md): their pic('…') and AG_SOUNDS
ag = open(os.path.join(root, 'src', 'anime_goku_gohan.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", ag)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", ag.split('export const AG_SOUNDS')[1].split(']')[0])}
# 比克・貝吉塔's Z3 move films (src/anime_piccolo_vegeta.js): their pic('…') and PV_SOUNDS
pv = open(os.path.join(root, 'src', 'anime_piccolo_vegeta.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", pv)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", pv.split('export const PV_SOUNDS')[1])}
# the Z fighters' Z3 move films (src/anime_zfighters.js): its pic('…') and ZF_SOUNDS
zf = open(os.path.join(root, 'src', 'anime_zfighters.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", zf)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", zf.split('export const ZF_SOUNDS')[1])}
# 巴達克's move films (src/anime_bardock.js, docs/anim-cd-plan.md ancb): its pic('…'), CB_SOUNDS and CB_BGS
cb = open(os.path.join(root, 'src', 'anime_bardock.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", cb)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", cb.split('export const CB_SOUNDS')[1].split(']')[0])}
files |= {f'Audio/BGS/{n}.ogg' for n in re.findall(r"'([^']+)'", cb.split('export const CB_BGS')[1].split(']')[0])}
# バーダック一味's move films (src/anime_bardock_crew.js, docs/anim-cd-plan.md ancc): its pic('…') and CR_SOUNDS
cr = open(os.path.join(root, 'src', 'anime_bardock_crew.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", cr)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", cr.split('export const CR_SOUNDS')[1])}
# 特蘭克斯・未來悟飯・龜仙人's move films (src/anime_future.js, docs/anim-cd-plan.md andt): pic('…'), DT_SOUNDS, DT_BGS
dt = open(os.path.join(root, 'src', 'anime_future.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", dt)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", dt.split('export const DT_SOUNDS')[1].split(']')[0])}
files |= {f'Audio/BGS/{n}.ogg' for n in re.findall(r"'([^']+)'", dt.split('export const DT_BGS')[1].split(']')[0])}
# 人造人's Z3 move films (src/anime_androids.js): its pic('…') and ANDA_SOUNDS
anda = open(os.path.join(root, 'src', 'anime_androids.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", anda)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", anda.split('export const ANDA_SOUNDS')[1])}
# the Z2 enemies' move films (src/anime_foes_z2.js, docs/anim-e-plan.md aen1): its pic('…') and FZ_SOUNDS
fz = open(os.path.join(root, 'src', 'anime_foes_z2.js'), encoding='utf-8').read()
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", fz)}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", fz.split('export const FZ_SOUNDS')[1].split(']')[0])}
# the enemies' move films (docs/anim-e-plan.md): the shared stage (src/anime_foes_common.js) and aen3's (src/anime_foes_movie.js)
for js, key in (('anime_foes_common.js', 'FE_SOUNDS'), ('anime_foes_movie.js', 'AEN3_SOUNDS')):
    t = open(os.path.join(root, 'src', js), encoding='utf-8').read()
    files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)", t)}
    files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"'([^']+)'", t.split(f'export const {key}')[1].split(']')[0])}
# イレイサーショック / リベンジャーカノン play the original's frame-by-frame pictures (names built at run time)
for d in ('raichi_ire', 'hatchiyack_cannon'):
    files |= {f'Graphics/Pictures/{d}/{f}' for f in os.listdir(os.path.join(src, 'Graphics', 'Pictures', d)) if f.lower().endswith('.png')}
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
# the party / tactics menus (src/partymenu.js): the original's cursor sounds
partymenu = open(os.path.join(root, 'src', 'partymenu.js'), encoding='utf-8').read()
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"SE_\w+ = '([^']+)'", partymenu)}
for js in ('battle.js', 'growth.js'):  # their cursor / card sounds too
    t = open(os.path.join(root, 'src', js), encoding='utf-8').read()
    files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"SE_\w+ = '([^']+)'", t)}
# the background sounds (BGS) of the story pages (tools/build_data.py script(): {bgs})
files |= {f'Audio/BGS/{n}.ogg' for n in set(re.findall(r'"bgs":"([^"]+)"', json.dumps(world, ensure_ascii=False, separators=(',', ':'))))}
# the story scenes between chapters (src/cutscene.js): scene pictures (BG('…') and the `bg` / `scroll` entries)
cutscene = ''.join(open(os.path.join(root, 'src', f), encoding='utf-8').read()  # and the scenes the chapters add (addScenes)
                   for f in sorted(os.listdir(os.path.join(root, 'src'))) if f in ('cutscene.js', 'willow.js') or f.startswith('chapter'))
files |= {f'Graphics/Pictures/Z1_背景_{n}.PNG' for n in re.findall(r"(?:BG\(|bg: |scroll: )'([^']+)'", cutscene)}
files |= {f'Audio/BGM/{n}.ogg' for n in re.findall(r"bgm: '([^']+)'", cutscene)}
files |= {f'Graphics/Pictures/Z1_イベント_{n}.PNG' for n in re.findall(r"'([^']+)'\]\.map\(EV\)|EV\('([^']+)'\)", cutscene) for n in n if n}
files |= {f'Graphics/Pictures/Z1_イベント_{n}.PNG' for n in re.findall(r"'([^']+)'", cutscene.split('...[')[1].split(']')[0])}
files |= {f'Graphics/Pictures/{n}' for n in re.findall(r"pic\('([^']+)'\)(?:\.replace\('\.PNG', '(\.png)'\))?", cutscene) for n in [n[0] + (n[1] or '.PNG')]}
files |= {f'Audio/SE/{n}.ogg' for n in re.findall(r"(?:se: |se\()'([^']+)'", cutscene)}

# the Shenron summoning (src/ending.js): map 117's 550 pictures (Z1_syenron/…_0000-0549, one a frame at 60 fps) as one
# animated WebP — 61 MB of PNG frames become a few MB
film = os.path.join(root, 'assets', 'film', 'shenron.webp')
if not os.path.exists(film):
    from PIL import Image  # noqa: E402
    d = os.path.join(src, 'Graphics', 'Pictures', 'Z1_syenron')
    frames = [Image.open(os.path.join(d, f)).convert('RGB') for f in sorted(os.listdir(d)) if f.lower().endswith('.png')]
    os.makedirs(os.path.dirname(film), exist_ok=True)
    frames[0].save(film, save_all=True, append_images=frames[1:], duration=17, quality=82, method=4, loop=1)

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
