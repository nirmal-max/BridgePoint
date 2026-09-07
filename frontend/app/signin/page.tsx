import { SignInPage } from "@/components/AuthPages";
import { Suspense } from "react";

export default function SignInRoute() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f4f9ff] text-slate-500">Loading sign in...</div>}><SignInPage /></Suspense>;
}
