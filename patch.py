import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('background: "#0d1117"', 'background: "var(--bg-dark)"')
content = content.replace('background: "#fff"', 'background: "transparent"')
content = content.replace('background: "#ffffff"', 'background: "var(--bg-card)"')
content = content.replace('background: "#f8faff"', 'background: "var(--bg-soft)"')
content = content.replace('background: "#fafbff"', 'background: "var(--bg-soft)"')
content = content.replace('bg-white', '')

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
