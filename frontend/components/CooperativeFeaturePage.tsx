"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Section = "members" | "worker-profile" | "verification" | "demand-forecast" | "workforce" | "revenue" | "analytics";
const links = [["/admin", "Dashboard"], ["/admin/members", "Members / Workers"], ["/admin/worker-profile", "Worker Profile"], ["/admin/verification", "Verification Center"], ["/admin/demand-forecast", "AI Demand Forecast"], ["/admin/workforce", "Workforce Allocation"], ["/admin/revenue", "Earnings & Revenue"], ["/admin/analytics", "Analytics & Reports"]] as const;
const copy: Record<Section, [string, string, string[]]> = {
  members: ["Members / Workers", "Manage cooperative members and verification progress.", ["248 total members", "187 verified workers", "12 pending verification"]],
  "worker-profile": ["Worker Profile", "Review worker identity, skills, and cooperative membership.", ["Identity status", "Skill certifications", "Insurance status"]],
  verification: ["Verification Center", "Review worker documents and verification states.", ["Verified", "Pending review", "Needs attention"]],
  "demand-forecast": ["AI Demand Forecast", "Plan supply against expected service demand.", ["Electrical demand: High", "Plumbing demand: Medium", "Cleaning demand: Medium"]],
  workforce: ["Workforce Allocation", "Allocate verified workers using demand, skills, and availability.", ["4 electricians needed", "2 plumbers available", "1 carpenter pending"]],
  revenue: ["Earnings & Revenue", "Review cooperative revenue and recorded payment activity.", ["Cooperative share", "Platform commission", "Welfare and training fund"]],
  analytics: ["Analytics & Reports", "Track operational performance across your cooperative.", ["Jobs completed", "Worker growth", "Service performance"]],
};

export default function CooperativeFeaturePage({ section }: { section: Section }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace(`/signin?role=cooperative&next=${encodeURIComponent(`/admin/${section}`)}`); }, [loading, router, section, user]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-[#f3f7fd] text-slate-500">Checking access...</div>;
  const [title, description, cards] = copy[section];
  return <div className="min-h-screen bg-[#f3f7fd] text-slate-900"><div className="flex"><aside className="hidden min-h-screen w-72 shrink-0 border-r bg-white p-5 lg:block"><Link href="/admin" className="text-2xl font-semibold">Bridge<span className="text-blue-600">Point</span></Link><p className="mb-7 text-sm text-slate-500">Work that matters. People who care.</p><nav className="space-y-1">{links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-xl px-4 py-3 text-sm ${href === `/admin/${section}` ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>)}</nav></aside><main className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b bg-white/90 px-5 py-4 backdrop-blur"><div className="flex items-center justify-between"><Link href="/admin" className="text-xl font-semibold lg:hidden">Bridge<span className="text-blue-600">Point</span></Link><span className="ml-auto text-sm text-slate-500">Chennai Electrical Workers Cooperative · Admin</span></div></header><div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8"><div className="rounded-3xl border bg-gradient-to-br from-white to-blue-50 p-6"><p className="text-sm text-blue-600">BridgePoint / Cooperative</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-2 max-w-2xl text-slate-600">{description}</p></div><section className="grid gap-4 md:grid-cols-3">{cards.map((card) => <article key={card} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">{card}</h2><p className="mt-3 text-sm text-slate-500">Cooperative data and actions appear here when connected to the existing backend.</p></article>)}</section><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Operational workspace</h2><p className="mt-2 text-sm text-slate-600">This page is part of the current cooperative workspace and does not use the generic reference UI.</p></div></div></main></div></div>;
}
