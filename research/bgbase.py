import re
p=r"<workspace>\kurisu-skin\research\frontend-css\node_modules__@deepseek-ai__dsh-web-frontend__dist__assets__index-BxpfOGf3.css"
t=open(p,encoding="utf8").read()
for m in re.finditer(r'--dsw-alias-bg-base',t):
    a=max(0,m.start()-110); b=min(len(t),m.end()+110)
    print('---',t[a:b].replace('\n',' '))