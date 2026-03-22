"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import { createProfile } from "@/lib/db/users";
import { useUserStore } from "@/store/userStore";

const LOGO_B64 = "data:image/png;base64,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";

const HUD_CSS = `
  @keyframes scanScroll{from{background-position:0 0}to{background-position:0 80px}}
  @keyframes lglow{0%,100%{filter:brightness(1.1) drop-shadow(0 0 8px rgba(0,255,136,.4))}50%{filter:brightness(1.3) drop-shadow(0 0 18px rgba(0,255,136,.75))}}
  @keyframes bp{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .sig-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:middle;animation:bp 2s ease-in-out infinite}
  .hud-in{width:100%;background:rgba(0,255,136,.03);border:1px solid rgba(0,255,136,.14);color:#C0FFD8;font-family:monospace;font-size:11px;letter-spacing:1px;padding:9px 12px 9px 24px;outline:none;transition:all .25s;cursor:crosshair}
  .hud-in:focus{border-color:#00FF88;background:rgba(0,255,136,.06);box-shadow:0 0 14px rgba(0,255,136,.1)}
  .hud-in::placeholder{color:rgba(0,255,136,.22)}
  .hud-sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300AA55'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-left:12px !important}
  .hud-btn{width:100%;padding:13px;background:#00FF88;border:none;color:#000;font-family:monospace;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:crosshair;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px}
  .hud-btn:hover:not(:disabled){background:#39FF14;box-shadow:0 0 30px rgba(0,255,136,.5)}
  .hud-btn:disabled{opacity:.5;cursor:not-allowed}
  .str-bar{flex:1;height:2px;background:rgba(0,255,136,.1);transition:background .3s}
  .str-bar.s1{background:#FF4444;box-shadow:0 0 4px #FF4444}
  .str-bar.s2{background:#FF8800;box-shadow:0 0 4px #FF8800}
  .str-bar.s3{background:#FFD700;box-shadow:0 0 4px #FFD700}
  .str-bar.s4{background:#00FF88;box-shadow:0 0 4px #00FF88}
  *{cursor:crosshair}
`;

type Checks = { c1: boolean; c2: boolean; c3: boolean; c4: boolean; c5: boolean };
type FD = { name: string; uid: string; email: string; pass: string; pass2: string };

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [clock, setClock] = useState("00:00:00 UTC");
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState<Checks>({ c1: false, c2: false, c3: false, c4: false, c5: false });
  const [fd, setFd] = useState<FD>({ name: "", uid: "", email: "", pass: "", pass2: "" });

  const triggerError = (msg: string) => { setError(msg); setIsErrorShake(true); setTimeout(() => setIsErrorShake(false), 500); };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const calcStrength = (v: string) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  };

  const updateFd = (patch: Partial<FD>) => {
    const d = { ...fd, ...patch };
    setFd(d);
    setChecks({
      c1: d.name.length > 0,
      c2: /^WG-[A-Z0-9]{3}-[A-Z0-9]{3}$/i.test(d.uid),
      c3: validateEmail(d.email),
      c4: d.pass.length >= 8,
      c5: d.pass === d.pass2 && d.pass.length > 0,
    });
    setStrength(calcStrength(d.pass));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!email || !password || !confirmPassword) { triggerError("Lütfen tüm alanları doldurun."); return; }
    if (!validateEmail(email)) { triggerError("Geçerli bir e-posta adresi girin."); return; }
    if (password.length < 8) { triggerError("Şifre en az 8 karakter olmalıdır."); return; }
    if (password !== confirmPassword) { triggerError("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    const { data, error: signUpError } = await signUp(email, password);
    if (signUpError) { triggerError(signUpError); setLoading(false); return; }
    if (data?.user) {
      setUser(data.user); setIsSuccess(true);
      const { error: profileError } = await createProfile(data.user.id);
      if (profileError) console.error("Profil oluşturulamadı:", profileError);
      setTimeout(() => router.push("/dashboard"), 600);
    } else { setLoading(false); }
  };

  useEffect(() => {
    document.body.style.background = "#030A06";
    document.body.style.backgroundImage = "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,.012) 3px,rgba(0,255,136,.012) 4px),linear-gradient(rgba(0,255,136,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,.02) 1px,transparent 1px)";
    document.body.style.backgroundSize = "auto,44px 44px,44px 44px";
    const p = (v: number) => String(v).padStart(2, "0");
    const tick = () => { const n = new Date(); setClock(p(n.getUTCHours()) + ":" + p(n.getUTCMinutes()) + ":" + p(n.getUTCSeconds()) + " UTC"); };
    const t = setInterval(tick, 1000); tick();
    const cols = ["rgba(0,255,136,.85)", "rgba(0,255,136,.45)", "rgba(0,255,136,.2)"];
    const dots = cols.map((c, i) => { const d = document.createElement("div"); const s = 6 - i * 1.5; d.style.cssText = `position:fixed;width:${s}px;height:${s}px;background:${c};border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:left ${.04 + i * .045}s,top ${.04 + i * .045}s`; document.body.appendChild(d); return d; });
    const move = (e: MouseEvent) => dots.forEach(d => { d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; });
    document.addEventListener("mousemove", move);
    return () => { clearInterval(t); document.removeEventListener("mousemove", move); dots.forEach(d => d.remove()); document.body.style.cssText = ""; };
  }, []);

  const strLabels = ["", "ZAYIF — Büyük harf ve rakam ekle", "ORTA — Özel karakter ekle", "GÜÇLİ — İyi seviye", "ÇOK GÜÇLİ — Mükemmel"];
  const checkList = [
    { id: "c1", label: "BİRİM / İSİM GİRİŞİ ONAYLANADI" },
    { id: "c2", label: "ID FORMATI DOĞRULAMASI (WG-XXX-YYY)" },
    { id: "c3", label: "E-POSTA KANAL TESTİ" },
    { id: "c4", label: "ANAHTAR GÜÇ DOĞRULAMASI (min 8)" },
    { id: "c5", label: "ANAHTAR EŞLEŞMESİ KONTROLÜ" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#030A06", fontFamily: "monospace" }}>
      <style dangerouslySetInnerHTML={{ __html: HUD_CSS }} />
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,.01) 3px,rgba(0,255,136,.01) 4px)", pointerEvents: "none", zIndex: 9000, animation: "scanScroll 6s linear infinite" }} />

      {/* NAVBAR */}
      <nav style={{ position: "relative", zIndex: 100, height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderBottom: "1px solid rgba(0,255,136,.15)", background: "rgba(3,10,6,.9)", backdropFilter: "blur(16px)", flexShrink: 0 }}>
        <Link href="/"><img src={LOGO_B64} alt="WatcherG" style={{ height: "32px", animation: "lglow 4s ease-in-out infinite" }} /></Link>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "9px", letterSpacing: "2px", color: "#4A8862" }}>
          <span><span className="sig-dot" style={{ background: "#00FF88", boxShadow: "0 0 6px #00FF88" }} />SIGNAL_ACTIVE</span>
          <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#00FF88", letterSpacing: "2px", padding: "5px 14px", border: "1px solid rgba(0,255,136,.2)" }}>{clock}</div>
        </div>
        <Link href="/auth/login" style={{ color: "#00FF88", textDecoration: "none", fontSize: "10px", letterSpacing: "2px", padding: "6px 16px", border: "1px solid rgba(0,255,136,.2)" }}>GİRİŞ</Link>
      </nav>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 60px", position: "relative", zIndex: 10 }}>
        {/* sayfa başlığı */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#4A8862", marginBottom: "8px" }}>{"// YENİ OPERATÖR KAYDI"}</div>
          <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "#00FF88", letterSpacing: "5px", textShadow: "0 0 20px rgba(0,255,136,.4)" }}>PERSONEL KAYIT TERMİNALİ</div>
          <div style={{ fontSize: "8px", letterSpacing: "3px", color: "#4A8862", marginTop: "6px" }}>SECURE_DATA_ENTRY_PROTOCOL_V2.4</div>
        </div>

        <div style={{ width: "100%", maxWidth: "960px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "14px" }}>

          {/* ── SOL: FORM ── */}
          <div style={{ border: "1px solid rgba(0,255,136,.15)", background: "rgba(3,10,6,.92)", backdropFilter: "blur(16px)", position: "relative", animation: "cardIn .6s ease forwards" }}
            className={isErrorShake ? "animate-error-glow" : isSuccess ? "animate-success-flash" : ""}>
            <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "2px solid #00FF88", borderLeft: "2px solid #00FF88" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "2px solid #00FF88", borderRight: "2px solid #00FF88" }} />
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,255,136,.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,255,136,.03)", fontSize: "11px", letterSpacing: "3px", color: "#C0FFD8" }}>
              <span>◈ KİMLİK BİLGİLERİ</span>
              <span style={{ fontSize: "8px", padding: "3px 10px", border: "1px solid rgba(255,68,68,.4)", color: "#FF4444", letterSpacing: "2px" }}>ZORUNLU ALANLAR</span>
            </div>

            {error && <div style={{ margin: "16px 20px 0", padding: "10px 14px", background: "rgba(255,68,68,.08)", border: "1px solid rgba(255,68,68,.3)", color: "#FF4444", fontSize: "9px", letterSpacing: "2px" }}>⚠ {error}</div>}

            <form onSubmit={handleRegister} style={{ padding: "20px" }}>
              {/* isim + id */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}><span>TAM İSİM</span><span style={{ color: "#FF4444" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                    <input className="hud-in" type="text" placeholder="OPERATÖR İSMİ" disabled={loading}
                      onChange={e => updateFd({ name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}><span>ATANMIŞ ID</span><span style={{ color: "#FF4444" }}>*</span></div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                    <input className="hud-in" type="text" placeholder="WG-XXX-YYY" maxLength={12} disabled={loading}
                      onChange={e => updateFd({ uid: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* email */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}><span>GÜVENLİ İLETİŞİM KANALI [E-POSTA]</span><span style={{ color: "#FF4444" }}>*</span></div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                  <input className="hud-in" type="email" value={email} placeholder="operatör@watcherg.net" disabled={loading}
                    onChange={e => { setEmail(e.target.value); updateFd({ email: e.target.value }); }} />
                </div>
              </div>

              {/* şifre */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}><span>ERİŞİM ANAHTARI [ŞİFRE]</span><span style={{ color: "#FF4444" }}>*</span></div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                  <input className="hud-in" type="password" value={password} placeholder="············" disabled={loading}
                    onChange={e => { setPassword(e.target.value); updateFd({ pass: e.target.value }); }} />
                </div>
                <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
                  {[0, 1, 2, 3].map(i => <div key={i} className={`str-bar${strength > i ? " s" + strength : ""}`} />)}
                </div>
                {strength > 0 && <div style={{ fontSize: "8px", letterSpacing: "1.5px", color: "#4A8862", marginTop: "3px" }}>{strLabels[strength]}</div>}
              </div>

              {/* şifre tekrar */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}><span>ANAHTAR DOĞRULAMA [TEKRAR]</span><span style={{ color: "#FF4444" }}>*</span></div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                  <input className="hud-in" type="password" value={confirmPassword} placeholder="············" disabled={loading}
                    onChange={e => { setConfirmPassword(e.target.value); updateFd({ pass2: e.target.value }); }} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="hud-btn">
                {loading ? "KAYIT İŞLENİYOR..." : "KAYIT OL VE SİSTEME BAĞLAN ⚡"}
              </button>

              <div style={{ marginTop: "12px", fontSize: "8px", letterSpacing: "1px", color: "#4A8862", lineHeight: 1.6, padding: "10px", border: "1px solid rgba(0,255,136,.07)", background: "rgba(0,0,0,.2)" }}>
                Kayıt olarak <Link href="#" style={{ color: "#00FF88" }}>WATCHERG GİZLİLİK PROTOKOLLERİNİ</Link> ve{" "}
                <Link href="#" style={{ color: "#00FF88" }}>HİZMET SÖZLEŞMESİNİ</Link> kabul etmiş sayılırsınız.
              </div>
            </form>
          </div>

          {/* ── SAĞ: DOĞRULAMA PANELLERİ ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Protokol Doğrulama */}
            <div style={{ border: "1px solid rgba(0,255,136,.15)", background: "rgba(3,10,6,.92)", backdropFilter: "blur(16px)", animation: "cardIn .6s ease .1s forwards", opacity: 0 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(0,255,136,.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,255,136,.03)", fontSize: "10px", letterSpacing: "3px", color: "#C0FFD8" }}>
                <span>◈ PROTOKOL DOĞRULAMA</span>
                <span style={{ fontSize: "8px", padding: "2px 8px", border: "1px solid rgba(0,255,136,.3)", color: "#00FF88", letterSpacing: "2px" }}>AUTO_CHECK</span>
              </div>
              <div style={{ padding: "16px" }}>
                {checkList.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: "10px", marginBottom: "10px", fontSize: "9px", letterSpacing: "1.5px", color: checks[c.id as keyof Checks] ? "#00FF88" : "#4A8862", transition: "color .3s", alignItems: "flex-start" }}>
                    <div style={{ width: "12px", height: "12px", border: `1px solid ${checks[c.id as keyof Checks] ? "#00FF88" : "rgba(0,255,136,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#00FF88", flexShrink: 0, marginTop: "1px", background: checks[c.id as keyof Checks] ? "rgba(0,255,136,.15)" : "transparent", transition: "all .3s" }}>
                      {checks[c.id as keyof Checks] ? "✓" : ""}
                    </div>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anahtar Gücü */}
            <div style={{ border: "1px solid rgba(0,255,136,.15)", background: "rgba(3,10,6,.92)", animation: "cardIn .6s ease .2s forwards", opacity: 0 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(0,255,136,.1)", display: "flex", justifyContent: "space-between", fontSize: "10px", letterSpacing: "3px", color: "#C0FFD8", background: "rgba(0,255,136,.03)" }}>
                <span>◈ ANAHTAR GÜCÜ</span>
                <span style={{ fontSize: "8px", color: strength >= 3 ? "#00FF88" : "#FF8800", letterSpacing: "2px" }}>
                  {["AWAITING_INPUT", "WEAK", "MODERATE", "STRONG", "EXCELLENT"][strength]}
                </span>
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", letterSpacing: "2px", color: "#4A8862", marginBottom: "5px" }}>
                  <span>ENTROPİ SEVİYESİ</span><span style={{ color: "#00FF88" }}>{strength * 25}%</span>
                </div>
                <div style={{ height: "3px", background: "rgba(0,255,136,.08)", marginBottom: "10px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${strength * 25}%`, background: "linear-gradient(90deg,#00AA55,#00FF88)", boxShadow: "0 0 6px #00FF88", transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: "8px", letterSpacing: "1px", color: "rgba(0,255,136,.4)", lineHeight: 1.7 }}>
                  {strength === 0 ? "SİSTEM_HAZIR // VERİ GİRİŞİ BEKLENİYOR" : strLabels[strength]}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div style={{ marginTop: "16px", fontSize: "9px", letterSpacing: "2px", color: "#4A8862" }}>
          Zaten hesabın var mı?{" "}<Link href="/auth/login" style={{ color: "#00FF88", textDecoration: "none" }}>GİRİŞ YAP</Link>
        </div>
      </main>

      <div style={{ height: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderTop: "1px solid rgba(0,255,136,.12)", background: "rgba(3,10,6,.95)", fontSize: "8px", letterSpacing: "2px", color: "#4A8862", flexShrink: 0, position: "relative", zIndex: 100 }}>
        <div style={{ display: "flex", gap: "16px" }}><span><span className="sig-dot" style={{ background: "#00FF88" }} />TERM_STATUS: ONLINE</span><span>NODE: TR-IST-01</span></div>
        <div style={{ display: "flex", gap: "16px" }}><span>SEC_LEVEL: CLASSIFIED</span><span style={{ color: "#00FF88" }}>V 2.0.4</span></div>
      </div>
    </div>
  );
}
