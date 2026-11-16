from PIL import Image
import numpy as np
def stats(p, box, label):
    im=Image.open(p).convert("L").crop(box)
    a=np.asarray(im).astype(float)
    p5,p50,p95=np.percentile(a,[5,50,95])
    # contrast ratio between p5 (text) and p50 (background)
    def lin(v):
        v=v/255.0
        return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
    L1,L2=lin(p95),lin(p5)
    cr=(L1+0.05)/(L2+0.05)
    print(f"{label}: p5={p5:.0f} p50={p50:.0f} p95={p95:.0f} contrast(p95/p5)={cr:.1f}")
base=r"<workspace>\kurisu-skin\preview"
for n in ["final-live.png","glass-live.png"]:
    p=base+"\\"+n
    print("==",n)
    stats(p,(8,150,258,420),"sidebar nav")
    stats(p,(300,120,1240,540),"chat text")