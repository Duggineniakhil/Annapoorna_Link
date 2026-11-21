"""Generate placeholder PWA icons (a bowl with steam) into app/public/.

Run from app/:  python scripts/make-icons.py   (needs Pillow)
Icons are full-bleed so they also work as maskable icons; the artwork stays inside the centre 70 %.
"""

from pathlib import Path

from PIL import Image, ImageDraw

BG = (122, 62, 0)  # #7a3e00, matches theme_color
FG = (255, 253, 247)  # #fffdf7, matches the page background
SCALE = 4  # draw large, then downscale for smooth edges

OUT = Path(__file__).resolve().parent.parent / "public"


def draw_icon(size: int) -> Image.Image:
    s = size * SCALE
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)

    # Bowl: lower half of a circle, centred a little below the middle.
    cx, cy, r = s * 0.5, s * 0.52, s * 0.27
    d.pieslice([cx - r, cy - r, cx + r, cy + r], start=0, end=180, fill=FG)
    # Rim and foot.
    rim_h = s * 0.035
    d.rounded_rectangle(
        [cx - r * 1.08, cy - rim_h, cx + r * 1.08, cy + rim_h * 0.4], radius=rim_h, fill=FG
    )
    d.rounded_rectangle(
        [cx - r * 0.4, cy + r * 0.95, cx + r * 0.4, cy + r * 1.08], radius=rim_h, fill=FG
    )

    # Three steam lines above the bowl.
    w = max(1, int(s * 0.03))
    for dx in (-0.12, 0, 0.12):
        x = cx + s * dx
        top, bottom = s * 0.24, s * 0.42
        points = [
            (x, bottom),
            (x - s * 0.025, bottom - (bottom - top) * 0.33),
            (x + s * 0.025, bottom - (bottom - top) * 0.66),
            (x, top),
        ]
        d.line(points, fill=FG, width=w, joint="curve")

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for size, name in [
        (192, "pwa-192x192.png"),
        (512, "pwa-512x512.png"),
        (180, "apple-touch-icon.png"),
        (64, "favicon-64.png"),
    ]:
        draw_icon(size).save(OUT / name, optimize=True)
        print("wrote", name)


if __name__ == "__main__":
    main()
