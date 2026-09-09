"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function InvoiceIndexPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getMyJobs().then((result) => setJobs(result.jobs)).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load invoices.")); }, []);
  return <main className="min-h-screen bg-[#f3f8ff] p-5 text-slate-900"><div className="mx-auto max-w-4xl"><Link href="/dashboard" className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></Link><h1 className="mt-8 text-3xl font-bold">Invoices</h1><p className="mt-2 text-slate-500">Open a persistent receipt for one of your recorded jobs.</p>{error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<div className="mt-6 space-y-3">{jobs.length === 0 ? <p className="rounded-2xl border bg-white p-6 text-slate-500">No job invoices are available yet.</p> : jobs.map((job) => <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm"><div><b>{job.title}</b><p className="text-sm text-slate-500">{job.status} · ₹{(job.employer_total || job.budget).toLocaleString("en-IN")}</p></div><Link href={"/invoice/" + job.id} className="rounded-xl border border-blue-400 px-4 py-2 text-sm text-blue-700">Open invoice</Link></article>)}</div></div></main>;
}
