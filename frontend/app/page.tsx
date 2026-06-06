const qrPattern = [
  [1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0],
  [1, 0, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1],
  [0, 0, 1, 0, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 1],
];

const queueSteps = [
  {
    title: "Scan and join",
    copy: "Guests scan a QR code at the counter and join the digital queue in seconds.",
  },
  {
    title: "Track your turn",
    copy: "They can see their place in line and estimated wait time from any device.",
  },
  {
    title: "Get notified",
    copy: "When their turn is next, the system sends an instant alert so they can return.",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Digital queue, without the friction</span>
          <h1>JoinQ keeps your queue moving and your guests informed.</h1>
          <p>
            Replace waiting-room guesswork with a QR-driven queue flow. Visitors join instantly,
            monitor their spot, and receive a notification the moment their turn is approaching.
          </p>

          <div className="actions">
            <a href="#how-it-works" className="primary-action">
              See how it works
            </a>
            <a href="#status-card" className="secondary-action">
              View live status
            </a>
          </div>

          <dl className="stats">
            <div>
              <dt>Join time</dt>
              <dd>&lt; 10 sec</dd>
            </div>
            <div>
              <dt>Queue visibility</dt>
              <dd>Real time</dd>
            </div>
            <div>
              <dt>Alerts</dt>
              <dd>SMS, push, or email</dd>
            </div>
          </dl>
        </div>

        <div className="hero-panel" id="status-card">
          <div className="panel-header">
            <span className="panel-dot" />
            <span>Queue status</span>
          </div>

          <div className="qr-card" aria-label="Queue QR code preview">
            <div className="qr-corners qr-corner-top-left" />
            <div className="qr-corners qr-corner-top-right" />
            <div className="qr-corners qr-corner-bottom-left" />
            <div className="qr-grid">
              {qrPattern.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <span
                    key={`${rowIndex}-${colIndex}`}
                    className={cell ? "qr-cell filled" : "qr-cell"}
                  />
                ))
              )}
            </div>
            <div className="qr-caption">
              <strong>Scan to join</strong>
              <span>Take a number, get updates, and come back when it is your turn.</span>
            </div>
          </div>

          <div className="live-card">
            <div>
              <span className="muted">Now serving</span>
              <strong>Ticket 042</strong>
            </div>
            <div>
              <span className="muted">Next up</span>
              <strong>You in 4 min</strong>
            </div>
            <div className="notification-pill">Notification queued</div>
          </div>
        </div>
      </section>

      <section className="info-grid" id="how-it-works">
        {queueSteps.map((step, index) => (
          <article className="info-card" key={step.title}>
            <span className="card-index">0{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
