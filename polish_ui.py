import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix hero headline wrapping
content = content.replace(
    '<div style={{ position: "relative", maxWidth: 600, zIndex: 1, textAlign: "left" }} className="animate-fade-up">',
    '<div style={{ position: "relative", maxWidth: 680, zIndex: 1, textAlign: "left" }} className="animate-fade-up">'
)
content = content.replace(
    'fontSize: "clamp(2.5rem, 6vw, 4.8rem)"',
    'fontSize: "clamp(2.5rem, 5.5vw, 4.2rem)"'
)

# 2. Fix Features layout
# Replace flex: 1 on image side with a fixed width/flex basis to give grid more room
content = content.replace(
    '<div style={{ flex: 1, position: "relative" }} className="hidden-mobile float-anim">',
    '<div style={{ flex: "0 0 40%", maxWidth: "500px", position: "relative" }} className="hidden-mobile float-anim">'
)
# Ensure the grid itself has enough space
content = content.replace(
    'gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"',
    'gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"'
)

# 3. Features Section Responsive flex direction
content = content.replace(
    '<div style={{ display: "flex", flexDirection: "row", gap: "3rem", alignItems: "center" }}>',
    '<div style={{ display: "flex", gap: "3rem", alignItems: "center" }} className="mobile-stack">'
)

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Landing page UI polished successfully")
