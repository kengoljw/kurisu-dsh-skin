from PIL import Image
im=Image.open(r"<workspace>\kurisu-skin\preview\final-live.png").convert("RGB")
im.crop((264,120,1280,560)).save(r"<workspace>\kurisu-skin\preview\final-live-art.png")