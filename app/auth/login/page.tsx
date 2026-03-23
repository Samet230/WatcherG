"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";

const LOGO_B64 = "data:image/png;base64,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";

const HUD_CSS = `
  @keyframes scanScroll{from{background-position:0 0}to{background-position:0 80px}}
  @keyframes lglow{0%,100%{filter:brightness(1.1) drop-shadow(0 0 8px rgba(0,255,136,.4))}50%{filter:brightness(1.3) drop-shadow(0 0 18px rgba(0,255,136,.75))}}
  @keyframes bp{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rotateRing{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes rotateRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
  @keyframes pupilPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
  @keyframes blinkT{0%,88%,100%{transform:translateY(0)}92%{transform:translateY(14px)}96%{transform:translateY(0)}}
  @keyframes blinkB{0%,88%,100%{transform:translateY(0)}92%{transform:translateY(-14px)}96%{transform:translateY(0)}}
  .eye-outer{animation:rotateRing 12s linear infinite;transform-origin:60px 60px}
  .eye-mid{animation:rotateRev 8s linear infinite;transform-origin:60px 60px}
  .eye-inner{animation:rotateRing 5s linear infinite;transform-origin:60px 60px}
  .eye-lid-t{animation:blinkT 4s ease-in-out infinite}
  .eye-lid-b{animation:blinkB 4s ease-in-out infinite}
  .eye-pupil{animation:pupilPulse 2.5s ease-in-out infinite;transform-origin:60px 60px}
  .sig-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:middle;animation:bp 2s ease-in-out infinite}
  .hud-in{width:100%;background:rgba(0,255,136,.03);border:1px solid rgba(0,255,136,.14);color:#C0FFD8;font-family:monospace;font-size:11px;letter-spacing:1px;padding:10px 12px 10px 26px;outline:none;transition:all .25s;cursor:crosshair}
  .hud-in:focus{border-color:#00FF88;background:rgba(0,255,136,.06);box-shadow:0 0 14px rgba(0,255,136,.1)}
  .hud-in::placeholder{color:rgba(0,255,136,.22)}
  .hud-btn{width:100%;padding:13px;background:#00FF88;border:none;color:#000;font-family:monospace;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;cursor:crosshair;transition:all .25s;margin-top:8px}
  .hud-btn:hover:not(:disabled){background:#39FF14;box-shadow:0 0 30px rgba(0,255,136,.5)}
  .hud-btn:disabled{opacity:.5;cursor:not-allowed}
  *{cursor:crosshair}
`;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [clock, setClock] = useState("00:00:00 UTC");

  const triggerError = (msg: string) => {
    setError(msg);
    setIsErrorShake(true);
    setTimeout(() => setIsErrorShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { triggerError("Lütfen e-posta ve şifrenizi girin."); return; }
    setLoading(true);
    const { data, error: signInError } = await signIn(email, password);
    if (signInError) { triggerError("E-posta veya şifre hatalı."); setLoading(false); return; }
    if (data?.user) {
      setUser(data.user); setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 600);
    } else { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) { triggerError("Google ile giriş yapılamadı."); setLoading(false); }
  };

  useEffect(() => {
    document.body.style.background = "#030A06";
    document.body.style.backgroundImage = "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,.012) 3px,rgba(0,255,136,.012) 4px),linear-gradient(rgba(0,255,136,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,.02) 1px,transparent 1px)";
    document.body.style.backgroundSize = "auto,44px 44px,44px 44px";

    const p = (v: number) => String(v).padStart(2, "0");
    const tick = () => { const n = new Date(); setClock(p(n.getUTCHours()) + ":" + p(n.getUTCMinutes()) + ":" + p(n.getUTCSeconds()) + " UTC"); };
    const t = setInterval(tick, 1000); tick();

    const cols = ["rgba(0,255,136,.85)", "rgba(0,255,136,.45)", "rgba(0,255,136,.2)"];
    const dots = cols.map((c, i) => {
      const d = document.createElement("div"); const s = 6 - i * 1.5;
      d.style.cssText = `position:fixed;width:${s}px;height:${s}px;background:${c};border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:left ${.04 + i * .045}s,top ${.04 + i * .045}s`;
      document.body.appendChild(d); return d;
    });
    const move = (e: MouseEvent) => dots.forEach(d => { d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; });
    document.addEventListener("mousemove", move);
    return () => { clearInterval(t); document.removeEventListener("mousemove", move); dots.forEach(d => d.remove()); document.body.style.cssText = ""; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#030A06", fontFamily: "monospace" }}>
      <style dangerouslySetInnerHTML={{ __html: HUD_CSS }} />

      {/* scan line overlay */}
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,.01) 3px,rgba(0,255,136,.01) 4px)", pointerEvents: "none", zIndex: 9000, animation: "scanScroll 6s linear infinite" }} />

      {/* NAVBAR */}
      <nav className="relative z-[100] h-14 flex items-center justify-between px-4 md:px-10 border-b border-[#00FFF1]/15 bg-[#030A06]/90 backdrop-blur-md shrink-0">
        <Link href="/"><img src={LOGO_B64} alt="WatcherG" style={{ height: "32px", animation: "lglow 4s ease-in-out infinite" }} /></Link>
        <div className="flex gap-2 md:gap-5 items-center text-[9px] tracking-[2px] text-[#4A8862]">
          <span className="hidden md:inline"><span className="sig-dot" style={{ background: "#00FF88", boxShadow: "0 0 6px #00FF88" }} />SIGNAL_ACTIVE</span>
          <span className="hidden md:inline"><span className="sig-dot" style={{ background: "#00FF88", boxShadow: "0 0 6px #00FF88" }} />ENCRYPTED</span>
          <div className="font-mono text-[10px] md:text-[13px] text-[#00FF88] tracking-[2px] px-2 py-1 md:px-3 md:py-1.5 border border-[#00FFF1]/20">{clock}</div>
        </div>
        <Link href="/auth/register" className="text-[#00FF88] no-underline text-[9px] md:text-[10px] tracking-[2px] px-2 py-1 md:px-4 md:py-1.5 border border-[#00FFF1]/20">KAYIT OL</Link>
      </nav>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 md:p-8 relative z-10">
        <div style={{ width: "100%", maxWidth: "480px", border: "1px solid rgba(0,255,136,.15)", background: "rgba(3,10,6,.92)", backdropFilter: "blur(20px)", animation: "cardIn .6s ease forwards", position: "relative" }}
          className={isErrorShake ? "animate-error-glow" : isSuccess ? "animate-success-flash" : ""}>

          {/* bracket corners */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: "2px solid #00FF88", borderLeft: "2px solid #00FF88" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: "2px solid #00FF88", borderRight: "2px solid #00FF88" }} />

          {/* card header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,255,136,.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,255,136,.03)", fontSize: "8px", letterSpacing: "2px", color: "#4A8862" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <span><span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#00FF88", marginRight: "4px" }} />NODE_LD: <span style={{ color: "#00FF88" }}>STABLE</span></span>
              <span><span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#FF8800", marginRight: "4px" }} />NET_TX: <span style={{ color: "#FF8800" }}>OPTIMAL</span></span>
            </div>
            <span>SECURE_LINK</span>
          </div>

          <div style={{ padding: "32px 28px" }}>
            {/* MEKANİK GÖZ */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <svg width="110" height="110" viewBox="0 0 120 120" fill="none">
                <defs>
                  <filter id="gL2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <filter id="gS2"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <circle cx="60" cy="60" r="52" stroke="rgba(0,255,136,0.07)" strokeWidth="18" fill="none" />
                <g className="eye-outer">
                  <circle cx="60" cy="60" r="52" stroke="rgba(0,255,136,0.18)" strokeWidth="1" fill="none" />
                  <line x1="60" y1="8" x2="60" y2="16" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" />
                  <line x1="60" y1="104" x2="60" y2="112" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" />
                  <line x1="8" y1="60" x2="16" y2="60" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" />
                  <line x1="104" y1="60" x2="112" y2="60" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" />
                  <circle cx="60" cy="8" r="2" fill="#00FF88" filter="url(#gL2)" />
                  <circle cx="60" cy="112" r="2" fill="#00FF88" filter="url(#gL2)" />
                  <circle cx="8" cy="60" r="2" fill="#00FF88" filter="url(#gL2)" />
                  <circle cx="112" cy="60" r="2" fill="#00FF88" filter="url(#gL2)" />
                </g>
                <g className="eye-mid">
                  <circle cx="60" cy="60" r="40" stroke="rgba(0,255,136,0.25)" strokeWidth="1" strokeDasharray="6 3" fill="none" />
                  <rect x="58.5" y="20" width="3" height="6" fill="rgba(0,255,136,0.5)" rx="1" />
                  <rect x="58.5" y="94" width="3" height="6" fill="rgba(0,255,136,0.5)" rx="1" />
                  <rect x="20" y="58.5" width="6" height="3" fill="rgba(0,255,136,0.5)" rx="1" />
                  <rect x="94" y="58.5" width="6" height="3" fill="rgba(0,255,136,0.5)" rx="1" />
                </g>
                <g filter="url(#gL2)">
                  <g className="eye-lid-t"><path d="M18 60 Q60 20 102 60" stroke="#00FF88" strokeWidth="1.5" fill="none" opacity="0.7" /></g>
                  <g className="eye-lid-b"><path d="M18 60 Q60 100 102 60" stroke="#00FF88" strokeWidth="1.5" fill="none" opacity="0.7" /></g>
                </g>
                <g className="eye-inner">
                  <circle cx="60" cy="60" r="22" stroke="rgba(0,255,136,0.4)" strokeWidth="1.5" fill="none" />
                  <line x1="60" y1="38" x2="60" y2="43" stroke="rgba(0,255,136,0.6)" strokeWidth="1.5" />
                  <line x1="60" y1="77" x2="60" y2="82" stroke="rgba(0,255,136,0.6)" strokeWidth="1.5" />
                  <line x1="38" y1="60" x2="43" y2="60" stroke="rgba(0,255,136,0.6)" strokeWidth="1.5" />
                  <line x1="77" y1="60" x2="82" y2="60" stroke="rgba(0,255,136,0.6)" strokeWidth="1.5" />
                </g>
                <line x1="60" y1="4" x2="60" y2="32" stroke="rgba(0,255,136,0.3)" strokeWidth="1" />
                <line x1="60" y1="88" x2="60" y2="116" stroke="rgba(0,255,136,0.3)" strokeWidth="1" />
                <line x1="4" y1="60" x2="32" y2="60" stroke="rgba(0,255,136,0.3)" strokeWidth="1" />
                <line x1="88" y1="60" x2="116" y2="60" stroke="rgba(0,255,136,0.3)" strokeWidth="1" />
                <g className="eye-pupil" filter="url(#gS2)">
                  <circle cx="60" cy="60" r="10" fill="rgba(0,255,136,0.1)" stroke="#00FF88" strokeWidth="1.5" />
                  <circle cx="60" cy="60" r="5" fill="rgba(0,255,136,0.3)" stroke="#00FF88" strokeWidth="1" />
                  <circle cx="60" cy="60" r="2.5" fill="#00FF88" />
                </g>
                <circle cx="60" cy="60" r="10" stroke="#00FF88" strokeWidth="1" fill="none" opacity="0">
                  <animate attributeName="r" values="10;28;10" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="60" cy="60" r="10" stroke="#00FF88" strokeWidth="0.5" fill="none" opacity="0">
                  <animate attributeName="r" values="10;42;10" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* başlık */}
            <div className="text-center mb-5">
              <div className="font-mono text-base md:text-xl font-bold text-[#00FF88] tracking-[3px] md:tracking-[4px]" style={{ textShadow: "0 0 20px rgba(0,255,136,0.4)" }}>SİSTEM GİRİŞİ</div>
              <div className="text-[8px] md:text-[9px] tracking-[2px] md:tracking-[3px] text-[#4A8862] mt-1">SECURE_AUTHENTICATION_PROTOCOL_V2.4</div>
            </div>

            {/* error */}
            {error && <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(255,68,68,.08)", border: "1px solid rgba(255,68,68,.3)", color: "#FF4444", fontSize: "9px", letterSpacing: "2px" }}>⚠ {error}</div>}

            {/* FORM — orijinal handler'lar aynen */}
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}>
                  <span>GÜVENLİ İLETİŞİM KANALI [E-POSTA]</span><span style={{ color: "#FF4444" }}>*</span>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="hud-in" placeholder="operatör@watcherg.net" disabled={loading} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8px", letterSpacing: "2.5px", color: "#4A8862", marginBottom: "5px", display: "flex", justifyContent: "space-between" }}>
                  <span>ERİŞİM ANAHTARI [ŞİFRE]</span><span style={{ color: "#FF4444" }}>*</span>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#00AA55", fontSize: "11px", pointerEvents: "none" }}>&gt;</span>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="hud-in" placeholder="············" disabled={loading} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="hud-btn">
                {loading ? "BAĞLANIYOR..." : "SİSTEME BAĞLAN →"}
              </button>
            </form>

            {/* divider + google */}
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(0,255,136,.1)" }} /><span style={{ fontSize: "8px", letterSpacing: "3px", color: "#4A8862" }}>VEYA</span><div style={{ flex: 1, height: "1px", background: "rgba(0,255,136,.1)" }} />
            </div>
            <button onClick={handleGoogleLogin} disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "transparent", border: "1px solid rgba(0,255,136,.15)", color: "#C0FFD8", fontFamily: "monospace", fontSize: "10px", letterSpacing: "2px", padding: "10px", cursor: "crosshair", transition: "all .25s" }}>
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              GOOGLE İLE GİRİŞ YAP
            </button>

            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "9px", letterSpacing: "2px", color: "#4A8862" }}>
              Hesabın yok mu?{" "}<Link href="/auth/register" style={{ color: "#00FF88", textDecoration: "none" }}>KAYIT OL</Link>
            </div>
          </div>

          <div style={{ padding: "8px 20px", borderTop: "1px solid rgba(0,255,136,.08)", display: "flex", justifyContent: "space-between", fontSize: "8px", letterSpacing: "1.5px", color: "#4A8862" }}>
            <span>ENCRYPTION: QUANTUM_RSA</span><span>SEC_LEVEL: CLASSIFIED</span>
          </div>
        </div>
      </main>

      {/* BOTTOM BAR */}
      <div style={{ height: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderTop: "1px solid rgba(0,255,136,.12)", background: "rgba(3,10,6,.95)", fontSize: "8px", letterSpacing: "2px", color: "#4A8862", flexShrink: 0, position: "relative", zIndex: 100 }}>
        <div style={{ display: "flex", gap: "16px" }}><span><span className="sig-dot" style={{ background: "#00FF88" }} />TERM_STATUS: ONLINE</span><span>NODE: TR-IST-01</span></div>
        <div style={{ display: "flex", gap: "16px" }}><span>SEC_LEVEL: CLASSIFIED</span><span style={{ color: "#00FF88" }}>V 2.0.4</span></div>
      </div>
    </div>
  );
}
