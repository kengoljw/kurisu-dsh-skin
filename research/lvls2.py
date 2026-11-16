from PIL import Image, ImageStat
base=r"<workspace>\kurisu-skin\preview"
for sch in ["dark","light"]:
    print("==",sch)
    for g in ["solid","mid","clear"]:
        im=Image.open(rf"{base}\tmp-{sch}-{g}.png").convert("RGB")
        w,h=im.size
        side=ImageStat.Stat(im.crop((0,60,264,700)))
        comp=ImageStat.Stat(im.crop((330,int(h*0.82),950,h-30)))
        print(f"  {g:6s} sidebar mean={[round(x) for x in side.mean]} std={[round(x) for x in side.stddev]}  composer mean={[round(x) for x in comp.mean]} std={[round(x) for x in comp.stddev]}")