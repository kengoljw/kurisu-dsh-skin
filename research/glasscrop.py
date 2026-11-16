from PIL import Image
im=Image.open(r"<workspace>\kurisu-skin\preview\glass-live.png").convert("RGB")
im.crop((264,120,1280,620)).save(r"<workspace>\kurisu-skin\preview\glass-chat.png")
im.crop((0,55,264,839)).save(r"<workspace>\kurisu-skin\preview\glass-side.png")
im.crop((290,650,1270,839)).save(r"<workspace>\kurisu-skin\preview\glass-input.png")