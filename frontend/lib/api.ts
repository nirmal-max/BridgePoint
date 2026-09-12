/* ─── Bridge Point — API Client ─── */

// In the browser, always use a relative base so requests go through the
// Next.js rewrite proxy (/api/* → FastAPI). This means no backend host is
// baked into the JS bundle.
const API_BASE: string =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '') || 'http://127.0.0.1:8000')
    : '';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bp_token");
  }

  private headers(withAuth = true): HeadersInit {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (withAuth) {
      const token = this.getToken();
      if (token) h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...this.headers(), ...(options.headers || {}) } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const isAuthEndpoint = path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
      if (res.status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
        const hadToken = !!localStorage.getItem("bp_token");
        localStorage.removeItem("bp_token");
        localStorage.removeItem("bp_user");
        if (hadToken && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) window.location.href = "/login";
      }
      throw new Error(err.detail || `API Error: ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private json<T>(path: string, body: unknown, method = "POST") {
    return this.request<T>(path, { method, body: JSON.stringify(body) });
  }

  register(data: { email: string; phone: string; password: string; full_name: string; role: string; labor_category?: string; skills?: string[]; city?: string; bio?: string; }) {
    return this.request<{ access_token: string; token_type: string; user: import("./types").User }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string; user: import("./types").User }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  }

  voiceOnboard(audio: Blob, language: string) {
    const form = new FormData();
    form.append("audio", audio, "voice.webm");
    form.append("preferred_language", language);
    form.append("language_hint", language);
    form.append("language", language);
    const token = this.getToken();
    return this.request<{
      status: "success";
      transcript: string;
      transcription: string;
      structured_profile: {
        name: string;
        primary_skill: string | null;
        sub_skills: string[];
        experience_years: number;
        base_rate_inr: number;
        operating_zone: string | null;
        transcript: string;
        language: string;
      };
    }>("/api/workers/voice-onboard", { method: "POST", body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  }
}

export const api = new ApiClient();
export { API_BASE };
