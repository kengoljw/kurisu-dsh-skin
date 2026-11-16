import re
p=r"<workspace>\kurisu-skin\research\frontend-css\node_modules__@deepseek-ai__dsh-web-frontend__dist__assets__index-BxpfOGf3.css"
t=open(p,encoding="utf8").read()
for m in re.finditer(r'(?<![A-Za-z0-9_-])(html|body|#root|#app)\s*\{[^}]*\}',t):
    s=m.group(0)
    if 'background' in s or 'root' in s or 'height' in s:
        print('---',s[:600])