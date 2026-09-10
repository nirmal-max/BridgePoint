"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Icon, { type IconName } from "@/components/Icon";

const NAV: readonly [string, string, IconName][] = [
  ["/admin", "Dashboard", "service"],
  ["/admin/federation", "Federation", "users"],
  ["/admin/societies", "Societies", "users"],
  ["/admin/members", "Members / Workers", "user"],
  ["/admin/jobs", "Job Management", "briefcase"],
  ["/admin/demand-forecast", "Demand Forecast (AI)", "trendingUp"],
  ["/admin/workforce", "Workforce Allocation", "users"],
  ["/admin/revenue", "Earnings & Revenue", "card"],
  ["/admin/wage-benchmark", "Wage Benchmark", "wallet"],
  ["/admin/training", "Training & Welfare", "award"],
  ["/admin/verification", "Verifications", "shield"],
  ["/admin/analytics", "Analytics & Reports", "fileText"],
  ["/admin/messages", "Messages", "chat"],
  ["/admin/notifications", "Notifications", "bell"],
  ["/admin/settings", "Settings", "settings"],
];

const KPIS = [
  ["Total Members", "Worker records from the cooperative API"],
  ["Verified Workers", "Provider verification status"],
  ["Active Jobs", "Current job state totals"],
  ["Cooperative Earnings", "Recorded platform commission"],
];

export default function CooperativeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const demoCooperativeAccess = getActiveWorkspaceRole() === "cooperative";
  const cooperativeAccess = !!user && (user.is_admin || user.roles?.includes("cooperative") || demoCooperativeAccess);

  useEffect(() => {
    if (!user) router.replace("/signin?role=cooperative&next=%2Fadmin");
    else if (!cooperativeAccess) router.replace("/dashboard");
  }, [cooperativeAccess, router, user]);

  const [period, setPeriod] = useState("Next 7 Days");
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [notify, setNotify] = useState(false);
  const [profile, setProfile] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [demoWarning] = useState(() => (typeof window !== "undefined" ? sessionStorage.getItem("bp_demo_role_warning") || "" : ""));
  const [overview, setOverview] = useState<{ members: number; verified_workers: number; active_jobs: number; cooperative_revenue: number } | null>(null);
  const [forecastRows, setForecastRows] = useState<{ skill: string; predicted_jobs: number; confidence: string }[]>([]);
  const [workforceRows, setWorkforceRows] = useState<{ skill: string; qualified_workers: number; available_workers: number; gap: number; recommendation: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    api.getCooperativeOverview().then(setOverview).catch((err: unknown) => setJobsError(err instanceof Error ? err.message : "Unable to load cooperative reporting."));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const days = Number(period.match(/\d+/)?.[0] || 7);
    Promise.all([api.getDemandForecast(days), api.getWorkforceAllocation()])
      .then(([forecastResult, workforceResult]) => {
        setForecastRows(forecastResult.forecast);
        setWorkforceRows(workforceResult.workforce);
      })
      .catch((err: unknown) => setJobsError(err instanceof Error ? err.message : "Unable to load cooperative intelligence."));
  }, [period, user]);

  const filteredNav = useMemo(() => NAV.filter(([, label]) => label.toLowerCase().includes(search.toLowerCase())), [search]);
  if (!cooperativeAccess) return <div className="grid min-h-screen place-items-center bg-[#f8fafc] text-slate-500">Checking cooperative access...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 transition-transform xl:static xl:w-64 xl:translate-x-0 ${
            sidebar ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="mb-6">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                Bridge<span className="text-blue-600">Point</span>
              </div>
              <div className="text-xs text-slate-500">Work that matters. People who care.</div>
            </div>

            <nav className="space-y-1 overflow-y-auto">
              {filteredNav.map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebar(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                    pathname === href ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon name={icon} size={18} className={pathname === href ? "text-blue-600" : "text-slate-400"} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-slate-600">
                <Icon name="users" size={16} className="mb-2 text-blue-600" />
                Stronger communities through cooperative operations.
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <button
                aria-label="Toggle navigation"
                className="rounded-xl border border-slate-200 p-2 text-slate-700 xl:hidden"
                onClick={() => setSidebar((v) => !v)}
              >
                <Icon name="filter" size={18} />
              </button>

              <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 md:flex">
                <Icon name="location" size={14} className="text-slate-400" />
                {user?.city || "Cooperative workspace"}
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                <Icon name="search" size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workers, jobs, reports..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                aria-label="Show notifications"
                onClick={() => setNotify((v) => !v)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <Icon name="bell" size={18} />
              </button>

              <Link
                aria-label="Open cooperative messages"
                href="/admin/messages"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <Icon name="chat" size={18} />
              </Link>

              <button onClick={() => setProfile((v) => !v)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {(user?.full_name || "CE").split(" ").map((s) => s[0]).slice(0, 2).join("") || "CE"}
                </span>
                <span className="hidden text-left md:block">
                  <div className="text-xs font-bold text-slate-900">{user?.full_name || "Cooperative"}</div>
                  <div className="text-[10px] text-slate-500">Admin</div>
                </span>
              </button>
            </div>

            {notify && <div className="mt-2 text-xs text-slate-500">No live notifications are available for this workspace yet.</div>}
          </header>

          <main className="space-y-6 p-4 md:p-6">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-6 md:p-8 shadow-xs">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Good morning!</div>
                  <div className="mt-1 text-lg font-semibold text-slate-600">Cooperative Operational Workspace</div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                    Manage your workforce, meet community demand, and allocate resources efficiently across societies.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 text-xs italic text-blue-800 md:block shadow-xs">
                    &quot;Organised workers. Stronger communities.&quot;
                  </div>
                  <Link href="/admin/members" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700">
                    <Icon name="users" size={16} />
                    Manage Members
                  </Link>
                </div>
              </div>
            </section>

            {demoWarning && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">{demoWarning}</div>}
            {jobsError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">Cooperative job data unavailable: {jobsError}</div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {KPIS.map(([label, note], i) => {
                const live = overview ? [overview.members, overview.verified_workers, overview.active_jobs, `₹${overview.cooperative_revenue.toLocaleString("en-IN")}`][i] : null;
                const icons = ["users", "shield", "calendar", "card"] as const;
                return (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="mb-3 text-blue-600">
                      <Icon name={icons[i]} size={22} />
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-slate-900">{live ?? "Loading..."}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-700">{label}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{overview ? "Live from backend reporting" : note}</div>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">AI Demand Forecast</h2>
                    <p className="text-xs text-slate-500">Predicts service demand in your area based on historical job activity.</p>
                  </div>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                  >
                    {["Next 7 Days", "Next 14 Days", "Next 30 Days"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-5 grid gap-4 grid-cols-1 lg:grid-cols-[1fr_200px]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="mb-3 text-xs font-medium text-slate-500">
                      Prophet forecast across recorded locations.
                    </div>
                    <div className="space-y-2.5">
                      {forecastRows.length ? (
                        forecastRows.slice(0, 6).map((row) => (
                          <div key={row.skill} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs">
                            <span className="text-xs font-semibold text-slate-800 capitalize">{row.skill}</span>
                            <span className="text-right text-xs">
                              <strong className="font-bold text-blue-700">{row.predicted_jobs}</strong> jobs
                              <small className="block text-[10px] text-slate-400">{row.confidence} confidence</small>
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500">No recent job history is available for forecasting.</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {forecastRows.slice(0, 3).map((row) => (
                      <div key={row.skill} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 capitalize">{row.skill}</span>
                          <span className="font-bold text-blue-600">{row.confidence}</span>
                        </div>
                      </div>
                    ))}
                    <Link
                      href="/admin/demand-forecast"
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-blue-300 bg-white py-2.5 text-center text-xs font-semibold text-blue-600 shadow-xs hover:bg-blue-50"
                    >
                      View Forecast Report →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <h2 className="text-lg font-bold text-slate-900">Workforce Allocation (AI)</h2>
                <p className="text-xs text-slate-500">Recommends optimal worker allocation based on demand and availability.</p>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4">
                  <div className="text-xs font-medium text-red-800">
                    {workforceRows.find((row) => row.gap > 0)?.recommendation || "No current shortage identified."}
                  </div>
                  <Link href="/admin/workforce" className="shrink-0 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                    View Allocation →
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {workforceRows.length ? (
                    workforceRows.slice(0, 4).map((row) => (
                      <div key={row.skill}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 capitalize">{row.skill}</span>
                          <span className="font-medium text-slate-500">
                            {row.available_workers} / {row.qualified_workers} available
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${Math.round((row.available_workers / Math.max(row.qualified_workers, 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {row.gap ? `${row.gap} shortage gap` : "Capacity covers forecast demand"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">No workforce allocation data available.</div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs xl:col-span-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Recent Activities</h2>
                  <Link href="/admin/analytics" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    View Analytics
                  </Link>
                </div>
                <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  Activity history is summarized cleanly from verified job totals and status reporting in Analytics.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs xl:col-span-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Cooperative Revenue</h2>
                  <Link href="/admin/revenue" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    View Details
                  </Link>
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  {overview ? `₹${overview.cooperative_revenue.toLocaleString("en-IN")}` : "Loading..."}
                </div>
                <p className="mt-1 text-xs text-slate-500">Platform commission recorded from completed jobs</p>
                <Link
                  href="/admin/revenue"
                  className="mt-5 inline-flex items-center gap-1 rounded-xl border border-blue-300 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  View Revenue Details →
                </Link>
              </div>

              <div className="space-y-4 xl:col-span-1">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Member Directory</h2>
                    <Link href="/admin/members" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      View Members
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    {overview ? `${overview.members} workers recorded, including ${overview.verified_workers} verified.` : "Loading member data..."}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Service Performance</h2>
                    <Link href="/admin/analytics" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      View Report
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Category and city breakdowns calculated from recorded jobs in Analytics.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {profile && (
        <div className="fixed inset-0 z-50 bg-slate-900/20" onClick={() => setProfile(false)}>
          <div className="absolute right-6 top-20 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl text-sm" onClick={(e) => e.stopPropagation()}>
            <Link href="/admin/worker-profile" className="block rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">
              Profile
            </Link>
            <Link href="/admin/settings" className="block rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">
              Settings
            </Link>
            <button onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

