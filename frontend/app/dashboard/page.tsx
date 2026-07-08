"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Queue {
  queue_id: string;
  name: string;
  status: string;
  waiting_count: number;
  avg_service_time: number;
}

interface OverviewData {
  total_queues: number;
  active_queues: number;
  total_customers_served: number;
  total_customers_waiting: number;
  avg_wait_time_minutes: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function Dashboard() {
  const router = useRouter();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [queuesOpen, setQueuesOpen] = useState(true);
  const [userName, setUserName] = useState("Vendor");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth");
      return;
    }
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [queuesRes, overviewRes, profileRes] = await Promise.all([
        fetch(`${API_BASE}/queues`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/business/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (queuesRes.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/auth");
        return;
      }

      const queuesData = await queuesRes.json();
      const overviewData = await overviewRes.json();
      const profileData = await profileRes.json();

      if (queuesData.success) setQueues(queuesData.data);
      if (overviewData.success) setOverview(overviewData.data);
      if (profileData.success) setUserName(profileData.data.name || "Vendor");
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/auth");
  };

  const activeQueues = queues.filter((q) => q.status === "ACTIVE");

  return (
    <div className="db-layout">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <img src="/logo.png" alt="JoinQ" height={32} style={{ borderRadius: "6px" }} />
          <span>JoinQ</span>
        </div>

        <nav className="db-nav">
          <Link href="/dashboard" className="db-nav-item db-nav-active">
            🏠 Dashboard
          </Link>

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
                <Link href="/dashboard/queues" className="db-nav-subitem">
                  View queues
                </Link>
                <Link href="/dashboard/queues/create" className="db-nav-subitem">
                  Create queue
                </Link>
              </div>
            )}
          </div>

          <Link href="/dashboard/analytics" className="db-nav-item">
            📊 Analytics
          </Link>

          <Link href="/dashboard/settings" className="db-nav-item">
            ⚙️ Settings
          </Link>
        </nav>

        <button className="db-logout" onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      {/* Main Content */}
      <div className="db-main">
        {/* Top Bar */}
        <header className="db-topbar">
          <div>
            <h1 className="db-page-title">Dashboard</h1>
            <p className="db-page-subtitle">Overview of your queue activity</p>
          </div>
          <div className="db-topbar-right">
            <button className="db-bell">🔔</button>
            <div className="db-dot" />
            <div className="db-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="db-user-info">
              <span className="db-user-name">{userName}</span>
              <span className="db-user-role">Vendor</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="db-content">
          {loading ? (
            <div className="db-loading">Loading...</div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="db-stats">
                <div className="db-stat-card">
                  <div className="db-stat-label">Active queues</div>
                  <div className="db-stat-value">{overview?.active_queues ?? 0}</div>
                  <div className="db-stat-sub">
                    {queues.length} total
                  </div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Customers waiting</div>
                  <div className="db-stat-value">{overview?.total_customers_waiting ?? 0}</div>
                  <div className="db-stat-sub db-stat-sub-blue">
                    Across all queues
                  </div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Served today</div>
                  <div className="db-stat-value">{overview?.total_customers_served ?? 0}</div>
                  <div className="db-stat-sub db-stat-sub-blue">
                    Today
                  </div>
                </div>
                <div className="db-stat-card">
                  <div className="db-stat-label">Avg wait time</div>
                  <div className="db-stat-value">
                    {overview?.avg_wait_time_minutes ?? 0} mins
                  </div>
                  <div className="db-stat-sub db-stat-sub-green">
                    Per customer
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="db-bottom">
                {/* Active Queues */}
                <div className="db-card db-queues-card">
                  <h2 className="db-card-title">Active queues</h2>
                  <div className="db-queue-list">
                    {activeQueues.length === 0 ? (
                      <div className="db-empty">No active queues yet</div>
                    ) : (
                      activeQueues.map((queue) => (
                        <div key={queue.queue_id} className="db-queue-row">
                          <span className="db-queue-name">{queue.name}</span>
                          <span className={`db-badge ${queue.status === "ACTIVE" ? "db-badge-active" : "db-badge-inactive"}`}>
                            {queue.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="db-card db-actions-card">
                  <h2 className="db-card-title">Quick actions</h2>
                  <div className="db-actions">
                    <Link href="/dashboard/queues/create" className="db-action-primary">
                      Create queue
                    </Link>
                    <Link href="/dashboard/queues" className="db-action-outline">
                      View queues
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}