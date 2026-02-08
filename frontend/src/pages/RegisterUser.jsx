import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const RegisterUser = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("register"); // "register" | "otp"
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  // Step 1: Submit registration form → generate OTP
  const handleGenerateOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/auth/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setMessage(data.message || "OTP sent to your email!");
      setStep("otp");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP → verify & register
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, otp: otp.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (re-calls generate-otp)
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/user/auth/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setMessage("OTP resent to your email!");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>

      {error && (
        <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ color: "green", marginBottom: "15px", textAlign: "center" }}>
          {message}
        </div>
      )}

      {step === "register" && (
        <form onSubmit={handleGenerateOTP}>
          <div style={{ marginBottom: "15px" }}>
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP}>
          <p style={{ textAlign: "center", marginBottom: "15px", color: "#555" }}>
            Enter the 6-digit OTP sent to <strong>{formData.email}</strong>
          </p>

          <div style={{ marginBottom: "15px" }}>
            <label>OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => { setOtp(e.target.value); setError(""); }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "5px",
                textAlign: "center",
                fontSize: "1.2rem",
                letterSpacing: "0.5rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying..." : "Verify & Register"}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            <button
              type="button"
              onClick={() => { setStep("register"); setOtp(""); setError(""); setMessage(""); }}
              style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer" }}
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Already have an account? <Link to="/">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterUser;
