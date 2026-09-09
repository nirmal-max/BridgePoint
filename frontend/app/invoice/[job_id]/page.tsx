"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoicePage() {
  const params = useParams<{ job_id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { const id = Number(params.job_id); if (!id) return; api.getInvoice(id).then(setInvoice).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load invoice.")); }, [params.job_id]);
  if (error) return <main className="grid min-h-screen place-items-center bg-[#f3f8ff] p-5"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p></main>;
  if (!invoice) return <main className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Loading invoice...</main>;
  return <main className="min-h-screen bg-[#f3f8ff] p-5 text-slate-900"><article className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-sm print:shadow-none"><div className="flex items-start justify-between gap-4"><div><div className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></div><h1 className="mt-6 text-3xl font-bold">Invoice / Receipt</h1></div><button onClick={() => window.print()} className="rounded-xl border px-4 py-2 text-sm print:hidden">Print</button></div><div className="mt-6 grid gap-2 text-sm text-slate-600"><p>Invoice: <b className="text-slate-900">{invoice.invoice_number}</b></p><p>Job date: {new Date(invoice.job_date).toLocaleDateString()}</p><p>Payment status: <b className="text-slate-900">{invoice.payment_status}</b></p></div><div className="mt-6 rounded-2xl bg-slate-50 p-5"><p><b>Service:</b> {invoice.service}</p><p className="mt-2"><b>Customer:</b> {invoice.employer_name}</p><p className="mt-2"><b>Worker:</b> {invoice.worker_name || "Not assigned"}</p></div><div className="mt-6 space-y-3 border-t pt-5 text-right"><p>Service amount: ₹{invoice.amount.toLocaleString("en-IN")}</p><p>Platform commission: ₹{invoice.commission.toLocaleString("en-IN")}</p><p className="text-xl font-bold">Total: ₹{invoice.total.toLocaleString("en-IN")}</p>{invoice.transaction_reference && <p className="text-sm text-slate-500">Transaction reference: {invoice.transaction_reference}</p>}</div></article></main>;
}
