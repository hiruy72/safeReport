import re

with open('apps/web/src/components/landing-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make hero layout flex
hero_target = '<div style={{ position: "relative", maxWidth: 860, margin: "0 auto", zIndex: 1 }} className="animate-fade-up">'
hero_replace = '''<div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", gap: "2rem", width: "100%" }}>
<div style={{ position: "relative", maxWidth: 600, zIndex: 1, textAlign: "left" }} className="animate-fade-up">'''

content = content.replace(hero_target, hero_replace)

# Fix centering for text and trust strip
content = content.replace('margin: "0 auto 2.5rem"', 'marginBottom: "2.5rem"')
content = content.replace('justifyContent: "center", marginBottom: "3.5rem"', 'gap: "1rem", marginBottom: "3.5rem"')
content = content.replace('justifyContent: "center", gap: "1.5rem"', 'gap: "1.5rem"')

# Close the new flex div and add the image
trust_target = '''                </svg>
                {txt}
              </div>
            ))}
          </div>
        </div>'''
trust_replace = '''                </svg>
                {txt}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }} className="hidden-mobile">
          <img src="/images/avatar.jpg" alt="3D Avatar" style={{ height: "600px", objectFit: "contain", mixBlendMode: "multiply", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" }} />
        </div>
      </div>'''

content = content.replace(trust_target, trust_replace)

with open('apps/web/src/components/landing-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
