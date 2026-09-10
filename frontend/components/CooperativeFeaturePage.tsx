"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Icon, { type IconName } from "@/components/Icon";
import type { AdminPendingPayment, CertificationReview } from "@/lib/types";
import ProviderVerificationPanel from "@/components/ProviderVerificationPanel";

type Section = "members" | "worker-profile" | "verification" | "demand-forecast" | "workforce" | "revenue" | "analytics" | "jobs" | "training" | "settings" | "notifications" | "wage-benchmark";

const links: readonly [string, string, IconName][] = [
  ["/admin", "Dashboard", "dashboard"],
  ["/admin/federation", "Federation", "users"],
  ["/admin/societies", "Societies", "card"],
  ["/admin/members", "Members / Workers", "users"],
  ["/admin/jobs", "Job Management", "tools"],
  ["/admin/worker-profile", "Worker Profile", "search"],
  ["/admin/verification", "Verification Center", "shield"],
  ["/admin/demand-forecast", "AI Demand Forecast", "search"],
  ["/admin/workforce", "Workforce Allocation", "users"],
  ["/admin/revenue", "Earnings & Revenue", "wallet"],
  ["/admin/wage-benchmark", "Wage Benchmark", "card"],
  ["/admin/training", "Training & Welfare", "shield"],
  ["/admin/analytics", "Analytics & Reports", "dashboard"],
  ["/admin/messages", "Messages", "chat"],
  ["/admin/notifications", "Notifications", "bell"],
  ["/admin/settings", "Settings", "settings"],
];

const copy: Record<Section, [string, string, string[]]> = {
  members: ["Members / Workers", "Manage cooperative members and verification progress.", ["Member directory", "Verification status", "Worker skills"]],
  "worker-profile": ["Worker Profile", "Review worker identity, skills, and cooperative membership.", ["Identity status", "Skill certifications", "Insurance status"]],
  verification: ["Verification Center", "Review worker documents and verification states.", ["Verified", "Pending review", "Needs attention"]],
  "demand-forecast": ["AI Demand Forecast", "Plan supply against expected service demand.", ["Predicted demand", "Forecast confidence", "Historical basis"]],
  workforce: ["Workforce Allocation", "Allocate verified workers using demand, skills, and availability.", ["Expected demand", "Available qualified workers", "Workforce gap"]],
  revenue: ["Earnings & Revenue", "Review cooperative revenue and recorded payment activity.", ["Cooperative share", "Platform commission", "Welfare and training fund"]],
  analytics: ["Analytics & Reports", "Track operational performance across your cooperative.", ["Jobs completed", "Worker growth", "Service performance"]],
  jobs: ["Job Management", "Review jobs and operational status from the existing job system.", ["Posted jobs", "Assigned jobs", "Completed jobs"]],
  training: ["Training & Welfare", "Track worker development and clearly separate live data from future provider integrations.", ["Skills", "Training pathways", "Welfare integrations are not connected"]],
  settings: ["Settings", "Review cooperative account and access settings.", ["Account access", "Notifications", "Backend permissions"]],
  notifications: ["Notifications", "Review persisted cooperative operations notifications.", ["Unread events", "Job updates", "Payment updates"]],
  "wage-benchmark": ["Wage Benchmark", "Compare recorded BridgePoint job values without inventing market statistics.", ["Average", "Median", "Recorded range"]],
};

export default function CooperativeFeaturePage({ section }: { section: Section }) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");

  const cooperativeAccess = !!user && (user.is_admin || user.roles?.includes("cooperative") || getActiveWorkspaceRole() === "cooperative");

  useEffect(() => {
    if (!loading && !user) router.replace(`/signin?role=cooperative&next=${encodeURIComponent(`/admin/${section}`)}`);
    else if (!loading && user && !cooperativeAccess) router.replace("/dashboard");
  }, [cooperativeAccess, loading, router, section, user]);

  useEffect(() => {
    if (!user) return;
    const load = section === "members" ? api.getCooperativeMembers()
      : section === "demand-forecast" ? api.getDemandForecast()
      : section === "workforce" ? api.getWorkforceAllocation()
      : section === "analytics" ? api.getCooperativeAnalytics()
      : section === "notifications" ? api.getNotifications()
      : section === "wage-benchmark" ? api.getWageBenchmark(user.city || undefined)
      : section === "jobs" ? api.getAdminPending()
      : api.getCooperativeOverview();
      
    load.then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load cooperative data."));
  }, [section, user]);

  if (loading || !cooperativeAccess) return <div className="grid min-h-screen place-items-center bg-[var(--color-bp-white)] text-[var(--color-bp-gray-500)]">Checking cooperative access...</div>;

  const [title, description, cards] = copy[section];
  const rows = Array.isArray(data) ? data : data && typeof data === "object" ? Object.entries(data as Record<string, unknown>).map(([label, value]) => ({ label, value })) : [];
  
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "Not available";
    if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(", ");
    if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key.replaceAll("_", " ")}: ${formatValue(item)}`).join(" · ");
    return String(value);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bp-white)] text-[var(--color-bp-black)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--color-bp-gray-200)] bg-white p-5 transition-transform lg:static lg:block lg:w-64 lg:translate-x-0 overflow-y-auto`}>
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-xl font-semibold tracking-tight">
              Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
            </Link>
            <button aria-label="Close navigation" className="lg:hidden text-[var(--color-bp-gray-500)] hover:bg-[var(--color-bp-gray-100)] rounded-lg p-2" onClick={() => setMobileNav(false)}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className="mb-7 mt-1 text-xs text-[var(--color-bp-gray-500)]">Work that matters. People who care.</p>
          <nav className="space-y-1">
            {links.map(([href, label, icon]) => (
              <Link key={href} href={href} onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${pathname === href ? "bg-blue-50 font-semibold text-[var(--color-bp-blue)]" : "text-[var(--color-bp-gray-700)] hover:bg-[var(--color-bp-gray-100)]"}`}>
                <Icon name={icon} size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="mt-8 w-full rounded-xl border border-red-200 px-3 py-2.5 text-left text-sm font-medium text-[var(--color-bp-red)] hover:bg-red-50 transition-colors">Sign Out</button>
        </aside>

        {/* Mobile overlay */}
        {mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileNav(false)} />}

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[var(--color-bp-gray-200)] bg-white/90 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation" className="mr-1 rounded-lg border border-[var(--color-bp-gray-200)] px-3 py-2 lg:hidden" onClick={() => setMobileNav(true)}>
                <span className="block h-0.5 w-5 bg-[var(--color-bp-gray-700)] shadow-[0_-6px_0_var(--color-bp-gray-700),0_6px_0_var(--color-bp-gray-700)]" />
              </button>
              <Link href="/admin" className="text-xl font-semibold tracking-tight lg:hidden">
                Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
              </Link>
              <span className="ml-auto hidden text-sm font-medium text-[var(--color-bp-gray-500)] md:block">{user?.city || "Cooperative workspace"} · Admin</span>
            </div>
          </header>

          <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
            {/* Header section */}
            <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-gradient-to-br from-white to-blue-50/50 p-6 shadow-sm">
              <p className="text-sm font-medium text-[var(--color-bp-blue)]">BridgePoint / Cooperative</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 max-w-2xl text-[var(--color-bp-gray-600)]">{description}</p>
            </div>

            {error && (
              <div className="rounded-2xl border border-[var(--color-bp-red)] bg-red-50 p-4 text-sm text-[var(--color-bp-red)]">
                {error}
              </div>
            )}

            {section === "jobs" && <PaymentOperationsPanel data={data as { jobs: AdminPendingPayment[]; total: number } | null} />}

            {section !== "jobs" && (
              <section className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => (
                  <article key={card} className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <h2 className="font-bold text-[var(--color-bp-black)]">{card}</h2>
                    <p className="mt-3 text-sm text-[var(--color-bp-gray-500)]">Live data is loaded from the cooperative reporting API.</p>
                  </article>
                ))}
              </section>
            )}

            {section === "verification" && (
              <>
                <VerificationPanel />
                <ProviderVerificationPanel />
              </>
            )}

            {section !== "jobs" && (
              <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight">Live cooperative data</h2>
                {data ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {rows.map((row, index) => (
                      <article key={index} className="rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-4 transition-colors hover:bg-white hover:border-[var(--color-bp-gray-200)]">
                        <div className="text-sm font-bold capitalize text-[var(--color-bp-black)]">{String((row as { label?: unknown }).label || (row as Record<string, unknown>).name || "Record")}</div>
                        <div className="mt-2 text-sm text-[var(--color-bp-gray-600)] font-mono">{formatValue((row as { value?: unknown }).value ?? row)}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">Loading backend data...</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PaymentOperationsPanel({ data }: { data: { jobs: AdminPendingPayment[]; total: number } | null }) {
  const [items, setItems] = useState<AdminPendingPayment[]>([]);
  const [action, setAction] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { if (data) setItems(data.jobs); }, [data]);

  async function refresh() {
    try { const result = await api.getAdminPending(); setItems(result.jobs); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to refresh payment operations."); }
  }

  async function verify(id: number) {
    setAction(id); setError("");
    try { await api.adminVerifyPayment(id); await refresh(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to verify payment."); }
    finally { setAction(null); }
  }

  async function release(id: number) {
    setAction(id); setError("");
    try { await api.adminReleasePayout(id); await refresh(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to release payout."); }
    finally { setAction(null); }
  }

  const statusLabel = (status: string) => ({ payment_in_process: "Pending payment", verification_pending: "Payment received / awaiting verification", verified: "Payment verified / payout pending", payout_released: "Worker payout completed" }[status] || status);
  const getBadgeClass = (status: string) => {
    if (status === "verified") return "badge-success";
    if (status === "verification_pending") return "badge-warning";
    return "badge-info";
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Payment Operations</h2>
        <p className="mt-2 text-sm text-[var(--color-bp-gray-600)]">Customer payment is received by BridgePoint admin, then manually verified before the worker payout is released.</p>
        <p className="mt-2 text-xs font-medium text-[var(--color-bp-gray-500)]">Payment is only released after work is completed. If work is not completed, do not release the payout; any return is an admin-managed return to the original payer.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)] border border-red-100">{error}</p>}
      </div>

      {data === null ? (
        <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 text-[var(--color-bp-gray-500)]">Loading payment operations...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 text-[var(--color-bp-gray-500)]">No pending payment operations.</div>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-bp-gray-100)] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-bp-black)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-bp-gray-500)] font-medium">Customer: {item.employer_name || "Not available"} · Worker: {item.worker_name || "Not assigned"}</p>
              </div>
              <span className={`badge ${getBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
            </div>
            
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 bg-[var(--color-bp-gray-50)] rounded-xl p-4 border border-[var(--color-bp-gray-100)]">
              <div>
                <p className="text-[var(--color-bp-gray-500)] mb-1">Invoice amount</p>
                <b className="text-lg text-[var(--color-bp-black)]">₹{item.employer_total.toLocaleString("en-IN")}</b>
              </div>
              <div>
                <p className="text-[var(--color-bp-gray-500)] mb-1">Worker payout</p>
                <b className="text-lg text-[var(--color-bp-blue)]">₹{item.worker_payout.toLocaleString("en-IN")}</b>
              </div>
              <div>
                <p className="text-[var(--color-bp-gray-500)] mb-1">Registered payment number</p>
                <b className="font-mono">{item.worker_payment_number || "Not registered"}</b>
              </div>
              <div>
                <p className="text-[var(--color-bp-gray-500)] mb-1">Transaction reference</p>
                <b className="font-mono">{item.upi_reference || "Not submitted"}</b>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {item.status === "verification_pending" && (
                <button disabled={action === item.id} onClick={() => verify(item.id)} className="btn-primary !py-2 !px-4 !text-sm whitespace-nowrap">
                  {action === item.id ? "Verifying..." : "Confirm payment received"}
                </button>
              )}
              {item.status === "verified" && (
                <button disabled={action === item.id} onClick={() => release(item.id)} className="btn-primary !py-2 !px-4 !text-sm !bg-[var(--color-bp-green)] hover:!bg-[#166534] whitespace-nowrap">
                  {action === item.id ? "Releasing..." : "Release worker payout"}
                </button>
              )}
              <Link href={`/jobs/${item.id}`} className="btn-secondary !py-2 !px-4 !text-sm">View job details</Link>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function VerificationPanel() {
  const [items, setItems] = useState<CertificationReview[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => { api.getCertificationQueue().then(setItems).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load certification queue.")); }, []);

  async function verify(id: number) {
    setSaving(id); setError("");
    try {
      const updated = await api.verifyCertification(id);
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...updated, worker_name: item.worker_name } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify certification.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight">Certification review queue</h2>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)] border border-red-100">{error}</p>}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-bp-gray-500)]">No worker certifications are waiting for review.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-5 transition-all hover:bg-white hover:shadow-sm">
              <div>
                <b className="text-[var(--color-bp-black)] text-lg">{item.name}</b>
                <p className="text-sm font-medium text-[var(--color-bp-gray-700)] mt-1">{item.worker_name} · {item.issuing_organization}</p>
                <p className="text-xs text-[var(--color-bp-gray-500)] mt-1"><span className={`badge ${item.verification_status === "VERIFIED" ? "badge-success" : "badge-warning"} !text-[10px]`}>{item.verification_status}</span> · issued {item.issue_date}</p>
              </div>
              {item.verification_status !== "VERIFIED" && (
                <button disabled={saving === item.id} onClick={() => verify(item.id)} className="btn-primary !py-2 !px-6 !text-sm">
                  {saving === item.id ? "Verifying..." : "Verify Credential"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
