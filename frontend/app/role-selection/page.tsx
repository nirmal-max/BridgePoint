"use client";

import Link from "next/link";
import { useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

const roles: readonly [string, string, string, IconName][] = [
  ["customer", "Customer", "Find services, book verified workers, and manage requests.", "user"],
  ["worker", "Worker", "Find jobs, manage work, and grow your skills.", "briefcase"],
  ["cooperative", "Cooperative", "Manage workers, jobs, demand, and cooperative operations.", "users"],
];

export default function RoleSelectionPage() {
  const [role, setRole] = useState("customer");
  const destination = role === "worker" ? "/worker" : role === "cooperative" ? "/admin" : "/dashboard";

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-12 text-slate-900 md:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <Link href="/" className="text-3xl font-bold tracking-tight">
          Bridge<span className="text-blue-600">Point</span>
        </Link>
        
        <h1 className="mt-8 text-3xl font-bold tracking-tight md:text-4xl">
          Choose your BridgePoint experience
        </h1>
        <p className="mt-2 text-slate-500">
          Select the workspace role tailored to your needs.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {roles.map(([id, name, description, icon]) => {
            const isSelected = role === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-6 text-left transition ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div>
                  <div className={`grid h-12 w-12 place-items-center rounded-xl transition ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                  }`}>
                    <Icon name={icon} size={22} />
                  </div>
                  <b className="mt-5 block text-xl font-bold text-slate-900">{name}</b>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? "text-blue-700" : "text-slate-400"}>
                    {isSelected ? "Selected" : "Click to select"}
                  </span>
                  {isSelected && <Icon name="check" size={16} className="text-blue-600" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            ← Back to Home
          </Link>
          <Link
            href={destination}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Continue to Workspace
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}

