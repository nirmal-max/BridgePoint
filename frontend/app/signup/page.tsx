import { SignUpPage } from "@/components/AuthPages";
import { Suspense } from "react";

export default function SignUpRoute() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f4f9ff] text-slate-500">Loading sign up...</div>}><SignUpPage /></Suspense>;
}
