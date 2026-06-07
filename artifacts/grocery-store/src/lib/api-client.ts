const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

let csrfToken: string | null = null;

function getCsrfFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

async function ensureCsrfToken(): Promise<string> {
  const fromCookie = getCsrfFromCookie();
  if (fromCookie) {
    csrfToken = fromCookie;
    return csrfToken;
  }
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API}/csrf-token`, { credentials: "include" });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken!;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function apiRequest(path: string, options?: RequestInit) {
  const method = (options?.method || "GET").toUpperCase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!SAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    headers["x-csrf-token"] = token;
  }

  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
    ...options,
  });

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    if (body.message?.includes("CSRF")) {
      csrfToken = null;
      const token = await ensureCsrfToken();
      headers["x-csrf-token"] = token;
      const retry = await fetch(`${API}${path}`, {
        credentials: "include",
        headers: { ...headers, ...(options?.headers as Record<string, string>) },
        ...options,
      });
      if (!retry.ok) {
        const retryBody = await retry.json().catch(() => ({ message: retry.statusText }));
        throw new Error(retryBody.message || retry.statusText);
      }
      return retry.json();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || res.statusText);
  }
  return res.json();
}

export async function validateCoupon(code: string, orderTotal: number) {
  return apiRequest("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, orderTotal }),
  });
}
