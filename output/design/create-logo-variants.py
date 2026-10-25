"""Export the existing VETUD logo with portable outlined type and background variants."""
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(os.environ["TEMP"]) / "vetud-logo-font-tools"))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/storefront/public/brand/variants"
OUT.mkdir(parents=True, exist_ok=True)
font_path = ROOT / "apps/storefront/.next/static/media/a343f882a40d2cc9-s.p.1sj6eobyi31rd.woff2"

def outline(text, size, weight, spacing, x, y):
    font = instantiateVariableFont(TTFont(font_path), {"wght": weight})
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    paths = []
    right = x
    for char in text:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        if pen.getCommands():
            paths.append(f'<path transform="translate({x:.5f} {y}) scale({scale:.7f} {-scale:.7f})" d="{pen.getCommands()}"/>')
            bounds = BoundsPen(glyphs)
            glyphs[name].draw(bounds)
            right = x + bounds.bounds[2] * scale
        x += glyphs[name].width * scale + spacing
    return "".join(paths), right

wordmark, word_right = outline("VETUD", 29, 650, 6, 64, 40)
tagline, tag_right = outline("PEPTIDE SCIENCE", 10, 400, 3.2, 65, 57)
logo_width = max(word_right, tag_right) - 5
logo_left = (400 - logo_width * 1.4) / 2 - 5 * 1.4

palettes = {
    "navy": dict(bg="#12334c", main="#f5f9fb", accent="#a5c6b5", dot="#a5c6b5", sub="#b4c9d5"),
    "blue": dict(bg="#367dab", main="#ffffff", accent="#d1e5da", dot="#d1e5da", sub="#ffffff"),
    "sage": dict(bg="#d1e5da", main="#12334c", accent="#367dab", dot="#315f50", sub="#20475e"),
    "white": dict(bg="#ffffff", main="#12334c", accent="#367dab", dot="#315f50", sub="#637684"),
}

def mark(p):
    return f'''<path d="m6 9 18 31L42 9" stroke="{p['main']}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="m11 29 10-17 9 15 7-12" stroke="{p['accent']}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="6" cy="9" r="3" fill="{p['dot']}"/><circle cx="21" cy="12" r="2.6" fill="{p['main']}"/><circle cx="42" cy="9" r="3" fill="{p['accent']}"/>'''

def svg(p, icon=False, transparent=False):
    dim = "192 192" if icon else "400 160"
    label = "VETUD symbol" if icon else "VETUD Peptide Science"
    bg = "" if transparent else f'<path fill="{p["bg"]}" d="M0 0H{192 if icon else 400}V{192 if icon else 160}H0z"/>'
    if icon:
        drawing = f'<g transform="translate(24 24) scale(3)">{mark(p)}</g>'
    else:
        drawing = f'<g transform="translate({logo_left:.5f} 31.7) scale(1.4)"><g transform="translate(2 12)">{mark(p)}</g><g fill="{p["main"]}">{wordmark}</g><g fill="{p["sub"]}">{tagline}</g></g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {dim}" fill="none" role="img" aria-label="{label}"><title>{label}</title>{bg}{drawing}</svg>\n'

for name, palette in palettes.items():
    for icon in (False, True):
        asset = "mark" if icon else "logo"
        (OUT / f"vetud-{asset}-on-{name}.svg").write_text(svg(palette, icon), encoding="utf-8")

for icon in (False, True):
    asset = "mark" if icon else "logo"
    (OUT / f"vetud-{asset}-inverted-transparent.svg").write_text(svg(palettes["navy"], icon, True), encoding="utf-8")

(OUT / "colors.json").write_text(json.dumps(palettes, indent=2) + "\n", encoding="utf-8")
print(f"Created 10 SVG variants in {OUT}")
