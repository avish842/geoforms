import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/user/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setMessage("OTP sent to your email");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("OTP is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/user/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      setMessage("OTP verified. Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/user/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "8px", marginTop: "5px" };
  const btnStyle = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#4F46E5",
    color: "white",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Forgot Password</h2>

      {error && (
        <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>
      )}
      {message && (
        <div style={{ color: "green", marginBottom: "15px", textAlign: "center" }}>{message}</div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOTP}>
          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Enter your registered email"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP}>
          <p style={{ marginBottom: "15px", color: "#555", textAlign: "center" }}>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          <div style={{ marginBottom: "15px" }}>
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => { setOtp(e.target.value); setError(""); }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            type="button"
            onClick={() => { setStep(1); setOtp(""); setError(""); setMessage(""); }}
            style={{ ...btnStyle, backgroundColor: "transparent", color: "#4F46E5", marginTop: "10px" }}
          >
            Resend OTP
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: "15px" }}>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="Enter new password"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Confirm new password"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
