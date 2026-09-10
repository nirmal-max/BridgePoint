"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { DemandForecastResponse, Job } from "@/lib/types";

const links = [["/dashboard", "Dashboard"], ["/find-services", "Find Services"], ["/booking", "Bookings & Tracking"], ["/payment", "Payments"], ["/invoice", "Invoices"], ["/reviews", "Reviews"], ["/emergency", "Emergency Service"], ["/messages", "Messages"], ["/notifications", "Notifications"], ["/settings", "Settings"]] as const;

export default function CustomerDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const customerWorkspace = getActiveWorkspaceRole() === "customer";
    if (!customerWorkspace && (user.is_admin || user.roles?.includes("cooperative") || user.roles?.includes("labor") || user.role === "labor" || user.labor_category)) {
      router.replace(user.is_admin || user.roles?.includes("cooperative") ? "/admin" : "/worker");
      return;
    }
    api.getMyJobs().then((result) => setJobs(result.jobs)).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load your requests.")).finally(() => setLoading(false));
  }, [router, user]);

  const activeJobs = jobs.filter((job) => !["payment_completed", "payout_released", "paid"].includes(job.status));
  const total = jobs.reduce((sum, job) => sum + (job.employer_total || job.budget || 0), 0);

  if (authLoading || !user) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Checking customer access...</div>;

  return <div className="min-h-screen bg-[#f3f8ff] text-slate-900"><div className="flex min-h-screen"><aside className="hidden w-60 shrink-0 border-r bg-white p-5 lg:block"><Link href="/dashboard" className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></Link><p className="mb-7 text-xs text-slate-500">Work that matters. People who care.</p><nav className="space-y-1">{links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-xl px-3 py-3 text-sm ${href === "/dashboard" ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}>{label}</Link>)}</nav><button onClick={logout} className="mt-8 w-full rounded-xl border border-red-200 px-3 py-2 text-left text-sm text-red-600">Sign Out</button></aside><main className="min-w-0 flex-1"><header className="border-b bg-white px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/dashboard" className="text-2xl font-bold lg:hidden">Bridge<span className="text-blue-600">Point</span></Link><div className="flex items-center gap-4 text-sm"><span>⌖ {user.city || "Your city"}</span><Link href="/find-services" className="text-blue-600">Find Workers</Link><button onClick={logout} className="text-red-600 lg:hidden">Sign Out</button></div></div><nav aria-label="Customer navigation" className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">{links.map(([href, label]) => <Link key={href} href={href} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${href === "/dashboard" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</Link>)}</nav></header><div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8"><section className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-7"><h1 className="text-3xl font-bold">Welcome back, {user?.full_name?.split(" ")[0] || "Customer"}!</h1><p className="mt-2 text-slate-600">Book trusted workers and keep every request in one place.</p><Link href="/post-job" className="mt-5 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold text-white">Book a Service →</Link></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[[String(activeJobs.length), "Active Requests"], [`₹${total.toLocaleString("en-IN")}`, "Total Job Value"], ["Live", "Account Data"]].map(([value, label]) => <div key={label} className="rounded-2xl border bg-white p-5"><b className="text-3xl">{value}</b><p className="text-sm text-slate-500">{label}</p></div>)}</section><DemandInsight city={user.city || ""} /><section className="rounded-3xl border bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Your Requests</h2><p className="text-sm text-slate-500">Live jobs posted from your BridgePoint account.</p></div><Link href="/find-services" className="text-sm font-semibold text-blue-600">Find More Services →</Link></div>{loading && <div className="py-10 text-center text-slate-500">Loading your requests...</div>}{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><b>Requests unavailable</b><p className="mt-1 text-sm">{error}</p></div>}{!loading && !error && <div className="mt-4 space-y-3">{jobs.length ? jobs.map((job) => <div key={job.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"><div className="flex-1"><b>{job.title}</b><p className="text-sm text-slate-500">{job.city} · {job.status}</p></div><b>₹{(job.employer_total || job.budget).toLocaleString("en-IN")}</b><div className="flex gap-2"><Link href={`/payment?job_id=${job.id}`} className="rounded-xl border border-blue-400 px-3 py-2 text-xs text-blue-600">Payment</Link>{job.allotted_labor_id && <Link href={`/reviews?job_id=${job.id}&reviewee_id=${job.allotted_labor_id}`} className="rounded-xl border border-blue-400 px-3 py-2 text-xs text-blue-600">Review</Link>}<Link href={`/jobs/${job.id}`} className="rounded-xl border border-slate-300 px-3 py-2 text-xs">Details</Link></div></div>) : <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">No jobs posted yet.</div>}</div>}</section></div></main></div></div>;
}

const CUSTOMER_INSIGHT_SKILLS = [{ skill: "plumber", label: "Plumbing" }, { skill: "electrician", label: "Electrical" }, { skill: "cleaner", label: "Cleaning" }];

function DemandInsight({ city }: { city: string }) {
  const [results, setResults] = useState<{ skill: string; label: string; response: DemandForecastResponse | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!city.trim()) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true); setError(""); setResults([]);
      const next = await Promise.all(CUSTOMER_INSIGHT_SKILLS.map(async (item) => ({ ...item, response: await api.getForecastDemand(city.trim(), item.skill, 7).catch(() => null) })));
      if (active) { setResults(next); setError(next.every((item) => !item.response) ? "Demand insights are unavailable right now. You can still explore services." : ""); setLoading(false); }
    });
    return () => { active = false; };
  }, [city]);
  if (!city.trim()) return null;
  const available = results.filter((item) => item.response?.status === "ok");
  const allInsufficient = !loading && results.length > 0 && available.length === 0 && results.some((item) => item.response?.status === "insufficient_data");
  const level = (response: DemandForecastResponse) => { const average = response.forecast.reduce((sum, point) => sum + point.predicted_demand, 0) / Math.max(response.forecast.length, 1); return average >= 3 ? "HIGH" : average >= 1 ? "MEDIUM" : "LOW"; };
  return <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">AI Service Demand</h2><p className="text-sm text-slate-500">Demand outlook for {city}</p></div><Link href="/find-services" className="text-sm font-semibold text-blue-600">Explore Services →</Link></div>{loading && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading demand insights...</p>}{error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">Demand insights are unavailable right now. You can still explore services.</p>}{allInsufficient && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Not enough historical service data to generate a demand insight yet.</p>}{!loading && !error && available.length > 0 && <><div className="mt-5 grid gap-3 sm:grid-cols-3">{available.map((item) => <div key={item.skill} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><b>{item.label}</b><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${level(item.response!) === "HIGH" ? "bg-red-50 text-red-700" : level(item.response!) === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{level(item.response!)}</span></div><p className="mt-3 text-sm text-slate-600">{Math.round(item.response!.forecast.reduce((sum, point) => sum + point.predicted_demand, 0) / Math.max(item.response!.forecast.length, 1))} expected requests/day</p></div>)}</div><p className="mt-4 text-xs text-slate-500">Simple BridgePoint demand indicator based on the 7-day forecast; thresholds are not scientifically validated. High demand may mean lower immediate availability.</p></>}</section>;
}
