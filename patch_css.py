import re

with open('apps/web/src/app/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the Animations section and replace everything from there to end of file
marker = '/* \u2500\u2500\u2500 Animations'
idx = content.find(marker)
if idx == -1:
    # Try finding with dashes
    for line_idx, line in enumerate(content.split('\n')):
        if 'Animations' in line and 'keyframes' not in line:
            idx = content.find(line)
            break

if idx > 0:
    before = content[:idx]
else:
    before = content

new_animations = r"""/* Animations */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

@keyframes pulse-ring {
  0%   { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes float {
  0%   { transform: translateY(0px) rotate(0deg); }
  33%  { transform: translateY(-12px) rotate(1deg); }
  66%  { transform: translateY(-6px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

@keyframes float-slow {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

@keyframes float-delayed {
  0%   { transform: translateY(0) rotate(0deg); }
  50%  { transform: translateY(-15px) rotate(2deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

@keyframes pulse-soft {
  0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50%  { transform: translate(-50%, -50%) scale(1.08); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
}

@keyframes glow-pulse {
  0%   { box-shadow: 0 0 20px rgba(15,118,110,0.15); }
  50%  { box-shadow: 0 0 40px rgba(15,118,110,0.3); }
  100% { box-shadow: 0 0 20px rgba(15,118,110,0.15); }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes tilt-3d {
  0%   { transform: perspective(800px) rotateY(0deg) rotateX(0deg); }
  25%  { transform: perspective(800px) rotateY(2deg) rotateX(-1deg); }
  50%  { transform: perspective(800px) rotateY(0deg) rotateX(1deg); }
  75%  { transform: perspective(800px) rotateY(-2deg) rotateX(-1deg); }
  100% { transform: perspective(800px) rotateY(0deg) rotateX(0deg); }
}

.animate-fade-up  { animation: fade-up  0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.animate-fade-in  { animation: fade-in  0.5s ease forwards; }
.animate-slide-right { animation: slide-in-right 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.animate-slide-left  { animation: slide-in-left  0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.animate-scale-in { animation: scale-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

.float-anim     { animation: float 5s ease-in-out infinite; }
.float-slow     { animation: float-slow 7s ease-in-out infinite; }
.float-delayed  { animation: float-delayed 6s ease-in-out 1s infinite; }
.pulse-anim     { animation: pulse-soft 4s ease-in-out infinite; }
.glow-anim      { animation: glow-pulse 3s ease-in-out infinite; }
.rotate-slow    { animation: rotate-slow 30s linear infinite; }
.tilt-3d        { animation: tilt-3d 8s ease-in-out infinite; }

/* Staggered reveal children */
.stagger-children > * {
  opacity: 0;
  animation: fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.12s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.19s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.26s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.33s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.40s; }

/* 3D card hover effect */
.card-3d {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
}
.card-3d:hover {
  transform: perspective(600px) rotateY(-3deg) rotateX(2deg) translateY(-6px);
  box-shadow: 0 25px 50px rgba(0,0,0,0.12), 0 0 0 1px var(--blue-border);
}

/* Image parallax hover */
.parallax-img {
  transition: transform 0.3s ease-out;
}
.parallax-img:hover {
  transform: scale(1.03) translateY(-4px);
}

/* Section label pill */
.section-label {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--blue);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: var(--blue-soft);
  border: 1px solid var(--blue-border);
  border-radius: 999px;
  padding: 4px 14px;
  margin-bottom: 1rem;
}

/* FAQ */
.faq-item {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.22s, box-shadow 0.22s;
}
.faq-item:hover {
  border-color: rgba(15, 118, 110, 0.3);
  box-shadow: 0 4px 16px rgba(15, 118, 110, 0.06);
}
.faq-item.open {
  border-color: var(--blue);
  box-shadow: 0 6px 24px rgba(15, 118, 110, 0.09);
}
.faq-btn {
  width: 100%;
  padding: 1.3rem 1.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  gap: 1rem;
}
.faq-toggle {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  transition: all 0.22s;
}

/* ID card highlight */
.id-challenge-box {
  background: linear-gradient(135deg, #eff6ff 0%, #f0f4ff 100%);
  border: 1.5px solid #bfdbfe;
  border-radius: 14px;
  padding: 1.4rem;
}

/* Responsive */
@media (max-width: 640px) {
  .otp-input {
    width: 44px;
    height: 52px;
    font-size: 1.3rem;
    border-radius: 10px;
  }
}
@media (max-width: 768px) {
  .hidden-mobile { display: none !important; }
  .mobile-stack { flex-direction: column !important; }
}
"""

with open('apps/web/src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(before + new_animations)

print("CSS updated successfully")
