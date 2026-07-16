"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function CreateQueue() {
  const router = useRouter();
  const [queuesOpen, setQueuesOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Consultation",
    prefix: "",
    avg_service_time: "",
    max_queue_size: "",
    start_time: "09:00 AM",
    end_time: "06:00 PM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.prefix) {
      setError("Queue name and prefix are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) { router.push("/auth"); return; }
      const res = await fetch(`${API_BASE}/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          prefix: form.prefix.toUpperCase(),
          avg_service_time: parseInt(form.avg_service_time) || 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create queue");
      router.push("/dashboard/queues");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create queue");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth");
  };

  return (
    <div className="db-layout">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <img src="/logo.png" alt="JoinQ" height={32} style={{ borderRadius: "6px" }} />
          <span>JoinQ</span>
        </div>
        <nav className="db-nav">
          <Link href="/dashboard" className="db-nav-item">🏠 Dashboard</Link>
          <div>
            <button className="db-nav-item db-nav-parent db-nav-active" onClick={() => setQueuesOpen(!queuesOpen)}>
              📋 Queues
              <span className="db-nav-arrow">{queuesOpen ? "▾" : "▸"}</span>
            </button>
            {queuesOpen && (
              <div className="db-nav-sub">
                <Link href="/dashboard/queues" className="db-nav-subitem">View queues</Link>
                <Link href="/dashboard/queues/create" className="db-nav-subitem db-nav-subitem-active">Create queue</Link>
              </div>
            )}
          </div>
          <Link href="/dashboard/analytics" className="db-nav-item">📊 Analytics</Link>
          <Link href="/dashboard/settings" className="db-nav-item">⚙️ Settings</Link>
        </nav>
        <button className="db-logout" onClick={handleLogout}>Sign out</button>
      </aside>

      {/* Main */}
      <div className="db-main">
        <header className="db-topbar">
          <div>
            <div className="cq-breadcrumb">
              <Link href="/dashboard/queues" className="cq-breadcrumb-link">Queues</Link>
              <span className="cq-breadcrumb-sep">›</span>
              <span>Create queue</span>
            </div>
            <h1 className="db-page-title">Create new queue</h1>
            <p className="db-page-subtitle">Configure a queue for your customers</p>
          </div>
        </header>

        <div className="db-content">
          {error && <div className="auth-error" style={{marginBottom: "16px"}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="cq-layout">
              {/* Left - Form */}
              <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>

                {/* Queue Information */}
                <div className="cq-form-card">
                  <h2 className="cq-section-title">Queue information</h2>
                  <div className="cq-field">
                    <label className="cq-label">Queue name</label>
                    <input
                      type="text"
                      className="cq-input"
                      placeholder="e.g. General consultation"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Token Prefix</label>
                    <input
                      type="text"
                      className="cq-input"
                      placeholder="e.g. A"
                      maxLength={5}
                      value={form.prefix}
                      onChange={(e) => setForm({...form, prefix: e.target.value})}
                      required
                    />
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Description</label>
                    <textarea
                      className="cq-textarea"
                      placeholder="Briefly describe this queue"
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                    />
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Category</label>
                    <select
                      className="cq-input"
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                    >
                      <option>Consultation</option>
                      <option>Billing</option>
                      <option>Support</option>
                      <option>Registration</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Queue Settings */}
                <div className="cq-form-card">
                  <h2 className="cq-section-title">Queue settings</h2>
                  <div className="cq-two-col">
                    <div className="cq-field">
                      <label className="cq-label">Average service time</label>
                      <input
                        type="text"
                        className="cq-input"
                        placeholder="e.g. 8 mins"
                        value={form.avg_service_time}
                        onChange={(e) => setForm({...form, avg_service_time: e.target.value})}
                      />
                    </div>
                    <div className="cq-field">
                      <label className="cq-label">Maximum queue size</label>
                      <input
                        type="text"
                        className="cq-input"
                        placeholder="e.g. 50"
                        value={form.max_queue_size}
                        onChange={(e) => setForm({...form, max_queue_size: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Status</label>
                    <div className="cq-toggle-group">
                      <button
                        type="button"
                        className={`cq-toggle-btn ${status === "ACTIVE" ? "cq-toggle-active" : "cq-toggle-inactive"}`}
                        onClick={() => setStatus("ACTIVE")}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        className={`cq-toggle-btn ${status === "INACTIVE" ? "cq-toggle-active" : "cq-toggle-inactive"}`}
                        onClick={() => setStatus("INACTIVE")}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Operating hours</label>
                    <div className="cq-two-col">
                      <div>
                        <label className="cq-sublabel">Start time</label>
                        <input
                          type="text"
                          className="cq-input"
                          value={form.start_time}
                          onChange={(e) => setForm({...form, start_time: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="cq-sublabel">End time</label>
                        <input
                          type="text"
                          className="cq-input"
                          value={form.end_time}
                          onChange={(e) => setForm({...form, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="cq-form-card">
                  <h2 className="cq-section-title">Notifications</h2>
                  <div className="cq-toggle-row">
                    <span className="cq-toggle-label">Enable SMS updates</span>
                    <button
                      type="button"
                      className={`cq-switch ${smsEnabled ? "cq-switch-on" : ""}`}
                      onClick={() => setSmsEnabled(!smsEnabled)}
                    >
                      <span className="cq-switch-thumb" />
                    </button>
                  </div>
                  <div className="cq-toggle-row">
                    <div>
                      <span className="cq-toggle-label">Notify before turn</span>
                      <p className="cq-sublabel">Notify 3 positions before turn</p>
                    </div>
                    <button
                      type="button"
                      className={`cq-switch ${notifyEnabled ? "cq-switch-on" : ""}`}
                      onClick={() => setNotifyEnabled(!notifyEnabled)}
                    >
                      <span className="cq-switch-thumb" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right - QR + Actions */}
              <div className="cq-sidebar">
                <div className="cq-qr-card">
                  <h3 className="cq-qr-title">Queue QR code</h3>
                  <div className="cq-qr-placeholder">
                    <div className="cq-qr-box" />
                    <p className="cq-qr-text">QR generated after creation</p>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{width: "100%", height: "48px"}} disabled={loading}>
                  {loading ? "Creating..." : "Create queue"}
                </button>
                <Link href="/dashboard/queues" className="btn-outline" style={{display: "block", textAlign: "center", padding: "12px"}}>
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}