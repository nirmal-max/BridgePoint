"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import MessagesWorkspace from "@/components/MessagesWorkspace";

type Section = "find-services" | "booking" | "payment" | "reviews" | "emergency" | "messages" | "settings";
const links = [["/dashboard", "Dashboard"], ["/find-services", "Find Services"], ["/booking", "Bookings & Tracking"], ["/payment", "Payments"], ["/reviews", "Reviews"], ["/emergency", "Emergency Service"], ["/messages", "Messages"], ["/settings", "Settings"]] as const;

export default function CustomerFeaturePage({ section }: { section: Section }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(section === "find-services");
  const [error, setError] = useState("");
  useEffect(() => { if (!authLoading && !user) router.replace(`/signup?role=customer&next=${encodeURIComponent(`/${section}`)}`); else if (!authLoading && user && (user.is_admin || user.roles?.includes("cooperative") || user.role === "labor" || user.labor_category)) router.replace(user.is_admin || user.roles?.includes("cooperative") ? "/admin" : "/worker"); }, [authLoading, router, section, user]);
  useEffect(() => { if (section !== "find-services") return; let active = true; api.listJobs().then((result) => { if (active) setJobs(result.jobs); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load services."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [section]);
  if (authLoading || !user) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Checking access...</div>;
  const title = section === "find-services" ? "Find Services" : section === "booking" ? "Bookings & Tracking" : section[0].toUpperCase() + section.slice(1);
  return <div className="min-h-screen bg-[#f3f8ff] text-slate-900"><div className="flex"><aside className="hidden min-h-screen w-60 shrink-0 border-r bg-white p-5 lg:block"><Link href="/dashboard" className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></Link><p className="mb-7 text-xs text-slate-500">Work that matters. People who care.</p><nav className="space-y-1">{links.map(([href, label]) => <Link key={href} href={href} className={`block rounded-xl px-3 py-3 text-sm ${href === `/${section}` ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}>{label}</Link>)}</nav></aside><main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/90 px-5 py-4 backdrop-blur"><Link href="/dashboard" className="text-xl font-bold lg:hidden">Bridge<span className="text-blue-600">Point</span></Link><span className="ml-auto text-sm text-slate-500">⌖ Chennai</span></header><div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8"><div><p className="text-sm font-medium text-blue-600">BridgePoint / Customer</p><h1 className="mt-1 text-3xl font-bold">{title}</h1><p className="mt-1 text-slate-500">A connected customer workspace for services, bookings, and support.</p></div>{section === "find-services" && <>{loading && <Empty title="Loading services" text="Finding available BridgePoint services." />}{error && <Empty title="Services unavailable" text={error} />}{!loading && !error && <div className="grid gap-4 md:grid-cols-2">{jobs.length ? jobs.map((job) => <article key={job.id} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">{job.title}</h2><p className="mt-2 text-sm text-slate-500">{job.category} · {job.city}</p><p className="mt-3 text-sm text-slate-600">{job.work_description}</p><Link href={`/jobs/${job.id}`} className="mt-4 inline-block rounded-full border border-blue-400 px-4 py-2 text-sm text-blue-600">View Service</Link></article>) : <Empty title="No services found" text="There are no services available right now." />}</div>}</>}{section === "messages" && <MessagesWorkspace role="customer" />}{section !== "find-services" && section !== "messages" && <section className="grid gap-4 md:grid-cols-2"><Info title={title} text={section === "payment" ? "Select a job from your dashboard to continue payment." : section === "reviews" ? "Select a completed job to submit feedback." : section === "emergency" ? "Request emergency help from nearby verified workers." : "Your BridgePoint customer information appears here."} /><Info title="Next step" text="Use the customer dashboard to create or track a service request." /></section>}</div></main></div></div>;
}

function Info({ title, text }: { title: string; text: string }) { return <article className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-slate-600">{text}</p></article>; }
function Empty({ title, text }: { title: string; text: string }) { return <section className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p></section>; }
