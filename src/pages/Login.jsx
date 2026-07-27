import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";

export default function Login({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { sendEmailOtp, verifyEmailOtp, loginWithPhone } = useAuth();

  const [method, setMethod] = useState("email");
  const [step, setStep] = useState("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setError("");
    if (!email) { setError("Enter your email"); return; }
    setLoading(true);
    const { error } = await sendEmailOtp(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("otp");
    showToast("OTP sent to your email");
  }

  async function handleVerifyOtp() {
    setError("");
    if (!otp) { setError("Enter the OTP sent to your email"); return; }
    setLoading(true);
    const { error } = await verifyEmailOtp(email, otp);
    setLoading(false);
    if (error) { setError("Invalid or expired OTP"); return; }
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

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Log in</h2>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: colors.pendingBg, borderRadius: 10, padding: 4 }}>
        <button onClick={() => { setMethod("email"); setStep("form"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
          background: method === "email" ? colors.primary : "transparent",
          color: method === "email" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}><Mail size={14} /> Email OTP</button>
        <button onClick={() => { setMethod("phone"); setError(""); }} style={{
          flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
          background: method === "phone" ? colors.primary : "transparent",
          color: method === "phone" ? colors.primaryText : colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}><Phone size={14} /> Phone + password</button>
      </div>

      {method === "email" && step === "form" && (
        <>
          <TextField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending OTP…" : "Send OTP to email"}
          </PrimaryButton>
        </>
      )}

      {method === "email" && step === "otp" && (
        <>
          <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 14 }}>
            We sent a 6-digit code to <b>{email}</b>. Enter it below.
          </p>
          <TextField label="OTP code" value={otp} onChange={setOtp} placeholder="6-digit code" required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handleVerifyOtp} disabled={loading}>
            {loading ? "Verifying…" : "Verify & log in"}
          </PrimaryButton>
          <button onClick={() => setStep("form")} style={{
            width: "100%", background: "none", border: "none", color: colors.textFaint, fontSize: 12.5, marginTop: 10,
          }}>
            Change email / resend
          </button>
        </>
      )}

      {method === "phone" && (
        <>
          <TextField label="Phone number" value={phone} onChange={setPhone} placeholder="10-digit mobile number" required />
          <TextField label="Password" type="password" value={password} onChange={setPassword} required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handlePhoneLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </PrimaryButton>
        </>
      )}

      <p style={{ fontSize: 12, color: colors.textFaint, marginTop: 16, textAlign: "center" }}>
        New here?{" "}
        <button onClick={() => onNavigate("register")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12, padding: 0 }}>
          Register
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
