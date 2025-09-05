// Static GitHub Pages app for Monthly Challenges
const App = (() => {
  const paths = {
    challenges: 'data/challenges.json',
    leaderboard: 'data/leaderboard.json',
    winners: 'data/winners.json'
  };

  const qs = (sel, parent=document) => parent.querySelector(sel);

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit' });
  }

  function setYear() {
    const y = new Date().getFullYear();
    const el = qs('#year');
    if (el) el.textContent = y;
  }

  async function loadJSON(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.json();
  }

  function renderLeaderboardTable(rows, {limit=null}={}) {
    let data = [...rows];
    if (limit) data = data.slice(0, limit);
    const html = [`<table class="table"><thead><tr><th>#</th><th>Name</th><th>Score</th><th>Submitted</th></tr></thead><tbody>`];
    data.forEach((r, i) => {
      const when = r.submittedAt ? fmtDate(r.submittedAt) : '—';
      html.push(`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.score}</td><td>${when}</td></tr>`);
    });
    html.push('</tbody></table>');
    return html.join('');
  }

  function countdown(el, endISO) {
    function tick() {
      const now = new Date();
      const end = new Date(endISO);
      const diff = end - now;
      if (diff <= 0) {
        el.textContent = 'Challenge window closed';
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      const days = Math.floor(s / 86400);
      const hrs = Math.floor((s % 86400) / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      el.textContent = `${days}d ${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    }
    tick();
    const timer = setInterval(tick, 1000);
    return timer;
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function statusBadge(el, status) {
    const map = { open: 'open', upcoming: 'upcoming', closed: 'closed' };
    el.className = 'badge ' + (map[status] || '');
    el.textContent = (status || '').toUpperCase();
  }

  function challengesById(items) {
    const m = new Map();
    items.forEach(c => m.set(c.id, c));
    return m;
  }

  async function initHome() {
    setYear();
    const [ch, lb, win] = await Promise.all([
      loadJSON(paths.challenges),
      loadJSON(paths.leaderboard),
      loadJSON(paths.winners)
    ]);

    // Current challenge
    const currentId = ch.current;
    const current = ch.items.find(x => x.id === currentId) || ch.items[0];
    const wrap = qs('#current-challenge-content');
    if (current && wrap) {
      const status = current.status || 'open';
      const end = current.end;
      const files = Array.isArray(current.pdf) ? current.pdf : [current.pdf].filter(Boolean);
      const links = files.map((f,i) => `<a href="${f}" target="_blank" rel="noopener">PDF ${files.length>1? i+1 : ''}</a>`).join(' ');

      wrap.innerHTML = `
        <div class="challenge-title-row">
          <h3>${current.title}</h3>
          <div class="badge ${status}">${status.toUpperCase()}</div>
        </div>
        <p class="lead">${current.blurb || ''}</p>
        <div class="timer-row">
          <div class="timer-label">Time Remaining:</div>
          <div id="home-countdown" class="countdown">—</div>
        </div>
        <div class="file-links">${links}</div>
        <p class="muted small" id="home-window">Opens ${fmtDate(current.start)} — Closes ${fmtDate(current.end)}</p>
        <p><a href="challenge.html?id=${current.id}">View challenge page →</a></p>
      `;
      const el = qs('#home-countdown');
      if (el && end) countdown(el, end);
    }

    // Leaderboard preview for current challenge
    const preview = qs('#leaderboard-preview');
    if (preview) {
      const cur = lb.filter(r => r.challengeId === current.id)
                    .sort((a,b) => b.score - a.score || new Date(a.submittedAt||0) - new Date(b.submittedAt||0));
      preview.innerHTML = renderLeaderboardTable(cur, {limit: 10});
    }

    // Winners
    const winners = qs('#winners-list');
    if (winners) {
      const out = [];
      win.slice(-5).reverse().forEach(w => {
        out.push(`<div><strong>${w.challengeId}</strong>: ` + (w.winners||[]).map(x => `${x.place}. ${x.name}`).join(' & ') + `</div>`);
      });
      winners.innerHTML = out.join('') || '<p class="muted">No winners recorded yet.</p>';
    }
  }

  async function initChallenge() {
    setYear();
    const id = getParam('id');
    const [ch, lb] = await Promise.all([
      loadJSON(paths.challenges),
      loadJSON(paths.leaderboard)
    ]);
    const lookup = challengesById(ch.items);
    const c = id ? lookup.get(id) : ch.items.find(x => x.id === ch.current) || ch.items[0];
    if (!c) {
      qs('#challenge-title').textContent = 'Challenge not found';
      return;
    }

    qs('.site-title').textContent = c.title;
    const statusEl = qs('#challenge-status');
    statusBadge(statusEl, c.status || 'open');
    qs('#challenge-title').textContent = c.title;
    qs('#challenge-blurb').textContent = c.blurb || '';

    // Files
    const files = (Array.isArray(c.pdf) ? c.pdf : [c.pdf]).filter(Boolean);
    const pdfLinks = qs('#pdf-links');
    if (pdfLinks && files.length) {
      pdfLinks.innerHTML = files.map((f,i)=>`<a href="${f}" target="_blank" rel="noopener">Download PDF ${files.length>1? i+1 : ''}</a>`).join(' ');
    } else if (pdfLinks) {
      pdfLinks.innerHTML = '<p class="muted">No files attached yet.</p>';
    }

    // Dates + countdown
    const windowDates = qs('#window-dates');
    windowDates.textContent = `Opens ${fmtDate(c.start)} — Closes ${fmtDate(c.end)}`;
    const cd = qs('#countdown');
    if (cd && c.end) countdown(cd, c.end);

    // Leaderboard for this challenge
    const table = qs('#leaderboard');
    const rows = lb.filter(r => r.challengeId === c.id)
                   .sort((a,b)=> b.score - a.score || new Date(a.submittedAt||0) - new Date(b.submittedAt||0));
    table.innerHTML = rows.length ? renderLeaderboardTable(rows) : '<p class="muted">No submissions yet.</p>';
  }

  async function initPast() {
    setYear();
    const ch = await loadJSON(paths.challenges);
    const archive = qs('#archive');
    const items = [...ch.items].sort((a,b) => (a.start || '').localeCompare(b.start || ''));
    const out = items.map(c => `
      <div class="card">
        <div class="challenge-title-row">
          <h3>${c.title}</h3>
          <div class="badge ${c.status || ''}">${(c.status || '').toUpperCase()}</div>
        </div>
        <p class="lead">${c.blurb || ''}</p>
        <p class="muted small">Opens ${fmtDate(c.start)} — Closes ${fmtDate(c.end)}</p>
        <p><a href="challenge.html?id=${c.id}">View challenge →</a></p>
      </div>
    `);
    archive.innerHTML = out.join('') || '<p class="muted">No challenges recorded yet.</p>';
  }

  return { initHome, initChallenge, initPast };
})();
