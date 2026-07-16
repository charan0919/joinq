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
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.joinq.unitedtechlab.com";

export default function ViewQueues() {
  const router = useRouter();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [filtered, setFiltered] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queuesOpen, setQueuesOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/auth"); return; }
    fetchQueues(token);
  }, [router]);

  useEffect(() => {
    let result = queues;
    if (search) {
      result = result.filter((q) =>
        q.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, queues]);

  const fetchQueues = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/queues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push("/auth"); return; }
      const data = await res.json();
      if (data.success) {
        setQueues(data.data);
        setFiltered(data.data);
      }
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
          <Link href="/dashboard" className="db-nav-item">
            🏠 Dashboard
          </Link>
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
          <Link href="/dashboard/analytics" className="db-nav-item">
            📊 Analytics
          </Link>
          <Link href="/dashboard/settings" className="db-nav-item">
            ⚙️ Settings
          </Link>
        </nav>
        <button className="db-logout" onClick={handleLogout}>Sign out</button>
      </aside>

      {/* Main */}
      <div className="db-main">
        {/* Top Bar */}
        <header className="db-topbar">
          <div>
            <h1 className="db-page-title">Queues</h1>
            <p className="db-page-subtitle">View and manage all your queues at one place</p>
          </div>
          <div className="db-topbar-right">
            <Link href="/dashboard/queues/create" className="btn-primary">
              Create queue
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="db-content">
          {/* Search and Filters */}
          <div className="vq-filters">
            <input
              type="text"
              className="vq-search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="vq-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Table */}
          <div className="vq-table-wrapper">
            <table className="vq-table">
              <thead>
                <tr>
                  <th>Queue name</th>
                  <th>Status</th>
                  <th>Customers waiting</th>
                  <th>Created on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="vq-empty">Loading...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vq-empty">No queues found</td>
                  </tr>
                ) : (
                  filtered.map((queue) => (
                    <tr key={queue.queue_id}>
                      <td className="vq-name">{queue.name}</td>
                      <td>
                        <span className={`db-badge ${
                          queue.status === "ACTIVE" ? "db-badge-active" :
                          queue.status === "PAUSED" ? "db-badge-paused" :
                          "db-badge-inactive"
                        }`}>
                          {queue.status.charAt(0) + queue.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>{queue.waiting_count}</td>
                      <td className="vq-date">{formatDate(queue.created_at)}</td>
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

          {/* Pagination info */}
          {!loading && (
            <div className="vq-footer">
              <span className="vq-count">
                Showing 1 to {filtered.length} of {filtered.length} queues
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}