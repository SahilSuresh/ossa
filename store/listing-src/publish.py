"""Copy the finished listing assets into the repo (store/ and the assets/ icon files). Run with python -I."""
import os, shutil, glob
from PIL import Image

L = os.path.dirname(os.path.abspath(__file__))
R = r"C:\Ossa\ossa-expo"
S69 = os.path.join(R, "store", "screenshots-6.9in-v3")
S63 = os.path.join(R, "store", "screenshots-6.3in-v3")
IC = os.path.join(R, "store", "icon")
for d in (S69, S63, IC, os.path.join(IC, "alternates"), os.path.join(IC, "old")):
    os.makedirs(d, exist_ok=True)

# screenshots: 6.9" 1320x2868 and 6.3" 1206x2622, RGB (no alpha)
for f in sorted(glob.glob(os.path.join(L, "out", "0*.png"))):
    im = Image.open(f).convert("RGB")
    assert im.size == (1320, 2868), (f, im.size)
    n = os.path.basename(f)
    im.save(os.path.join(S69, n), optimize=True)
    im.resize((1206, 2622), Image.LANCZOS).save(os.path.join(S63, n), optimize=True)
    print("shot", n)

# keep the old icons
for f in ["icon.png", "android-icon-foreground.png", "android-icon-monochrome.png", "splash-icon.png", "notification-icon.png", "favicon.png"]:
    src = os.path.join(R, "assets", f)
    dst = os.path.join(IC, "old", f)
    if os.path.exists(src) and not os.path.exists(dst):
        shutil.copy2(src, dst)
gp_old = os.path.join(IC, "old", "google-play-icon-512.png")
if not os.path.exists(gp_old):
    shutil.copy2(os.path.join(R, "store", "google-play", "icon-512.png"), gp_old)

# the new icon
master = Image.open(os.path.join(L, "icon", "out", "reg-1024.png")).convert("RGB")
assert master.size == (1024, 1024)
master.save(os.path.join(R, "assets", "icon.png"), optimize=True)                  # iOS: 1024, opaque, no alpha
master.save(os.path.join(IC, "ossa-icon-1024.png"), optimize=True)
master.resize((48, 48), Image.LANCZOS).save(os.path.join(R, "assets", "favicon.png"), optimize=True)
master.convert("RGBA").resize((512, 512), Image.LANCZOS).save(os.path.join(R, "store", "google-play", "icon-512.png"), optimize=True)

fg = Image.open(os.path.join(L, "alpha", "reg-fg.png")).convert("RGBA")
mono = Image.open(os.path.join(L, "alpha", "reg-mono.png")).convert("RGBA")
fg.save(os.path.join(R, "assets", "android-icon-foreground.png"), optimize=True)
mono.save(os.path.join(R, "assets", "android-icon-monochrome.png"), optimize=True)
fg.save(os.path.join(R, "assets", "splash-icon.png"), optimize=True)               # the glyph on the black splash

# notification icon: the white glyph, cropped to its box, 8% margin, 96x96
bb = mono.getbbox()
g = mono.crop(bb)
side = int(max(g.size) * 1.16)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.alpha_composite(g, ((side - g.size[0]) // 2, (side - g.size[1]) // 2))
sq.resize((96, 96), Image.LANCZOS).save(os.path.join(R, "assets", "notification-icon.png"), optimize=True)

# sources and alternates
for a, b in [("reg.svg", "ossa-icon.svg"), ("reg-fg.svg", "ossa-icon-android-foreground.svg"), ("reg-mono.svg", "ossa-icon-android-mono.svg")]:
    shutil.copy2(os.path.join(L, "icon", a), os.path.join(IC, b))
shutil.copy2(os.path.join(L, "icon", "out", "reg-sheet.png"), os.path.join(IC, "ossa-icon-small-sizes.png"))
for key, name in [("final", "breakout-hex-wide"), ("xpring", "level-ring"), ("breakout", "breakout-hex-v1"), ("firstform", "first-form"), ("torso", "stone-torso")]:
    if not os.path.exists(os.path.join(L, "icon", key + ".svg")):
        continue                                   # the alternates are already in store/icon/alternates
    shutil.copy2(os.path.join(L, "icon", key + ".svg"), os.path.join(IC, "alternates", name + ".svg"))
    p = os.path.join(L, "icon", "out", key + "-1024.png")
    if os.path.exists(p):
        Image.open(p).convert("RGB").save(os.path.join(IC, "alternates", name + "-1024.png"), optimize=True)
print("icons done")
