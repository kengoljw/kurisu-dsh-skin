from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\live-window-2.png"
im=Image.open(p).convert("RGB"); w,h=im.size
print("size",w,h)
for name,box in [("left",(0,0,int(w*0.28),h)),("center",(int(w*0.28),0,int(w*0.72),h)),("right",(int(w*0.72),0,w,h)),("chat-right",(int(w*0.55),int(h*0.15),w,int(h*0.85)))]:
    st=ImageStat.Stat(im.crop(box)); print(name,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])
im.crop((int(w*0.60),0,w,h)).save(r"<workspace>\kurisu-skin\preview\live2-right.png")
im.crop((0,0,int(w*0.30),h)).save(r"<workspace>\kurisu-skin\preview\live2-left.png")
im.crop((int(w*0.25),int(h*0.10),int(w*0.75),int(h*0.65))).save(r"<workspace>\kurisu-skin\preview\live2-center.png")