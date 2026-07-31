import { useState } from "react";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";
import { resetPasswordWithSecurityAnswer } from "../data/queries";

export default function Login({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { loginWithEmailPassword, loginWithPhone, sendEmailPasswordResetLink } = useAuth();

  const [method, setMethod] = useState("email");
  const [step, setStep] = useState("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotPhone, setForgotPhone] = useState("");
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

  async function handleEmailForgotPassword() {
    setError("");
    if (!email) { setError("Enter your email above first"); return; }
    setLoading(true);
    const { error } = await sendEmailPasswordResetLink(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    showToast("Password reset link sent — check your email");
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
    if (!forgotPhone || !forgotAnswer || !forgotNewPassword) {
      setError("Fill all fields");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await resetPasswordWithSecurityAnswer(forgotPhone, forgotAnswer, forgotNewPassword);
    setLoading(false);
    if (error) { setError(error); return; }
    setStep("forgotSuccess");
  }

  if (step === "forgot") {
    return (
      <div>
        <button onClick={() => { setStep("form"); setError(""); }} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
        }}>
          <ArrowLeft size={14} /> Back to login / திரும்பிச் செல்ல
        </button>

        <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Reset your password / கடவுச்சொல்லை மீட்டமைக்கவும்</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
          Enter your phone number and answer your security question to set a new password.
          <br />உங்கள் தொலைபேசி எண்ணையும் பாதுகாப்பு கேள்விக்கான பதிலையும் உள்ளிடவும்.
        </p>

        <TextField label="Phone number / தொலைபேசி எண்" value={forgotPhone} onChange={setForgotPhone} placeholder="10-digit mobile number" required />
        <TextField label="Mother's name / தாயின் பெயர்" value={forgotAnswer} onChange={setForgotAnswer} placeholder="The answer you set when registering" required />
        <TextField label="New password / புதிய கடவுச்சொல்" type="password" value={forgotNewPassword} onChange={setForgotNewPassword} placeholder="At least 6 characters" required />

        {error && <ErrorBox colors={colors}>{error}</ErrorBox>}

        <PrimaryButton onClick={handleForgotPasswordSubmit} disabled={loading}>
          {loading ? "Resetting…" : "Reset password / மீட்டமைக்கவும்"}
        </PrimaryButton>
      </div>
    );
  }

  if (step === "forgotSuccess") {
    return (
      <div style={{ textAlign: "center", padding: "30px 16px" }}>
        <h2 className="serif" style={{ fontSize: 18, marginBottom: 10 }}>Password reset successfully! / வெற்றிகரமாக மீட்டமைக்கப்பட்டது!</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
          You can now log in with your new password. / இப்போது புதிய கடவுச்சொல்லுடன் உள்நுழையலாம்.
        </p>
        <button onClick={() => { setStep("form"); setMethod("phone"); setPhone(forgotPhone); setPassword(""); }} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 24px", fontWeight: 700, fontSize: 14,
        }}>Go to login / உள்நுழைய செல்லவும்</button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Log in / உள்நுழையவும்</h2>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: colors.pendingBg, borderRadius: 10, padding: 4 }}>
        <button onClick={() => { setMethod("email"); setStep("form"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
          background: method === "email" ? colors.primary : "transparent",
          color: method === "email" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}><Mail size={14} /> Email</button>
        <button onClick={() => { setMethod("phone"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
          background: method === "phone" ? colors.primary : "transparent",
          color: method === "phone" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
          <button onClick={handleEmailForgotPassword} style={{
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
          <button onClick={() => { setStep("forgot"); setError(""); }} style={{
            width: "100%", background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, marginTop: 12,
          }}>
            Forgot password? / கடவுச்சொல் மறந்துவிட்டதா?
          </button>
        </>
      )}

      <p style={{ fontSize: 12, color: colors.textFaint, marginTop: 16, textAlign: "center" }}>
        New here? / புதியவரா?{" "}
        <button onClick={() => onNavigate("register")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12, padding: 0 }}>
          Register / பதிவு செய்யவும்
        </button>
      </p>
    </div>
  );
}

function ErrorBox({ children, colors }) {
  return (
    <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>
      {children}
    </div>
  );
}
