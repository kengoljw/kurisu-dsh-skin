from PIL import Image, ImageStat
p=r"<workspace>\kurisu-skin\preview\check-now.png"
im=Image.open(p).convert("RGB"); w,h=im.size
print("size",w,h)
for name,box in [("left",(0,0,int(w*0.26),h)),("center",(int(w*0.26),0,int(w*0.70),h)),("right",(int(w*0.70),0,w,h)),("far-right",(int(w*0.86),0,w,h))]:
    st=ImageStat.Stat(im.crop(box)); print(name,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])
im.crop((int(w*0.55),0,w,h)).save(r"<workspace>\kurisu-skin\preview\check-right.png")
im.crop((int(w*0.80),int(h*0.10),w,int(h*0.90))).save(r"<workspace>\kurisu-skin\preview\check-farright.png")