"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { EmergencyRequest } from "@/lib/types";
import Icon from "@/components/Icon";

export default function EmergencyPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<EmergencyRequest[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState({ category: "Electrical emergency", urgency: "high", description: "", address: "", city: "" });

  useEffect(() => {
    if (user) api.getMyEmergencies().then(setItems).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load emergency requests."));
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    try {
      const item = await api.createEmergency({ ...form, city: form.city || user?.city || "Chennai" });
      setItems((current) => [item, ...current]);
      setForm({ ...form, description: "", address: "" });
      setSaved("Emergency request submitted. Matching workers in your city can respond.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create emergency request.");
    }
  }

  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-[#f8fafc] text-slate-500">Checking access...</div>;

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            Bridge<span className="text-blue-600">Point</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to dashboard
          </Link>
        </header>

        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-100 text-red-600">
              <Icon name="alert" size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Emergency Service</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Request verified nearby help</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter location details below. Nearby verified workers in your city will be notified immediately.
          </p>

          {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
          {saved && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">{saved}</p>}

          <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Emergency Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="select-field mt-1.5"
              >
                <option>Electrical emergency</option>
                <option>Plumbing emergency</option>
                <option>Medical support</option>
                <option>Other urgent help</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Urgency Level
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="select-field mt-1.5"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              City
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder={user?.city || "Chennai"}
                className="input-field mt-1.5"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Specific Address
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter the location for help"
                className="input-field mt-1.5"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              What happened?
              <textarea
                required
                minLength={10}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide detail on the emergency situation..."
                className="input-field mt-1.5 min-h-28"
              />
            </label>

            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] md:col-span-2">
              <Icon name="alert" size={18} />
              Submit Emergency Request
            </button>
          </form>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Your Emergency Requests</h2>
          {items.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No emergency requests submitted.
            </p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <b className="text-base font-bold text-slate-900">{item.category}</b>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 uppercase tracking-wide border border-red-200">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  {item.address} · {item.city}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

