"use client";

import Image from "next/image";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

const services: { name: string; icon: IconName }[] = [
  { name: "Electrical Services", icon: "tools" },
  { name: "Plumbing", icon: "service" },
  { name: "Carpentry", icon: "briefcase" },
  { name: "Painting", icon: "tools" },
  { name: "Cleaning", icon: "service" },
  { name: "Domestic Help", icon: "users" },
  { name: "Caregiver", icon: "users" },
  { name: "Driver", icon: "location" },
  { name: "Gardening", icon: "service" },
  { name: "Technician", icon: "tools" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f1b3d]">
      <div className="bg-blue-700 px-5 py-2.5 text-xs font-medium text-white shadow-inner">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon name="users" size={14} className="text-blue-200" />
            A cooperative-powered platform for stronger communities
          </span>
          <span className="hidden font-semibold md:block">English · தமிழ் · हिन्दी</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-[1440px] items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
            Bridge<span className="text-blue-600">Point</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium md:flex">
            <Link className="border-b-2 border-blue-600 py-1 text-blue-600" href="/">
              Home
            </Link>
            <Link href="/signup" className="text-slate-600 transition hover:text-blue-600">
              Find Services
            </Link>
            <Link href="/signin?role=worker" className="text-slate-600 transition hover:text-blue-600">
              For Workers
            </Link>
            <Link href="/signin?role=cooperative" className="text-slate-600 transition hover:text-blue-600">
              For Cooperatives
            </Link>
            <a href="#about" className="text-slate-600 transition hover:text-blue-600">
              About
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/signin" className="text-sm font-semibold text-slate-700 transition hover:text-blue-600">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-slate-50 px-5 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                <Icon name="award" size={14} />
                People · Skills · Stronger Communities
              </div>
              <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-900 md:text-7xl">
                Work that matters.<br />
                <span className="text-blue-600">People who care.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                BridgePoint connects customers with cooperative workers in their city. Post a task, find skilled help, and manage the work through one accountable workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup?role=customer&next=%2Fdashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <Icon name="search" size={18} />
                  Book a Service
                </Link>
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-600 bg-white px-7 py-3.5 text-base font-semibold text-blue-600 shadow-xs transition hover:bg-blue-50 active:scale-[0.98]"
                >
                  <Icon name="briefcase" size={18} />
                  Post a Task
                </Link>
              </div>
            </div>

            <div className="relative min-h-[420px]">
              <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-blue-100/60 to-blue-50/20 border border-blue-100/80" />
              <div className="relative flex h-full min-h-[420px] items-center justify-center p-6">
                <Image
                  src="/hero-worker.svg"
                  alt="BridgePoint cooperative worker illustration"
                  width={410}
                  height={410}
                  className="relative z-10 h-[380px] w-auto drop-shadow-xl"
                  priority
                />
                <div className="absolute right-2 top-2 z-20 max-w-60 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Icon name="trendingUp" size={16} className="text-blue-600" />
                    Live workspace data
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Sign in to view verified workers, active jobs, and cooperative metrics from BridgePoint records.
                  </p>
                  <Link
                    href="/signin"
                    className="mt-3 block rounded-xl bg-blue-50 p-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Open workspace →
                  </Link>
                </div>

                <div className="absolute bottom-2 left-2 right-6 z-20 rounded-2xl border border-red-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                  <b className="flex items-center gap-2 text-sm font-bold text-red-700">
                    <Icon name="alert" size={16} className="text-red-600" />
                    Emergency Service?
                  </b>
                  <p className="mt-1 text-xs text-slate-500">
                    Request urgent help using a manually entered address.
                  </p>
                  <Link
                    href="/emergency"
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700"
                  >
                    Request Emergency Help
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-5 py-6">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 md:grid-cols-5">
            {[
              ["shield", "Verified Workers", "Verification status from worker records"],
              ["users", "Cooperative Powered", "Supports local cooperative operations"],
              ["card", "Secure Payments", "Recorded payment and payout flow"],
              ["award", "Worker Welfare", "Support information when available"],
              ["star", "Reliable & Rated", "Reviews from completed work"],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Icon name={icon as IconName} size={20} />
                </span>
                <div>
                  <b className="block text-sm font-semibold text-slate-900">{title}</b>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Popular Services</h2>
              <p className="mt-1 text-sm text-slate-500">Find trusted help for everyday needs in your city</p>
            </div>
            <Link href="/signup?role=customer&next=%2Ffind-services" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
              View All Services
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5 lg:grid-cols-10">
            {services.map((item) => (
              <Link
                key={item.name}
                href={`/signup?role=customer&next=${encodeURIComponent(`/find-services?service=${item.name}`)}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="mt-3 block text-xs font-semibold text-slate-800">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-12 lg:grid-cols-3">
          <Feature
            title="Worker discovery"
            icon="search"
            text="Search the live marketplace after signing in. Availability and job assignment come from BridgePoint records."
          >
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Worker profiles and service availability appear from the authenticated marketplace.
            </p>
            <Link href="/signin?role=customer&next=%2Ffind-services" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Open Find Services
              <Icon name="arrowRight" size={16} />
            </Link>
          </Feature>

          <Feature
            title="Demand Forecast"
            icon="calendar"
            text="Authorized cooperatives can review a data-driven forecast based on recorded BridgePoint job activity."
          >
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Forecast results are calculated cleanly from historical activity records.
            </p>
            <Link
              href="/signin?role=cooperative&next=%2Fadmin/demand-forecast"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Open Cooperative Insights
            </Link>
          </Feature>

          <Feature
            title="Digital Skill Passport"
            icon="shield"
            text="Worker identity, skills, and certification status are shown from authenticated records."
          >
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Blockchain-ready credential architecture only. No on-chain credential is claimed.
            </p>
            <Link
              href="/signin?role=worker&next=%2Fworker/skill-passport"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Open Skill Passport
            </Link>
          </Feature>
        </section>

        <section id="about" className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-16 lg:grid-cols-2">
          <div className="relative min-h-72 overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
            <Image src="/community-workers.svg" alt="BridgePoint cooperative workers" fill className="object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
            <div className="relative flex h-full min-h-72 flex-col justify-end p-8 text-white">
              <h2 className="max-w-sm text-3xl font-bold leading-tight">
                Empowering Skilled People.<br />
                Building Stronger Communities.
              </h2>
              <div className="mt-6">
                <Link
                  href="/signup?role=worker"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Icon name="briefcase" size={16} />
                  Join as a Worker
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-8">
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Icon name="users" size={20} />
              </span>
              For Cooperatives
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Manage your workforce, review demand, allocate resources, and support members with connected BridgePoint tools.
            </p>
            <div className="mt-6">
              <Link
                href="/signup?role=cooperative"
                className="inline-flex items-center gap-2 rounded-full border border-blue-600 bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 shadow-xs transition hover:bg-blue-50"
              >
                Access Cooperative Dashboard →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-[#0f1b3d] px-5 py-10 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 text-sm md:flex-row md:items-center">
          <div>
            <b className="text-2xl font-bold tracking-tight">
              Bridge<span className="text-blue-400">Point</span>
            </b>
            <p className="mt-1 text-xs text-slate-400">India&apos;s cooperative work coordination platform</p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-medium text-slate-300">
            <a href="#about" className="hover:text-white">About</a>
            <Link href="/signin?role=cooperative" className="hover:text-white">Cooperatives</Link>
            <a href="mailto:hello@bridgepoint.local" className="hover:text-white">Contact</a>
            <a href="#about" className="hover:text-white">Privacy</a>
            <a href="#about" className="hover:text-white">Terms</a>
          </div>
          <span className="text-xs text-slate-400">© 2026 BridgePoint Ecosystem</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, icon, text, children }: { title: string; icon: IconName; text: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Icon name={icon} size={20} />
        </span>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{text}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

