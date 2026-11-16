import re
p=r"<workspace>\kurisu-skin\research\frontend-css\node_modules__@deepseek-ai__dsh-web-frontend__dist__assets__index-BxpfOGf3.css"
t=open(p,encoding="utf8").read()
rules=re.findall(r'([^{}]+)\{([^{}]*)\}',t)
n=0
for sel,body in rules:
    if 'background' in body and ('100vh' in body or 'height:100%' in body or 'height:100dvh' in body or 'inset:0' in body):
        print('---',sel.strip()[:160]); print(body[:400]); n+=1
        if n>=25: break
print('total',n)