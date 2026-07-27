import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";

export default function Register({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { sendEmailOtp, verifyEmailOtp, signUpWithPhone } = useAuth();

  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setError("");
    if (!email || !name) { setError("Enter your name and email"); return; }
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
    showToast("Email verified! Complete your profile next.");
    onNavigate("editProfile");
  }

  async function handlePhoneSignup() {
    setError("");
    if (!name || !phone || !password) { setError("Fill all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUpWithPhone(phone, password, name);
    setLoading(false);
    if (error) {
      setError(error.message.includes("already registered") ? "This phone number is already registered. Try logging in." : error.message);
      return;
    }
    showToast("Account created! Complete your profile next.");
    onNavigate("editProfile");
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Create your account</h2>

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
          <TextField label="Full name" value={name} onChange={setName} required />
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
            {loading ? "Verifying…" : "Verify & continue"}
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
          <TextField label="Full name" value={name} onChange={setName} required />
          <TextField label="Phone number" value={phone} onChange={setPhone} placeholder="10-digit mobile number" required />
          <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
          {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
          <PrimaryButton onClick={handlePhoneSignup} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </>
      )}

      <p style={{ fontSize: 12, color: colors.textFaint, marginTop: 16, textAlign: "center" }}>
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12, padding: 0 }}>
          Log in
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
