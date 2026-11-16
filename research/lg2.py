from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\live-glass2.png"
im=Image.open(p).convert("RGB"); w,h=im.size
print("size",w,h)
for lab,box in [("sidebar",(0,60,264,760)),("main",(280,120,w,600)),("composer",(330,int(h*0.80),1000,h-40))]:
    st=ImageStat.Stat(im.crop(box)); print(" ",lab,"mean",[round(x) for x in st.mean],"std",[round(x) for x in st.stddev])