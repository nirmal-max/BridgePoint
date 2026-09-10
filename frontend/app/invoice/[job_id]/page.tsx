"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Invoice } from "@/lib/types";

export default function InvoicePage() {
  const params = useParams<{ job_id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [platform, setPlatform] = useState<{ upi_id: string; upi_name: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const id = Number(params.job_id);
    if (!id) return;
    api.getInvoice(id).then(setInvoice).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load invoice."));
    api.getPlatformInfo().then(setPlatform).catch(() => setPlatform(null));
  }, [params.job_id]);
  if (error) return <main className="grid min-h-screen place-items-center bg-[#f3f8ff] p-5"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p></main>;
  if (!invoice) return <main className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Loading invoice...</main>;
  const paymentPending = ["pending", "initiated"].includes(invoice.payment_status) && ["work_completed", "payment_in_process"].includes(invoice.job_status);
  const workNotCompleted = !["work_completed", "payment_in_process", "verification_pending", "verified", "payout_released", "payment_completed"].includes(invoice.job_status);
  return <main className="min-h-screen bg-[#f3f8ff] p-5 text-slate-900"><article className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-sm print:shadow-none"><div className="flex items-start justify-between gap-4"><div><div className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></div><h1 className="mt-6 text-3xl font-bold">Invoice / Receipt</h1></div><button onClick={() => window.print()} className="rounded-xl border px-4 py-2 text-sm print:hidden">Print</button></div><div className="mt-6 grid gap-2 text-sm text-slate-600"><p>Invoice: <b className="text-slate-900">{invoice.invoice_number}</b></p><p>Job date: {new Date(invoice.job_date).toLocaleDateString()}</p><p>Work status: <b className="text-slate-900">{invoice.job_status}</b></p><p>Payment status: <b className="text-slate-900">{invoice.payment_status}</b></p></div><div className="mt-6 rounded-2xl bg-slate-50 p-5"><p><b>Service:</b> {invoice.service}</p><p className="mt-2"><b>Customer:</b> {invoice.employer_name}</p><p className="mt-2"><b>Assigned worker:</b> {invoice.worker_name || "Not assigned"}</p></div><div className="mt-6 space-y-3 border-t pt-5 text-right"><p>Service amount: ₹{invoice.amount.toLocaleString("en-IN")}</p><p>Platform commission: ₹{invoice.commission.toLocaleString("en-IN")}</p><p className="text-xl font-bold">Total: ₹{invoice.total.toLocaleString("en-IN")}</p>{invoice.transaction_reference && <p className="text-sm text-slate-500">Transaction reference: {invoice.transaction_reference}</p>}</div>{workNotCompleted && <p className="mt-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800"><b>Work not completed.</b> No worker payout will be released. If a payment was already received, the return is admin-managed to the original payer.</p>}{paymentPending && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5"><h2 className="text-xl font-bold text-blue-950">Pay BridgePoint Admin</h2><p className="mt-2 text-sm text-blue-900">Scan this QR to make the payment. The payment is received by the BridgePoint admin and manually verified.</p><Image src="/platform-qr.png" alt="BridgePoint admin payment QR" width={200} height={200} className="mx-auto mt-4 rounded-xl bg-white p-2" />{platform && <p className="mt-4 text-center text-sm text-blue-900">UPI ID: <b>{platform.upi_id}</b></p>}<p className="mt-2 text-center text-xs text-blue-800">After paying, open the job payment flow to submit the UTR reference.</p><Link href={`/jobs/${invoice.job_id}`} className="mt-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white print:hidden">Open payment flow</Link></div>}{invoice.payment_status === "verification_pending" && <p className="mt-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">Payment received from the customer is awaiting admin verification.</p>}{invoice.payment_status === "completed" && <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Payment completed. Any worker payout is handled through the BridgePoint admin workflow.</p>}</article></main>;
}
