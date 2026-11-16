from PIL import Image, ImageStat
for name in ["live-v3","live-v4"]:
    p=rf"<workspace>\kurisu-skin\preview\{name}.png"
    im=Image.open(p).convert("RGB"); w,h=im.size
    print("==",name)
    for lab,box in [("sidebar",(0,0,264,h)),("center-L",(264,120,700,h)),("center-R",(700,120,w,h))]:
        st=ImageStat.Stat(im.crop(box)); print(" ",lab,"mean",[round(x,1) for x in st.mean],"std",[round(x,1) for x in st.stddev])