import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Hero Section
content = content.replace(
    '<div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", gap: "2rem", width: "100%" }}>',
    '<div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", gap: "4rem", width: "100%" }}>'
)
# slightly widen hero text max-width for better wrapping
content = content.replace(
    '<div style={{ position: "relative", maxWidth: 680, zIndex: 1, textAlign: "left" }} className="animate-fade-up">',
    '<div style={{ position: "relative", maxWidth: 640, zIndex: 1, textAlign: "left" }} className="animate-fade-up">'
)
content = content.replace(
    '<div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }} className="hidden-mobile">',
    '<div style={{ flex: "0 0 450px", display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }} className="hidden-mobile">'
)
# Shrink hero image slightly so it feels less crowded
content = content.replace(
    'style={{ height: 520, objectFit: "contain", position: "relative", zIndex: 1, borderRadius: 24, filter: "drop-shadow(0 25px 50px rgba(15,118,110,0.25))" }}',
    'style={{ height: 480, objectFit: "contain", position: "relative", zIndex: 1, borderRadius: 24, filter: "drop-shadow(0 25px 50px rgba(15,118,110,0.25))" }}'
)

# How It Works
content = content.replace(
    '<div style={{ display: "flex", gap: "3rem", alignItems: "center" }} className="mobile-stack">',
    '<div style={{ display: "flex", gap: "4rem", alignItems: "center" }} className="mobile-stack">'
)
content = content.replace(
    'className="hidden-mobile float-delayed" style={{ flex: "0 0 320px", position: "relative" }}>',
    'className="hidden-mobile float-delayed" style={{ flex: "0 0 360px", position: "relative" }}>'
)
content = content.replace(
    '<div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.75rem" }} className="stagger-children">',
    '<div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.75rem" }} className="stagger-children">'
)

# Features
# Already replaced the mobile-stack gap to 4rem above since they are identical
content = content.replace(
    '<div style={{ flex: "0 0 40%", maxWidth: "500px", position: "relative" }} className="hidden-mobile float-anim">',
    '<div style={{ flex: "0 0 400px", position: "relative" }} className="hidden-mobile float-anim">'
)
content = content.replace(
    '<div className="stagger-children" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>',
    '<div className="stagger-children" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem" }}>'
)

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Spacing optimized successfully.")
