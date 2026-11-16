from PIL import Image, ImageChops, ImageStat
a=Image.open(r"<workspace>\kurisu-skin\preview\final-live.png").convert("RGB")
b=Image.open(r"<workspace>\kurisu-skin\preview\glass-live.png").convert("RGB")
d=ImageChops.difference(a,b); st=ImageStat.Stat(d)
print("mean diff", [round(x,2) for x in st.mean])
bbox=d.getbbox(); print("bbox", bbox)
b.crop((0,0,264,839)).save(r"<workspace>\kurisu-skin\preview\glass-sidebar.png")
b.crop((264,int(839*0.78),1280,839)).save(r"<workspace>\kurisu-skin\preview\glass-composer.png")