from PIL import Image, ImageChops, ImageStat
a=Image.open(r"<workspace>\kurisu-skin\preview\vt-200.png").convert("RGB")
b=Image.open(r"<workspace>\kurisu-skin\preview\vt-1400.png").convert("RGB")
d=ImageChops.difference(a,b); st=ImageStat.Stat(d)
print("mean", [round(x,3) for x in st.mean], "bbox", d.getbbox())