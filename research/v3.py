from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\live-v3.png"
im=Image.open(p).convert("RGB"); w,h=im.size
print("size",w,h)
for name,box in [("sidebar",(0,0,264,h)),("center",(264,0,int(w*0.72),h)),("right",(int(w*0.72),0,w,h)),("top",(264,0,w,120)),("bottom",(264,int(h*0.72),w,h))]:
    st=ImageStat.Stat(im.crop(box)); print(name,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])
im.crop((264,0,w,h)).save(r"<workspace>\kurisu-skin\preview\live-v3-main.png")