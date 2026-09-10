"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import type { Certification, EmergencyRequest, Job, Notification, ProviderVerification, TrustScore, WorkerAvailability, WorkerLocation, WelfareRecord, InsurancePolicy } from "@/lib/types";
import MessagesWorkspace from "@/components/MessagesWorkspace";
import Icon, { type IconName } from "@/components/Icon";

type Section = "available-jobs" | "jobs" | "earnings" | "skill-passport" | "training" | "messages" | "profile" | "settings" | "availability" | "notifications" | "emergency";
const links: readonly [string, string, IconName][] = [
  ["/worker", "Dashboard", "dashboard"],
  ["/worker/available-jobs", "Available Jobs", "search"],
  ["/worker/jobs", "My Jobs", "tools"],
  ["/worker/earnings", "Earnings", "wallet"],
  ["/worker/availability", "Availability", "calendar"],
  ["/worker/skill-passport", "Skill Passport", "card"],
  ["/worker/training", "Training & Welfare", "shield"],
  ["/worker/emergency", "Emergency Requests", "alert"],
  ["/worker/messages", "Messages", "chat"],
  ["/worker/notifications", "Notifications", "bell"],
  ["/worker/profile", "Profile", "users"],
  ["/worker/settings", "Settings", "settings"],
];
const workerLabelKey: Record<string, string> = { Dashboard: "dashboard", "Available Jobs": "jobs", "My Jobs": "jobs", Earnings: "payments", Availability: "availability", "Skill Passport": "passport", "Training & Welfare": "training", "Emergency Requests": "emergency", Messages: "messages", Notifications: "notifications", Profile: "profile", Settings: "settings" };

export default function WorkerFeaturePage({ section }: { section: Section }) {
  const { user, logout, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(section === "available-jobs" || section === "jobs" || section === "earnings");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [availability, setAvailability] = useState<WorkerAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [location, setLocation] = useState<WorkerLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin?role=worker&next=" + encodeURIComponent("/worker/" + section));
    else if (!authLoading && user && (user.is_admin || user.roles?.includes("cooperative") || (!user.roles?.includes("labor") && !user.labor_category))) {
      router.replace(user.is_admin || user.roles?.includes("cooperative") ? "/admin" : "/dashboard");
    }
  }, [authLoading, router, section, user]);

  useEffect(() => {
    if (section !== "available-jobs" && section !== "jobs" && section !== "earnings") return;
    let active = true;
    const request = section === "available-jobs" ? api.listJobs() : section === "jobs" ? api.getActiveTasksAsLabor() : api.getLaborJobHistory();
    request.then((result) => { if (active) setJobs(result.jobs); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load worker data."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section]);

  useEffect(() => {
    if (section !== "availability") return;
    api.getWorkerLocation().then(setLocation).catch(() => setLocation(null));
  }, [section]);

  useEffect(() => {
    if (section !== "availability") return;
    api.getAvailability().then(setAvailability).catch((err: unknown) => setAvailabilityError(err instanceof Error ? err.message : "Unable to load availability."));
  }, [section]);

  async function saveAvailability(value: boolean) {
    setSavingAvailability(true);
    setAvailabilityError("");
    try { setAvailability(await api.updateAvailability(value)); }
    catch (err) { setAvailabilityError(err instanceof Error ? err.message : "Unable to update availability."); }
    finally { setSavingAvailability(false); }
  }

  function captureLocation() {
    if (!navigator.geolocation) { setLocationError("Location is not supported by this browser."); return; }
    setSavingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try { setLocation(await api.updateWorkerLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_m: position.coords.accuracy })); }
      catch (err) { setLocationError(err instanceof Error ? err.message : "Unable to save location."); }
      finally { setSavingLocation(false); }
    }, (err) => { setLocationError(err.message || "Location permission was not granted."); setSavingLocation(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  }

  const name = mounted ? (user?.full_name || "Worker") : "Worker";
  const title = section === "available-jobs" ? "Available Jobs" : section === "skill-passport" ? "Digital Skill Passport" : section === "training" ? "Training & Welfare" : section === "jobs" ? "My Jobs" : section === "earnings" ? "Earnings" : section === "availability" ? "Worker Availability" : section === "notifications" ? "Notifications" : section === "emergency" ? "Emergency Requests" : section[0].toUpperCase() + section.slice(1);

  if (authLoading || !user || user.is_admin || user.roles?.includes("cooperative") || (!user.roles?.includes("labor") && !user.labor_category)) {
    return <div className="grid min-h-screen place-items-center bg-[var(--color-bp-white)] text-[var(--color-bp-gray-500)]">Checking worker access...</div>;
  }

  const renderDataSection = () => {
    if (section === "availability") return <AvailabilityPanel availability={availability} error={availabilityError} saving={savingAvailability} onChange={saveAvailability} location={location} locationError={locationError} savingLocation={savingLocation} onCaptureLocation={captureLocation} />;
    if (section === "notifications") return <NotificationsPanel />;
    if (section === "emergency") return <EmergencyPanel />;
    if (section === "messages") return <MessagesWorkspace role="worker" />;
    return (
      <>
        {loading && <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 text-[var(--color-bp-gray-500)]">Loading your data...</div>}
        {error && <div className="rounded-2xl border border-[var(--color-bp-red)] bg-red-50 p-5 text-[var(--color-bp-red)]"><b>Unable to load this section</b><p className="mt-1 text-sm">{error}</p><button onClick={() => window.location.reload()} className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium hover:bg-red-100 transition-colors">Retry</button></div>}
        {!loading && !error && section === "available-jobs" && <JobList jobs={jobs} title="Available Jobs" empty="No available jobs found. Try again later." />}
        {!loading && !error && section === "jobs" && <JobList jobs={jobs} title="My Jobs" empty="No accepted or active jobs found." />}
        {!loading && !error && section === "earnings" && <Earnings jobs={jobs} />}
        {section === "skill-passport" && <Passport user={user} />}
        {section === "training" && <Training />}
        {section === "profile" && <><ProviderStatus /><Profile user={user} /></>}
        {section === "settings" && <Empty title="Settings" text="Worker account settings are managed from your BridgePoint profile." />}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bp-white)] text-[var(--color-bp-black)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className={(mobileNav ? "translate-x-0" : "-translate-x-full") + " fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--color-bp-gray-200)] bg-white p-5 transition-transform lg:static lg:w-64 lg:translate-x-0"}>
          <div className="flex items-center justify-between">
            <Link href="/worker" className="text-xl font-semibold tracking-tight">
              Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
            </Link>
            <button aria-label="Close navigation" className="rounded-lg p-2 text-[var(--color-bp-gray-500)] hover:bg-[var(--color-bp-gray-100)] lg:hidden" onClick={() => setMobileNav(false)}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className="mb-7 mt-1 text-xs text-[var(--color-bp-gray-500)]">Work that matters. People who care.</p>
          <nav className="space-y-1">
            {links.map(([href, label, icon]) => (
              <Link key={href} href={href} onClick={() => setMobileNav(false)} className={(pathname === href ? "bg-blue-50 font-semibold text-[var(--color-bp-blue)] " : "text-[var(--color-bp-gray-700)] hover:bg-[var(--color-bp-gray-100)] ") + "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"}>
                <Icon name={icon} size={16} />
                {t(workerLabelKey[label] || label)}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="mt-8 w-full rounded-xl border border-red-200 px-3 py-2.5 text-left text-sm font-medium text-[var(--color-bp-red)] hover:bg-red-50 transition-colors">{t("signOut")}</button>
        </aside>

        {/* Mobile overlay */}
        {mobileNav && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileNav(false)} />}

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-bp-gray-200)] bg-white/90 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation" className="mr-1 rounded-lg border border-[var(--color-bp-gray-200)] px-3 py-2 lg:hidden" onClick={() => setMobileNav(true)}>
                <span className="block h-0.5 w-5 bg-[var(--color-bp-gray-700)] shadow-[0_-6px_0_var(--color-bp-gray-700),0_6px_0_var(--color-bp-gray-700)]" />
              </button>
              <Link href="/worker" className="text-xl font-semibold tracking-tight lg:hidden">
                Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span className="hidden text-[var(--color-bp-gray-500)] md:block">{user.city || "Worker location"}</span>
              <span className="font-medium">{name}</span>
              <Link href="/worker/profile" className="text-[var(--color-bp-blue)] font-medium hover:underline">Profile</Link>
            </div>
          </header>

          <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
            <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-gradient-to-br from-white to-blue-50/50 p-6">
              <p className="text-sm font-medium text-[var(--color-bp-blue)]">BridgePoint / Worker</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-[var(--color-bp-gray-500)]">Your worker workspace, connected to your BridgePoint account.</p>
            </div>
            {renderDataSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

function AvailabilityPanel({ availability, error, saving, onChange, location, locationError, savingLocation, onCaptureLocation }: { availability: WorkerAvailability | null; error: string; saving: boolean; onChange: (value: boolean) => void; location: WorkerLocation | null; locationError: string; savingLocation: boolean; onCaptureLocation: () => void }) {
  return (
    <section className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Availability for work</h2>
        <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">This status is stored on your worker account and used by matching.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)]">{error}</p>}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-[var(--color-bp-gray-100)] p-4">
          <div>
            <b className="text-[var(--color-bp-black)]">{availability?.is_available ? "Available" : "Unavailable"}</b>
            <p className="text-sm text-[var(--color-bp-gray-500)]">{availability ? "Saved to your account" : "Loading current status"}</p>
          </div>
          <button disabled={saving || !availability} onClick={() => onChange(!availability?.is_available)} className={(availability?.is_available ? "bg-[var(--color-bp-green)]" : "bg-[var(--color-bp-gray-500)]") + " rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"}>
            {saving ? "Saving..." : availability?.is_available ? "Set unavailable" : "Set available"}
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Work location</h2>
        <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">Save a precise location to enable nearby matching. BridgePoint stores coordinates, not a live tracking stream.</p>
        {location && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Location saved: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
        {locationError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)]">{locationError}</p>}
        <button disabled={savingLocation} onClick={onCaptureLocation} className="btn-primary mt-4 w-full justify-center !py-2.5">
          {savingLocation ? "Saving location..." : location ? "Update my location" : "Set my location"}
        </button>
      </div>
    </section>
  );
}

function NotificationsPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getNotifications().then(setItems).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load notifications.")); }, []);
  async function read(id: number) { try { const updated = await api.markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? updated : item)); } catch (err) { setError(err instanceof Error ? err.message : "Unable to update notification."); } }
  return (
    <section className="space-y-3">
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-[var(--color-bp-red)]">{error}</p>}
      {items.length === 0 ? <Empty title="No notifications" text="New job, payment, message, and emergency updates will appear here." /> : items.map((item) => (
        <article key={item.id} className={(item.is_read ? "bg-white" : "bg-blue-50") + " flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-bp-gray-200)] p-5 transition-colors"}>
          <div>
            <b className="text-[var(--color-bp-black)]">{item.title}</b>
            <p className="mt-1 text-sm text-[var(--color-bp-gray-700)]">{item.body}</p>
            <small className="text-[var(--color-bp-gray-500)]">{new Date(item.created_at).toLocaleString()}</small>
          </div>
          {!item.is_read && <button onClick={() => read(item.id)} className="btn-secondary !py-2 !px-4 !text-sm">Mark read</button>}
        </article>
      ))}
    </section>
  );
}

function EmergencyPanel() {
  const [items, setItems] = useState<EmergencyRequest[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getOpenEmergencies().then(setItems).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load emergency requests.")); }, []);
  async function respond(id: number) { try { const updated = await api.respondToEmergency(id); setItems((current) => current.filter((item) => item.id !== updated.id)); } catch (err) { setError(err instanceof Error ? err.message : "Unable to respond."); } }
  return (
    <section className="space-y-3">
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-[var(--color-bp-red)]">{error}</p>}
      {items.length === 0 ? <Empty title="No nearby emergency requests" text="Open requests matching your city will appear here." /> : items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between gap-3">
            <h2 className="font-bold">{item.category}</h2>
            <span className="badge badge-danger">{item.urgency}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--color-bp-gray-700)]">{item.description}</p>
          <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">{item.address} · {item.city}</p>
          <button onClick={() => respond(item.id)} className="btn-danger mt-4 !py-2 !px-4 !text-sm w-full sm:w-auto">Respond to request</button>
        </article>
      ))}
    </section>
  );
}

function JobList({ jobs, title, empty }: { jobs: Job[]; title: string; empty: string }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {jobs.length === 0 ? <Empty title={title} text={empty} /> : jobs.map((job) => (
        <article key={job.id} className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{job.title}</h2>
              <p className="text-sm text-[var(--color-bp-gray-500)]">{job.city} · {job.date_of_task}</p>
            </div>
            <span className="badge badge-success">{job.status}</span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-bp-gray-700)]">{job.work_description}</p>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--color-bp-gray-100)] pt-4">
            <b className="text-[var(--color-bp-black)] text-lg">₹{job.worker_payout || job.budget}</b>
            <Link href={"/jobs/" + job.id} className="btn-secondary !py-2 !px-4 !text-sm">View Details</Link>
          </div>
        </article>
      ))}
    </section>
  );
}

function Earnings({ jobs }: { jobs: Job[] }) {
  const total = jobs.reduce((sum, job) => sum + (job.worker_payout || job.labor_receives || 0), 0);
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Recorded total" value={"₹" + total.toLocaleString("en-IN")} />
        <Metric label="Completed jobs" value={String(jobs.filter((job) => job.status.includes("completed") || job.status === "payout_released").length)} />
        <Metric label="Transactions" value={String(jobs.length)} />
      </div>
      <JobList jobs={jobs} title="Earnings" empty="No earnings history is available yet." />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm">
      <b className="text-2xl tracking-tight text-[var(--color-bp-black)]">{value}</b>
      <p className="mt-1 text-sm font-medium text-[var(--color-bp-gray-500)]">{label}</p>
    </div>
  );
}

function Passport({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const [items, setItems] = useState<Certification[]>([]);
  const [trust, setTrust] = useState<TrustScore | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", issuing_organization: "", issue_date: "", expiry_date: "", credential_id: "" });

  useEffect(() => { if (!user) return; Promise.all([api.getCertifications(), api.getTrustScore(user.id)]).then(([certifications, score]) => { setItems(certifications); setTrust(score); }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load skill passport.")); }, [user]);
  useEffect(() => { if (trust) document.title = `Trust score ${Math.round(trust.trust_score)} · BridgePoint`; }, [trust]);

  async function add(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      const item = await api.addCertification(form);
      setItems((current) => [item, ...current]);
      setForm({ name: "", issuing_organization: "", issue_date: "", expiry_date: "", credential_id: "" });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save certification."); }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Image src="/hero-worker.svg" alt="Worker profile" width={110} height={110} className="h-24 w-24 rounded-2xl object-cover bg-[var(--color-bp-gray-100)]" />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight">{user?.full_name || "Worker"}</h2>
            <p className="text-[var(--color-bp-gray-500)] font-medium mt-1">{user?.labor_category || "Worker"}</p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className={`badge ${user?.email_verified ? "badge-success" : "badge-warning"}`}>Identity: {user?.email_verified ? "Verified" : "Pending"}</span>
              <span className={`badge ${user?.phone_verified ? "badge-success" : "badge-warning"}`}>Phone: {user?.phone_verified ? "Verified" : "Pending"}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[var(--color-bp-gray-100)]">
          <p className="text-sm font-medium text-[var(--color-bp-gray-700)]">Registered Skills</p>
          <p className="mt-1 text-sm text-[var(--color-bp-gray-500)]">{user?.skills?.join(" · ") || "Not added yet"}</p>
        </div>
        {trust && (
          <div className="mt-4 rounded-xl bg-blue-50/50 border border-blue-100 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-lg text-[var(--color-bp-blue)]">Trust score {Math.round(trust.trust_score)}/100</b>
              <span className="badge badge-info uppercase tracking-wider !text-[10px]">{trust.confidence} confidence</span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-bp-gray-700)]">Based on {trust.evidence_count} BridgePoint record{trust.evidence_count === 1 ? "" : "s"}: {trust.completed_jobs} completed job{trust.completed_jobs === 1 ? "" : "s"}, {trust.assigned_jobs} assigned.</p>
          </div>
        )}
        <p className="mt-4 text-xs text-[var(--color-bp-gray-500)] italic">Blockchain-ready credential architecture only. No on-chain credential is claimed.</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Certifications</h2>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-[var(--color-bp-red)]">{error}</p>}
        <div className="mt-4 space-y-3">
          {items.length === 0 ? <p className="text-sm text-[var(--color-bp-gray-500)]">No certifications added yet.</p> : items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-4 transition-colors hover:bg-white hover:border-[var(--color-bp-gray-200)]">
              <div className="flex justify-between gap-3">
                <b className="text-[var(--color-bp-black)]">{item.name}</b>
                <span className={`badge ${item.verification_status === "VERIFIED" ? "badge-success" : "badge-warning"} uppercase !text-[10px]`}>{item.verification_status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-bp-gray-700)]">{item.issuing_organization} · issued {item.issue_date}</p>
              {item.expiry_date && <p className="mt-1 text-xs text-[var(--color-bp-gray-500)]">Expires {item.expiry_date}</p>}
            </div>
          ))}
        </div>
        <form onSubmit={add} className="mt-6 pt-6 border-t border-[var(--color-bp-gray-100)] grid gap-3 md:grid-cols-2">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Certification name" className="input-field" />
          <input required value={form.issuing_organization} onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })} placeholder="Issuing organization" className="input-field" />
          <input required type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className="input-field" />
          <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input-field" />
          <input value={form.credential_id} onChange={(e) => setForm({ ...form, credential_id: e.target.value })} placeholder="Credential/reference ID (optional)" className="input-field md:col-span-2" />
          <button className="btn-primary w-full md:col-span-2 justify-center">Save self-declared certification</button>
        </form>
      </div>
    </section>
  );
}

function Training() {
  const [welfare, setWelfare] = useState<WelfareRecord[]>([]);
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.getWelfare(), api.getInsurance()]).then(([w, i]) => { setWelfare(w); setInsurance(i); }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load welfare records.")); }, []);
  async function enroll() { try { const item = await api.saveWelfare({ support_type: "BridgePoint worker support", status: "requested", eligibility: "Reviewed by cooperative", notes: "Request submitted from worker workspace." }); setWelfare((current) => [...current.filter((entry) => entry.support_type !== item.support_type), item]); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save support request."); } }
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-[var(--color-bp-red)] md:col-span-2">{error}</p>}
      <article className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Worker welfare support</h2>
        <p className="mt-2 text-sm text-[var(--color-bp-gray-700)]">BridgePoint support information. No government scheme integration is claimed.</p>
        {welfare.length ? welfare.map((item) => <p key={item.id} className="mt-4 rounded-xl bg-[var(--color-bp-gray-50)] border border-[var(--color-bp-gray-100)] p-4 text-sm">{item.support_type}: <b className="text-[var(--color-bp-black)]">{item.status}</b></p>) : <p className="mt-4 text-sm text-[var(--color-bp-gray-500)]">No support records yet.</p>}
        <button onClick={enroll} className="btn-secondary mt-4 w-full justify-center !py-2.5 !text-sm">Request BridgePoint support</button>
      </article>
      <article className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Insurance policies</h2>
        <p className="mt-2 text-sm text-[var(--color-bp-gray-700)]">Policies appear here when entered by an authorized worker workflow.</p>
        {insurance.length ? insurance.map((item) => (
          <div key={item.id} className="mt-4 rounded-xl bg-[var(--color-bp-gray-50)] border border-[var(--color-bp-gray-100)] p-4 text-sm">
            <b className="text-[var(--color-bp-black)]">{item.policy_name}</b>
            <p className="mt-1 text-[var(--color-bp-gray-700)]">{item.provider} · {item.status}</p>
            <p className="mt-1 text-xs text-[var(--color-bp-gray-500)] font-medium">Claim: {item.claim_status}</p>
          </div>
        )) : <p className="mt-4 text-sm text-[var(--color-bp-gray-500)]">No insurance policy data is available.</p>}
      </article>
      <Info title="Training programs" text="Training provider integrations are pending. Verified certifications remain available in Skill Passport." href="/worker/skill-passport" />
      <Info title="Cooperative support" text="Use Messages to contact BridgePoint support or your cooperative." href="/worker/messages" />
    </section>
  );
}

function Profile({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const [memberships, setMemberships] = useState<import("@/lib/types").CooperativeMembership[]>([]);
  const [membershipError, setMembershipError] = useState("");
  useEffect(() => { api.getMyMemberships().then(setMemberships).catch(() => setMembershipError("Cooperative membership data is not available yet.")); }, []);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Worker Profile</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 text-[var(--color-bp-gray-700)]">
          <p><strong className="text-[var(--color-bp-black)]">Name:</strong> {user?.full_name || "Not available"}</p>
          <p><strong className="text-[var(--color-bp-black)]">Email:</strong> {user?.email || "Not available"}</p>
          <p><strong className="text-[var(--color-bp-black)]">Phone:</strong> {user?.phone || "Not available"}</p>
          <p><strong className="text-[var(--color-bp-black)]">City:</strong> {user?.city || "Not available"}</p>
          <p className="sm:col-span-2"><strong className="text-[var(--color-bp-black)]">Skills:</strong> {user?.skills?.join(", ") || "Not added yet"}</p>
          <p className="sm:col-span-2"><strong className="text-[var(--color-bp-black)]">Bio:</strong> {user?.bio || "Not added yet"}</p>
        </div>
      </div>
      <ServiceLocationPanel />
      <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Cooperative Membership</h2>
        {membershipError ? <p className="mt-3 text-sm text-[var(--color-bp-gray-500)]">{membershipError}</p> : memberships.length === 0 ? <p className="mt-3 text-sm text-[var(--color-bp-gray-500)]">You are not connected to a cooperative society yet.</p> : (
          <div className="mt-4 space-y-3">
            {memberships.map((membership) => (
              <div key={membership.id} className="rounded-xl border border-[var(--color-bp-gray-100)] bg-[var(--color-bp-gray-50)] p-4 text-sm">
                <div className="flex justify-between items-start">
                  <b className="text-[var(--color-bp-black)]">{membership.society_name || "Society"}</b>
                  <span className={`badge ${membership.status === "ACTIVE" ? "badge-success" : "badge-warning"} uppercase !text-[10px]`}>{membership.status}</span>
                </div>
                <p className="mt-2 text-[var(--color-bp-gray-500)]">Membership ID: {membership.membership_number}</p>
                <p className="mt-1 text-[var(--color-bp-gray-500)]">Joined: {new Date(membership.joined_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProviderStatus() {
  const [provider, setProvider] = useState<ProviderVerification | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.getProviderVerification().then(setProvider).catch((err: unknown) => setError(err instanceof Error ? err.message : "Provider verification status is unavailable.")); }, []);
  if (error) return <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 text-sm text-[var(--color-bp-gray-500)] shadow-sm">Provider verification status is unavailable.</div>;
  if (!provider) return <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 text-sm text-[var(--color-bp-gray-500)] shadow-sm">Loading provider verification...</div>;
  
  const label = provider.status === "VERIFIED" ? "Verified Service Provider" : provider.status === "REJECTED" ? "Provider verification rejected" : "Provider verification pending";
  const bgClass = provider.status === "VERIFIED" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : provider.status === "REJECTED" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800";
  
  return (
    <div className={`rounded-2xl border p-6 mb-4 shadow-sm ${bgClass}`}>
      <div className="flex items-center gap-3">
        {provider.status === "VERIFIED" && <Icon name="shield" size={20} />}
        <b className="text-lg">{label}</b>
      </div>
      <p className="mt-2 text-sm opacity-90">Provider approval is reviewed by the cooperative and is separate from skill certifications.</p>
    </div>
  );
}

function ServiceLocationPanel() {
  const [location, setLocation] = useState<WorkerLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadLocation() {
    setLoading(true); setError("");
    try {
      setLocation(await api.getWorkerLocation());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load your service location.";
      if (msg.toLowerCase().includes("not been set") || msg.includes("404")) setLocation(null);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadLocation(); }, []);

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("Location is unavailable because this browser does not support geolocation.");
      return;
    }
    setSaving(true); setMessage(""); setError("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const saved = await api.updateWorkerLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_m: position.coords.accuracy });
        setLocation(saved);
        setMessage("Location detected and saved.");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to save your service location.");
      } finally {
        setSaving(false);
      }
    }, (geoError) => {
      const messages: Record<number, string> = {
        1: "Location permission was denied. Allow location access and retry.",
        2: "Location is currently unavailable. Check your device location settings and retry.",
        3: "Location detection timed out. Please retry.",
      };
      setError(messages[geoError.code] || "Unable to detect your location. Please retry.");
      setSaving(false);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  }

  return (
    <section className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm" aria-live="polite">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold">Service Location</h2>
          <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">Used for nearby job matching. BridgePoint stores your coordinates, not a live tracking stream.</p>
        </div>
        <button type="button" disabled={saving} onClick={captureLocation} className="btn-secondary !py-2.5 !text-sm whitespace-nowrap disabled:opacity-50">
          {saving ? "Saving location..." : location ? "Update location" : "Use My Current Location"}
        </button>
      </div>
      {loading && <p className="mt-4 rounded-xl bg-[var(--color-bp-gray-50)] p-4 text-sm text-[var(--color-bp-gray-500)] border border-[var(--color-bp-gray-100)]">Loading saved location...</p>}
      {!loading && location && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
          <b className="font-semibold">Location detected / saved</b>
          <p className="mt-1 font-mono text-xs opacity-90">Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}{location.accuracy_m != null ? ` · Accuracy ${Math.round(location.accuracy_m)} m` : ""}</p>
          <p className="mt-2 text-xs opacity-75 font-medium">Last updated {new Date(location.updated_at).toLocaleString()}</p>
        </div>
      )}
      {!loading && !location && !error && <p className="mt-4 rounded-xl bg-[var(--color-bp-gray-50)] p-4 text-sm text-[var(--color-bp-gray-600)] border border-[var(--color-bp-gray-100)]">No service location saved yet. Add one to improve nearby job matching.</p>}
      {message && <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800">{message}</p>}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-[var(--color-bp-red)]">
          <p>{error}</p>
          <button type="button" onClick={() => { setError(""); captureLocation(); }} className="mt-3 rounded-lg border border-[var(--color-bp-red)] bg-white px-3 py-1.5 font-medium hover:bg-red-50 transition-colors">Retry</button>
        </div>
      )}
    </section>
  );
}

function Info({ title, text, href }: { title: string; text: string; href?: string }) {
  return (
    <article className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-bp-gray-700)]">{text}</p>
      {href && <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-bp-blue)] hover:underline">Open <Icon name="arrow" size={14} /></Link>}
    </article>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">{text}</p>
    </section>
  );
}
