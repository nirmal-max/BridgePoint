"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  const access = !!user && (user.is_admin || user.roles?.includes("cooperative"));

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

  if (loading || !access) return <div className="grid min-h-screen place-items-center bg-[#f3f7fd] text-slate-500">Checking cooperative access...</div>;
  const plan = allocation?.allocation;
  return <div className="min-h-screen bg-[#f3f7fd] text-slate-900"><header className="border-b bg-white px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/admin" className="text-xl font-semibold">Bridge<span className="text-blue-600">Point</span></Link><div className="flex items-center gap-4 text-sm"><Link href="/admin" className="text-slate-600">Dashboard</Link><button onClick={logout} className="text-red-600">Sign Out</button></div></div></header><main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8"><div className="rounded-3xl border bg-gradient-to-br from-white to-blue-50 p-6"><p className="text-sm font-medium text-blue-600">BridgePoint / Cooperative Planning</p><h1 className="mt-2 text-3xl font-bold">AI Demand &amp; Workforce Planning</h1><p className="mt-2 max-w-2xl text-slate-600">Prophet forecasts expected service requests from historical BridgePoint jobs. Existing worker matching signals then recommend suitable available workers. No future job is assigned automatically.</p></div><section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"><label className="text-sm font-medium">City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Chennai" className="mt-2 w-full rounded-xl border px-3 py-2" /></label><label className="text-sm font-medium">Service skill<select value={skill} onChange={(event) => setSkill(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2">{skills.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm font-medium">Horizon<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-2 rounded-xl border px-3 py-2"><option value={7}>Next 7 days</option><option value={14}>Next 14 days</option><option value={30}>Next 30 days</option></select></label><button onClick={generate} disabled={busy} className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Generating..." : "Generate Forecast"}</button></div>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}</section>{forecast && forecast.status === "insufficient_data" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-900">Not enough historical BridgePoint demand data to produce an AI forecast.</h2><p className="mt-2 text-sm text-amber-800">History available: {forecast.history_days} calendar days. Minimum required: {forecast.minimum_history_days} days. No generated or demo numbers are shown.</p></section>}{forecast?.status === "ok" && <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="text-xl font-bold">Demand Forecast</h2><p className="text-sm text-slate-500">{forecast.skill} · {forecast.city} · Prophet · {forecast.history_days} calendar days of history</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Forecast, not accuracy claim</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{forecast.forecast.map((point) => <article key={point.date} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{new Date(`${point.date}T00:00:00`).toLocaleDateString()}</p><p className="mt-2 text-2xl font-bold">{point.predicted_demand}</p><p className="text-sm text-slate-600">predicted requests</p><p className="mt-2 text-xs text-slate-500">Range {point.lower_bound}–{point.upper_bound}</p></article>)}</div></section>}{plan && <section className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Expected demand" value={String(plan.predicted_demand)} /><Metric label="Eligible workers" value={String(plan.eligible_workers)} /><Metric label="Recommended workers" value={String(plan.recommended_worker_count)} /><Metric label="Shortage" value={String(plan.shortage)} /></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Recommended Workers</h2><p className="mt-1 text-sm text-slate-500">Ranked using BridgePoint skill, availability, certification, rating, workload, fairness, location, and trust signals.</p><div className="mt-4 space-y-3">{plan.recommended_workers.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No eligible workers are available for this requirement.</p> : plan.recommended_workers.map((worker) => <article key={worker.worker_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><b>{worker.name}</b><p className="text-xs text-slate-500">{worker.certified ? "Verified certification" : "Certification not verified"} · {worker.available ? "Available" : "Unavailable"} · Trust {Math.round(worker.trust_score)} ({worker.trust_confidence} confidence)</p></div><div className="text-right"><b className="text-blue-700">{Math.round(worker.match_score)}% suitability</b><p className="text-xs text-slate-500">Workload {Math.round(worker.workload_score * 100)}% · Fairness {Math.round(worker.fairness_score * 100)}%</p></div></article>)}</div>{plan.shortage > 0 && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Shortage: {plan.shortage} additional qualified worker{plan.shortage === 1 ? "" : "s"} would be needed. No workers were fabricated or assigned.</p>}</div></section>}</main></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></article>; }
