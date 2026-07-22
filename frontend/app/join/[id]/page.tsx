"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface QueueInfo {
  queue_id: string;
  business_name: string;
  queue_name: string;
  status: string;
  waiting_count: number;
  estimated_wait_time: number;
}

interface TokenInfo {
  token_id: string;
  token_number: string;
  position: number;
  estimated_wait_time: number;
  session_token: string;
  queue_name: string;
  business_name: string;
}

interface TokenStatus {
  token_id: string;
  token_number: string;
  status: string;
  position: number | null;
  estimated_wait_time: number | null;
  called_at: string | null;
  served_at: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function JoinQueue() {
  const params = useParams();
  const queueId = params.id as string;

  const [step, setStep] = useState<"info" | "form" | "token" | "status">("info");
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Fetch queue info on load
  useEffect(() => {
    fetchQueueInfo();
  }, [queueId]);

  // Poll token status every 10 seconds when on status step
  useEffect(() => {
    if (step !== "status" || !tokenInfo) return;
    const interval = setInterval(() => {
      fetchTokenStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [step, tokenInfo]);

  const fetchQueueInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer/queue/${queueId}`);
      const data = await res.json();
      if (data.success) {
        setQueueInfo(data.data);
        setStep("info");
      } else {
        setError("Queue not found");
      }
    } catch {
      setError("Failed to load queue information");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/customer/queue/${queueId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to join queue");
      setTokenInfo(data.data);
      localStorage.setItem(`token_${queueId}`, JSON.stringify(data.data));
      setStep("token");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join queue");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTokenStatus = async () => {
    if (!tokenInfo) return;
    try {
      const res = await fetch(
        `${API_BASE}/customer/token/${tokenInfo.token_id}/status?session_token=${tokenInfo.session_token}`
      );
      const data = await res.json();
      if (data.success) setTokenStatus(data.data);
    } catch {
      console.error("Failed to fetch token status");
    }
  };

  const handleTrackStatus = async () => {
    await fetchTokenStatus();
    setStep("status");
  };

  const handleLeave = async () => {
    if (!tokenInfo) return;
    if (!confirm("Are you sure you want to leave the queue?")) return;
    try {
      await fetch(
        `${API_BASE}/customer/token/${tokenInfo.token_id}/leave?session_token=${tokenInfo.session_token}`,
        { method: "DELETE" }
      );
      localStorage.removeItem(`token_${queueId}`);
      setStep("info");
      setTokenInfo(null);
      setTokenStatus(null);
      fetchQueueInfo();
    } catch {
      alert("Failed to leave queue");
    }
  };

  if (loading) {
    return (
      <div className="join-page">
        <div className="join-card">
          <div className="join-loading">Loading queue information...</div>
        </div>
      </div>
    );
  }

  if (error && !queueInfo) {
    return (
      <div className="join-page">
        <div className="join-card">
          <div className="join-error-state">
            <div className="join-error-icon">❌</div>
            <h2>Queue Not Found</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-card">
        {/* Header */}
        <div className="join-header">
          <div className="join-logo">JoinQ</div>
          <h1 className="join-business">{queueInfo?.business_name}</h1>
          <h2 className="join-queue-name">{queueInfo?.queue_name}</h2>
        </div>

        {/* Step: Queue Info */}
        {step === "info" && (
          <div className="join-body">
            {queueInfo?.status !== "ACTIVE" ? (
              <div className="join-closed">
                <div className="join-closed-icon">🚫</div>
                <h3>Queue is {queueInfo?.status?.toLowerCase()}</h3>
                <p>This queue is not accepting customers right now.</p>
              </div>
            ) : (
              <>
                <div className="join-stats">
                  <div className="join-stat">
                    <span className="join-stat-value">{queueInfo?.waiting_count}</span>
                    <span className="join-stat-label">People waiting</span>
                  </div>
                  <div className="join-stat-divider" />
                  <div className="join-stat">
                    <span className="join-stat-value">{queueInfo?.estimated_wait_time}</span>
                    <span className="join-stat-label">Est. wait (mins)</span>
                  </div>
                </div>
                <button
                  className="join-btn-primary"
                  onClick={() => setStep("form")}
                >
                  Join Queue
                </button>
              </>
            )}
          </div>
        )}

        {/* Step: Join Form */}
        {step === "form" && (
          <div className="join-body">
            <h3 className="join-form-title">Enter your details</h3>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleJoin} className="join-form">
              <div className="join-field">
                <label className="join-label">Your Name *</label>
                <input
                  type="text"
                  className="join-input"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="join-field">
                <label className="join-label">Phone Number *</label>
                <input
                  type="tel"
                  className="join-input"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="join-field">
                <label className="join-label">Email (optional)</label>
                <input
                  type="email"
                  className="join-input"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <button type="submit" className="join-btn-primary" disabled={submitting}>
                {submitting ? "Joining..." : "Confirm & Join"}
              </button>
              <button
                type="button"
                className="join-btn-outline"
                onClick={() => setStep("info")}
              >
                Back
              </button>
            </form>
          </div>
        )}

        {/* Step: Token Confirmation */}
        {step === "token" && tokenInfo && (
          <div className="join-body">
            <div className="join-success-icon">✅</div>
            <h3 className="join-success-title">You&apos;re in the queue!</h3>
            <div className="join-token-card">
              <div className="join-token-label">Your Token</div>
              <div className="join-token-number">{tokenInfo.token_number}</div>
              <div className="join-token-info">
                <span>Position: <strong>{tokenInfo.position}</strong></span>
                <span>Est. Wait: <strong>{tokenInfo.estimated_wait_time} mins</strong></span>
              </div>
            </div>
            <p className="join-note">
              📱 Save this page to track your position. You&apos;ll be notified when your turn is near.
            </p>
            <button className="join-btn-primary" onClick={handleTrackStatus}>
              Track My Position
            </button>
            <button className="join-btn-danger" onClick={handleLeave}>
              Leave Queue
            </button>
          </div>
        )}

        {/* Step: Live Status */}
        {step === "status" && tokenStatus && (
          <div className="join-body">
            {tokenStatus.status === "CALLED" ? (
              <div className="join-called">
                <div className="join-called-icon">🔔</div>
                <h3>It&apos;s your turn!</h3>
                <p>Please proceed to the counter now.</p>
                <div className="join-token-number" style={{ color: "#2563eb" }}>
                  {tokenStatus.token_number}
                </div>
              </div>
            ) : tokenStatus.status === "SERVED" ? (
              <div className="join-served">
                <div className="join-called-icon">🎉</div>
                <h3>You have been served!</h3>
                <p>Thank you for using JoinQ.</p>
              </div>
            ) : tokenStatus.status === "CANCELLED" ? (
              <div className="join-served">
                <div className="join-called-icon">❌</div>
                <h3>Token Cancelled</h3>
                <p>Your token has been cancelled.</p>
              </div>
            ) : (
              <>
                <div className="join-token-card">
                  <div className="join-token-label">Your Token</div>
                  <div className="join-token-number">{tokenStatus.token_number}</div>
                  <div className="join-token-info">
                    <span>Position: <strong>{tokenStatus.position ?? "—"}</strong></span>
                    <span>Est. Wait: <strong>{tokenStatus.estimated_wait_time ?? 0} mins</strong></span>
                  </div>
                </div>
                <div className="join-status-badge">
                  ⏳ Waiting — Auto-updates every 10 seconds
                </div>
                <button className="join-btn-danger" onClick={handleLeave}>
                  Leave Queue
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}