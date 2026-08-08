/* Shared shell for every admin page: auth guard + sidebar + topbar.
   Call `await initAdminShell(activeKey, title, eyebrow)` at the top of each
   admin page's script before rendering page-specific data. */

const ADMIN_NAV = [
  { key: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>' },
  { key: 'buses', href: 'buses.html', label: 'Buses', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="12" width="16" height="6" rx="1.2" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="20" r="1.4" fill="currentColor"/><circle cx="16" cy="20" r="1.4" fill="currentColor"/></svg>' },
  { key: 'routes', href: 'routes.html', label: 'Routes', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="18" r="2.4" stroke="currentColor" stroke-width="1.8"/><path d="M8 7 L16 17" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 3"/></svg>' },
  { key: 'payments', href: 'payments.html', label: 'Payments', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/></svg>' },
];

/** Verifies the session with the backend, redirecting to login if it's missing/expired, then renders the shell. */
async function initAdminShell(activeKey, pageTitle, eyebrow) {
  if (!RL.isAdminLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    await RL.verifyAdminSession();
  } catch (err) {
    RL.adminLogout();
    window.location.href = 'login.html';
    return false;
  }

  const navHtml = ADMIN_NAV.map(item => `
    <li><a href="${item.href}" class="${item.key === activeKey ? 'active' : ''}">${item.icon}<span>${item.label}</span></a></li>
  `).join('');

  document.getElementById('sidebarMount').innerHTML = `
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <span class="admin-brand-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" stroke="#F6F4EE" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="12" width="16" height="6" rx="1.2" stroke="#F6F4EE" stroke-width="1.8"/></svg></span>
        <div><strong>RouteLine</strong><small>Admin console</small></div>
      </div>
      <ul class="admin-nav">${navHtml}</ul>
      <div class="admin-sidebar-foot">
        <a href="../index.html">↩ View passenger site</a>
        <a href="#" id="logoutLink">⏻ Sign out</a>
      </div>
    </aside>
  `;

  const adminInfo = RL.getAdminInfo();
  document.getElementById('topbarMount').innerHTML = `
    <div class="admin-topbar">
      <div>
        <span class="eyebrow">${eyebrow || 'RouteLine Admin'}</span>
        <h1>${pageTitle}</h1>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:34px;height:34px;border-radius:50%;background:var(--a-teal);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:var(--font-display);font-size:13px;" title="${adminInfo && adminInfo.email ? adminInfo.email : ''}">A</div>
      </div>
    </div>
  `;

  document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    RL.adminLogout();
    window.location.href = 'login.html';
  });

  return true;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
