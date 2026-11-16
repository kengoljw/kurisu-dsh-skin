from PIL import Image
im=Image.open(r"<workspace>\kurisu-skin\preview\mark-parity.png").convert("RGB")
w,h=im.size
print("size",w,h)
# scan for the small mark: find non-background pixels in row bands
import collections
def sample(box,label):
    c=im.crop(box)
    cols=collections.Counter(c.getdata())
    print(label, cols.most_common(6))
sample((150,55,200,100),"light-small")
sample((150,120,200,175),"light-hero")
sample((150,370,200,415),"dark-small")
sample((150,440,200,500),"dark-hero")
im.crop((120,40,340,190)).resize((220*4,150*4), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\mark-zoom-light.png")
im.crop((120,355,340,510)).resize((220*4,155*4), Image.LANCZOS).save(r"<workspace>\kurisu-skin\preview\mark-zoom-dark.png")