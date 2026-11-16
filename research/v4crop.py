from PIL import Image
p=r"<workspace>\kurisu-skin\preview\live-v4.png"
im=Image.open(p).convert("RGB")
im.crop((0,40,264,120)).resize((264*3,80*3), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\live-v4-brand.png")
im.crop((0,740,264,839)).resize((264*3,99*3), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\live-v4-foot.png")