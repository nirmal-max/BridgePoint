"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Section = "members" | "worker-profile" | "verification" | "demand-forecast" | "workforce" | "revenue" | "analytics" | "jobs" | "training" | "settings";
const links = [["/admin", "Dashboard"], ["/admin/federation", "Federation"], ["/admin/societies", "Societies"], ["/admin/members", "Members / Workers"], ["/admin/jobs", "Job Management"], ["/admin/worker-profile", "Worker Profile"], ["/admin/verification", "Verification Center"], ["/admin/demand-forecast", "AI Demand Forecast"], ["/admin/workforce", "Workforce Allocation"], ["/admin/revenue", "Earnings & Revenue"], ["/admin/training", "Training & Welfare"], ["/admin/analytics", "Analytics & Reports"], ["/admin/messages", "Messages"], ["/admin/settings", "Settings"]] as const;
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
};

export default function CooperativeFeaturePage({ section }: { section: Section }) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");
  const cooperativeAccess = !!user && (user.is_admin || user.roles?.includes("cooperative"));
  useEffect(() => { if (!loading && !user) router.replace(`/signin?role=cooperative&next=${encodeURIComponent(`/admin/${section}`)}`); else if (!loading && user && !cooperativeAccess) router.replace("/dashboard"); }, [cooperativeAccess, loading, router, section, user]);
  useEffect(() => { if (!user) return; const load = section === "members" ? api.getCooperativeMembers() : section === "demand-forecast" ? api.getDemandForecast() : section === "workforce" ? api.getWorkforceAllocation() : section === "analytics" ? api.getCooperativeAnalytics() : api.getCooperativeOverview(); load.then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load cooperative data.")); }, [section, user]);
  if (loading || !cooperativeAccess) return <div className="grid min-h-screen place-items-center bg-[#f3f7fd] text-slate-500">Checking cooperative access...</div>;
  const [title, description, cards] = copy[section];
  const rows = Array.isArray(data) ? data : data && typeof data === "object" ? Object.entries(data as Record<string, unknown>).map(([label, value]) => ({ label, value })) : [];
  const formatValue = (value: unknown): string => { if (value === null || value === undefined) return "Not available"; if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(", "); if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key.replaceAll("_", " ")}: ${formatValue(item)}`).join(" · "); return String(value); };
  return <div className="min-h-screen bg-[#f3f7fd] text-slate-900"><div className="flex"><aside className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 border-r bg-white p-5 transition-transform lg:static lg:block lg:translate-x-0`}><div className="flex items-center justify-between"><Link href="/admin" className="text-2xl font-semibold">Bridge<span className="text-blue-600">Point</span></Link><button aria-label="Close navigation" className="lg:hidden" onClick={() => setMobileNav(false)}>✕</button></div><p className="mb-7 text-sm text-slate-500">Work that matters. People who care.</p><nav className="space-y-1">{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setMobileNav(false)} className={`block rounded-xl px-4 py-3 text-sm ${pathname === href ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>)}</nav><button onClick={logout} className="mt-8 w-full rounded-xl border border-red-200 px-3 py-2 text-left text-sm text-red-600">Sign Out</button></aside>{mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileNav(false)} />}<main className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b bg-white/90 px-5 py-4 backdrop-blur"><div className="flex items-center justify-between"><button aria-label="Open navigation" className="mr-3 rounded-lg border px-3 py-2 lg:hidden" onClick={() => setMobileNav(true)}>☰</button><Link href="/admin" className="text-xl font-semibold">Bridge<span className="text-blue-600">Point</span></Link><span className="ml-auto hidden text-sm text-slate-500 md:block">{user?.city || "Cooperative workspace"} · Admin</span></div></header><div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8"><div className="rounded-3xl border bg-gradient-to-br from-white to-blue-50 p-6"><p className="text-sm text-blue-600">BridgePoint / Cooperative</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-2 max-w-2xl text-slate-600">{description}</p></div>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<section className="grid gap-4 md:grid-cols-3">{cards.map((card) => <article key={card} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">{card}</h2><p className="mt-3 text-sm text-slate-500">Live data is loaded from the cooperative reporting API.</p></article>)}</section><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Live cooperative data</h2>{data ? <div className="mt-4 grid gap-3 md:grid-cols-2">{rows.map((row, index) => <article key={index} className="rounded-xl border bg-slate-50 p-4"><div className="text-sm font-semibold capitalize text-slate-700">{String((row as { label?: unknown }).label || (row as Record<string, unknown>).name || "Record")}</div><div className="mt-2 text-sm text-slate-600">{formatValue((row as { value?: unknown }).value ?? row)}</div></article>)}</div> : <p className="mt-2 text-sm text-slate-600">Loading backend data...</p>}</div></div></main></div></div>;
}
