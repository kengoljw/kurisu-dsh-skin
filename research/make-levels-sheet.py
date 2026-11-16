from PIL import Image, ImageDraw
import os

base = r"<workspace>\kurisu-skin\preview"
levels = ["solid", "mid", "clear"]
labels = {"solid": "偏实 (solid)", "mid": "标准 (mid, 默认)", "clear": "通透 (clear)"}

rows = []
for sch in ["light", "dark"]:
    for g in levels:
        p = os.path.join(base, f"tmp-{sch}-{g}.png")
        im = Image.open(p).convert("RGB")
        w, h = im.size
        side = im.crop((0, 55, 264, 600))
        comp = im.crop((300, int(h * 0.78), w, h))
        # scale composer to a common height
        target_h = 300
        comp = comp.resize((int(comp.width * target_h / comp.height), target_h), Image.LANCZOS)
        side = side.resize((int(side.width * target_h / side.height), target_h), Image.LANCZOS)
        canvas = Image.new("RGB", (side.width + comp.width + 24, target_h + 34), (255, 255, 255))
        canvas.paste(side, (0, 34))
        canvas.paste(comp, (side.width + 24, 34))
        d = ImageDraw.Draw(canvas)
        d.text((6, 10), f"{sch}  |  {labels[g]}", fill=(20, 20, 20))
        rows.append(canvas)

width = max(r.width for r in rows)
height = sum(r.height for r in rows) + 8 * (len(rows) - 1)
out = Image.new("RGB", (width, height), (230, 230, 230))
y = 0
for r in rows:
    out.paste(r, (0, y))
    y += r.height + 8
out.save(os.path.join(base, "glass-levels.png"))
print("glass-levels.png", out.size)
