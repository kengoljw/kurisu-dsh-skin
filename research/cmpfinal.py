from PIL import Image, ImageStat
def stat(p):
    im=Image.open(p).convert("RGB"); w,h=im.size
    out={}
    for lab,box in [("side",(0,0,int(w*0.2),h)),("art",(int(w*0.72),int(h*0.05),w,int(h*0.5))),("chat",(int(w*0.25),int(h*0.55),int(w*0.95),int(h*0.85)))]:
        st=ImageStat.Stat(im.crop(box)); out[lab]=([round(x,1) for x in st.mean],[round(x,1) for x in st.stddev])
    return out
for n in ["preview-light.png","final-live.png"]:
    print(n, stat(rf"<workspace>\kurisu-skin\preview\{n}"))