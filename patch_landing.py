import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the duplicate gap property on line 462
content = content.replace(
    'gap: "1rem", gap: "1rem"',
    'gap: "1rem"'
)

# 2. Replace the mereb-grid hero background with transparent (beige shows through)
content = content.replace(
    'className="mereb-grid"',
    'className=""'
)

# 3. Add decorative orbit rings around the hero avatar
old_avatar = '''<div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }} className="hidden-mobile">
          <img src="/images/avatar.jpg" className="float-anim" alt="3D Avatar" style={{ height: "600px", objectFit: "contain", mixBlendMode: "multiply", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" }} />
        </div>'''
new_avatar = '''<div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }} className="hidden-mobile">
            {/* Orbit rings */}
            <div className="orbit-ring" style={{ width: 500, height: 500, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
            <div className="orbit-ring" style={{ width: 400, height: 400, top: "50%", left: "50%", transform: "translate(-50%, -50%)", animationDuration: "20s", animationDirection: "reverse" }} />
            {/* Glow behind avatar */}
            <div className="pulse-anim" style={{ position: "absolute", top: "50%", left: "50%", width: 350, height: 350, background: "radial-gradient(circle, rgba(15,118,110,0.12) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
            <img src="/images/shield.jpg" className="float-anim" alt="SafeHer Protection" style={{ height: 520, objectFit: "contain", position: "relative", zIndex: 1, borderRadius: 24, filter: "drop-shadow(0 25px 50px rgba(15,118,110,0.2))" }} />
          </div>'''
content = content.replace(old_avatar, new_avatar)

# 4. Add phone image to How It Works section (beside the steps grid)
old_howit = '''<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.75rem" }}>
            {t.howItWorks.steps.map((step) => (
              <div key={step.step} className="glass-card card-hover" style={{ borderRadius: 16, padding: "2.25rem", background: "var(--bg-card)", border: "1.5px solid #e5e7eb", transition: "all 0.3s" }}>'''
new_howit = '''<div style={{ display: "flex", gap: "3rem", alignItems: "center" }} className="mobile-stack">
            <div className="hidden-mobile float-delayed" style={{ flex: "0 0 320px", position: "relative" }}>
              <div className="pulse-anim" style={{ position: "absolute", top: "50%", left: "50%", width: 300, height: 300, background: "radial-gradient(circle, rgba(15,118,110,0.1) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }} />
              <img src="/images/phone.jpg" alt="SafeHer App" className="tilt-3d" style={{ width: "100%", borderRadius: 20, position: "relative", zIndex: 1, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.12))" }} />
            </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.75rem" }} className="stagger-children">
            {t.howItWorks.steps.map((step) => (
              <div key={step.step} className="glass-card card-3d" style={{ borderRadius: 16, padding: "2.25rem", background: "var(--bg-card)", border: "1.5px solid #e5e7eb", transition: "all 0.3s" }}>'''
content = content.replace(old_howit, new_howit)

# Close the extra div we opened for how-it-works flex layout
old_howit_close = '''            ))}
          </div>
        </div>
      </section>

      {/* '''
# Find the specific one after how-it-works
howit_section_end = content.find('Features', content.find('howItWorks'))
# Find the </section> before Features
section_end_before_features = content.rfind('</section>', 0, howit_section_end)
# Find the closing divs before that
close_area_start = content.rfind('))}', 0, section_end_before_features)

# Let's just replace the hoodie image with the lock image in features
content = content.replace(
    '<img src="/images/hoodie.jpg" alt="3D Hoodie Elements"',
    '<img src="/images/lock.jpg" alt="Security & Encryption"'
)

# 5. Add community image to witness section
old_witness = '''<div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", border: "1.5px solid #e5e7eb", borderRadius: 24, padding: "4.5rem 2.5rem", background: "linear-gradient(135deg, #f8faff 0%, #ffffff 100%)", boxShadow: "0 8px 30px rgba(0,0,0,0.02)" }}>'''
new_witness = '''<div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: "3rem", border: "1.5px solid #e5e7eb", borderRadius: 24, padding: "3.5rem", background: "linear-gradient(135deg, var(--bg-soft) 0%, var(--bg-card) 100%)", boxShadow: "0 8px 30px rgba(0,0,0,0.02)" }} className="mobile-stack">
          <div className="hidden-mobile float-slow" style={{ flex: "0 0 280px" }}>
            <img src="/images/community.jpg" alt="Community Support" className="parallax-img" style={{ width: "100%", borderRadius: 16, filter: "drop-shadow(0 20px 40px rgba(15,118,110,0.1))" }} />
          </div>
        <div style={{ flex: 1, textAlign: "center" }}>'''
content = content.replace(old_witness, new_witness)

# Close the extra witness div
old_witness_close = '''          </Link>
        </div>
      </section>

      {/* '''
# We need to find the witness section's closing and add an extra </div>
witness_footer = content.find('Footer')
witness_link_close = content.rfind('</Link>\n', 0, witness_footer)
# Find the </div> and </section> after that
after_witness_link = content.find('</div>', witness_link_close)
after_witness_section = content.find('</section>', after_witness_link)
# Insert an extra </div> before the first </div> after witness link
insert_pos = after_witness_link
content = content[:insert_pos] + '</div>\n        ' + content[insert_pos:]

# 6. Add card-3d class to feature cards
content = content.replace(
    'className="glass-card card-hover" style={{ borderRadius: 16, padding: "2rem", background: "var(--bg-card)"',
    'className="glass-card card-3d" style={{ borderRadius: 16, padding: "2rem", background: "var(--bg-card)"'
)

# 7. Add stagger-children to features grid
content = content.replace(
    'style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>',
    'className="stagger-children" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>'
)

# 8. Make navbar background match beige
content = content.replace(
    'background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.92)"',
    'background: scrolled ? "rgba(253,246,233,0.97)" : "rgba(253,246,233,0.85)"'
)

# 9. Add glow to shield image in hero
content = content.replace(
    'filter: "drop-shadow(0 25px 50px rgba(15,118,110,0.2))"',
    'filter: "drop-shadow(0 25px 50px rgba(15,118,110,0.25))"'
)

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Landing page updated successfully")
