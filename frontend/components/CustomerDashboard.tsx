"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { DemandForecastResponse, Job } from "@/lib/types";
import Icon, { type IconName } from "@/components/Icon";

const links: readonly [string, string, IconName][] = [
  ["/dashboard", "Dashboard", "service"],
  ["/find-services", "Find Services", "search"],
  ["/booking", "Bookings & Tracking", "calendar"],
  ["/payment", "Payments", "card"],
  ["/invoice", "Invoices", "fileText"],
  ["/reviews", "Reviews", "star"],
  ["/emergency", "Emergency Service", "alert"],
  ["/messages", "Messages", "chat"],
  ["/notifications", "Notifications", "bell"],
  ["/settings", "Settings", "settings"],
];

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

  if (authLoading || !user) return <div className="grid min-h-screen place-items-center bg-[#f8fafc] text-slate-500">Checking customer access...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-slate-900">
            Bridge<span className="text-blue-600">Point</span>
          </Link>
          <p className="mb-6 text-xs text-slate-500">Work that matters. People who care.</p>
          
          <nav className="space-y-1">
            {links.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  href === "/dashboard" ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon name={icon} size={18} className={href === "/dashboard" ? "text-blue-600" : "text-slate-400"} />
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-8 flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100/50"
          >
            <Icon name="logout" size={16} />
            Sign Out
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <Link href="/dashboard" className="text-2xl font-bold tracking-tight lg:hidden">
                Bridge<span className="text-blue-600">Point</span>
              </Link>
              
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  <Icon name="location" size={14} className="text-slate-400" />
                  {user.city || "Your city"}
                </span>
                <Link href="/find-services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                  <Icon name="search" size={16} />
                  Find Workers
                </Link>
                <button onClick={logout} className="text-xs font-semibold text-red-600 lg:hidden">
                  Sign Out
                </button>
              </div>
            </div>

            <nav aria-label="Customer navigation" className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {links.map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    href === "/dashboard" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon name={icon} size={14} />
                  {label}
                </Link>
              ))}
            </nav>
          </header>

          <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
            <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-slate-50 p-8 shadow-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Icon name="user" size={14} />
                Customer Workspace
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Welcome back, {user?.full_name?.split(" ")[0] || "Customer"}!
              </h1>
              <p className="mt-2 text-slate-600">
                Book trusted workers and keep every request in one accountable place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Icon name="briefcase" size={16} />
                  Book a Service
                </Link>
                <Link
                  href="/find-services"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                >
                  <Icon name="search" size={16} />
                  Browse Services
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                [String(activeJobs.length), "Active Requests", "calendar"],
                [`₹${total.toLocaleString("en-IN")}`, "Total Job Value", "wallet"],
                ["Live", "Account Data", "shield"],
              ].map(([value, label, icon]) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon name={icon as IconName} size={22} />
                  </span>
                  <div>
                    <b className="text-2xl font-bold text-slate-900">{value}</b>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </section>

            <DemandInsight city={user.city || ""} />

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Requests</h2>
                  <p className="text-xs text-slate-500">Live jobs posted from your BridgePoint account.</p>
                </div>
                <Link href="/find-services" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Find More Services
                  <Icon name="arrowRight" size={14} />
                </Link>
              </div>

              {loading && <div className="py-10 text-center text-sm text-slate-500">Loading your requests...</div>}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <b className="text-sm">Requests unavailable</b>
                  <p className="mt-1 text-xs">{error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="mt-5 space-y-3">
                  {jobs.length ? (
                    jobs.map((job) => (
                      <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <b className="text-base font-semibold text-slate-900">{job.title}</b>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {job.city} · <span className="capitalize font-medium text-blue-700">{job.status.replace("_", " ")}</span>
                          </p>
                        </div>

                        <b className="text-lg font-bold text-slate-900">
                          ₹{(job.employer_total || job.budget).toLocaleString("en-IN")}
                        </b>

                        <div className="flex gap-2">
                          <Link
                            href={`/payment?job_id=${job.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <Icon name="card" size={14} />
                            Payment
                          </Link>
                          {job.allotted_labor_id && (
                            <Link
                              href={`/reviews?job_id=${job.id}&reviewee_id=${job.allotted_labor_id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              <Icon name="star" size={14} />
                              Review
                            </Link>
                          )}
                          <Link
                            href={`/jobs/${job.id}`}
                            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No jobs posted yet.
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

const CUSTOMER_INSIGHT_SKILLS = [
  { skill: "plumber", label: "Plumbing" },
  { skill: "electrician", label: "Electrical" },
  { skill: "cleaner", label: "Cleaning" },
];

function DemandInsight({ city }: { city: string }) {
  const [results, setResults] = useState<{ skill: string; label: string; response: DemandForecastResponse | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!city.trim()) return;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      setResults([]);
      const next = await Promise.all(
        CUSTOMER_INSIGHT_SKILLS.map(async (item) => ({
          ...item,
          response: await api.getForecastDemand(city.trim(), item.skill, 7).catch(() => null),
        }))
      );
      if (active) {
        setResults(next);
        setError(next.every((item) => !item.response) ? "Demand insights are unavailable right now. You can still explore services." : "");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [city]);

  if (!city.trim()) return null;
  const available = results.filter((item) => item.response?.status === "ok");
  const allInsufficient = !loading && results.length > 0 && available.length === 0 && results.some((item) => item.response?.status === "insufficient_data");
  const level = (response: DemandForecastResponse) => {
    const average = response.forecast.reduce((sum, point) => sum + point.predicted_demand, 0) / Math.max(response.forecast.length, 1);
    return average >= 3 ? "HIGH" : average >= 1 ? "MEDIUM" : "LOW";
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Service Demand</h2>
          <p className="text-xs text-slate-500">Demand outlook for {city}</p>
        </div>
        <Link href="/find-services" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          Explore Services
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      {loading && <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">Loading demand insights...</p>}
      {error && <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">Demand insights are unavailable right now. You can still explore services.</p>}
      {allInsufficient && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">Not enough historical service data to generate a demand insight yet.</p>}

      {!loading && !error && available.length > 0 && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {available.map((item) => (
              <div key={item.skill} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm font-semibold text-slate-900">{item.label}</b>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    level(item.response!) === "HIGH" ? "bg-red-50 text-red-700 border border-red-200" : level(item.response!) === "MEDIUM" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {level(item.response!)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  {Math.round(item.response!.forecast.reduce((sum, point) => sum + point.predicted_demand, 0) / Math.max(item.response!.forecast.length, 1))} expected requests/day
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Simple BridgePoint demand indicator based on the 7-day forecast; thresholds are calculated cleanly from BridgePoint records.
          </p>
        </>
      )}
    </section>
  );
}

