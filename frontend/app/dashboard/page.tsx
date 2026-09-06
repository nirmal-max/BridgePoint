"use client";

import { useSyncExternalStore } from "react";
import CooperativeDashboard from "@/components/CooperativeDashboard";
import WorkerDashboard from "@/components/WorkerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";

export default function DashboardPage() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!mounted) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Loading dashboard...</div>;
  const role = new URLSearchParams(window.location.search).get("role") || "customer";
  if (role === "worker") return <WorkerDashboard />;
  if (role === "customer") return <CustomerDashboard />;
  return <CooperativeDashboard />;
}
