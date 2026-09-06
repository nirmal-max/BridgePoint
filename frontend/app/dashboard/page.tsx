"use client";

import { useEffect, useState } from "react";
import CooperativeDashboard from "@/components/CooperativeDashboard";
import WorkerDashboard from "@/components/WorkerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const queryRole = new URLSearchParams(window.location.search).get("role");
    setRole(queryRole || "customer");
  }, []);
  if (!role) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Loading dashboard...</div>;
  if (role === "worker") return <WorkerDashboard />;
  if (role === "customer") return <CustomerDashboard />;
  return <CooperativeDashboard />;
}
