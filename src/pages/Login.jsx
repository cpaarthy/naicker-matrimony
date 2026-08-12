import { useState } from "react";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";
import { resetPasswordWithSecurityAnswer, resetPasswordWithSecurityAnswerEmail } from "../data/queries";

export default function Login({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { loginWithEmailPassword, loginWithPhone } = useAuth();

  const [method, setMethod] = useState("email");
  const [step, setStep] = useState("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  async function handleEmailLogin() {
    setError("");
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    const { error } = await loginWithEmailPassword(email, password);
    setLoading(false);
    if (error) { setError("Incorrect email or password"); return; }
    showToast("Logged in successfully");
    onNavigate("dashboard");
  }

  async function handlePhoneLogin() {
    setError("");
    if (!phone || !password) { setError("Enter phone number and password"); return; }
    setLoading(true);
    const { error } = await loginWithPhone(phone, password);
    setLoading(false);
    if (error) { setError("Incorrect phone number or password"); return; }
    showToast("Logged in successfully");
    onNavigate("dashboard");
  }

  async function handleForgotPasswordSubmit() {
    setError("");
    if (!forgotIdentifier || !forgotAnswer || !forgotNewPassword) {
      setError("Fill all fields");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = method === "email"
      ? await resetPasswordWithSecurityAnswerEmail(forgotIdentifier, forgotAnswer, forgotNewPassword)
      : await resetPasswordWithSecurityAnswer(forgotIdentifier, forgotAnswer, forgotNewPassword);
    setLoading(false);
    if (error) { setError(error); return; }
    setStep("forgotSuccess");
  }

  if (step === "forgot") {
    return (
      <div>
        <button onClick={() => { setStep("form"); setError(""); }} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0, fontWeight: 600,
        }}>
          <ArrowLeft size={14} /> Back to login / திரும்பிச் செல்ல
        </button>

        <div style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 18,
          padding: 20, boxShadow: colors.shadow,
        }}>
        <h2 className="serif" style={{ fontSize: 19, marginBottom: 4, letterSpacing: -0.2 }}>Reset your password</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
          Enter your {method === "email" ? "email" : "phone number"} and answer your security question to set a new password.
          <br />உங்கள் {method === "email" ? "மின்னஞ்சல்" : "தொலைபேசி எண்"}ணையும் பாதுகாப்பு கேள்விக்கான பதிலையும் உள்ளிடவும்.
        </p>

        {method === "email" ? (
          <TextField label="Email address / மின்னஞ்சல்" type="email" value={forgotIdentifier} onChange={setForgotIdentifier} placeholder="you@example.com" required />
        ) : (
          <TextField label="Phone number / தொலைபேசி எண்" value={forgotIdentifier} onChange={setForgotIdentifier} placeholder="10-digit mobile number" required />
        )}
        <TextField label="Mother's name / தாயின் பெயர்" value={forgotAnswer} onChange={setForgotAnswer} placeholder="The answer you set when registering" required />
        <TextField label="New password / புதிய கடவுச்சொல்" type="password" value={forgotNewPassword} onChange={setForgotNewPassword} placeholder="At least 6 characters" required />

        {error && <ErrorBox colors={colors}>{error}</ErrorBox>}

        <PrimaryButton onClick={handleForgotPasswordSubmit} disabled={loading}>
          {loading ? "Resetting…" : "Reset password / மீட்டமைக்கவும்"}
        </PrimaryButton>
        </div>
      </div>
    );
  }

  if (step === "forgotSuccess") {
    return (
      <div style={{
        textAlign: "center", padding: "34px 20px", background: colors.card,
        border: `1px solid ${colors.cardBorder}`, borderRadius: 18, boxShadow: colors.shadow,
      }}>
        <h2 className="serif" style={{ fontSize: 18, marginBottom: 10, letterSpacing: -0.2 }}>Password reset successfully!</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
          You can now log in with your new password. / இப்போது புதிய கடவுச்சொல்லுடன் உள்நுழையலாம்.
        </p>
        <button onClick={() => {
          setStep("form");
          if (method === "email") setEmail(forgotIdentifier); else setPhone(forgotIdentifier);
          setPassword("");
        }} className="nkm-btn-primary" style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 10,
          padding: "11px 26px", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 14px rgba(74,21,36,0.22)",
        }}>Go to login / உள்நுழைய செல்லவும்</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 18,
        padding: 20, boxShadow: colors.shadow,
      }}>
      <h2 className="serif" style={{ fontSize: 20, marginBottom: 3, letterSpacing: -0.2 }}>Log in</h2>
      <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 18 }}>உள்நுழையவும்</div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: colors.bgSubtle, borderRadius: 11, padding: 4, border: `1px solid ${colors.cardBorder}` }}>
        <button onClick={() => { setMethod("email"); setStep("form"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
          background: method === "email" ? colors.primary : "transparent",
          color: method === "email" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: method === "email" ? "0 2px 6px rgba(74,21,36,0.2)" : "none",
          transition: "background 120ms ease",
        }}><Mail size={14} /> Email</button>
        <button onClick={() => { setMethod("phone"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
          background: method === "phone" ? colors.primary : "transparent",
          color: method === "phone" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: method === "phone" ? "0 2px 6px rgba(74,21,36,0.2)" : "none",
          transition: "background 120ms ease",
        }}><Phone size={14} /> Phone + password</button>
      </div>

      {method === "email" && (
        <>
          <TextField label="Email address / மின்னஞ்சல்" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          <TextField label="Password / கடவுச்சொல்" type="password" value={password} onChange={setPassword} required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handleEmailLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log in / உள்நுழையவும்"}
          </PrimaryButton>
          <button onClick={() => { setStep("forgot"); setForgotIdentifier(""); setError(""); }} style={{
            width: "100%", background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, marginTop: 12,
          }}>
            Forgot password? / கடவுச்சொல் மறந்துவிட்டதா?
          </button>
        </>
      )}

      {method === "phone" && (
        <>
          <TextField label="Phone number / தொலைபேசி எண்" value={phone} onChange={setPhone} placeholder="10-digit mobile number" required />
          <TextField label="Password / கடவுச்சொல்" type="password" value={password} onChange={setPassword} required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handlePhoneLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log in / உள்நுழையவும்"}
          </PrimaryButton>
          <button onClick={() => { setStep("forgot"); setForgotIdentifier(""); setError(""); }} style={{
            width: "100%", background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, marginTop: 12,
          }}>
            Forgot password? / கடவுச்சொல் மறந்துவிட்டதா?
          </button>
        </>
      )}
      </div>

      <p style={{ fontSize: 12.5, color: colors.textFaint, marginTop: 18, textAlign: "center" }}>
        New here? / புதியவரா?{" "}
        <button onClick={() => onNavigate("register")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, padding: 0 }}>
          Register / பதிவு செய்யவும்
        </button>
      </p>
    </div>
  );
}

function ErrorBox({ children, colors }) {
  return (
    <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 9, padding: "10px 13px", fontSize: 13, marginBottom: 15, fontWeight: 500 }}>
      {children}
    </div>
  );
}
