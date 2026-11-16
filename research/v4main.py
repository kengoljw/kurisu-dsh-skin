from PIL import Image
im=Image.open(r"<workspace>\kurisu-skin\preview\live-v4.png").convert("RGB")
im.crop((264,120,1280,839)).save(r"<workspace>\kurisu-skin\preview\live-v4-main.png")