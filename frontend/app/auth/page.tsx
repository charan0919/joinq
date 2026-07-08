"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "", remember: false });

  // Signup form state
  const [signupData, setSignupData] = useState({
    business_name: "",
    business_phone: "",
    business_address: "",
    vendor_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("access_token", data.data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signupData.password !== signupData.confirm_password) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: signupData.business_name,
          business_phone: signupData.business_phone,
          business_address: signupData.business_address,
          vendor_name: signupData.vendor_name,
          email: signupData.email,
          password: signupData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      setMode("login");
      setError("");
      alert("Account created successfully! Please sign in.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
       <div className="auth-logo">
  <img src="/logo.png" alt="JoinQ" height={40} />
  <span>JoinQ</span>
</div>
        <div className="auth-left-content">
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
          <div className="auth-decorative-card" />
          <h2 className="auth-left-heading">Manage queues smarter</h2>
          <p className="auth-left-subtext">
            Control queues, track customers and manage operations in real time.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          {mode === "login" ? (
            <>
              <div className="auth-card-header">
                <h1 className="auth-card-title">Sign in to your Account</h1>
                <p className="auth-card-subtitle">
                  Access your dashboard and manage queues easily.
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">email</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="auth-row">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={loginData.remember}
                      onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="auth-forgot">Forgot password?</a>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="auth-switch">
                Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} className="auth-switch-btn">
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h1 className="auth-card-title">Create your Account</h1>
                <p className="auth-card-subtitle">
                  Set up your business and start managing queues.
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSignup} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Business Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter business name"
                    value={signupData.business_name}
                    onChange={(e) => setSignupData({ ...signupData, business_name: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Your Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your name"
                    value={signupData.vendor_name}
                    onChange={(e) => setSignupData({ ...signupData, vendor_name: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Phone (optional)</label>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="Enter phone number"
                    value={signupData.business_phone}
                    onChange={(e) => setSignupData({ ...signupData, business_phone: e.target.value })}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Confirm your password"
                      value={signupData.confirm_password}
                      onChange={(e) => setSignupData({ ...signupData, confirm_password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="auth-switch-btn">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}