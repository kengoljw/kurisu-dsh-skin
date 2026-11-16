from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\live-window.png"
im=Image.open(p).convert("RGB")
w,h=im.size
print("size",w,h)
for name,box in [("left",(0,0,int(w*0.30),h)),("center",(int(w*0.30),0,int(w*0.70),h)),("right",(int(w*0.70),0,w,h))]:
    st=ImageStat.Stat(im.crop(box))
    print(name,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])
im.crop((int(w*0.62),0,w,h)).save(r"<workspace>\kurisu-skin\preview\live-right.png")
im.crop((0,0,int(w*0.30),h)).save(r"<workspace>\kurisu-skin\preview\live-left.png")