#!/usr/bin/env python3
"""Stamp a new version before each deploy so phones never mix old and new files.

Writes version.json, sets VERSION in src/core.js and adds ?v=<version> to every
script/style/data URL, so a new version always has new URLs the browser hasn't cached.
Run from the repo root:  python3 tools/bump.py
"""
import datetime, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
v = datetime.datetime.now().strftime('%Y%m%d-%H%M')

(root / 'version.json').write_text(json.dumps({'v': v}) + '\n')

for f in (root / 'src').glob('*.js'):
    s = f.read_text()
    s = re.sub(r"(from '\./[\w-]+\.js)(\?v=[\w-]+)?'", rf"\1?v={v}'", s)
    s = re.sub(r"(import '\./[\w-]+\.js)(\?v=[\w-]+)?'", rf"\1?v={v}'", s)  # (side-effect imports: the Z3 chapters)
    s = re.sub(r"export const VERSION = '[^']*';", f"export const VERSION = '{v}';", s)
    s = re.sub(r"fetch\('data/world\.json(\?v=[\w-]+)?'\)", f"fetch('data/world.json?v={v}')", s)
    f.write_text(s)

html = root / 'index.html'
s = html.read_text()
s = re.sub(r'src/(main\.js|style\.css)(\?v=[\w-]+)?"', rf'src/\1?v={v}"', s)
html.write_text(s)
print(v)
