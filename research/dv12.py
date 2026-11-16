from PIL import Image, ImageStat
a=Image.open(r"<workspace>\kurisu-skin\preview\live-glass2.png").convert("RGB")
b=Image.open(r"<workspace>\kurisu-skin\preview\live-v12.png").convert("RGB")
from PIL import ImageChops
d=ImageChops.difference(a,b); st=ImageStat.Stat(d)
print("mean diff vs previous:", [round(x,2) for x in st.mean])
print("bbox:", d.getbbox())