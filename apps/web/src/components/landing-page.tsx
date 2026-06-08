"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Count-up counter component
function Counter({ end, duration = 1500, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Translations dictionary
const TRANSLATIONS = {
  en: {
    nav: {
      howItWorks: "How It Works",
      features: "Features",
      lawEnforcement: "Law Enforcement",
      witnessPortal: "Witness Portal",
      signIn: "Sign In",
      reportSafely: "Report Safely →"
    },
    hero: {
      badge: "Secure · Anonymous · Encrypted · OTP Verified",
      headline: "You deserve to be heard safely.",
      subhead: "SafeHer is a secure, anonymous reporting platform for survivors of gender-based violence in Ethiopia. Your real identity is never shared with investigators.",
      ctaReport: "File a Report →",
      ctaHow: "How It Works",
      trust1: "Military-grade encryption",
      trust2: "OTP identity verification",
      trust3: "Anonymous case ID",
      trust4: "Full audit log"
    },
    stats: {
      reports: "Reports filed",
      resolved: "Cases resolved",
      stations: "Partner stations",
      protected: "Identity protected"
    },
    howItWorks: {
      label: "Process",
      title: "Simple. Secure. Private.",
      desc: "From first report to resolved case — here's exactly how SafeHer protects you at every step in Ethiopia.",
      steps: [
        {
          step: "01",
          title: "Verify Your Identity",
          desc: "Enter your phone number and national ID FAN. We send a one-time OTP, verify your phone, and securely encrypt your details."
        },
        {
          step: "02",
          title: "Submit Your Report Securely",
          desc: "Describe the incident. Upload photos, audio, or documents — all encrypted on your device before upload."
        },
        {
          step: "03",
          title: "Police Receive the Case",
          desc: "The nearest authorized station receives an anonymized case file. They see your anonymous ID and evidence, never your identity."
        },
        {
          step: "04",
          title: "Track Progress Together",
          desc: "Communicate with investigators through anonymous chat. Receive real-time updates from submission to resolution."
        }
      ]
    },
    features: {
      label: "Features",
      title: "Built for your protection",
      desc: "Every feature is designed with your safety and privacy as the top priority.",
      items: [
        {
          icon: "🛡️",
          title: "Verified & Anonymous",
          desc: "Your identity is encrypted with AES-256. Investigators only ever see your anonymous ID — never your name or address."
        },
        {
          icon: "🔐",
          title: "End-to-End Encrypted",
          desc: "Every file, message, and evidence upload is encrypted before leaving your device. Access logs are immutably audited."
        },
        {
          icon: "📍",
          title: "Routed to Local Police",
          desc: "Reports are automatically dispatched to the closest authorized police station in your Ethiopian region."
        },
        {
          icon: "💬",
          title: "Anonymous Chat",
          desc: "Communicate with the assigned investigator without ever exposing your personal details."
        },
        {
          icon: "🚨",
          title: "Emergency SOS",
          desc: "One tap triggers an immediate alert to your local regional station with your live GPS coordinates."
        },
        {
          icon: "📊",
          title: "Real-Time Case Tracking",
          desc: "Follow every investigation milestone — from submission to resolved — with full transparency."
        }
      ]
    },
    police: {
      label: "For Officers",
      title: "A smarter investigation workflow",
      desc: "SafeHer gives law enforcement agencies in Ethiopia a powerful, privacy-preserving case management system. AI-assisted suspect matching, encrypted evidence, anonymous victim chat, and full case timelines.",
      feats: [
        "AI suspect matching",
        "Anonymous victim profiles",
        "Encrypted evidence vault",
        "Case status timelines",
        "Audit-logged access",
        "Secure officer portal"
      ],
      ctaRegister: "Officer Registration →",
      ctaLogin: "Officer Sign In"
    },
    witness: {
      label: "Did you witness something?",
      title: "Your testimony could change everything",
      desc: "Submit an anonymous witness statement or audio testimony to an active case in Ethiopia — no account required.",
      cta: "Submit Witness Statement →"
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Questions about how we work, what to expect, or how we structure engagements? The answers most clients ask about, below.",
      items: [
        {
          q: "Who can see my real identity when I submit a report?",
          a: "No one except the system's isolated identity vault. The assigned police officers, admin staff, and investigators only see an anonymous Case ID and a generated pseudonymous code. Your real name, address, and national ID are completely encrypted with AES-256."
        },
        {
          q: "Is this platform really free to use in Ethiopia?",
          a: "Yes, SafeHer is 100% free and sponsored by regional security bureaus and partners to combat gender-based violence (GBV) and protect citizens."
        },
        {
          q: "How does the national ID verification work?",
          a: "We verify you using your phone OTP and Fayda ID (FAN number) to prevent fake/spam reports. During setup, you enter the FAN number and verify minor details from the physical card. The system cryptographically seals these details, so they are never exposed to the police."
        },
        {
          q: "Can I communicate with the police investigator?",
          a: "Yes, once an investigator is assigned, you can log in to your dashboard and chat with them anonymously. You can also upload additional encrypted evidence, text, or audio messages."
        },
        {
          q: "What is the Emergency SOS button?",
          a: "If you are in immediate danger, you can trigger the SOS button on the mobile app or web portal. It sends a high-priority alert with your live GPS location to the nearest police station for immediate response."
        }
      ]
    },
    footer: {
      desc: "A confidential platform for survivors of gender-based violence. Your safety and anonymity are our absolute priority.",
      platforms: "Platform",
      policeSection: "Law Enforcement",
      support: "Support",
      rights: "© 2026 SafeHer. Confidential reporting platform for survivors in Ethiopia.",
      operational: "All systems operational"
    }
  },
  am: {
    nav: {
      howItWorks: "እንዴት ይሰራል",
      features: "ባህሪያት",
      lawEnforcement: "ለህግ አስከባሪዎች",
      witnessPortal: "የምስክርነት ቃል",
      signIn: "ይግቡ",
      reportSafely: "ጥቃት ሪፖርት ያድርጉ →"
    },
    hero: {
      badge: "አስተማማኝ · በምስጢር የተጠበቀ · የተመሰጠረ · በኦቲፒ የተረጋገጠ",
      headline: "በጥንቃቄ እና በምስጢር ድምፅዎ እንዲሰማ ይገባዎታል።",
      subhead: "ሴፍሄር በኢትዮጵያ ውስጥ በጾታ ላይ የተመሰረቱ ጥቃቶችን (GBV) ለደረሰባቸው ወገኖች ደህንነቱ የተጠበቀ እና ማንነትን የማይገልጽ ሪፖርት ማድረጊያ መድረክ ነው። እውነተኛ ማንነትዎ ለፖሊስ ምርመራ ክፍል በጭራሽ አይጋራም።",
      ctaReport: "ሪፖርት አቅርብ →",
      ctaHow: "እንዴት እንደሚሰራ",
      trust1: "ወታደራዊ ደረጃ መረጃ ምስጠራ",
      trust2: "በኦቲፒ (OTP) የተረጋገጠ ማንነት",
      trust3: "ማንነትን የማይገልጽ የክስ ቁጥር",
      trust4: "ሙሉ የክትትልና ቁጥጥር መዝገብ"
    },
    stats: {
      reports: "ሪፖርቶች ተመዝግበዋል",
      resolved: "እልባት አግኝተዋል",
      stations: "ተባባሪ ጣቢያዎች",
      protected: "ማንነታቸው ተጠብቋል"
    },
    howItWorks: {
      label: "ሂደት",
      title: "ቀላል። አስተማማኝ። ሚስጥራዊ።",
      desc: "ከመጀመሪያው ሪፖርት ጀምሮ ጉዳዩ እልባት እስኪያገኝ ድረስ — በኢትዮጵያ ውስጥ ሴፍሄር እንዴት ጥበቃ እንደሚያደርግልዎ እነሆ።",
      steps: [
        {
          step: "01",
          title: "ማንነትዎን ያረጋግጡ",
          desc: "የስልክ ቁጥርዎን እና የፋይዳ ብሄራዊ መታወቂያ (FAN) ያስገቡ። የአንድ ጊዜ የኦቲፒ ኮድ እንልካለን፤ ማንነትዎን አረጋግጠን መረጃዎን በምስጢር እናስቀምጣለን።"
        },
        {
          step: "02",
          title: "ሪፖርትዎን በምስጢር ይላኩ",
          desc: "የተፈጠረውን ሁኔታ ይግለጹ። ፎቶዎች፣ ድምጽ ወይም ሰነዶችን ያክሉ — ሁሉም ከስልክዎ ከመውጣቱ በፊት በምስጢር ይመሰጠራሉ።"
        },
        {
          step: "03",
          title: "ፖሊስ ጉዳዩን ይቀበላል",
          desc: "በአቅራቢያዎ የሚገኝ ጣቢያ ማንነትዎ የተሰወረበትን ጉዳይ ይቀበላል። የእርስዎን ሚስጥራዊ መለያ እና ማስረጃ እንጂ እውነተኛ ማንነትዎን ማየት አይችሉም።"
        },
        {
          step: "04",
          title: "ሂደቱን አብረው ይከታተሉ",
          desc: "ከተመደበው መርማሪ ጋር ማንነትዎ ሳይገለጽ በምስጢር ይወያዩ። ጉዳዩ ከቀረበበት ጀምሮ እልባት እስኪያገኝ ድረስ ያሉትን ደረጃዎች ይከታተሉ።"
        }
      ]
    },
    features: {
      label: "ባህሪያት",
      title: "ለእርስዎ ጥበቃ የተሰራ",
      desc: "እያንዳንዱ ባህሪ ለእርስዎ ደህንነት እና ምስጢራዊነት ፍፁም ቅድሚያ በሚሰጥ መልኩ የተነደፈ ነው።",
      items: [
        {
          icon: "🛡️",
          title: "የተረጋገጠ እና ማንነት የማይገልጽ",
          desc: "ማንነትዎ በAES-256 የተመሰጠረ ነው። መርማሪዎች የሚያዩት የእርስዎን ሚስጥራዊ መለያ እንጂ እውነተኛ ስምዎን ወይም አድራሻዎን አይደለም።"
        },
        {
          icon: "🔐",
          title: "ጫፍ-እስከ-ጫፍ የተመሰጠረ",
          desc: "እያንዳንዱ ፋይል፣ መልዕክት እና ማስረጃ ከመሳሪያዎ ከመውጣቱ በፊት ይመሰጠራል። የመረጃ መዳረሻ መዝገቦች በደህንነት ይቀመጣሉ።"
        },
        {
          icon: "📍",
          title: "ለአካባቢ ፖሊስ የሚላክ",
          desc: "ሪፖርቶች በአቅራቢያዎ ወደሚገኘው ፈቃድ ላለው የኢትዮጵያ ፖሊስ ጣቢያ በቀጥታ ይላካሉ።"
        },
        {
          icon: "💬",
          title: "ማንነት የማይገልጽ ውይይት",
          desc: "የግል ዝርዝሮችዎን ሳይገልጹ ከተመደበው መርማሪ ጋር በምስጢራዊ የጽሁፍ መልዕክት መገናኘት ይችላሉ።"
        },
        {
          icon: "🚨",
          title: "የአደጋ ጊዜ ኤስ.ኦ.ኤስ (SOS)",
          desc: "አንድ ጊዜ በመጫን የአሁኑን የጂፒኤስ መገኛ መጋጠሚያዎች በአቅራቢያ ላለው ጣቢያ በመላክ ፈጣን እርዳታ ማግኘት ይችላሉ።"
        },
        {
          icon: "📊",
          title: "የጉዳይ ክትትል",
          desc: "ከማስገባት ጀምሮ እስከ እልባት ድረስ ያለውን የሂደት ደረጃዎች በግልፅነት መከታተል ይችላሉ።"
        }
      ]
    },
    police: {
      label: "ለፖሊስ አባላት",
      title: "የተሻሻለ የጉዳይ ምርመራ አሰራር",
      desc: "ሴፍሄር በኢትዮጵያ ውስጥ ላሉ የህግ አስከባሪ አካላት የግል ምስጢርን በጠበቀ መልኩ የሚሰራ የጉዳይ ምርመራ ስርዓት ይሰጣል። በሰው ሰራሽ አስተዋፅዖ (AI) የተደገፈ ተጠርጣሪ ማዛመጃ፣ የተመሰጠረ ማስረጃ ማከማቻ እና የቀጥታ ውይይት።",
      feats: [
        "በAI የተደገፈ ተጠርጣሪ ማዛመድ",
        "ማንነት የማይገልጽ የተጎጂ መገለጫ",
        "የተመሰጠረ የማስረጃ ቋት",
        "የጉዳይ ሂደት ደረጃዎች",
        "የመረጃ መዳረሻ ክትትል",
        "ደህንነቱ የተጠበቀ የፖሊስ መግቢያ"
      ],
      ctaRegister: "የፖሊስ ምዝገባ →",
      ctaLogin: "የፖሊስ መግቢያ"
    },
    witness: {
      label: "ጥቃት ሲፈጸም ተመልክተዋል?",
      title: "የእርስዎ ምስክርነት ሁሉንም ነገር ሊቀይር ይችላል",
      desc: "በምርመራ ላይ ላለ ጉዳይ ማንነትዎ ሳይገለጽ ምስክርነትዎን ወይም የድምጽ ቃልዎን ያቅርቡ — አካውንት መክፈት አያስፈልግም።",
      cta: "የምስክርነት ቃል ስጥ →"
    },
    faq: {
      title: "ተደጋግመው የሚጠየቁ ጥያቄዎች",
      subtitle: "ስለ አሰራራችን፣ ምን እንደሚጠብቁ እና እንዴት እንደምናግዝዎ የተለመዱ ጥያቄዎችና መልሶች ከዚህ በታች ተካተዋል።",
      items: [
        {
          q: "ሪፖርት ሳቀርብ እውነተኛ ማንነቴን ማን ማየት ይችላል?",
          a: "በስርዓቱ ውስጥ ካለው የተለየ ሚስጥራዊ የመረጃ ቋት ውጭ ማንም እውነተኛ ማንነትዎን ማየት አይችልም። መርማሪዎች እና አስተዳዳሪዎች የሚያዩት ማንነትዎ የተሰወረበትን የጉዳይ መለያ ቁጥር ብቻ ነው። ስምዎ፣ አድራሻዎ እና መታወቂያዎ በAES-256 ምስጠራ ሙሉ በሙሉ የተጠበቁ ናቸው።"
        },
        {
          q: "ይህ መድረክ በኢትዮጵያ ለመጠቀም በእርግጥ ነፃ ነው?",
          a: "አዎ፣ ሴፍሄር የቤት ውስጥ እና የጾታ ጥቃቶችን ለመከላከል እና ዜጎችን ለመጠበቅ በአጋር አካላት የተደገፈ በመሆኑ 100% ነፃ ነው።"
        },
        {
          q: "የብሄራዊ መታወቂያ ማረጋገጫ እንዴት ነው የሚሰራው?",
          a: "የሀሰት ሪፖርቶችን ለመከላከል ስልክዎን በኦቲፒ እና የፋይዳ (Fayda) ብሄራዊ መታወቂያ (FAN ቁጥር) እንጠቀማለን። በምዝገባ ወቅት የመታወቂያ ቁጥርዎን አስገብተው አንዳንድ ጥያቄዎችን ይመልሳሉ። መድረኩ መረጃውን በምስጢር ስለሚያስቀምጠው ለፖሊስ አይገለጽም።"
        },
        {
          q: "ከተመደበው የፖሊስ መርማሪ ጋር መገናኘት እችላለሁ?",
          a: "አዎ፣ መርማሪ በሚመደብበት ጊዜ በመለያዎ በመግባት ማንነትዎ ሳይገለጽ በምስጢራዊ የጽሁፍ መልዕክት መገናኘት ይችላሉ። ተጨማሪ ማስረጃዎችንም መስቀል ይችላሉ።"
        },
        {
          q: "የአደጋ ጊዜ የኤስ.ኦ.ኤስ (SOS) ቁልፍ ምንድነው?",
          a: "በድንገተኛ አደጋ ውስጥ ከሆኑ የSOS ቁልፍን በመጫን የአሁኑን የጂፒኤስ መገኛዎትን በአቅራቢያ ላለው ጣቢያ በመላክ አፋጣኝ የፖሊስ እርዳታ እንዲደርስዎት ማድረግ ይችላሉ።"
        }
      ]
    },
    footer: {
      desc: "በጾታ ላይ የተመሰረቱ ጥቃቶችን (GBV) ለደረሰባቸው ወገኖች ምስጢራዊ መድረክ። የእርስዎ ደህንነት እና ማንነትን መደበቅ የእኛ ፍፁም ቅድሚያ የሚሰጠው ጉዳይ ነው።",
      platforms: "መድረክ",
      policeSection: "ህግ አስከባሪዎች",
      support: "እርዳታ",
      rights: "© 2026 ሴፍሄር። በኢትዮጵያ የተጎጂዎች ጥበቃና ምስጢራዊ ሪፖርት ማድረጊያ መድረክ።",
      operational: "ሁሉም ስርዓቶች ንቁ ናቸው"
    }
  }
};

export function LandingPage() {
  const [lang, setLang] = useState<"en" | "am">("en");
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    // Load persisted language selection
    const savedLang = localStorage.getItem("safeher-lang");
    if (savedLang === "en" || savedLang === "am") {
      setLang(savedLang);
    }

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const changeLang = (l: "en" | "am") => {
    setLang(l);
    localStorage.setItem("safeher-lang", l);
  };

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.92)",
          borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
          backdropFilter: "blur(12px)",
          transition: "all 0.2s ease",
          boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.03)" : "none"
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" width={20} height={20} stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0d1117", letterSpacing: "-0.01em" }}>SafeHer</span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden-mobile">
            <a href="#how-it-works" className="nav-link">{t.nav.howItWorks}</a>
            <a href="#features" className="nav-link">{t.nav.features}</a>
            <a href="#for-police" className="nav-link">{t.nav.lawEnforcement}</a>
            <Link href="/witness" className="nav-link">{t.nav.witnessPortal}</Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Language Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, borderRight: "1px solid #e5e7eb", paddingRight: 14 }}>
              <span style={{ fontSize: "0.9rem" }}>🇬🇧</span>
              <button
                onClick={() => changeLang("en")}
                style={{
                  background: "none",
                  border: "none",
                  color: lang === "en" ? "var(--blue)" : "#6b7280",
                  fontWeight: lang === "en" ? 700 : 500,
                  fontSize: "0.825rem",
                  cursor: "pointer",
                  padding: "2px 4px"
                }}
              >
                EN
              </button>
              <span style={{ color: "#d1d5db", fontSize: "0.75rem" }}>::</span>
              <span style={{ fontSize: "0.9rem" }}>🇪🇹</span>
              <button
                onClick={() => changeLang("am")}
                style={{
                  background: "none",
                  border: "none",
                  color: lang === "am" ? "var(--blue)" : "#6b7280",
                  fontWeight: lang === "am" ? 700 : 500,
                  fontSize: "0.825rem",
                  cursor: "pointer",
                  padding: "2px 4px"
                }}
              >
                አማ
              </button>
            </div>

            <Link href="/login" className="nav-link" style={{ fontWeight: 600 }}>{t.nav.signIn}</Link>
            <Link href="/register" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.55rem 1.35rem", borderRadius: 99 }}>
              {t.nav.reportSafely}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero (Grid overlay) ────────────────────────────────────── */}
      <section
        className="mereb-grid"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "7.5rem 1.5rem 5rem",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", zIndex: 1 }} className="animate-fade-up">
          {/* Top badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid var(--blue-border)", borderRadius: 999, padding: "6px 18px", marginBottom: "2rem", fontSize: "0.8rem", color: "var(--blue)", fontWeight: 600, boxShadow: "0 4px 12px rgba(37,99,235,0.06)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", boxShadow: "0 0 8px var(--blue)" }} />
            {t.hero.badge}
          </div>

          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.8rem)", fontWeight: 900, lineHeight: 1.1, color: "#0d1117", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
            {lang === "en" ? (
              <>
                You deserve to be{" "}
                <span className="gradient-text">heard safely.</span>
              </>
            ) : (
              <span className="gradient-text">{t.hero.headline}</span>
            )}
          </h1>

          <p style={{ fontSize: "1.15rem", color: "#4b5563", maxWidth: 680, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            {t.hero.subhead}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", marginBottom: "3.5rem" }}>
            <Link href="/register" className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2.25rem", borderRadius: 99, boxShadow: "0 4px 14px var(--blue-glow)" }}>
              {t.hero.ctaReport}
            </Link>
            <a href="#how-it-works" className="btn-ghost" style={{ fontSize: "1rem", padding: "0.875rem 2.25rem", borderRadius: 99 }}>
              {t.hero.ctaHow}
            </a>
          </div>

          {/* Trust strip */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
            {[t.hero.trust1, t.hero.trust2, t.hero.trust3, t.hero.trust4].map((txt) => (
              <div key={txt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#6b7280", fontWeight: 500 }}>
                <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} style={{ color: "var(--blue)", flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {txt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (dark navy section) ───────────────────────────────── */}
      <section style={{ background: "#0d1117", padding: "5rem 1.5rem", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--blue)", lineHeight: 1, marginBottom: "0.5rem" }}>
              <Counter end={12400} suffix="+" />
            </div>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.stats.reports}</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--blue)", lineHeight: 1, marginBottom: "0.5rem" }}>
              <Counter end={94} suffix="%" />
            </div>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.stats.resolved}</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--blue)", lineHeight: 1, marginBottom: "0.5rem" }}>
              <Counter end={38} />
            </div>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.stats.stations}</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--blue)", lineHeight: 1, marginBottom: "0.5rem" }}>
              <Counter end={100} suffix="%" />
            </div>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.stats.protected}</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "6.5rem 1.5rem", background: "#f8faff", position: "relative" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.howItWorks.label}</span>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0d1117", marginTop: "0.75rem", marginBottom: "1rem", letterSpacing: "-0.01em" }}>{t.howItWorks.title}</h2>
            <p style={{ color: "#6b7280", maxWidth: 540, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7 }}>{t.howItWorks.desc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.75rem" }}>
            {t.howItWorks.steps.map((step) => (
              <div key={step.step} className="glass-card card-hover" style={{ borderRadius: 16, padding: "2.25rem", background: "#ffffff", border: "1.5px solid #e5e7eb", transition: "all 0.3s" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Step {step.step}</div>
                <h3 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#0d1117", marginBottom: "0.75rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "6.5rem 1.5rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.features.label}</span>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0d1117", marginTop: "0.75rem", marginBottom: "1rem", letterSpacing: "-0.01em" }}>{t.features.title}</h2>
            <p style={{ color: "#6b7280", maxWidth: 520, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7 }}>{t.features.desc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {t.features.items.map((f) => (
              <div key={f.title} className="glass-card card-hover" style={{ borderRadius: 16, padding: "2rem", background: "#ffffff", border: "1.5px solid #e5e7eb", transition: "all 0.3s" }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "1.25rem" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#0d1117", marginBottom: "0.6rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section (Accordion) ────────────────────────────────── */}
      <section style={{ padding: "6.5rem 1.5rem", background: "#f8faff", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0d1117", marginBottom: "1rem" }}>
              <span className="gradient-text">{t.faq.title}</span>
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1rem", lineHeight: 1.7 }}>{t.faq.subtitle}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {t.faq.items.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    border: isOpen ? "1.5px solid var(--blue)" : "1.5px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    boxShadow: isOpen ? "0 4px 18px rgba(37,99,235,0.06)" : "none"
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: isOpen ? "var(--blue)" : "#0d1117" }}>
                      {item.q}
                    </span>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isOpen ? "var(--blue)" : "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isOpen ? "#ffffff" : "#6b7280",
                        fontSize: "1rem",
                        fontWeight: 700,
                        transition: "all 0.2s"
                      }}
                    >
                      {isOpen ? "✕" : "+"}
                    </div>
                  </button>

                  <div
                    style={{
                      maxHeight: isOpen ? 500 : 0,
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      borderTop: isOpen ? "1px solid #f3f4f6" : "none"
                    }}
                  >
                    <p style={{ padding: "1.25rem 1.5rem", fontSize: "0.925rem", color: "#4b5563", lineHeight: 1.7, background: "#fafbff" }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Law Enforcement (dark navy) ─────────────────────────────── */}
      <section id="for-police" style={{ background: "#0d1117", padding: "6rem 1.5rem", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "4rem", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.police.label}</span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", marginTop: "0.75rem", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>{t.police.title}</h2>
            <p style={{ color: "#9ca3af", lineHeight: 1.7, fontSize: "1rem", marginBottom: "2.5rem" }}>
              {t.police.desc}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {t.police.feats.map((feat) => (
                <div key={feat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "#d1d5db", fontWeight: 500 }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} style={{ color: "var(--blue)", flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  {feat}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360, margin: "0 auto", width: "100%" }}>
            <Link href="/register/police" className="btn-white" style={{ textAlign: "center", padding: "0.875rem 2rem", borderRadius: 99 }}>
              {t.police.ctaRegister}
            </Link>
            <Link href="/login" className="btn-outline-white" style={{ textAlign: "center", padding: "0.875rem 2rem", borderRadius: 99 }}>
              {t.police.ctaLogin}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Witness CTA ────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem", background: "#fff", position: "relative" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", border: "1.5px solid #e5e7eb", borderRadius: 24, padding: "4.5rem 2.5rem", background: "linear-gradient(135deg, #f8faff 0%, #ffffff 100%)", boxShadow: "0 8px 30px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.witness.label}</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0d1117", marginTop: "0.75rem", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>{t.witness.title}</h2>
          <p style={{ color: "#6b7280", lineHeight: 1.7, fontSize: "1rem", marginBottom: "2.25rem", maxWidth: 520, margin: "0 auto 2.25rem" }}>
            {t.witness.desc}
          </p>
          <Link href="/witness" className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2.5rem", borderRadius: 99 }}>
            {t.witness.cta}
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ background: "#0d1117", borderTop: "1px solid #1f2937", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4.5rem 1.5rem 2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "3.5rem", marginBottom: "4rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" width={20} height={20} stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#fff", letterSpacing: "-0.01em" }}>SafeHer</span>
              </div>
              <p style={{ fontSize: "0.95rem", color: "#9ca3af", lineHeight: 1.7, maxWidth: 380 }}>
                {t.footer.desc}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>{t.footer.platforms}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link href="/register" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  {t.nav.reportSafely}
                </Link>
                <Link href="/witness" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  {t.nav.witnessPortal}
                </Link>
                <Link href="/login" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  {t.nav.signIn}
                </Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>{t.footer.policeSection}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link href="/register/police" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  {t.police.ctaRegister}
                </Link>
                <Link href="/login" style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  {t.police.ctaLogin}
                </Link>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1f2937", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>{t.footer.rights}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#6b7280" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              {t.footer.operational}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
