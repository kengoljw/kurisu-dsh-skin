from PIL import Image
p=r"<workspace>\kurisu-skin\preview\live-v4.png"
im=Image.open(p).convert("RGB")
im.crop((8,50,150,100)).resize((142*6,50*6), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\live-v4-brand2.png")
im.crop((8,760,264,830)).resize((256*4,70*4), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\live-v4-foot2.png")