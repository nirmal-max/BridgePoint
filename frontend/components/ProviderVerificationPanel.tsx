"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ProviderVerification } from "@/lib/types";

export default function ProviderVerificationPanel() {
  const [items, setItems] = useState<ProviderVerification[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    api.getProviderVerificationQueue().then(setItems).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Unable to load provider verification queue.");
    });
  }, []);

  async function update(workerId: number, action: "verify" | "reject") {
    setSaving(workerId);
    setError("");
    try {
      const updated = action === "verify" ? await api.verifyProvider(workerId) : await api.rejectProvider(workerId);
      setItems((current) => current.map((item) => item.worker_id === workerId ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update provider verification.");
    } finally {
      setSaving(null);
    }
  }

  return <section className="rounded-2xl border bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">Service Provider Verification</h2>
    <p className="mt-2 text-sm text-slate-600">Approve workers as service providers separately from their individual skill certifications.</p>
    {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">No service providers are available for review.</p> : <div className="mt-4 space-y-3">{items.map((item) => <article key={item.worker_id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><b>{item.worker_name}</b><p className="text-sm text-slate-600">{item.labor_category || "Worker"} · {item.city || "Location unavailable"}</p><p className="text-xs text-slate-500">Skills: {item.skills.length ? item.skills.join(", ") : "Not added"} · {item.status}</p></div><div className="flex gap-2">{item.status !== "VERIFIED" && <button disabled={saving === item.worker_id} onClick={() => update(item.worker_id, "verify")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === item.worker_id ? "Saving..." : "Verify"}</button>}{item.status !== "REJECTED" && <button disabled={saving === item.worker_id} onClick={() => update(item.worker_id, "reject")} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button>}</div></article>)}</div>}
  </section>;
}
