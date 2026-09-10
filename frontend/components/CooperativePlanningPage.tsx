"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import type { DemandForecastResponse, WorkforceAllocationResponse } from "@/lib/types";

const skills = ["electrician", "plumber", "carpenter", "painter", "cleaner", "driver", "caregiver"];

export default function CooperativePlanningPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState(skills[0]);
  const [days, setDays] = useState(7);
  const [forecast, setForecast] = useState<DemandForecastResponse | null>(null);
  const [allocation, setAllocation] = useState<WorkforceAllocationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const access = !!user && (user.is_admin || user.roles?.includes("cooperative") || getActiveWorkspaceRole() === "cooperative");

  useEffect(() => {
    if (!loading && !user) router.replace("/signin?role=cooperative&next=%2Fadmin/demand-forecast");
    else if (!loading && user && !access) router.replace("/dashboard");
    if (user?.city && !city) setCity(user.city);
  }, [access, city, loading, router, user]);

  async function generate() {
    if (!city.trim()) { setError("Enter a city before generating a forecast."); return; }
    setBusy(true); setError(""); setForecast(null); setAllocation(null);
    try {
      const result = await api.getForecastDemand(city.trim(), skill, days);
      setForecast(result);
      if (result.status === "ok" && result.forecast[0]) {
        setAllocation(await api.getForecastWorkforce(city.trim(), skill, result.forecast[0].date));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate the forecast.");
    } finally { setBusy(false); }
  }

  if (loading || !access) return <div className="grid min-h-screen place-items-center bg-[var(--color-bp-white)] text-[var(--color-bp-gray-500)]">Checking cooperative access...</div>;
  const plan = allocation?.allocation;

  return (
    <div className="min-h-screen bg-[var(--color-bp-white)] text-[var(--color-bp-black)]">
      <header className="border-b border-[var(--color-bp-gray-200)] bg-white/90 px-5 py-4 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin" className="text-xl font-semibold tracking-tight">
            Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-[var(--color-bp-blue)] hover:underline">Dashboard</Link>
            <button onClick={logout} className="text-[var(--color-bp-red)] hover:opacity-80">Sign Out</button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
        <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-gradient-to-br from-white to-blue-50/50 p-6 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-bp-blue)]">BridgePoint / Cooperative Planning</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Demand &amp; Workforce Planning</h1>
          <p className="mt-2 max-w-2xl text-[var(--color-bp-gray-600)]">Prophet forecasts expected service requests from historical BridgePoint jobs. Existing worker matching signals then recommend suitable available workers. No future job is assigned automatically.</p>
        </div>
        
        <section className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <label className="text-sm font-medium text-[var(--color-bp-black)]">City
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Chennai" className="input-field mt-2" />
            </label>
            <label className="text-sm font-medium text-[var(--color-bp-black)]">Service skill
              <select value={skill} onChange={(event) => setSkill(event.target.value)} className="input-field mt-2">
                {skills.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-[var(--color-bp-black)]">Horizon
              <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="input-field mt-2">
                <option value={7}>Next 7 days</option>
                <option value={14}>Next 14 days</option>
                <option value={30}>Next 30 days</option>
              </select>
            </label>
            <button onClick={generate} disabled={busy} className="btn-primary !py-2.5 whitespace-nowrap w-full md:w-auto">
              {busy ? "Generating..." : "Generate Forecast"}
            </button>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)] border border-red-100">{error}</p>}
        </section>

        {forecast && forecast.status === "insufficient_data" && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900 text-lg">Not enough historical BridgePoint demand data to produce an AI forecast.</h2>
            <p className="mt-2 text-sm text-amber-800">History available: {forecast.history_days} calendar days. Minimum required: {forecast.minimum_history_days} days. No generated or demo numbers are shown.</p>
          </section>
        )}

        {forecast?.status === "ok" && (
          <section className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Demand Forecast</h2>
                <p className="text-sm font-medium text-[var(--color-bp-gray-500)] mt-1">{forecast.skill} · {forecast.city} · Prophet · {forecast.history_days} calendar days of history</p>
              </div>
              <span className="badge badge-info">Forecast, not accuracy claim</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forecast.forecast.map((point) => (
                <article key={point.date} className="rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-5 transition-colors hover:bg-white hover:border-[var(--color-bp-gray-200)]">
                  <p className="text-sm font-medium text-[var(--color-bp-gray-500)]">{new Date(`${point.date}T00:00:00`).toLocaleDateString()}</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--color-bp-black)] tracking-tight">{point.predicted_demand}</p>
                  <p className="text-sm text-[var(--color-bp-gray-600)]">predicted requests</p>
                  <p className="mt-3 text-xs font-mono text-[var(--color-bp-gray-500)]">Range: {point.lower_bound} – {point.upper_bound}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {plan && (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Expected demand" value={String(plan.predicted_demand)} />
              <Metric label="Eligible workers" value={String(plan.eligible_workers)} />
              <Metric label="Recommended workers" value={String(plan.recommended_worker_count)} />
              <Metric label="Shortage" value={String(plan.shortage)} />
            </div>
            <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight">Recommended Workers</h2>
              <p className="mt-1 text-sm text-[var(--color-bp-gray-500)]">Ranked using BridgePoint skill, availability, certification, rating, workload, fairness, location, and trust signals.</p>
              <div className="mt-5 space-y-3">
                {plan.recommended_workers.length === 0 ? (
                  <p className="rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-4 text-sm text-[var(--color-bp-gray-500)]">No eligible workers are available for this requirement.</p>
                ) : (
                  plan.recommended_workers.map((worker) => (
                    <article key={worker.worker_id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-4 transition-colors hover:bg-white hover:border-[var(--color-bp-gray-200)]">
                      <div>
                        <b className="text-lg text-[var(--color-bp-black)]">{worker.name}</b>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium text-[var(--color-bp-gray-500)]">
                          <span className={worker.certified ? "text-[var(--color-bp-green)]" : ""}>{worker.certified ? "Verified certification" : "Certification not verified"}</span>
                          <span>·</span>
                          <span className={worker.available ? "text-[var(--color-bp-blue)]" : ""}>{worker.available ? "Available" : "Unavailable"}</span>
                          <span>·</span>
                          <span>Trust {Math.round(worker.trust_score)} ({worker.trust_confidence} confidence)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <b className="text-[var(--color-bp-blue)] text-lg">{Math.round(worker.match_score)}% suitability</b>
                        <p className="mt-1 text-xs font-mono text-[var(--color-bp-gray-500)]">Workload {Math.round(worker.workload_score * 100)}% · Fairness {Math.round(worker.fairness_score * 100)}%</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {plan.shortage > 0 && (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Shortage: {plan.shortage} additional qualified worker{plan.shortage === 1 ? "" : "s"} would be needed. No workers were fabricated or assigned.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <p className="text-3xl font-bold tracking-tight text-[var(--color-bp-black)]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-bp-gray-500)]">{label}</p>
    </article>
  );
}
