"use client";
import { useParams } from "next/navigation";
import SocietyDetails from "@/components/SocietyDetails";
import OrganizationShell from "@/components/OrganizationShell";
export default function SocietyDetailsPage() { const params = useParams<{ id: string }>(); return <OrganizationShell><SocietyDetails id={Number(params.id)} /></OrganizationShell>; }
