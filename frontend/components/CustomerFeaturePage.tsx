"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Job, Notification } from "@/lib/types";
import Icon, { type IconName } from "@/components/Icon";
import MessagesWorkspace from "@/components/MessagesWorkspace";

type Section = "find-services" | "booking" | "payment" | "reviews" | "emergency" | "messages" | "notifications" | "settings";
const links: readonly [string, string, IconName][] = [
  ["/dashboard", "Dashboard", "dashboard"],
  ["/find-services", "Find Services", "search"],
  ["/booking", "Bookings & Tracking", "calendar"],
  ["/payment", "Payments", "wallet"],
  ["/invoice", "Invoices", "card"],
  ["/reviews", "Reviews", "star"],
  ["/emergency", "Emergency Service", "alert"],
  ["/messages", "Messages", "chat"],
  ["/notifications", "Notifications", "bell"],
  ["/settings", "Settings", "settings"],
];
const customerLabelKey: Record<string, string> = { Dashboard: "dashboard", "Bookings & Tracking": "booking", Payments: "payments", Invoices: "invoice", Reviews: "reviews", "Emergency Service": "emergency", Messages: "messages", Notifications: "notifications", Settings: "settings" };

export default function CustomerFeaturePage({ section }: { section: Section }) {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(section === "find-services");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.replace("/signup?role=customer&next=" + encodeURIComponent("/" + section)); else if (!authLoading && user && getActiveWorkspaceRole() !== "customer" && (user.is_admin || user.roles?.includes("cooperative") || user.roles?.includes("labor") || user.role === "labor" || user.labor_category)) router.replace(user.is_admin || user.roles?.includes("cooperative") ? "/admin" : "/worker"); }, [authLoading, router, section, user]);
  useEffect(() => { if (section !== "find-services") return; let active = true; api.listJobs().then((result) => { if (active) setJobs(result.jobs); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load services."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [section]);

  if (authLoading || !user) return <div className="grid min-h-screen place-items-center bg-[var(--color-bp-white)] text-[var(--color-bp-gray-500)]">Checking access...</div>;

  const title = section === "find-services" ? "Find Services" : section === "booking" ? "Bookings & Tracking" : section === "notifications" ? "Notifications" : section[0].toUpperCase() + section.slice(1);

  return (
    <div className="min-h-screen bg-[var(--color-bp-white)] text-[var(--color-bp-black)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className={(mobileNav ? "translate-x-0" : "-translate-x-full") + " fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--color-bp-gray-200)] bg-white p-5 transition-transform lg:static lg:w-60 lg:translate-x-0"}>
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
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
                {t(customerLabelKey[label] || label)}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="mt-8 w-full rounded-xl border border-red-200 px-3 py-2.5 text-left text-sm text-[var(--color-bp-red)] hover:bg-red-50 transition-colors">{t("signOut")}</button>
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
              <Link href="/dashboard" className="text-xl font-semibold tracking-tight lg:hidden">
                Bridge<span className="text-[var(--color-bp-blue)]">Point</span>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-[var(--color-bp-gray-500)] md:block">{user.city || "Customer"}</span>
              <span className="font-medium">{user.full_name?.split(" ")[0]}</span>
            </div>
          </header>

          {/* Mobile tab bar */}
          <nav aria-label="Customer navigation" className="flex gap-2 overflow-x-auto border-b border-[var(--color-bp-gray-200)] bg-white px-5 py-3 lg:hidden">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={(pathname === href ? "bg-[var(--color-bp-blue)] text-white " : "bg-[var(--color-bp-gray-100)] text-[var(--color-bp-gray-700)] ") + "shrink-0 rounded-full px-3 py-2 text-sm transition-colors"}>
                {t(customerLabelKey[label] || label)}
              </Link>
            ))}
          </nav>

          <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
            {/* Page header */}
            <div className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-gradient-to-br from-white to-blue-50/50 p-6">
              <p className="text-sm font-medium text-[var(--color-bp-blue)]">BridgePoint / Customer</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-[var(--color-bp-gray-500)]">A connected customer workspace for services, bookings, and support.</p>
            </div>

            {/* Find services */}
            {section === "find-services" && <>
              {loading && <Empty title="Loading services" text="Finding available BridgePoint services." />}
              {error && <Empty title="Services unavailable" text={error} />}
              {!loading && !error && (
                <div className="grid gap-4 md:grid-cols-2">
                  {jobs.length ? jobs.map((job) => (
                    <article key={job.id} className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-bold">{job.title}</h2>
                        <span className="badge badge-info">{job.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-bp-gray-500)]">{job.category} · {job.city}</p>
                      <p className="mt-3 text-sm text-[var(--color-bp-gray-700)]">{job.work_description}</p>
                      <Link href={"/jobs/" + job.id} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-bp-blue)] px-4 py-2 text-sm font-medium text-[var(--color-bp-blue)] transition-colors hover:bg-[var(--color-bp-blue)] hover:text-white">
                        View Service
                        <Icon name="arrow" size={14} />
                      </Link>
                    </article>
                  )) : <Empty title="No services found" text="There are no services available right now." />}
                </div>
              )}
            </>}

            {/* Messages */}
            {section === "messages" && <MessagesWorkspace role="customer" />}

            {/* Notifications */}
            {section === "notifications" && <NotificationsPanel />}

            {/* Other sections */}
            {section !== "find-services" && section !== "messages" && section !== "notifications" && (
              <section className="grid gap-4 md:grid-cols-2">
                <Info title={title} text={section === "payment" ? "Select a job from your dashboard to continue payment." : section === "reviews" ? "Select a completed job to submit feedback." : section === "emergency" ? "Request emergency help from nearby verified workers." : "Your BridgePoint customer information appears here."} />
                <Info title="Next step" text="Use the customer dashboard to create or track a service request." />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api.getNotifications().then(setItems).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load notifications.")); }, []);
  async function read(id: number) { try { const updated = await api.markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? updated : item)); } catch (err) { setError(err instanceof Error ? err.message : "Unable to mark notification read."); } }
  return (
    <section className="space-y-3">
      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-[var(--color-bp-red)]">{error}</p>}
      {items.length === 0 ? (
        <Empty title="No notifications" text="New job, payment, message, and emergency updates will appear here." />
      ) : items.map((item) => (
        <article key={item.id} className={(item.is_read ? "bg-white" : "bg-blue-50") + " flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-bp-gray-200)] p-5 transition-colors"}>
          <div>
            <b className="text-[var(--color-bp-black)]">{item.title}</b>
            <p className="mt-1 text-sm text-[var(--color-bp-gray-700)]">{item.body}</p>
            <small className="text-[var(--color-bp-gray-500)]">{new Date(item.created_at).toLocaleString()}</small>
          </div>
          {!item.is_read && <button onClick={() => read(item.id)} className="rounded-lg border border-[var(--color-bp-blue)] px-3 py-2 text-sm font-medium text-[var(--color-bp-blue)] transition-colors hover:bg-[var(--color-bp-blue)] hover:text-white">Mark read</button>}
        </article>
      ))}
    </section>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-[var(--color-bp-gray-200)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-bp-gray-700)]">{text}</p>
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

