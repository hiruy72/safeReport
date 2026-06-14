"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Region {
  id: string;
  name: string;
  cities: { id: string; name: string }[];
}

const ETHIOPIAN_REGIONS_FALLBACK: Region[] = [
  { id: "addis_ababa", name: "Addis Ababa (አዲስ አበባ)", cities: [{ id: "addis_ababa_city", name: "Addis Ababa" }] },
  { id: "amhara", name: "Amhara (አማራ)", cities: [{ id: "bahir_dar", name: "Bahir Dar" }, { id: "gondar", name: "Gondar" }, { id: "dessie", name: "Dessie" }] },
  { id: "oromia", name: "Oromia (ኦሮሚያ)", cities: [{ id: "adama", name: "Adama" }, { id: "jimma", name: "Jimma" }, { id: "shashamane", name: "Shashamane" }] },
  { id: "tigray", name: "Tigray (ትግራይ)", cities: [{ id: "mekelle", name: "Mekelle" }, { id: "shire", name: "Shire" }] },
  { id: "somali", name: "Somali (ሶማሌ)", cities: [{ id: "jijiga", name: "Jijiga" }] },
  { id: "afar", name: "Afar (አፋር)", cities: [{ id: "semere", name: "Semera" }] },
  { id: "sidama", name: "Sidama (ሲዳማ)", cities: [{ id: "hawassa", name: "Hawassa" }] },
  { id: "south_ethiopia", name: "Southern Ethiopia (ደቡብ ኢትዮጵያ)", cities: [{ id: "arba_minch", name: "Arba Minch" }] },
  { id: "central_ethiopia", name: "Central Ethiopia (ማዕከላዊ ኢትዮጵያ)", cities: [{ id: "hosaena", name: "Hosaena" }] },
  { id: "south_west_ethiopia", name: "South West Ethiopia (ደቡብ ምዕራብ ኢትዮጵያ)", cities: [{ id: "bonga", name: "Bonga" }] },
  { id: "harari", name: "Harari (ሐረሪ)", cities: [{ id: "harar", name: "Harar" }] },
  { id: "dire_dawa", name: "Dire Dawa (ድሬዳዋ)", cities: [{ id: "dire_dawa_city", name: "Dire Dawa" }] },
  { id: "gambela", name: "Gambela (ጋምቤላ)", cities: [{ id: "gambela_city", name: "Gambela" }] },
  { id: "benishangul_gumuz", name: "Benishangul-Gumuz (ቤንሻንጉል ጉሙዝ)", cities: [{ id: "assosa", name: "Assosa" }] },
];

type Step = 1 | 2 | 3 | 4;

const TRANSLATIONS = {
  en: {
    backToHome: "Back to Home",
    alreadyHave: "Already have an account?",
    signIn: "Sign in",
    steps: ["Identity Setup", "Verify OTP", "National ID Challenge", "Create Account"],
    step1: {
      title: "Start Identity Verification",
      desc: "To file secure reports, we verify your identity against the national ID registry using your phone number. Your real details are cryptographically locked and kept secret.",
      phoneLabel: "Phone Number",
      phonePlaceholder: "9X XXX XXXX",
      phoneHelp: "Enter your active phone number to receive a verification OTP.",
      fanLabel: "🪪 Fayda / National ID FAN Number",
      fanPlaceholder: "FAN-XXXXXXXXXX",
      fanHelp: "Your unique national identifier printed on your ID card.",
      btnSend: "Send Verification OTP →",
      disclaimer: "🔒 Your phone and FAN number are used strictly to verify you are a real person. They are encrypted and never visible to the police.",
      phoneError: "Please enter your phone number.",
      fanError: "Please enter your National ID FAN number."
    },
    step2: {
      title: "Verify your phone",
      desc: "We sent a 6-digit verification code to ",
      codeLabel: "Verification Code",
      codePlaceholder: "000 000",
      btnVerify: "Verify Code →",
      changeNumber: "← Change number",
      resendOtp: "Resend OTP",
      resendIn: "Resend in",
      devMode: "💡 Dev mode: Check the API server console for the OTP code (Twilio not configured)."
    },
    step3: {
      title: "National ID Challenge",
      desc: "Please look at your physical National ID / Fayda card and verify the following minor details to confirm ownership. This encrypted data is kept secret.",
      verified: "Phone verified",
      amharicName: "Full Name in Amharic (የሙሉ ስም በፊደል)",
      amharicNamePlaceholder: "ለምሳሌ፡ ዮናስ አበበ ኃይሉ",
      issueDate: "Card Issue Date",
      woreda: "Woreda / Place of Issue (as printed on card)",
      woredaPlaceholder: "Woreda 03, Addis Ababa",
      firstName: "First Name (English, as on ID)",
      lastName: "Last Name (English, as on ID)",
      dob: "Date of Birth",
      gender: "Gender",
      genderOptions: {
        female: "Female",
        male: "Male",
        other: "Other",
        prefer: "Prefer not to say"
      },
      address: "Home Address",
      addressPlaceholder: "Street, district, city",
      region: "Region",
      selectRegion: "Select region",
      city: "City",
      selectCity: "Select city",
      btnBack: "← Back",
      btnContinue: "Continue →"
    },
    step4: {
      title: "Create your account",
      desc: "Set up a secure email and password. You'll use these to log in anonymously.",
      email: "Email Address",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "Min. 8 characters",
      summaryTitle: "✅ Information collected",
      summaryKeys: {
        phone: "Phone",
        fan: "FAN Number",
        name: "Name",
        region: "Region"
      },
      btnBack: "← Back",
      btnRegister: "Create Account →",
      disclaimer: "By registering, your identity is encrypted and will never be shared with police or third parties without your consent."
    }
  },
  am: {
    backToHome: "ወደ መነሻ ገጽ",
    alreadyHave: "አካውንት አለዎት?",
    signIn: "ይግቡ",
    steps: ["ማንነት መመስረቻ", "ኦቲፒ ማረጋገጫ", "የመታወቂያ ፈተና", "መለያ መፍጠሪያ"],
    step1: {
      title: "ማንነት ማረጋገጥ ይጀምሩ",
      desc: "ደህንነቱ የተጠበቀ ሪፖርቶችን ለማቅረብ የስልክ ቁጥርዎን በመጠቀም ማንነትዎን ከብሔራዊ መታወቂያ መዝገብ ጋር እናረጋግጣለን። የእርስዎ እውነተኛ መረጃዎች በምስጢር ተቆልፈው ይቀመጣሉ።",
      phoneLabel: "የስልክ ቁጥር",
      phonePlaceholder: "9X XXX XXXX",
      phoneHelp: "የማረጋገጫ የኦቲፒ ኮድ ለመቀበል ንቁ ስልክ ቁጥርዎን ያስገቡ።",
      fanLabel: "🪪 የፋይዳ (Fayda) ብሄራዊ መታወቂያ የFAN ቁጥር",
      fanPlaceholder: "FAN-XXXXXXXXXX",
      fanHelp: "መታወቂያ ካርድዎ ላይ የተጻፈው ልዩ ብሄራዊ መለያ ቁጥርዎ።",
      btnSend: "የማረጋገጫ ኦቲፒ ላክ →",
      disclaimer: "🔒 ስልክዎ እና የፋይዳ ቁጥርዎ እርስዎ እውነተኛ ሰው መሆንዎን ለማረጋገጥ ብቻ ያገለግላሉ። እነሱ በምስጢር የተመሰጠሩ ናቸው እና ለፖሊስ አይታዩም።",
      phoneError: "እባክዎ ስልክ ቁጥርዎን ያስገቡ።",
      fanError: "እባክዎ የብሄራዊ መታወቂያ የFAN ቁጥርዎን ያስገቡ።"
    },
    step2: {
      title: "ስልክዎን ያረጋግጡ",
      desc: "ባለ 6-አሃዝ የማረጋገጫ ኮድ ወደዚህ ቁጥር ልከናል፡ ",
      codeLabel: "የማረጋገጫ ኮድ",
      codePlaceholder: "000 000",
      btnVerify: "ኮዱን አረጋግጥ →",
      changeNumber: "← ቁጥር ቀይር",
      resendOtp: "ኦቲፒ ድጋሚ ላክ",
      resendIn: "ድጋሚ ለመላክ",
      devMode: "💡 Dev mode: የኦቲፒ ኮዱን ለማግኘት የኤፒአይ ሰርቨር ኮንሶልን ይመልከቱ (Twilio አልተዋቀረም)።"
    },
    step3: {
      title: "የብሄራዊ መታወቂያ ፈተና",
      desc: "እባክዎ የእርስዎን ብሄራዊ መታወቂያ / የፋይዳ ካርድ ይመልከቱ እና ባለቤትነትዎን ለማረጋገጥ የሚከተሉትን ጥያቄዎች ይመልሱ። ይህ መረጃ በምስጢር ይጠበቃል።",
      verified: "ስልክ ተረጋግጧል",
      amharicName: "ሙሉ ስም በፊደል (መታወቂያው ላይ እንዳለው)",
      amharicNamePlaceholder: "ለምሳሌ፡ ዮናስ አበበ ኃይሉ",
      issueDate: "መታወቂያው የተሰጠበት ቀን",
      woreda: "ወረዳ / መታወቂያው የተሰጠበት ቦታ",
      woredaPlaceholder: "ወረዳ 03፣ አዲስ አበባ",
      firstName: "የመጀመሪያ ስም (በእንግሊዝኛ፣ መታወቂያው ላይ እንዳለው)",
      lastName: "የአባት ስም (በእንግሊዝኛ፣ መታወቂያው ላይ እንዳለው)",
      dob: "የልደት ቀን",
      gender: "ጾታ",
      genderOptions: {
        female: "ሴት",
        male: "ወንድ",
        other: "ሌላ",
        prefer: "ባይገለጽ ይመረጣል"
      },
      address: "የመኖሪያ አድራሻ",
      addressPlaceholder: "ጎዳና፣ ቀበሌ፣ ከተማ",
      region: "ክልል",
      selectRegion: "ክልል ይምረጡ",
      city: "ከተማ",
      selectCity: "ከተማ ይምረጡ",
      btnBack: "← ወደኋላ",
      btnContinue: "ቀጥል →"
    },
    step4: {
      title: "መለያዎን ይፍጠሩ",
      desc: "ደህንነቱ የተጠበቀ ኢሜይል እና የይለፍ ቃል ያዘጋጁ። ማንነትዎ ሳይገለጽ ለመግባት እነዚህን ይጠቀማሉ።",
      email: "የኢሜይል አድራሻ",
      emailPlaceholder: "you@example.com",
      password: "የይለፍ ቃል",
      passwordPlaceholder: "ቢያንስ 8 ቁምፊዎች",
      summaryTitle: "✅ የተሰበሰቡ መረጃዎች",
      summaryKeys: {
        phone: "ስልክ",
        fan: "የፋይዳ ቁጥር",
        name: "ስም",
        region: "ክልል"
      },
      btnBack: "← ወደኋላ",
      btnRegister: "መለያ ፍጠር →",
      disclaimer: "በመመዝገብዎ ማንነትዎ በምስጢር ይመሰጠራል፤ ያለእርስዎ ፈቃድ ለፖሊስም ሆነ ለሶስተኛ ወገኖች በጭራሽ አይጋራም።"
    }
  }
};

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "am">("en");
  const [step, setStep] = useState<Step>(1);
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    phone: "",
    fanNumber: "",
    // Step 2
    otp: "",
    // Step 3 — National ID details & challenge
    idAmharicName: "",
    idIssueDate: "",
    idWoreda: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "FEMALE",
    address: "",
    regionId: "",
    cityId: "",
    // Step 4
    email: "",
    password: "",
  });

  useEffect(() => {
    // Load persisted language
    const savedLang = localStorage.getItem("safeher-lang");
    if (savedLang === "en" || savedLang === "am") {
      setLang(savedLang);
    }

    api<Region[]>("/api/regions")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setRegions(res.data);
        } else {
          setRegions(ETHIOPIAN_REGIONS_FALLBACK);
        }
      })
      .catch(() => {
        setRegions(ETHIOPIAN_REGIONS_FALLBACK);
      });
  }, []);

  // Countdown timer for OTP
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "am" : "en";
    setLang(nextLang);
    localStorage.setItem("safeher-lang", nextLang);
  };

  const t = TRANSLATIONS[lang];

  async function sendOtp() {
    if (!form.phone.trim()) {
      setError(t.step1.phoneError);
      return;
    }
    if (!form.fanNumber.trim()) {
      setError(t.step1.fanError);
      return;
    }
    setLoading(true);
    setError("");
    const res = await api("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone: form.phone }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Failed to send OTP");
      return;
    }
    setOtpSent(true);
    setOtpTimer(60);
    setStep(2);
  }

  async function verifyOtp() {
    if (form.otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await api("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: form.phone, otp: form.otp }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Invalid OTP");
      return;
    }
    setPhoneVerified(true);
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 3) {
      setStep(4);
      return;
    }

    setLoading(true);
    setError("");
    const res = await api<{ anonymousId: string }>("/api/victims/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
        email: form.email,
        password: form.password,
        nationalIdNumber: form.fanNumber,
        address: form.address,
        regionId: form.regionId,
        cityId: form.cityId || undefined,
        // Save the challenge details for audit/vault verification check
        idAmharicName: form.idAmharicName,
        idIssueDate: form.idIssueDate,
        idWoreda: form.idWoreda,
      }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Registration failed");
      return;
    }
    router.push("/login?registered=true");
  }

  const selectedRegion = regions.find((r) => r.id === form.regionId);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", display: "flex", flexDirection: "column" }}>
      {/* Nav Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width={18} height={18} stroke="white" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0d1117" }}>SafeHer</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Language toggle button */}
          <button
            onClick={toggleLanguage}
            style={{
              background: "none",
              border: "1px solid var(--blue-border)",
              borderRadius: "20px",
              padding: "4px 12px",
              color: "var(--blue)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            🌐 {lang === "en" ? "አማርኛ" : "English"}
          </button>

          <Link href="/login" style={{ fontSize: "0.875rem", color: "#6b7280", textDecoration: "none" }}>
            {t.alreadyHave} <span style={{ color: "var(--blue)", fontWeight: 600 }}>{t.signIn}</span>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: 600 }} className="animate-fade-up">
          {/* Progress Steps Indicator */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "0.75rem" }}>
              {t.steps.map((label, i) => {
                const s = i + 1;
                const active = step === s;
                const done = step > s;
                return (
                  <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {/* Connector line */}
                    {i < t.steps.length - 1 && (
                      <div style={{ position: "absolute", top: 14, left: "50%", right: "-50%", height: 2, background: done ? "var(--blue)" : "#e5e7eb", zIndex: 0 }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 700, zIndex: 1, position: "relative",
                      background: done ? "var(--blue)" : active ? "var(--blue)" : "#fff",
                      border: done || active ? "none" : "2px solid #d1d5db",
                      color: done || active ? "#fff" : "#9ca3af",
                    }}>
                      {done ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      ) : s}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400, color: active ? "var(--blue)" : done ? "#374151" : "#9ca3af", marginTop: "0.35rem", textAlign: "center", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Card */}
          <div className="glass-elevated" style={{ borderRadius: 20, padding: "2.5rem", background: "#ffffff" }}>

            {/* ── Step 1: Phone + FAN number ───────────────────────── */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: "2rem" }}>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d1117", marginBottom: "0.5rem" }}>
                    {t.step1.title}
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {t.step1.desc}
                  </p>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                    {t.step1.phoneLabel}
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.9rem", color: "#374151", flexShrink: 0 }}>
                      🇪🇹 +251
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder={t.step1.phonePlaceholder}
                      className="input-field"
                      style={{ borderRadius: 10 }}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.4rem" }}>{t.step1.phoneHelp}</p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                    {t.step1.fanLabel}
                  </label>
                  <input
                    type="text"
                    value={form.fanNumber}
                    onChange={(e) => update("fanNumber", e.target.value)}
                    placeholder={t.step1.fanPlaceholder}
                    className="input-field"
                    style={{ borderRadius: 10, fontWeight: 600, letterSpacing: "0.02em" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.4rem" }}>{t.step1.fanHelp}</p>
                </div>

                {error && <div style={{ marginBottom: "1rem" }}><ErrorBox msg={error} /></div>}

                <button onClick={sendOtp} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", borderRadius: 12, marginTop: "1rem" }}>
                  {loading ? "..." : t.step1.btnSend}
                </button>

                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f0f7ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
                  <p style={{ fontSize: "0.8rem", color: "#1d4ed8", lineHeight: 1.6 }}>
                    {t.step1.disclaimer}
                  </p>
                </div>
              </>
            )}

            {/* ── Step 2: OTP Verification ─────────────────────────── */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: "2rem" }}>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d1117", marginBottom: "0.5rem" }}>
                    {t.step2.title}
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {t.step2.desc} <strong style={{ color: "#374151" }}>{form.phone}</strong>.
                  </p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
                    {t.step2.codeLabel}
                  </label>
                  <input
                    type="text"
                    value={form.otp}
                    onChange={(e) => update("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t.step2.codePlaceholder}
                    maxLength={6}
                    className="input-field"
                    style={{ textAlign: "center", fontSize: "2rem", letterSpacing: "0.4em", fontWeight: 700, borderRadius: 12, padding: "1rem" }}
                  />
                </div>

                {error && <div style={{ marginBottom: "1rem" }}><ErrorBox msg={error} /></div>}

                <button onClick={verifyOtp} disabled={loading || form.otp.length !== 6} className="btn-primary" style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", borderRadius: 12, marginBottom: "1rem" }}>
                  {loading ? "..." : t.step2.btnVerify}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "0.875rem", cursor: "pointer" }}>
                    {t.step2.changeNumber}
                  </button>
                  <button
                    onClick={sendOtp}
                    disabled={otpTimer > 0 || loading}
                    style={{ background: "none", border: "none", color: otpTimer > 0 ? "#9ca3af" : "var(--blue)", fontSize: "0.875rem", cursor: otpTimer > 0 ? "default" : "pointer", fontWeight: 600 }}
                  >
                    {otpTimer > 0 ? `${t.step2.resendIn} ${otpTimer}s` : t.step2.resendOtp}
                  </button>
                </div>

                <div style={{ marginTop: "1.5rem", padding: "0.75rem 1rem", background: "#fef3c7", borderRadius: 10, border: "1px solid #fcd34d" }}>
                  <p style={{ fontSize: "0.75rem", color: "#92400e" }}>
                    {t.step2.devMode}
                  </p>
                </div>
              </>
            )}

            {/* ── Step 3: National ID Details & Challenge ──────────── */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width={18} height={18} style={{ color: "#16a34a" }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>{t.step3.verified}</span>
                  </div>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d1117", marginBottom: "0.5rem" }}>
                    {t.step3.title}
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {t.step3.desc}
                  </p>
                </div>

                {/* Challenge Section */}
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                    🔒 National ID Verification Challenge
                  </p>
                  
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#1d4ed8", marginBottom: "0.25rem" }}>
                      {t.step3.amharicName}
                    </label>
                    <input
                      required
                      type="text"
                      value={form.idAmharicName}
                      onChange={(e) => update("idAmharicName", e.target.value)}
                      placeholder={t.step3.amharicNamePlaceholder}
                      className="input-field"
                      style={{ borderRadius: 8, borderColor: "#bfdbfe", padding: "0.5rem 0.75rem" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#1d4ed8", marginBottom: "0.25rem" }}>
                        {t.step3.issueDate}
                      </label>
                      <input
                        required
                        type="date"
                        value={form.idIssueDate}
                        onChange={(e) => update("idIssueDate", e.target.value)}
                        className="input-field"
                        style={{ borderRadius: 8, borderColor: "#bfdbfe", padding: "0.5rem 0.75rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#1d4ed8", marginBottom: "0.25rem" }}>
                        {t.step3.woreda}
                      </label>
                      <input
                        required
                        type="text"
                        value={form.idWoreda}
                        onChange={(e) => update("idWoreda", e.target.value)}
                        placeholder={t.step3.woredaPlaceholder}
                        className="input-field"
                        style={{ borderRadius: 8, borderColor: "#bfdbfe", padding: "0.5rem 0.75rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Primary registration profile data */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <InputField label={t.step3.firstName} value={form.firstName} onChange={(v) => update("firstName", v)} required />
                  <InputField label={t.step3.lastName} value={form.lastName} onChange={(v) => update("lastName", v)} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <InputField label={t.step3.dob} type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} required />
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                      {t.step3.gender}
                    </label>
                    <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="input-field" required>
                      <option value="FEMALE">{t.step3.genderOptions.female}</option>
                      <option value="MALE">{t.step3.genderOptions.male}</option>
                      <option value="OTHER">{t.step3.genderOptions.other}</option>
                      <option value="PREFER_NOT_TO_SAY">{t.step3.genderOptions.prefer}</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <InputField label={t.step3.address} value={form.address} onChange={(v) => update("address", v)} placeholder={t.step3.addressPlaceholder} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                      {t.step3.region}
                    </label>
                    <select required value={form.regionId} onChange={(e) => update("regionId", e.target.value)} className="input-field">
                      <option value="">{t.step3.selectRegion}</option>
                      {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  {selectedRegion && selectedRegion.cities.length > 0 && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                        {t.step3.city}
                      </label>
                      <select value={form.cityId} onChange={(e) => update("cityId", e.target.value)} className="input-field">
                        <option value="">{t.step3.selectCity}</option>
                        {selectedRegion.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {error && <div style={{ marginTop: "1rem" }}><ErrorBox msg={error} /></div>}

                <div style={{ display: "flex", gap: 10, marginTop: "2rem" }}>
                  <button type="button" onClick={() => setStep(2)} className="btn-ghost" style={{ flex: 1, padding: "0.875rem", borderRadius: 12 }}>
                    {t.step3.btnBack}
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: "0.875rem", borderRadius: 12, fontSize: "1rem" }}>
                    {t.step3.btnContinue}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 4: Account Credentials ──────────────────────── */}
            {step === 4 && (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "2rem" }}>
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d1117", marginBottom: "0.5rem" }}>
                    {t.step4.title}
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {t.step4.desc}
                  </p>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <InputField label={t.step4.email} type="email" value={form.email} onChange={(v) => update("email", v)} placeholder={t.step4.emailPlaceholder} required />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                    {t.step4.password}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder={t.step4.passwordPlaceholder}
                      minLength={8}
                      className="input-field"
                      style={{ paddingRight: "3rem" }}
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                {/* Summary Box */}
                <div style={{ padding: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", marginBottom: "0.5rem" }}>
                    {t.step4.summaryTitle}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem" }}>
                    {[
                      [t.step4.summaryKeys.phone, form.phone],
                      [t.step4.summaryKeys.fan, form.fanNumber],
                      [t.step4.summaryKeys.name, `${form.firstName} ${form.lastName}`],
                      [t.step4.summaryKeys.region, regions.find(r => r.id === form.regionId)?.name ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ fontSize: "0.8rem" }}>
                        <span style={{ color: "#6b7280" }}>{k}:</span>{" "}
                        <span style={{ color: "#166534", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <div style={{ marginTop: "1rem" }}><ErrorBox msg={error} /></div>}

                <div style={{ display: "flex", gap: 10, marginTop: "2rem" }}>
                  <button type="button" onClick={() => setStep(3)} className="btn-ghost" style={{ flex: 1, padding: "0.875rem", borderRadius: 12 }}>
                    {t.step4.btnBack}
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, padding: "0.875rem", borderRadius: 12, fontSize: "1rem" }}>
                    {loading ? "..." : t.step4.btnRegister}
                  </button>
                </div>

                <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "1.25rem", lineHeight: 1.6 }}>
                  {t.step4.disclaimer}
                </p>
              </form>
            )}
          </div>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            {t.alreadyHave}{" "}
            <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "0.75rem 1rem", color: "#dc2626", fontSize: "0.875rem" }}>
      <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} style={{ flexShrink: 0 }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {msg}
    </div>
  );
}
