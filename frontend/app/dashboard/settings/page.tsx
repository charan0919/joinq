"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BusinessProfile {
  business_id: string;
  name: string;
  phone: string;
  address: string;
  logo_url: string | null;
  is_active: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [queuesOpen, setQueuesOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/auth"); return; }
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/business/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/auth"); return; }
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setForm({
          name: data.data.name || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/business/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");
      setProfile(data.data);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
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
            <button
              className="db-nav-item db-nav-parent"
              onClick={() => setQueuesOpen(!queuesOpen)}
            >
              📋 Queues
              <span className="db-nav-arrow">{queuesOpen ? "▾" : "▸"}</span>
            </button>
            {queuesOpen && (
              <div className="db-nav-sub">
                <Link href="/dashboard/queues" className="db-nav-subitem">View queues</Link>
                <Link href="/dashboard/queues/create" className="db-nav-subitem">Create queue</Link>
              </div>
            )}
          </div>
          <Link href="/dashboard/analytics" className="db-nav-item">📊 Analytics</Link>
          <Link href="/dashboard/settings" className="db-nav-item db-nav-active">⚙️ Settings</Link>
        </nav>
        <button className="db-logout" onClick={handleLogout}>Sign out</button>
      </aside>

      {/* Main */}
      <div className="db-main">
        <header className="db-topbar">
          <div>
            <h1 className="db-page-title">Settings</h1>
            <p className="db-page-subtitle">Manage your business profile and preferences</p>
          </div>
        </header>

        <div className="db-content">
          {loading ? (
            <div className="db-loading">Loading...</div>
          ) : (
            <div className="st-layout">
              {/* Business Profile */}
              <div className="cq-form-card">
                <h2 className="cq-section-title">Business Profile</h2>

                {success && (
                  <div className="st-success">{success}</div>
                )}
                {error && (
                  <div className="auth-error">{error}</div>
                )}

                <form onSubmit={handleSave}>
                  <div className="cq-field">
                    <label className="cq-label">Business Name</label>
                    <input
                      type="text"
                      className="cq-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Phone Number</label>
                    <input
                      type="tel"
                      className="cq-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="cq-field">
                    <label className="cq-label">Address</label>
                    <textarea
                      className="cq-textarea"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Enter business address"
                    />
                  </div>
                  <div className="cq-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Account Info */}
              <div className="cq-form-card">
                <h2 className="cq-section-title">Account Info</h2>
                <div className="st-info-row">
                  <span className="st-info-label">Business ID</span>
                  <span className="st-info-value">{profile?.business_id?.slice(0, 8)}...</span>
                </div>
                <div className="st-info-row">
                  <span className="st-info-label">Account Status</span>
                  <span className="db-badge db-badge-active">
                    {profile?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="cq-section-title" style={{ marginTop: "24px" }}>Danger Zone</div>
                <button className="qd-danger-btn qd-delete-btn" style={{ marginTop: "12px" }} onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}