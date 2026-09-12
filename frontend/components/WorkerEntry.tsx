"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import WorkerDashboard from "@/components/WorkerDashboard";
export default function WorkerEntry(){const router=useRouter();const[ready,setReady]=useState(false);useEffect(()=>{if(localStorage.getItem("bp_voice_onboarded")!=="1")router.replace("/worker/onboard");else setReady(true)},[router]);return ready?<WorkerDashboard/>:<div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Preparing your worker workspace…</div>}
