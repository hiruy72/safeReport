import re

with open('apps/web/src/app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

advanced_css = """
/* ─── Ultra-Premium Enhancements ───────────────────────────── */
.text-gradient-animated {
  background: linear-gradient(to right, var(--blue), #0d9488, #3b82f6, var(--blue));
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shine 4s linear infinite;
}

@keyframes shine {
  to {
    background-position: -200% center;
  }
}

.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px 0 rgba(15, 118, 110, 0.08);
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: -1;
  pointer-events: none;
}
"""

if "Ultra-Premium Enhancements" not in css:
    css += advanced_css
    
with open('apps/web/src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    tsx = f.read()

# Make hero background even cooler
tsx = tsx.replace(
    'className=""\n        style={{',
    'className=""\n        style={{\n          background: "radial-gradient(circle at 85% 15%, rgba(15, 118, 110, 0.08) 0%, transparent 40%), radial-gradient(circle at 15% 85%, rgba(15, 118, 110, 0.05) 0%, transparent 40%)",'
)

# Use animated gradient text on the headline
tsx = tsx.replace(
    '<span className="gradient-text">heard safely.</span>',
    '<span className="text-gradient-animated" style={{ paddingRight: "0.2em" }}>heard safely.</span>'
)
tsx = tsx.replace(
    '<span className="gradient-text">{t.hero.headline}</span>',
    '<span className="text-gradient-animated">{t.hero.headline}</span>'
)

# Update some cards to glass-panel
tsx = tsx.replace(
    'className="glass-card card-3d"',
    'className="glass-panel card-3d"'
)

# Update navbar to ultra glass
tsx = tsx.replace(
    'background: scrolled ? "rgba(253,246,233,0.97)" : "rgba(253,246,233,0.85)"',
    'background: scrolled ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", backdropFilter: "blur(24px)", -webkitBackdropFilter: "blur(24px)"'
)

# Enhance witness section background
tsx = tsx.replace(
    'background: "linear-gradient(135deg, var(--bg-soft) 0%, var(--bg-card) 100%)", boxShadow: "0 8px 30px rgba(0,0,0,0.02)"',
    'background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", boxShadow: "0 20px 60px rgba(15,118,110,0.1)", border: "1px solid rgba(255,255,255,0.9)"'
)

# Enhance police section background
tsx = tsx.replace(
    'background: "var(--bg-dark)"',
    'background: "linear-gradient(180deg, var(--bg-dark) 0%, #061220 100%)"'
)

# Add decorative ambient glows to body
hero_start = tsx.find('<section')
ambient = '''
      {/* Decorative ambient background glows */}
      <div className="ambient-glow" style={{ top: "10%", left: "-10%", width: "50vw", height: "50vw", background: "rgba(15,118,110,0.06)" }}></div>
      <div className="ambient-glow" style={{ top: "40%", right: "-20%", width: "60vw", height: "60vw", background: "rgba(15,118,110,0.04)" }}></div>
      <div className="ambient-glow" style={{ top: "75%", left: "10%", width: "40vw", height: "40vw", background: "rgba(15,118,110,0.05)" }}></div>
'''
if "Decorative ambient background glows" not in tsx:
    tsx = tsx[:hero_start] + ambient + tsx[hero_start:]

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx)

print("Landing page made stunning successfully")
