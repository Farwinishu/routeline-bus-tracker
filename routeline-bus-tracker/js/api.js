/* ============================================================
   Small fetch wrapper shared by every page.
   Adds the admin bearer token automatically when auth:true,
   and turns non-2xx / network failures into readable Errors.
   ============================================================ */

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = sessionStorage.getItem('rl_admin_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`Can't reach the RouteLine server at ${API_BASE}. Is the backend running?`);
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body is fine */ }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

/** Shows a dismissible red banner at the top of the page for connection/API errors. */
function showApiError(err) {
  console.error(err);
  if (document.querySelector('.api-error-banner')) return; // don't stack duplicates
  const banner = document.createElement('div');
  banner.className = 'api-error-banner';
  banner.innerHTML = `⚠ ${err.message || 'Something went wrong talking to the server.'}
    &nbsp;·&nbsp; Start it with <code>cd backend && npm install && npm start</code>
    &nbsp;<a href="javascript:location.reload()">Retry</a>`;
  document.body.prepend(banner);
}
