import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add float-anim to the avatar
content = content.replace(
    '<img src="/images/avatar.jpg" alt="3D Avatar" style={{ height: "600px"',
    '<img src="/images/avatar.jpg" className="float-anim" alt="3D Avatar" style={{ height: "600px"'
)

# Find the features section and add the hoodie image alongside it
features_target = '''          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {t.features.items.map((f) => ('''
features_replace = '''          <div style={{ display: "flex", flexDirection: "row", gap: "3rem", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }} className="hidden-mobile float-anim">
              <div className="pulse-anim" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "400px", height: "400px", background: "var(--blue-soft)", borderRadius: "50%", zIndex: 0 }}></div>
              <img src="/images/hoodie.jpg" alt="3D Hoodie Elements" style={{ width: "100%", maxWidth: "500px", objectFit: "contain", position: "relative", zIndex: 1, mixBlendMode: "multiply", borderRadius: "20px", filter: "drop-shadow(0 30px 40px rgba(15,118,110,0.15))" }} />
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {t.features.items.map((f) => ('''
            
content = content.replace(features_target, features_replace)

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
