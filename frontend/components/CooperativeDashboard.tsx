"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const NAV = [
  ["/admin", "Dashboard"], ["/admin/federation", "Federation"], ["/admin/societies", "Societies"], ["/admin/members", "Members / Workers"],
  ["/admin/jobs", "Job Management"], ["/admin/demand-forecast", "Demand Forecast (AI)"],
  ["/admin/workforce", "Workforce Allocation"], ["/admin/revenue", "Earnings & Revenue"], ["/admin/wage-benchmark", "Wage Benchmark"],
  ["/admin/training", "Training & Welfare"], ["/admin/verification", "Verifications"],
  ["/admin/analytics", "Analytics & Reports"], ["/admin/messages", "Messages"], ["/admin/notifications", "Notifications"], ["/admin/settings", "Settings"],
] as const;

const KPIS = [
  ["Total Members", "Worker records from the cooperative API"],
  ["Verified Workers", "Email and phone verification status"],
  ["Active Jobs", "Current job state totals"],
  ["Cooperative Earnings", "Recorded platform commission"],
];

export default function CooperativeDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const demoCooperativeAccess = getActiveWorkspaceRole() === "cooperative";
  const cooperativeAccess = !!user && (user.is_admin || user.roles?.includes("cooperative") || demoCooperativeAccess);
  useEffect(() => { if (!user) router.replace("/signin?role=cooperative&next=%2Fadmin"); else if (!cooperativeAccess) router.replace("/dashboard"); }, [cooperativeAccess, router, user]);
  const [period, setPeriod] = useState("Next 7 Days");
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [notify, setNotify] = useState(false);
  const [profile, setProfile] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [demoWarning] = useState(() => typeof window !== "undefined" ? sessionStorage.getItem("bp_demo_role_warning") || "" : "");
  const [overview, setOverview] = useState<{ members: number; verified_workers: number; active_jobs: number; cooperative_revenue: number } | null>(null);
  const [forecastRows, setForecastRows] = useState<{ skill: string; predicted_jobs: number; confidence: string }[]>([]);
  const [workforceRows, setWorkforceRows] = useState<{ skill: string; qualified_workers: number; available_workers: number; gap: number; recommendation: string }[]>([]);
  useEffect(() => { if (!user) return; api.getCooperativeOverview().then(setOverview).catch((err: unknown) => setJobsError(err instanceof Error ? err.message : "Unable to load cooperative reporting.")); }, [user]);
  useEffect(() => { if (!user) return; const days = Number(period.match(/\d+/)?.[0] || 7); Promise.all([api.getDemandForecast(days), api.getWorkforceAllocation()]).then(([forecastResult, workforceResult]) => { setForecastRows(forecastResult.forecast); setWorkforceRows(workforceResult.workforce); }).catch((err: unknown) => setJobsError(err instanceof Error ? err.message : "Unable to load cooperative intelligence.")); }, [period, user]);

  const filteredNav = useMemo(() => NAV.filter(([, label]) => label.toLowerCase().includes(search.toLowerCase())), [search]);
  if (!cooperativeAccess) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Checking cooperative access...</div>;

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900">
      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 backdrop-blur xl:static xl:translate-x-0 transition-transform ${sidebar ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`}>
          <div className="p-5 h-full flex flex-col">
            <div className="mb-6">
              <div className="text-2xl font-semibold text-slate-900">Bridge<span className="text-blue-600">Point</span></div>
              <div className="text-sm text-slate-500">Work that matters. People who care.</div>
            </div>
            <nav className="space-y-1 text-sm">
              {filteredNav.map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setSidebar(false)} className={`block w-full px-4 py-3 rounded-2xl ${pathname === href ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-3xl bg-gradient-to-br from-blue-50 to-sky-100 p-5">
              <div className="text-sm text-slate-600">Stronger communities through cooperation.</div>
              <div className="mt-3 h-28 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.8)),url('/icon-512.png')] bg-cover bg-center" />
            </div>
          </div>
        </aside>

        <div className="flex-1 xl:ml-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="px-4 md:px-6 py-4 flex items-center gap-3">
              <button className="xl:hidden px-3 py-2 rounded-xl border" onClick={() => setSidebar(v => !v)}>☰</button>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm text-slate-600">{user?.city || "Cooperative workspace"}</div>
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white text-slate-400">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workers, jobs, reports..." className="w-full outline-none text-slate-700" />
              </div>
              <button aria-label="Show notifications" onClick={() => setNotify(v => !v)} className="px-3 py-2 rounded-xl border bg-white">🔔</button>
              <Link aria-label="Open cooperative messages" href="/admin/messages" className="px-3 py-2 rounded-xl border bg-white">💬</Link>
              <button onClick={() => setProfile(v => !v)} className="flex items-center gap-3 px-3 py-2 rounded-2xl border bg-white">
                <span className="h-10 w-10 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">{(user?.full_name || "CE").split(" ").map(s => s[0]).slice(0,2).join("") || "CE"}</span>
                <span className="hidden md:block text-left"><div className="text-sm font-medium">{user?.full_name || "Cooperative workspace"}</div><div className="text-xs text-slate-500">Admin</div></span>
              </button>
            </div>
            {notify && <div className="px-6 pb-4 text-sm text-slate-600">No live notifications are available for this workspace yet.</div>}
          </header>

          <main className="p-4 md:p-6 space-y-4">
            <section className="rounded-[28px] bg-gradient-to-br from-white to-blue-50 border border-slate-200 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="text-4xl md:text-5xl font-semibold">Good morning!</div>
                  <div className="mt-1 text-2xl md:text-3xl font-semibold text-slate-700">Cooperative workspace</div>
                  <p className="mt-2 text-slate-600 max-w-2xl">Manage your workforce, meet community demand, and create better opportunities.</p>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="hidden md:block rounded-3xl bg-white/80 border border-slate-200 px-5 py-4 text-blue-700 italic">&quot;Organised workers. Stronger communities.&quot;</div>
                  <Link href="/admin/members" className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-medium">+ Manage Members</Link>
                </div>
              </div>
            </section>

            {demoWarning && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{demoWarning}</div>}
            {jobsError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Cooperative job data unavailable: {jobsError}</div>}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {KPIS.map(([label, note], i) => { const live = overview ? [overview.members, overview.verified_workers, overview.active_jobs, `₹${overview.cooperative_revenue.toLocaleString("en-IN")}`][i] : null; return <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="text-3xl mb-3">{["👥","🛡️","📅","₹"][i]}</div><div className="text-3xl font-semibold">{live ?? "Loading..."}</div><div className="text-slate-600">{label}</div><div className="mt-2 text-slate-500 text-sm">{overview ? "Live from backend reporting" : note}</div></div>; })}
            </section>

            <section className="grid xl:grid-cols-2 gap-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">AI Demand Forecast</div>
                    <div className="text-sm text-slate-500">Predicts service demand in your area to help you plan workforce and resources.</div>
                  </div>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
                    {['Next 7 Days', 'Next 14 Days', 'Next 30 Days'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-4">
                  <div className="rounded-3xl border bg-gradient-to-b from-white to-blue-50 p-4">
                    <div className="mb-3 text-sm text-slate-500">Calculated from the last 30 days of jobs. Location: all recorded locations.</div>
                    <div className="space-y-3">{forecastRows.length ? forecastRows.slice(0, 8).map((row) => <div key={row.skill} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3"><span className="font-medium">{row.skill}</span><span className="text-right"><strong>{row.predicted_jobs}</strong> jobs<br /><small className="text-slate-500">{row.confidence} confidence</small></span></div>) : <div className="py-12 text-center text-sm text-slate-500">No recent job history is available for forecasting.</div>}</div>
                  </div>
                  <div className="space-y-3">
                    {forecastRows.slice(0, 4).map((row) => <div key={row.skill} className="rounded-2xl border p-3">
                      <div className="flex justify-between text-sm"><span>{row.skill}</span><span className="text-blue-600">{row.confidence}</span></div>
                    </div>)}
                    <Link href="/admin/demand-forecast" className="block w-full rounded-2xl border border-blue-300 text-blue-700 py-3 text-center">View Detailed Forecast →</Link>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="text-xl font-semibold">Workforce Allocation (AI)</div>
                <div className="text-sm text-slate-500">Recommends optimal worker allocation based on demand, skills and availability.</div>
                <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-red-700">{workforceRows.find((row) => row.gap > 0)?.recommendation || "No current shortage identified."}</div>
                  <Link href="/admin/workforce" className="px-4 py-2 rounded-2xl border border-blue-300 text-blue-700">View Allocation →</Link>
                </div>
                <div className="mt-4 space-y-3">
                  {workforceRows.length ? workforceRows.slice(0, 4).map((row) => <div key={row.skill}><div className="flex justify-between text-sm mb-1"><span>{row.skill}</span><span>{row.available_workers} / {row.qualified_workers}</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((row.available_workers / Math.max(row.qualified_workers, 1)) * 100)}%` }} /></div><div className="mt-1 text-xs text-slate-500">{row.gap ? `${row.gap} gap` : "Capacity covers forecast"}</div></div>) : <div className="text-sm text-slate-500">No workforce data available.</div>}
                </div>
              </div>
            </section>

            <section className="grid xl:grid-cols-3 gap-4">
              <div className="rounded-[28px] border bg-white p-5 xl:col-span-1">
                <div className="flex justify-between"><div className="text-xl font-semibold">Recent Activities</div><Link href="/admin/analytics" className="text-blue-600 text-sm">View Analytics</Link></div>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Activity history is not stored as a dedicated feed yet. Use Analytics for verified job totals and status data.</p>
              </div>
              <div className="rounded-[28px] border bg-white p-5 xl:col-span-1">
                <div className="flex justify-between items-center"><div className="text-xl font-semibold">Cooperative Revenue</div><Link href="/admin/revenue" className="text-blue-600 text-sm">View Details</Link></div>
                <div className="mt-3 text-4xl font-semibold">{overview ? `₹${overview.cooperative_revenue.toLocaleString("en-IN")}` : "Loading..."}</div>
                <div className="text-slate-500 text-sm mt-1">Platform commission recorded from jobs</div>
                <Link href="/admin/revenue" className="mt-5 inline-block rounded-xl border border-blue-300 px-4 py-2 text-sm text-blue-700">View Revenue Details →</Link>
              </div>
              <div className="space-y-4 xl:col-span-1">
                <div className="rounded-[28px] border bg-white p-5">
                  <div className="flex justify-between"><div className="text-xl font-semibold">Member Directory</div><Link href="/admin/members" className="text-blue-600 text-sm">View Members</Link></div>
                  <div className="mt-4 text-sm text-slate-600">{overview ? `${overview.members} workers recorded, including ${overview.verified_workers} verified.` : "Loading member data..."}</div>
                </div>
                <div className="rounded-[28px] border bg-white p-5">
                  <div className="flex justify-between"><div className="text-xl font-semibold">Service Performance</div><Link href="/admin/analytics" className="text-blue-600 text-sm">View Report</Link></div>
                  <div className="mt-4 text-sm text-slate-600">Category and city breakdowns are calculated from recorded jobs in Analytics.</div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-sm">
              {["Verified Workforce","AI-Powered Planning","Sustainable Earnings","Worker Welfare","Skills & Training","Stronger Communities"].map((x) => <div key={x} className="rounded-2xl border bg-white p-4">{x}</div>)}
            </section>
          </main>
        </div>
      </div>

      {profile && <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setProfile(false)}><div className="absolute right-6 top-20 w-52 rounded-2xl border bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}><Link href="/admin/worker-profile" className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50">Profile</Link><Link href="/admin/settings" className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50">Settings</Link><button onClick={logout} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-red-600">Logout</button></div></div>}
    </div>
  );
}
