"""Contact sheet: python sheet.py <out.png> <w_each> <files...>"""
import sys
from PIL import Image
out, w = sys.argv[1], int(sys.argv[2])
fs = sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in fs]
ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims)
gap = 16
sheet = Image.new('RGB', (len(ims) * (w + gap) - gap, h), (58, 58, 58))
for i, im in enumerate(ims):
    sheet.paste(im, (i * (w + gap), 0))
sheet.save(out)
print(out, sheet.size)
