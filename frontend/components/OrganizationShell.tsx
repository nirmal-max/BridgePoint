"use client";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveWorkspaceRole, useAuth } from "@/lib/auth-context";

export default function OrganizationShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth(); const router = useRouter(); const access = !!user && (user.is_admin || user.roles?.includes("cooperative") || getActiveWorkspaceRole() === "cooperative");
  useEffect(() => { if (!loading && !user) router.replace("/signin?role=cooperative"); else if (!loading && user && !access) router.replace("/dashboard"); }, [access, loading, router, user]);
  if (loading || !access) return <div className="grid min-h-screen place-items-center bg-[#f3f8ff] text-slate-500">Checking cooperative access...</div>;
  return <div className="min-h-screen bg-[#f3f8ff] text-slate-900"><header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-5 py-4"><Link href="/admin" className="text-2xl font-bold">Bridge<span className="text-blue-600">Point</span></Link><nav className="hidden gap-5 text-sm md:flex"><Link href="/admin">Dashboard</Link><Link href="/admin/federation">Federation</Link><Link href="/admin/societies">Societies</Link><Link href="/admin/members">Members</Link></nav><button onClick={() => { logout(); router.push("/"); }} className="text-sm text-red-600">Sign Out</button></header><main className="mx-auto max-w-6xl p-5 md:p-8">{children}</main></div>;
}
