"use client";

import { useEffect, useState } from "react";

const chartData = [65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50, 88];
const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const qrPixels = [
  1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,
  1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,
  1,1,1,0,1,1,1,0,0,1,1,1,0,0,1,1,1,1,0,0,1,1,1,0,1,
  0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,
  1,1,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,1,1,1,0,0,
];

export default function Home() {

  const maxBar = Math.max(...chartData);

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-left">
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <img src="/logo.png" alt="JoinQ" height={32} style={{borderRadius: "6px"}} />
              <span className="logo">JoinQ</span>
            </div>
          </div>
          <div className="navbar-center">
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#analytics" className="nav-link">Analytics</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          <div className="navbar-right">
            <a href="/auth" className="btn-primary">Get Started</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero container animate-rise">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Queue Management for Modern Businesses
          </h1>
          <p className="hero-subtitle">
            Create digital queues, manage customers in real time, and reduce
            physical waiting with QR-based access.
          </p>
          <div className="hero-actions">
            <a href="/auth" className="btn-primary">Get Started</a>
            <a href="#how-it-works" className="btn-outline">▶ Watch Demo</a>
          </div>
        </div>

        <div className="hero-visual">
          {/* Dashboard mockup */}
          <div className="dashboard-mockup">
            <div className="mockup-header">
              <span className="mockup-dot mockup-dot-red" />
              <span className="mockup-dot mockup-dot-yellow" />
              <span className="mockup-dot mockup-dot-green" />
            </div>
            <div className="mockup-body">
              <div className="mockup-stats">
                <div className="mockup-stat">
                  <div className="mockup-stat-label">Waiting</div>
                  <div className="mockup-stat-value">24</div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-label">Serving</div>
                  <div className="mockup-stat-value">A-19</div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-label">Served</div>
                  <div className="mockup-stat-value">126</div>
                </div>
              </div>
              <div className="mockup-table">
                <div className="mockup-table-row mockup-table-header">
                  <span>Token</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span>Wait</span>
                </div>
                <div className="mockup-table-row">
                  <span>A-20</span>
                  <span>Charan</span>
                  <span><span className="badge badge-waiting">Waiting</span></span>
                  <span>5 min</span>
                </div>
                <div className="mockup-table-row">
                  <span>A-21</span>
                  <span>Aryan</span>
                  <span><span className="badge badge-called">Called</span></span>
                  <span>10 min</span>
                </div>
                <div className="mockup-table-row">
                  <span>A-22</span>
                  <span>Priya</span>
                  <span><span className="badge badge-waiting">Waiting</span></span>
                  <span>15 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating QR card */}
          <div className="floating-card floating-qr">
            <div className="qr-placeholder">
              {qrPixels.map((p, i) => (
                <div key={i} className={`qr-pixel ${p ? "filled" : "empty"}`} />
              ))}
            </div>
            <div className="floating-label">Scan to Join</div>
          </div>

          {/* Floating token card */}
          <div className="floating-card floating-token">
            <div className="token-label">Now Serving</div>
            <div className="token-number">A-19</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything you need to manage queues smarter</h2>
            <p className="section-subtitle">
              Powerful tools to create digital queues, manage customers, and improve waiting experience.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">QR Queue Joining</h3>
              <p className="feature-desc">
                Customers can instantly join queues by scanning a QR code from their phones. No app needed.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Live Queue Tracking</h3>
              <p className="feature-desc">
                Monitor real-time queue status, estimated waiting time, and customer progress live.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3 className="feature-title">SMS Notifications</h3>
              <p className="feature-desc">
                Automatically notify customers about their queue status and turn updates through SMS alerts.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Queue Analytics</h3>
              <p className="feature-desc">
                Track queue performance, customer flow, and waiting trends with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How JoinQ Works</h2>
            <p className="section-subtitle">
              Set up queues, share QR codes, and manage customers in real time.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create Queue</h3>
              <p className="step-desc">
                Create digital queues for your business within seconds.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Share QR Code</h3>
              <p className="step-desc">
                Customers scan the QR code to instantly join the queue.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Manage Customers</h3>
              <p className="step-desc">
                Track queue activity, call tokens, and manage waiting customers live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics Preview ── */}
      <section className="analytics-preview" id="analytics">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Analytics for Better Queue Management</h2>
            <p className="section-subtitle">
              Track waiting times, customer flow, and queue performance with real-time insights.
            </p>
          </div>
          <div className="analytics-mockup">
            <div className="analytics-header">
              <span className="analytics-title-text">Analytics Overview</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Today</span>
            </div>
            <div className="analytics-body">
              <div className="analytics-stats">
                <div className="analytics-stat">
                  <div className="analytics-stat-label">Total Customers</div>
                  <div className="analytics-stat-value">1,260</div>
                  <div className="analytics-stat-sub">↑ 12% vs yesterday</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-stat-label">Avg Wait Time</div>
                  <div className="analytics-stat-value">12 mins</div>
                  <div className="analytics-stat-sub">↓ 3 mins improved</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-stat-label">Queues Created</div>
                  <div className="analytics-stat-value">8</div>
                  <div className="analytics-stat-sub">Across all branches</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-stat-label">Satisfaction</div>
                  <div className="analytics-stat-value">94%</div>
                  <div className="analytics-stat-sub">↑ 2% this week</div>
                </div>
              </div>
              <div className="analytics-chart">
                {chartData.map((val, i) => (
                  <div key={i} className="chart-bar-group">
                    <div
                      className="chart-bar"
                      style={{ height: `${(val / maxBar) * 100}%` }}
                    />
                    <span className="chart-label">{chartDays[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">End Long Waiting Lines. Start Smarter Queueing.</h2>
            <p className="cta-subtitle">
              Join businesses using JoinQ to manage queues smarter, faster, and digitally.
            </p>
            <div className="cta-actions">
              <a href="/auth" className="btn-white">Get Started</a>
              <a href="#how-it-works" className="btn-ghost">▶ Watch Demo</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="logo">JoinQ</span>
              <p className="footer-desc">
                Smart queue management for modern businesses. Reduce waiting, improve experience.
              </p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How it works</a>
                <a href="#analytics" className="footer-link">Analytics</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Connect</div>
              <div className="footer-links">
                <a href="#" className="footer-link">Twitter</a>
                <a href="#" className="footer-link">LinkedIn</a>
                <a href="#contact" className="footer-link">Contact us</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 JoinQ. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}