"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OverviewData {
  total_queues: number;
  active_queues: number;
  total_customers_served: number;
  total_customers_waiting: number;
  avg_wait_time_minutes: number;
}

interface QueueStat {
  queue_id: string;
  queue_name: string;
  status: string;
  total_served: number;
  total_waiting: number;
  avg_wait_time_minutes: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function Analytics() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [topQueues, setTopQueues] = useState<QueueStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [queuesOpen, setQueuesOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/auth"); return; }
    fetchData(token);

     // Poll every 15 seconds
    const interval = setInterval(() => {
      const t = localStorage.getItem("access_token");
      if (t) fetchData(t);
    }, 15000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [overviewRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/top-queues`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (overviewRes.status === 401) { router.push("/auth"); return; }

      const overviewData = await overviewRes.json();
      const topData = await topRes.json();

      if (overviewData.success) setOverview(overviewData.data);
      if (topData.success) setTopQueues(topData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth");
  };

  const maxServed = Math.max(...topQueues.map((q) => q.total_served), 1);

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
          <Link href="/dashboard/analytics" className="db-nav-item db-nav-active">📊 Analytics</Link>
          <Link href="/dashboard/settings" className="db-nav-item">⚙️ Settings</Link>
        </nav>
        <button className="db-logout" onClick={handleLogout}>Sign out</button>
      </aside>

      {/* Main */}
      <div className="db-main">
        <header className="db-topbar">
          <div>
            <h1 className="db-page-title">Analytics</h1>
            <p className="db-page-subtitle">Track queue performance and customer flow . Auto-refreshes every 15s</p>
          </div>
        </header>

        <div className="db-content">
          {loading ? (
            <div className="db-loading">Loading analytics...</div>
          ) : (
            <>
              {/* Top Stats */}
              <div className="db-stats" style={{ marginBottom: "24px" }}>
                <div className="db-stat-card">
                  <div className="db-stat-label">Total Customers</div>
                  <div className="db-stat-value">{overview?.total_customers_served ?? 0}</div>
                  <div className="db-stat-sub db-stat-sub-green">Served today</div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Avg Wait Time</div>
                  <div className="db-stat-value">{overview?.avg_wait_time_minutes ?? 0} mins</div>
                  <div className="db-stat-sub db-stat-sub-blue">Per customer</div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Queues Created</div>
                  <div className="db-stat-value">{overview?.total_queues ?? 0}</div>
                  <div className="db-stat-sub">Total queues</div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Active Queues</div>
                  <div className="db-stat-value">{overview?.active_queues ?? 0}</div>
                  <div className="db-stat-sub db-stat-sub-green">Currently active</div>
                </div>
              </div>

              <div className="an-layout">
                {/* Top Performing Queues Table */}
                <div className="db-card">
                  <h2 className="db-card-title">Top Performing Queues</h2>
                  <div className="vq-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                    <table className="vq-table">
                      <thead>
                        <tr>
                          <th>Queue Name</th>
                          <th>Status</th>
                          <th>Customers Served</th>
                          <th>Waiting</th>
                          <th>Avg Wait</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topQueues.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="vq-empty">No queue data yet</td>
                          </tr>
                        ) : (
                          topQueues.map((queue) => (
                            <tr key={queue.queue_id}>
                              <td className="vq-name">{queue.queue_name}</td>
                              <td>
                                <span className={`db-badge ${queue.status === "ACTIVE" ? "db-badge-active" : "db-badge-inactive"}`}>
                                  {queue.status.charAt(0) + queue.status.slice(1).toLowerCase()}
                                </span>
                              </td>
                              <td>{queue.total_served}</td>
                              <td>{queue.total_waiting}</td>
                              <td>{queue.avg_wait_time_minutes} mins</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="db-card">
                  <h2 className="db-card-title">Customers Served per Queue</h2>
                  {topQueues.length === 0 ? (
                    <div className="vq-empty">No data yet</div>
                  ) : (
                    <div className="an-chart">
                      {topQueues.map((queue) => (
                        <div key={queue.queue_id} className="an-bar-row">
                          <div className="an-bar-label">{queue.queue_name}</div>
                          <div className="an-bar-track">
                            <div
                              className="an-bar-fill"
                              style={{
                                width: `${(queue.total_served / maxServed) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="an-bar-value">{queue.total_served}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Queue Details Table */}
              <div className="db-card" style={{ marginTop: "20px" }}>
                <h2 className="db-card-title">Queue Analytics Summary</h2>
                <div className="vq-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                  <table className="vq-table">
                    <thead>
                      <tr>
                        <th>Queue Name</th>
                        <th>Total Served</th>
                        <th>Currently Waiting</th>
                        <th>Avg Wait Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueues.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="vq-empty">No queues found</td>
                        </tr>
                      ) : (
                        topQueues.map((queue) => (
                          <tr key={queue.queue_id}>
                            <td className="vq-name">{queue.queue_name}</td>
                            <td>{queue.total_served}</td>
                            <td>{queue.total_waiting}</td>
                            <td>{queue.avg_wait_time_minutes} mins</td>
                            <td>
                              <span className={`db-badge ${queue.status === "ACTIVE" ? "db-badge-active" : "db-badge-inactive"}`}>
                                {queue.status.charAt(0) + queue.status.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td>
                              <Link
                                href={`/dashboard/queues/${queue.queue_id}`}
                                className="vq-action-btn"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}