from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\live-check2.png"
im=Image.open(p).convert("RGB"); w,h=im.size
for name,box in [("left",(0,0,int(w*0.26),h)),("center",(int(w*0.26),0,int(w*0.70),h)),("right",(int(w*0.70),0,w,h))]:
    st=ImageStat.Stat(im.crop(box)); print(name,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])
im.crop((0,int(h*0.72),int(w*0.26),h)).save(r"<workspace>\kurisu-skin\preview\live-check2-sidebar.png")