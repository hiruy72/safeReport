"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setTokens, setStoredUser } from "@/lib/api";

const TRANSLATIONS = {
  en: {
    welcomeBack: "Welcome back",
    twoFactor: "Two-factor authentication",
    twoFactorDesc: "Enter the 6-digit code from your authenticator app.",
    signInDesc: "Sign in to your secure account to continue.",
    accountCreated: "Account created! Sign in to access your dashboard.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    authCodeLabel: "Authentication code",
    btnSignIn: "Sign In",
    btnSigningIn: "Signing in...",
    btnVerify: "Verify Code",
    btnVerifying: "Verifying...",
    newHere: "New here?",
    createAccount: "Create an account",
    lawEnforcement: "Law enforcement?",
    officerRegistration: "Officer registration",
    leftTitle: "Your identity is",
    leftTitleAccent: "always protected.",
    leftFeats: [
      "Anonymous case ID — your name is never shared",
      "AES-256 encrypted evidence storage",
      "Automatically routed to your local station",
      "Anonymous chat with your investigator"
    ]
  },
  am: {
    welcomeBack: "እንኳን ደህና መጡ",
    twoFactor: "ባለሁለት ደረጃ ማረጋገጫ",
    twoFactorDesc: "በአረጋጋጭ መተግበሪያዎ ላይ ያለውን ባለ 6-አሃዝ ኮድ ያስገቡ።",
    signInDesc: "ለመቀጠል በጥንቃቄ ወደ መለያዎ ይግቡ።",
    accountCreated: "አካውንትዎ ተፈጥሯል! ዳሽቦርድዎን ለመክፈት አሁን ይግቡ።",
    emailLabel: "የኢሜይል አድራሻ",
    passwordLabel: "የይለፍ ቃል",
    authCodeLabel: "የማረጋገጫ ኮድ",
    btnSignIn: "ይግቡ",
    btnSigningIn: "በመግባት ላይ...",
    btnVerify: "ኮዱን አረጋግጥ",
    btnVerifying: "በማረጋገጥ ላይ...",
    newHere: "አዲስ ነዎት?",
    createAccount: "አካውንት ይፍጠሩ",
    lawEnforcement: "የህግ አስከባሪ?",
    officerRegistration: "የፖሊስ ምዝገባ",
    leftTitle: "ማንነትዎ ሁልጊዜ",
    leftTitleAccent: "የተጠበቀ ነው።",
    leftFeats: [
      "ማንነትን የማይገልጽ የክስ መለያ ቁጥር — ስምዎ በፍፁም አይጋራም",
      "በAES-256 የተመሰጠረ የማስረጃ ማስቀመጫ",
      "በአቅራቢያዎ ወዳለው የፖሊስ ጣቢያ በቀጥታ የሚላክ",
      "ከመርማሪው ጋር ማንነት ሳይገለጽ በምስጢር መወያያ"
    ]
  }
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  
  const [lang, setLang] = useState<"en" | "am">("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load persisted language
    const savedLang = localStorage.getItem("safeher-lang");
    if (savedLang === "en" || savedLang === "am") {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "am" : "en";
    setLang(nextLang);
    localStorage.setItem("safeher-lang", nextLang);
  };

  const t = TRANSLATIONS[lang];

  async function handleLoginSuccess(user: { role: string; status: string }) {
    const { role, status } = user;
    if (role === "VICTIM") router.push("/victim/dashboard");
    else if (role === "POLICE") {
      if (status === "PENDING") router.push("/police/pending");
      else if (status === "ACTIVE") router.push("/police/dashboard");
      else setError(lang === "en" ? "Account inactive. Contact administrator." : "መለያዎ ገና አልነቃም። እባክዎ አስተዳዳሪውን ያነጋግሩ።");
    } else if (role === "ADMIN") router.push("/admin/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (requires2FA) {
      const res = await api<{
        accessToken: string;
        refreshToken: string;
        user: { role: string; status: string };
      }>("/api/auth/2fa/login", {
        method: "POST",
        body: JSON.stringify({ userId: pendingUserId, token: twoFactorToken }),
      });
      setLoading(false);
      if (!res.success || !res.data) {
        setError(res.error ?? (lang === "en" ? "Invalid 2FA code" : "የማረጋገጫ ኮዱ ልክ አይደለም"));
        return;
      }
      setTokens(res.data.accessToken, res.data.refreshToken);
      setStoredUser(res.data.user);
      handleLoginSuccess(res.data.user);
      return;
    }

    const res = await api<{
      requires2FA?: boolean;
      userId?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: { role: string; status: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error ?? (lang === "en" ? "Login failed" : "መግባት አልተቻለም፣ እባክዎ በትክክል ያስገቡ"));
      return;
    }

    if (res.data.requires2FA && res.data.userId) {
      setRequires2FA(true);
      setPendingUserId(res.data.userId);
      return;
    }

    if (res.data.accessToken && res.data.refreshToken && res.data.user) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setStoredUser(res.data.user);
      handleLoginSuccess(res.data.user);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8faff" }}>
      {/* ─── Left panel (branding — dark navy) ─── */}
      <div style={{ display: "none", flexDirection: "column", justifyContent: "space-between", width: "44%", padding: "3rem", position: "relative", overflow: "hidden", background: "#0d1117", borderRight: "1px solid #1f2937" }}
        className="hidden lg:flex"
      >
        {/* Grid bg */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "56px 56px", pointerEvents: "none" }} />
        {/* Blue glow */}
        <div style={{ position: "absolute", top: "30%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" width={18} height={18} stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>SafeHer</span>
          </Link>
        </div>

        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: "1.5rem" }}>
            {t.leftTitle}<br />
            <span style={{ color: "var(--blue)" }}>{t.leftTitleAccent}</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {t.leftFeats.map((feat, idx) => {
              const icons = ["🛡️", "🔐", "📍", "💬"];
              return (
                <div key={feat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "1.15rem" }}>{icons[idx]}</span>
                  <p style={{ fontSize: "0.875rem", color: "#9ca3af", fontWeight: 500 }}>{feat}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ position: "relative", fontSize: "0.75rem", color: "#4b5563" }}>
          © 2026 SafeHer. Confidential &amp; encrypted.
        </p>
      </div>

      {/* ─── Right panel (form) ─── */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8" style={{ background: "#ffffff" }}>
        
        {/* Language selector in top right */}
        <div style={{ alignSelf: "flex-end" }}>
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
        </div>

        <div className="w-full max-w-md animate-fade-up" style={{ margin: "auto 0" }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">SafeHer</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#0d1117" }}>
              {requires2FA ? t.twoFactor : t.welcomeBack}
            </h1>
            <p style={{ color: "var(--muted)" }}>
              {requires2FA ? t.twoFactorDesc : t.signInDesc}
            </p>
          </div>

          {registered && !requires2FA && (
            <div className="glass rounded-xl p-4 mb-6 text-sm border border-[var(--success)]/25 text-[var(--success)] flex items-start gap-2.5" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {t.accountCreated}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#374151]" style={{ fontWeight: 600 }}>
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#374151]" style={{ fontWeight: 600 }}>
                      {t.passwordLabel}
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pr-12"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[#0d1117] transition-colors"
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2 text-[#374151]" style={{ fontWeight: 600 }}>
                  {t.authCodeLabel}
                </label>
                <input
                  type="text"
                  required
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="input-field tracking-[0.4em] text-center text-xl font-mono"
                  placeholder="000 000"
                  maxLength={6}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 text-[var(--danger)] text-sm bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-xl px-4 py-3" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 text-base"
              style={{ borderRadius: 12 }}
            >
              {loading
                ? (requires2FA ? t.btnVerifying : t.btnSigningIn)
                : (requires2FA ? t.btnVerify : t.btnSignIn)}
            </button>
          </form>

          {!requires2FA && (
            <div className="mt-8 pt-6 border-t border-[var(--border)] text-sm text-center space-y-3">
              <p className="text-[var(--muted)]">
                {t.newHere}{" "}
                <Link href="/register" className="text-[var(--primary)] hover:underline font-medium" style={{ color: "var(--blue)" }}>
                  {t.createAccount}
                </Link>
              </p>
              <p className="text-[var(--muted)]">
                {t.lawEnforcement}{" "}
                <Link href="/register/police" className="text-[var(--primary)] hover:underline font-medium" style={{ color: "var(--blue)" }}>
                  {t.officerRegistration}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Small footer */}
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "2rem" }}>
          © 2026 SafeHer. Confidential &amp; encrypted.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
