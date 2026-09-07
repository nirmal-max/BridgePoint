"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import CooperativeDashboard from "@/components/CooperativeDashboard";
import WorkerDashboard from "@/components/WorkerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";

export default function DashboardPage() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [loading, router, user]);
  if (!mounted) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Loading dashboard...</div>;
  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Checking access...</div>;
  const role = user.is_admin ? "cooperative" : user.role === "labor" || user.labor_category ? "worker" : "customer";
  if (role === "worker") return <WorkerDashboard />;
  if (role === "customer") return <CustomerDashboard />;
  return <CooperativeDashboard />;
}
