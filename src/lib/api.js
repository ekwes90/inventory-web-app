// Small fetch wrapper that attaches access token (stored in a cookie) and attempts refresh via HttpOnly refresh cookie on 401
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\\[\\]\\/\\+^])/g, "\\$1") + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

async function requestWithToken(input, init = {}) {
  const token = getCookie('inventory_token');
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  // include credentials so refresh cookie is sent when attempting refresh
  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  return res;
}

export async function apiFetch(input, init = {}) {
  let res = await requestWithToken(input, init);
  if (res.status !== 401) return res;

  // try refresh using server-side HttpOnly refresh cookie
  const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!r.ok) {
    // clear client-visible access token cookie
    document.cookie = 'inventory_token=; path=/; Max-Age=0';
    return res;
  }
  const rb = await r.json();
  if (rb.token) {
    // store new access token in a non-HttpOnly cookie so client can attach Authorization header
    document.cookie = 'inventory_token=' + encodeURIComponent(rb.token) + '; path=/';
    // retry original request with new token
    res = await requestWithToken(input, init);
    return res;
  }
  return res;
}
