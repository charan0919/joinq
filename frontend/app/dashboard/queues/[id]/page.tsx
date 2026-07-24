"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

interface Queue {
  queue_id: string;
  name: string;
  status: string;
  waiting_count: number;
  avg_service_time: number;
  created_at: string;
}

interface Token {
  token_id: string;
  token_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  position: number;
  joined_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function QueueDetails() {
  const router = useRouter();
  const params = useParams();
  const queueId = params.id as string;

  const [queue, setQueue] = useState<Queue | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [queuesOpen, setQueuesOpen] = useState(true);
  const [currentServing, setCurrentServing] = useState<Token | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth");
      return;
    }
    fetchData(token);
    QRCode.toDataURL(`https://joinq.unitedtechlab.com/join/${queueId}`, {
      width: 200,
      margin: 2,
    }).then((url) => setQrDataUrl(url));
  }, [router, queueId]);

  const fetchData = async (authToken: string) => {
    try {
      const [queueRes, tokensRes] = await Promise.all([
        fetch(`${API_BASE}/queues/${queueId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/queues/${queueId}/tokens`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      if (queueRes.status === 401) {
        router.push("/auth");
        return;
      }
      const queueData = await queueRes.json();
      const tokensData = await tokensRes.json();
      if (queueData.success) setQueue(queueData.data);
      if (tokensData.success) setTokens(tokensData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const callNext = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/queues/${queueId}/next`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentServing(data.data);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch {
          // Sound not supported
        }
        fetchData(token!);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const updateTokenStatus = async (tokenId: string, status: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/queues/${queueId}/tokens/${tokenId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchData(token!);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const updateQueueStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/queues/${queueId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchData(token!);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="db-loading">Loading...</div>;

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
              className="db-nav-item db-nav-parent db-nav-active"
              onClick={() => setQueuesOpen(!queuesOpen)}
            >
              📋 Queues
              <span className="db-nav-arrow">{queuesOpen ? "▾" : "▸"}</span>
            </button>
            {queuesOpen && (
              <div className="db-nav-sub">
                <Link href="/dashboard/queues" className="db-nav-subitem db-nav-subitem-active">
                  View queues
                </Link>
                <Link href="/dashboard/queues/create" className="db-nav-subitem">
                  Create queue
                </Link>
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
              <span>{queue?.name || "Queue Details"}</span>
            </div>
            <h1 className="db-page-title">{queue?.name || "Queue Details"}</h1>
            <p className="db-page-subtitle">
              Manage customers, monitor queue status, and control live operations.
            </p>
          </div>
          <div className="db-topbar-right">
            <span className={`db-badge ${queue?.status === "ACTIVE" ? "db-badge-active" : "db-badge-inactive"}`}>
              ● {queue?.status === "ACTIVE" ? "Active" : queue?.status}
            </span>
            {queue?.status === "ACTIVE" && (
              <button
                className="btn-outline"
                onClick={() => updateQueueStatus("PAUSED")}
                disabled={actionLoading}
              >
                Pause Queue
              </button>
            )}
            {queue?.status === "PAUSED" && (
              <button
                className="btn-primary"
                onClick={() => updateQueueStatus("ACTIVE")}
                disabled={actionLoading}
              >
                Resume Queue
              </button>
            )}
          </div>
        </header>

        <div className="db-content">
          {/* Stats Row */}
          <div className="qd-stats">
            <div className="db-stat-card">
              <div className="db-stat-label">Customers waiting</div>
              <div className="db-stat-value">{queue?.waiting_count ?? 0}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Currently serving</div>
              <div className="db-stat-value" style={{ color: "#2563eb" }}>
                {currentServing?.token_number || "—"}
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Avg service time</div>
              <div className="db-stat-value">{queue?.avg_service_time ?? 0} mins</div>
            </div>
          </div>

          <div className="qd-layout">
            {/* Left */}
            <div>
              {/* Now Serving Panel */}
              <div className="qd-serving-card">
                <div className="qd-serving-header">
                  <h2 className="db-card-title" style={{ margin: 0 }}>Now Serving</h2>
                  <button
                    className="btn-primary"
                    onClick={callNext}
                    disabled={actionLoading || queue?.status !== "ACTIVE"}
                    style={{ padding: "10px 20px" }}
                  >
                    {actionLoading ? "..." : "Call Next"}
                  </button>
                </div>
                {currentServing ? (
                  <div className="qd-serving-info">
                    <span className="qd-token-big">{currentServing.token_number}</span>
                    <div className="qd-serving-actions">
                      <button
                        className="qd-action-btn qd-complete"
                        onClick={() => updateTokenStatus(currentServing.token_id, "SERVED")}
                        disabled={actionLoading}
                      >
                        ✓ Complete
                      </button>
                      <button
                        className="qd-action-btn qd-skip"
                        onClick={() => updateTokenStatus(currentServing.token_id, "SKIPPED")}
                        disabled={actionLoading}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="db-empty" style={{ padding: "20px 0" }}>
                    No customer being served. Click &quot;Call Next&quot; to start.
                  </p>
                )}
              </div>

              {/* Waiting Queue Table */}
              <div className="db-card" style={{ marginTop: "20px" }}>
                <h2 className="db-card-title">Waiting Queue</h2>
                <div className="vq-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                  <table className="vq-table">
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Customer</th>
                        <th>Joined At</th>
                        <th>Est. Wait</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="vq-empty">No customers waiting</td>
                        </tr>
                      ) : (
                        tokens.map((token) => (
                          <tr key={token.token_id}>
                            <td><strong>{token.token_number}</strong></td>
                            <td>
                              <div>{token.customer_name}</div>
                              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                {token.customer_phone}
                              </div>
                            </td>
                            <td className="vq-date">{formatTime(token.joined_at)}</td>
                            <td>{token.position * (queue?.avg_service_time || 5)} mins</td>
                            <td>
                              <span className="db-badge db-badge-active">Waiting</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="qd-icon-btn qd-icon-complete"
                                  onClick={() => updateTokenStatus(token.token_id, "SERVED")}
                                  disabled={actionLoading}
                                  title="Complete"
                                >✓</button>
                                <button
                                  className="qd-icon-btn qd-icon-skip"
                                  onClick={() => updateTokenStatus(token.token_id, "SKIPPED")}
                                  disabled={actionLoading}
                                  title="Skip"
                                >→</button>
                                <button
                                  className="qd-icon-btn qd-icon-remove"
                                  onClick={() => updateTokenStatus(token.token_id, "CANCELLED")}
                                  disabled={actionLoading}
                                  title="Remove"
                                >✕</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="qd-right">
              {/* QR Card */}
              <div className="db-card">
                <h3 className="db-card-title">Queue QR</h3>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px 0" }}>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Queue QR Code"
                      style={{ width: "160px", height: "160px", borderRadius: "8px" }}
                    />
                  ) : (
                    <div className="cq-qr-box" style={{ width: "160px", height: "160px" }} />
                  )}
                  <p className="cq-qr-text">Scan to join this queue</p>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={queue?.name? queue.name+"qr.png" :"queue-qr.png"}
                      className="btn-outline"
                      style={{ flex: 1, padding: "10px", textAlign: "center" }}
                    >
                      Download QR
                    </a>
                  )}
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: "10px" }}
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      navigator.clipboard.writeText(`${baseUrl}/join/${queueId}`);
                      alert("Link copied!");
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="qd-danger-card">
                <h3 className="qd-danger-title">Danger Zone</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    className="qd-danger-btn qd-pause-btn"
                    onClick={() => updateQueueStatus("PAUSED")}
                    disabled={actionLoading}
                  >
                    Pause Queue
                  </button>
                  <button
                    className="qd-danger-btn qd-close-btn"
                    onClick={() => updateQueueStatus("CLOSED")}
                    disabled={actionLoading}
                  >
                    Close Queue
                  </button>
                  <button
                    className="qd-danger-btn qd-delete-btn"
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this queue? This cannot be undone.")) return;
                      setActionLoading(true);
                      try {
                        const token = localStorage.getItem("access_token");
                        const res = await fetch(`${API_BASE}/queues/${queueId}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        if (data.success) {
                          router.push("/dashboard/queues");
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                  >
                    Delete Queue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}