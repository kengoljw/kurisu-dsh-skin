from PIL import Image, ImageStat
for n in ["final-live","glass-live"]:
    p=rf"<workspace>\kurisu-skin\preview\{n}.png"
    im=Image.open(p).convert("RGB"); w,h=im.size
    print("==",n,w,h)
    for lab,box in [("sidebar",(0,60,264,760)),("main",(264,120,w,560)),("composer",(300,int(h*0.80),1200,h-40))]:
        st=ImageStat.Stat(im.crop(box)); print("  ",lab,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])