"use client";

import Link from "next/link";
import { useState } from "react";

const roles = [
  ["customer", "Customer", "Find services, book verified workers and manage requests."],
  ["worker", "Worker", "Find jobs, manage work and grow your skills."],
  ["cooperative", "Cooperative", "Manage workers, jobs, demand and cooperative operations."],
] as const;

export default function RoleSelectionPage() {
  const [role, setRole] = useState("customer");
  const destination = role === "worker" ? "/worker" : role === "cooperative" ? "/admin" : "/dashboard";
  return <main className="min-h-screen bg-[#f3f8ff] p-6"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm"><Link href="/" className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></Link><h1 className="mt-12 text-4xl font-bold">Choose your BridgePoint experience</h1><div className="mt-8 grid gap-4 md:grid-cols-3">{roles.map(([id, name, description]) => <button key={id} onClick={() => { setRole(id); localStorage.setItem("bp_active_role", id); }} className={`rounded-2xl border p-6 text-left ${role === id ? "border-blue-500 bg-blue-50" : "bg-white"}`}><b className="text-xl">{name}</b><p className="mt-2 text-sm text-slate-500">{description}</p></button>)}</div><Link href={destination} className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold text-white">Continue →</Link></div></main>;
}
