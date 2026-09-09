/* ─── Bridge Point — API Client ─── */

// Ignore any retired Railway value that may still be present in a deployment.
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
let API_BASE =
  configuredApiUrl && !/railway\.app/i.test(configuredApiUrl)
    ? configuredApiUrl
    : process.env.NODE_ENV === "production"
      ? "https://bridge-point.onrender.com"
      : "http://127.0.0.1:8000";

// Remove trailing slash
API_BASE = API_BASE.replace(/\/$/, '');

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

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    });

    if (!res.ok) {
      // Token expired or invalid — clear auth and redirect to login
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("bp_token");
        localStorage.removeItem("bp_user");
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API Error: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  /* ─── Auth ─── */
  register(data: {
    email: string;
    phone: string;
    password: string;
    full_name: string;
    role: string;
    labor_category?: string;
    skills?: string[];
    city?: string;
    bio?: string;
  }) {
    return this.request<{
      access_token: string;
      token_type: string;
      user: import("./types").User;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  login(email: string, password: string) {
    return this.request<{
      access_token: string;
      token_type: string;
      user: import("./types").User;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request<import("./types").User>("/api/auth/me");
  }

  activateRole(role: string) {
    return this.request<import("./types").User>(`/api/auth/activate-role?role=${role}`, {
      method: "POST",
    });
  }

  /* ─── Jobs ─── */
  createJob(data: Record<string, unknown>) {
    return this.request<import("./types").Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  listJobs(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<import("./types").JobListResponse>(`/api/jobs${qs}`);
  }

  getJob(id: number) {
    return this.request<import("./types").Job>(`/api/jobs/${id}`);
  }

  updateJobStatus(jobId: number, status: string) {
    return this.request<import("./types").Job>(`/api/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  getMyJobs(page = 1) {
    return this.request<import("./types").JobListResponse>(
      `/api/jobs/employer/my-jobs?page=${page}`
    );
  }

  getActiveTasksAsLabor(page = 1) {
    return this.request<import("./types").JobListResponse>(
      `/api/jobs/labor/active-tasks?page=${page}`
    );
  }

  getLaborJobHistory(page = 1) {
    return this.request<import("./types").JobListResponse>(
      `/api/jobs/labor/history?page=${page}`
    );
  }

  repostJob(jobId: number, dateOfTask: string) {
    return this.request<import("./types").Job>(
      `/api/jobs/${jobId}/repost?date_of_task=${encodeURIComponent(dateOfTask)}`,
      { method: "POST" }
    );
  }

  acceptTask(jobId: number) {
    return this.request<import("./types").Job>(
      `/api/jobs/${jobId}/accept-task`,
      { method: "POST" }
    );
  }

  getJobTransitions(jobId: number) {
    return this.request<
      { id: number; from_status: string; to_status: string; created_at: string }[]
    >(`/api/jobs/${jobId}/transitions`);
  }

  /* ─── Applications ─── */
  applyToJob(jobId: number, coverNote?: string) {
    return this.request<import("./types").Application>("/api/applications", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, cover_note: coverNote }),
    });
  }

  getJobApplications(jobId: number) {
    return this.request<import("./types").Application[]>(
      `/api/applications/job/${jobId}`
    );
  }

  acceptApplication(applicationId: number) {
    return this.request<import("./types").Application>(
      `/api/applications/${applicationId}/accept`,
      { method: "POST" }
    );
  }

  getMyApplications() {
    return this.request<import("./types").Application[]>(
      "/api/applications/labor/my-applications"
    );
  }

  getLaborHistory() {
    return this.request<import("./types").Application[]>(
      "/api/applications/labor/history"
    );
  }

  /* ─── Reviews ─── */
  createReview(data: {
    job_id: number;
    reviewee_id: number;
    rating: number;
    comment?: string;
  }) {
    return this.request<import("./types").Review>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getUserReviews(userId: number) {
    return this.request<import("./types").Review[]>(
      `/api/reviews/user/${userId}`
    );
  }

  /* ─── Favorites ─── */
  addFavorite(laborId: number) {
    return this.request<import("./types").Favorite>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ labor_id: laborId }),
    });
  }

  getFavorites() {
    return this.request<import("./types").Favorite[]>("/api/favorites");
  }

  removeFavorite(favoriteId: number) {
    return this.request<void>(`/api/favorites/${favoriteId}`, {
      method: "DELETE",
    });
  }

  /* ─── Payments — see Platform Custody section below ─── */

  /* ─── Calls ─── */
  getCallHistory(page = 1) {
    return this.request<import("./types").CallHistoryResponse>(
      `/api/calls/history?page=${page}`
    );
  }

  getCallDetail(callId: number) {
    return this.request<import("./types").CallLog>(
      `/api/calls/${callId}`
    );
  }

  /* ─── Messages (Chat) ─── */
  sendMessage(jobId: number, content: string) {
    return this.request<{
      id: number;
      job_id: number;
      sender_id: number;
      sender_name: string | null;
      content: string;
      created_at: string;
    }>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, content }),
    });
  }

  getJobMessages(jobId: number, page = 1) {
    return this.request<
      {
        id: number;
        job_id: number;
        sender_id: number;
        sender_name: string | null;
        content: string;
        created_at: string;
      }[]
    >(`/api/messages/job/${jobId}?page=${page}`);
  }

  getCooperativeMessageJobs() {
    return this.request<{ id: number; title: string; city: string; employer_name: string | null; worker_name: string | null }[]>("/api/messages/cooperative/jobs");
  }

  /* ─── Private Requests (Direct Rehire) ─── */
  sendPrivateRequest(data: { job_id: number; labor_id: number; message?: string }) {
    return this.request<import("./types").PrivateRequest>("/api/private-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMyPrivateRequests() {
    return this.request<import("./types").PrivateRequest[]>(
      "/api/private-requests/my"
    );
  }

  respondPrivateRequest(
    requestId: number,
    action: "accept" | "deny",
    updatedDescription?: string
  ) {
    return this.request<import("./types").PrivateRequest>(
      `/api/private-requests/${requestId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ action, updated_description: updatedDescription }),
      }
    );
  }

  /* ─── Platform Custody Payments (UPI QR) ─── */
  adminMarkCompleted(jobId: number) {
    return this.request<{ message: string; status: string }>(
      `/api/payments/${jobId}/complete`,
      { method: "POST" }
    );
  }

  initiatePayment(jobId: number, paymentMethod: string) {
    return this.request<{
      message: string; status: string;
      platform_upi_id: string; platform_upi_name: string;
      amount: number; platform_commission: number; worker_payout: number;
    }>("/api/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, payment_method: paymentMethod }),
    });
  }

  markPaymentSent(jobId: number, upiReference?: string) {
    return this.request<{ message: string; status: string; payment_sent_at: string }>(
      `/api/payments/${jobId}/mark-sent`,
      {
        method: "POST",
        body: JSON.stringify({ upi_reference: upiReference || null }),
      }
    );
  }

  adminVerifyPayment(jobId: number) {
    return this.request<{ message: string; status: string }>(
      `/api/payments/${jobId}/verify`,
      { method: "POST" }
    );
  }

  adminReleasePayout(jobId: number) {
    return this.request<{
      message: string; status: string;
      worker_payout: number; platform_commission: number;
    }>(
      `/api/payments/${jobId}/release-payout`,
      { method: "POST" }
    );
  }

  getAdminPending() {
    return this.request<{
      jobs: {
        id: number; title: string; status: string;
        employer_name: string | null; worker_name: string | null;
        budget: number; platform_commission: number; worker_payout: number;
        payment_method: string | null; payment_sent_at: string | null;
        created_at: string | null;
      }[];
      total: number;
    }>("/api/payments/admin/pending");
  }

  getPlatformInfo() {
    return this.request<{ upi_id: string; upi_name: string }>(
      "/api/payments/platform-info"
    );
  }

  getAvailability() { return this.request<import("./types").WorkerAvailability>("/api/workers/me/availability"); }
  updateAvailability(isAvailable: boolean) { return this.request<import("./types").WorkerAvailability>("/api/workers/me/availability", { method: "PATCH", body: JSON.stringify({ is_available: isAvailable }) }); }
  getCertifications() { return this.request<import("./types").Certification[]>("/api/workers/me/certifications"); }
  addCertification(data: { name: string; issuing_organization: string; issue_date: string; expiry_date?: string; credential_id?: string }) { return this.request<import("./types").Certification>("/api/workers/me/certifications", { method: "POST", body: JSON.stringify(data) }); }
  getWelfare() { return this.request<import("./types").WelfareRecord[]>("/api/workers/me/welfare"); }
  saveWelfare(data: { support_type: string; status: string; eligibility?: string; notes?: string }) { return this.request<import("./types").WelfareRecord>("/api/workers/me/welfare", { method: "POST", body: JSON.stringify(data) }); }
  getInsurance() { return this.request<import("./types").InsurancePolicy[]>("/api/workers/me/insurance"); }
  addInsurance(data: Record<string, unknown>) { return this.request<import("./types").InsurancePolicy>("/api/workers/me/insurance", { method: "POST", body: JSON.stringify(data) }); }
  getInvoice(jobId: number) { return this.request<import("./types").Invoice>("/api/invoices/job/" + jobId); }
  getNotifications() { return this.request<import("./types").Notification[]>("/api/notifications"); }
  markNotificationRead(id: number) { return this.request<import("./types").Notification>("/api/notifications/" + id + "/read", { method: "PATCH" }); }
  createEmergency(data: { category: string; urgency: string; description: string; address: string; city: string }) { return this.request<import("./types").EmergencyRequest>("/api/emergency", { method: "POST", body: JSON.stringify(data) }); }
  getMyEmergencies() { return this.request<import("./types").EmergencyRequest[]>("/api/emergency/mine"); }
  getOpenEmergencies() { return this.request<import("./types").EmergencyRequest[]>("/api/emergency/open"); }
  respondToEmergency(id: number) { return this.request<import("./types").EmergencyRequest>("/api/emergency/" + id + "/respond", { method: "POST" }); }
  updateEmergencyStatus(id: number, status: string) { return this.request<import("./types").EmergencyRequest>("/api/emergency/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }); }
  getWageBenchmark(city?: string, skill?: string) { const qs = new URLSearchParams(); if (city) qs.set("city", city); if (skill) qs.set("skill", skill); return this.request<Record<string, unknown>>("/api/wage-benchmark" + (qs.toString() ? "?" + qs : "")); }

  /* ─── Cooperative reporting ─── */
  getCooperativeOverview() { return this.request<{
    members: number; verified_workers: number; active_jobs: number;
    cooperative_revenue: number; jobs_total: number; source: string;
  }>("/api/cooperative/overview"); }
  getCooperativeMembers() { return this.request<{
    id: number; name: string; email: string; city: string; skills: string[];
    verified: boolean; created_at: string;
  }[]>("/api/cooperative/members"); }
  getDemandForecast(days = 7, location?: string) { return this.request<{ forecast: {
    skill: string; location: string; forecast_period_days: number; predicted_jobs: number;
    recent_jobs_30d: number; confidence: string; method: string;
  }[]; location: string; generated_at: string }>(`/api/cooperative/demand-forecast?days=${days}${location ? `&location=${encodeURIComponent(location)}` : ""}`); }
  getWorkforceAllocation() { return this.request<{ workforce: {
    skill: string; predicted_jobs: number; qualified_workers: number; available_workers: number;
    gap: number; recommendation: string; confidence: string;
  }[] }>("/api/cooperative/workforce"); }
  getCooperativeAnalytics() { return this.request<{
    jobs_posted: number; jobs_completed: number; completion_rate: number;
    average_job_value: number; jobs_by_category: Record<string, number>; jobs_by_city: Record<string, number>;
  }>("/api/cooperative/analytics"); }
  listFederations() { return this.request<import("@/lib/types").Federation[]>("/api/federations"); }
  createFederation(data: Record<string, unknown>) { return this.request<import("@/lib/types").Federation>("/api/federations", { method: "POST", body: JSON.stringify(data) }); }
  getFederation(id: number) { return this.request<import("@/lib/types").Federation>(`/api/federations/${id}`); }
  updateFederation(id: number, data: Record<string, unknown>) { return this.request<import("@/lib/types").Federation>(`/api/federations/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
  listSocieties(params?: { federation_id?: number; search?: string; status?: string }) { const query = new URLSearchParams(); if (params?.federation_id) query.set("federation_id", String(params.federation_id)); if (params?.search) query.set("search", params.search); if (params?.status) query.set("status", params.status); return this.request<import("@/lib/types").Society[]>(`/api/societies${query.toString() ? `?${query}` : ""}`); }
  createSociety(federationId: number, data: Record<string, unknown>) { return this.request<import("@/lib/types").Society>(`/api/societies?federation_id=${federationId}`, { method: "POST", body: JSON.stringify(data) }); }
  getSociety(id: number) { return this.request<import("@/lib/types").Society>(`/api/societies/${id}`); }
  updateSociety(id: number, data: Record<string, unknown>) { return this.request<import("@/lib/types").Society>(`/api/societies/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
  listSocietyMembers(id: number) { return this.request<import("@/lib/types").CooperativeMembership[]>(`/api/societies/${id}/members`); }
  addSocietyMember(id: number, data: { user_id: number; membership_type?: string; membership_number?: string }) { return this.request<import("@/lib/types").CooperativeMembership>(`/api/societies/${id}/members`, { method: "POST", body: JSON.stringify(data) }); }
  getMembership(id: number) { return this.request<import("@/lib/types").CooperativeMembership>(`/api/memberships/${id}`); }
  getMyMemberships() { return this.request<import("@/lib/types").CooperativeMembership[]>("/api/memberships/me"); }
  updateMembership(id: number, status: string) { return this.request<import("@/lib/types").CooperativeMembership>(`/api/memberships/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
  verifyMembership(id: number) { return this.request<import("@/lib/types").CooperativeMembership>(`/api/memberships/${id}/verify`, { method: "POST" }); }
  suspendMembership(id: number) { return this.request<import("@/lib/types").CooperativeMembership>(`/api/memberships/${id}/suspend`, { method: "POST" }); }
}

export const api = new ApiClient();
