"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";
import Icon, { type IconName } from "@/components/Icon";

const nav: readonly [IconName, string, string][] = [
  ["service", "Dashboard", "/worker"],
  ["search", "Available Jobs", "/worker/available-jobs"],
  ["calendar", "My Jobs", "/worker/jobs"],
  ["card", "Earnings", "/worker/earnings"],
  ["shield", "Skill Passport", "/worker/skill-passport"],
  ["award", "Training & Welfare", "/worker/training"],
  ["chat", "Messages", "/worker/messages"],
  ["user", "Profile", "/worker/profile"],
  ["settings", "Settings", "/worker/settings"],
];

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);

  useEffect(() => {
    if (!user) router.replace("/signin?role=worker&next=%2Fworker");
    else if (user.is_admin || user.roles?.includes("cooperative") || (!user.roles?.includes("labor") && !user.labor_category))
      router.replace(user.is_admin || user.roles?.includes("cooperative") ? "/admin" : "/dashboard");
  }, [router, user]);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.listJobs();
      setJobs(result.jobs.filter((job) => job.status === "posted"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load available jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadJobs();
  }, [user]);

  if (!user || user.is_admin || user.roles?.includes("cooperative") || (!user.roles?.includes("labor") && !user.labor_category))
    return <div className="grid min-h-screen place-items-center bg-[#f8fafc] text-slate-500">Checking worker access...</div>;

  const visibleJobs = jobs.filter((job) => !search || `${job.title} ${job.work_description} ${job.city}`.toLowerCase().includes(search.toLowerCase()));

  const acceptJob = async (job: Job) => {
    setAccepting(job.id);
    try {
      await api.acceptTask(job.id);
      setNotice(`${job.title} accepted. It is now in My Jobs.`);
      await loadJobs();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Unable to accept this job.");
    } finally {
      setAccepting(null);
    }
  };

  const stats: [IconName, string, string, string][] = [
    ["card", `₹${jobs.reduce((sum, job) => sum + (job.worker_payout || job.labor_receives || job.budget), 0).toLocaleString("en-IN")}`, "Available payout", "From live jobs"],
    ["calendar", String(jobs.length), "Available Jobs", "From the API"],
    ["shield", user.email_verified ? "Verified" : "Pending", "Account status", "From your profile"],
    ["user", user.labor_category || "Worker", "Worker category", "Authenticated user"],
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex">
        <aside
          className={`${
            mobileNav ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 transition-transform lg:static lg:w-64 lg:translate-x-0`}
        >
          <div className="flex items-center justify-between">
            <Link href="/worker" className="text-2xl font-bold tracking-tight text-slate-900">
              Bridge<span className="text-blue-600">Point</span>
            </Link>
            <button
              aria-label="Close navigation"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileNav(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className="mb-6 text-xs text-slate-500">Work that matters. People who care.</p>
          <nav className="space-y-1">
            {nav.map(([icon, label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileNav(false)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                  pathname === href ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon name={icon} size={18} className={pathname === href ? "text-blue-600" : "text-slate-400"} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <b className="text-sm font-semibold text-blue-900">Need Help?</b>
            <p className="mt-1 text-xs text-slate-500">Message BridgePoint support.</p>
            <Link
              href="/worker/messages"
              onClick={() => setMobileNav(false)}
              className="mt-3 block w-full rounded-xl border border-blue-300 bg-white py-2 text-center text-xs font-semibold text-blue-600 shadow-xs hover:bg-blue-50"
            >
              Contact Support
            </Link>
          </div>
          <button
            onClick={logout}
            className="mt-4 flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100/50"
          >
            <Icon name="logout" size={16} />
            Sign Out
          </button>
        </aside>

        {mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileNav(false)} />}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-7">
            <div className="flex items-center gap-4">
              <button
                aria-label="Open navigation"
                className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
                onClick={() => setMobileNav(true)}
              >
                <Icon name="filter" size={18} />
              </button>
              <Link href="/worker" className="text-xl font-bold tracking-tight lg:hidden">
                Bridge<span className="text-blue-600">Point</span>
              </Link>

              <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                <Icon name="search" size={16} className="mr-2 text-slate-400" />
                <input
                  aria-label="Search available jobs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search available jobs..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <span className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:inline-flex">
                <Icon name="location" size={14} className="text-slate-400" />
                {user.city || "Chennai"}
              </span>

              <button
                aria-label="Notifications"
                onClick={() => setNotice("Notifications are not connected to a backend feed yet.")}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <Icon name="bell" size={18} />
              </button>

              <button
                aria-label="Open profile menu"
                onClick={() => setProfile(!profile)}
                className="hidden items-center gap-3 border-l border-slate-200 pl-4 md:flex"
              >
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-blue-200 bg-blue-100 text-sm font-bold text-blue-700">
                  {user.full_name?.slice(0, 1) || "W"}
                </span>
                <span className="text-left text-sm">
                  <b className="block font-semibold text-slate-900">{user.full_name}</b>
                  <small className="block text-emerald-700 font-medium">Online</small>
                </span>
              </button>
            </div>

            {profile && (
              <div className="absolute right-7 top-16 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl text-sm">
                <Link href="/worker/profile" className="block rounded-xl px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
                  Profile
                </Link>
                <button onClick={logout} className="block w-full rounded-xl px-4 py-2 text-left font-semibold text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            )}
          </header>

          <main className="space-y-6 p-4 md:p-7">
            <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Welcome back, {user.full_name.split(" ")[0]}!
                </h1>
                <p className="mt-1 text-base text-slate-500">Good workers build great communities.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-xs">
                <Icon name="check" size={14} />
                Live jobs from BridgePoint
              </span>
            </section>

            <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-2 md:grid-cols-4">
              {stats.map(([icon, value, label, note]) => (
                <div key={label} className="flex items-center gap-3.5 border-slate-100 sm:border-r sm:pr-4 last:border-0">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon name={icon} size={20} />
                  </span>
                  <div>
                    <b className="text-2xl font-bold text-slate-900">{value}</b>
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                    <small className="text-[11px] text-slate-400">{note}</small>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Available Jobs</h2>
                  <p className="text-xs text-slate-500">Live posted jobs available for immediate acceptance.</p>
                </div>
                <Link href="/worker/available-jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View All Jobs
                  <Icon name="arrowRight" size={14} />
                </Link>
              </div>

              {loading && <div className="py-12 text-center text-sm text-slate-500">Loading jobs...</div>}
              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <b className="text-sm">Jobs unavailable</b>
                  <p className="mt-1 text-xs">{error}</p>
                  <button onClick={loadJobs} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold">
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {visibleJobs.length ? (
                    visibleJobs.slice(0, 6).map((job) => (
                      <JobCard key={job.id} job={job} accepting={accepting === job.id} onAccept={() => acceptJob(job)} />
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                      No available jobs found matching search criteria.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <Info
                title="Digital Skill Passport"
                text="View identity, skills, and verification status from your authenticated profile."
                href="/worker/skill-passport"
                icon="shield"
              />
              <Info
                title="Training & Welfare"
                text="Review truthful training and welfare availability."
                href="/worker/training"
                icon="award"
              />
            </section>
          </main>
        </div>
      </div>

      {notice && (
        <button
          aria-label="Dismiss notification"
          onClick={() => setNotice("")}
          className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900 px-5 py-3.5 text-left text-xs font-medium text-white shadow-xl"
        >
          {notice}
        </button>
      )}
    </div>
  );
}

function JobCard({ job, accepting, onAccept }: { job: Job; accepting: boolean; onAccept: () => void }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Icon name="service" size={18} />
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
            Posted
          </span>
        </div>

        <h3 className="mt-3 text-base font-bold text-slate-900">{job.title}</h3>
        <p className="text-xs text-slate-500">
          {job.city} · {job.location_type}
        </p>

        <b className="mt-3 block text-lg font-bold text-slate-900">
          ₹{(job.worker_payout || job.labor_receives || job.budget).toLocaleString("en-IN")}
        </b>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
          {job.role_description || job.work_description}
        </p>
      </div>

      <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
        <Link
          href={`/jobs/${job.id}`}
          className="flex-1 rounded-xl border border-blue-300 bg-white py-2 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50"
        >
          View Details
        </Link>
        <button
          disabled={accepting}
          onClick={onAccept}
          className="flex-1 rounded-xl bg-blue-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
        >
          {accepting ? "Accepting..." : "Accept Job"}
        </button>
      </div>
    </article>
  );
}

function Info({ title, text, href, icon }: { title: string; text: string; href: string; icon: IconName }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Icon name={icon} size={20} />
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{text}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
        Open Module
        <Icon name="arrowRight" size={14} />
      </Link>
    </article>
  );
}

