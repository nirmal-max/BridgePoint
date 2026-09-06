"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  "Dashboard",
  "Members / Workers",
  "Job Management",
  "Demand Forecast (AI)",
  "Workforce Allocation",
  "Earnings & Revenue",
  "Training & Welfare",
  "Verifications",
  "Analytics & Reports",
  "Messages",
  "Settings",
];

const KPIS = [
  ["248", "Total Members", "+12% from last month"],
  ["187", "Verified Workers", "+75% verified"],
  ["42", "Active Jobs", "+8% from last week"],
  ["₹84,500", "Cooperative Earnings", "+21% from last month"],
];

const forecast = {
  "Next 7 Days": { Electrical: [34, 41, 41, 52, 47, 50, 46], Plumbing: [18, 20, 25, 29, 22, 23, 21], Cleaning: [8, 9, 12, 15, 11, 13, 10], Carpentry: [4, 4, 5, 7, 4, 6, 4] },
  "Next 14 Days": { Electrical: [30, 34, 39, 45, 49, 51, 53], Plumbing: [16, 18, 20, 23, 25, 24, 22], Cleaning: [7, 8, 9, 12, 13, 12, 11], Carpentry: [3, 4, 4, 5, 6, 5, 4] },
  "Next 30 Days": { Electrical: [28, 32, 36, 40, 44, 48, 52], Plumbing: [15, 17, 18, 21, 22, 24, 25], Cleaning: [6, 7, 8, 9, 10, 11, 12], Carpentry: [3, 3, 4, 4, 5, 5, 6] },
} as const;

const bars = [18, 28, 42, 34, 50, 58, 44, 63];
const revenue = [12, 18, 22, 20, 26, 30, 33, 39];

function pct(n: number, d: number) { return Math.round((n / d) * 100); }

export default function CooperativeDashboard() {
  const { user, logout } = useAuth();
  const [nav, setNav] = useState(0);
  const [period, setPeriod] = useState<keyof typeof forecast>("Next 7 Days");
  const [revPeriod, setRevPeriod] = useState("This Month");
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [notify, setNotify] = useState(false);
  const [msg, setMsg] = useState(false);
  const [profile, setProfile] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [allocModal, setAllocModal] = useState(false);

  const series = forecast[period];
  const filteredNav = useMemo(() => NAV.filter((x) => x.toLowerCase().includes(search.toLowerCase())), [search]);

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900">
      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 backdrop-blur xl:static xl:translate-x-0 transition-transform ${sidebar ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`}>
          <div className="p-5 h-full flex flex-col">
            <div className="mb-6">
              <div className="text-2xl font-semibold text-slate-900">Bridge<span className="text-blue-600">Point</span></div>
              <div className="text-sm text-slate-500">Work that matters. People who care.</div>
            </div>
            <nav className="space-y-1 text-sm">
              {filteredNav.map((item, i) => (
                <button key={item} onClick={() => setNav(i)} className={`w-full text-left px-4 py-3 rounded-2xl ${nav === i ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                  {item}
                </button>
              ))}
            </nav>
            <div className="mt-auto rounded-3xl bg-gradient-to-br from-blue-50 to-sky-100 p-5">
              <div className="text-sm text-slate-600">Stronger communities through cooperation.</div>
              <div className="mt-3 h-28 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,.8)),url('/icon-512.png')] bg-cover bg-center" />
            </div>
          </div>
        </aside>

        <div className="flex-1 xl:ml-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="px-4 md:px-6 py-4 flex items-center gap-3">
              <button className="xl:hidden px-3 py-2 rounded-xl border" onClick={() => setSidebar(v => !v)}>☰</button>
              <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm text-slate-600">Chennai, Tamil Nadu ▾</button>
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white text-slate-400">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workers, jobs, reports..." className="w-full outline-none text-slate-700" />
              </div>
              <button onClick={() => setNotify(v => !v)} className="relative px-3 py-2 rounded-xl border bg-white">🔔<span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs rounded-full bg-red-500 text-white">5</span></button>
              <button onClick={() => setMsg(v => !v)} className="px-3 py-2 rounded-xl border bg-white">💬</button>
              <button onClick={() => setProfile(v => !v)} className="flex items-center gap-3 px-3 py-2 rounded-2xl border bg-white">
                <span className="h-10 w-10 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">{(user?.full_name || "CE").split(" ").map(s => s[0]).slice(0,2).join("") || "CE"}</span>
                <span className="hidden md:block text-left"><div className="text-sm font-medium">{user?.full_name || "Chennai Electrical Workers Cooperative"}</div><div className="text-xs text-slate-500">Admin</div></span>
              </button>
            </div>
            {(notify || msg || profile) && <div className="px-6 pb-4 text-sm text-slate-600">{notify ? "3 new notifications ready." : msg ? "2 unread messages." : "Profile actions available."}</div>}
          </header>

          <main className="p-4 md:p-6 space-y-4">
            <section className="rounded-[28px] bg-gradient-to-br from-white to-blue-50 border border-slate-200 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="text-4xl md:text-5xl font-semibold">Good morning!</div>
                  <div className="mt-1 text-2xl md:text-3xl font-semibold text-slate-700">Chennai Electrical Workers Cooperative</div>
                  <p className="mt-2 text-slate-600 max-w-2xl">Manage your workforce, meet community demand, and create better opportunities.</p>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="hidden md:block rounded-3xl bg-white/80 border border-slate-200 px-5 py-4 text-blue-700 italic">&quot;Organised workers. Stronger communities.&quot;</div>
                  <button onClick={() => setMemberModal(true)} className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-medium">+ Add New Member</button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {KPIS.map(([value, label, note], i) => <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="text-3xl mb-3">{["👥","🛡️","📅","₹"][i]}</div><div className="text-3xl font-semibold">{value}</div><div className="text-slate-600">{label}</div><div className="mt-2 text-emerald-600 text-sm">↑ {note}</div></div>)}
            </section>

            <section className="grid xl:grid-cols-2 gap-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">AI Demand Forecast</div>
                    <div className="text-sm text-slate-500">Predicts service demand in your area to help you plan workforce and resources.</div>
                  </div>
                  <select value={period} onChange={(e) => setPeriod(e.target.value as keyof typeof forecast)} className="rounded-xl border px-3 py-2 text-sm">
                    {Object.keys(forecast).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-4">
                  <div className="h-64 rounded-3xl border bg-gradient-to-b from-white to-blue-50 p-4">
                    <div className="flex items-end gap-4 h-full">
                      {series.Electrical.map((_, idx) => <div key={idx} className="flex-1 flex items-end gap-1 h-full">
                        {(["Electrical","Plumbing","Cleaning","Carpentry"] as const).map((k, sIdx) => <div key={k} className="flex-1 rounded-t-lg" style={{ height: `${series[k][idx] * 3}px`, background: ["#1d77ff","#8b5cf6","#22c55e","#fb923c"][sIdx], opacity: 0.9 }} />)}
                      </div>)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["Electrical","Plumbing","Cleaning","Carpentry"].map((k, i) => <div key={k} className="rounded-2xl border p-3">
                      <div className="flex justify-between text-sm"><span>{k}</span><span className={i ? "text-amber-600" : "text-red-600"}>{["High","Medium","Medium","Low"][i]}</span></div>
                    </div>)}
                    <button className="w-full rounded-2xl border border-blue-300 text-blue-700 py-3">View Detailed Forecast →</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="text-xl font-semibold">Workforce Allocation (AI)</div>
                <div className="text-sm text-slate-500">Recommends optimal worker allocation based on demand, skills and availability.</div>
                <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-red-700">4 additional electricians needed next week to meet expected demand.</div>
                  <button onClick={() => setAllocModal(true)} className="px-4 py-2 rounded-2xl border border-blue-300 text-blue-700">Optimize Workforce →</button>
                </div>
                <div className="mt-4 space-y-3">
                  {[["Electricians",14,18],["Plumbers",12,14],["Cleaners",20,22],["Carpenters",8,12]].map(([n,a,b]) => <div key={n as string}><div className="flex justify-between text-sm mb-1"><span>{n as string}</span><span>{a as number} / {b as number}</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${pct(a as number, b as number)}%` }} /></div></div>)}
                </div>
              </div>
            </section>

            <section className="grid xl:grid-cols-3 gap-4">
              <div className="rounded-[28px] border bg-white p-5 xl:col-span-1">
                <div className="flex justify-between"><div className="text-xl font-semibold">Recent Activities</div><button className="text-blue-600 text-sm">View All</button></div>
                <div className="mt-4 space-y-4 text-sm">
                  {["New worker registration","Job completed","Verification approved","New service request in your area","Payout processed"].map((t, i) => <div key={t} className="flex justify-between border-b last:border-0 pb-3 last:pb-0"><div><div className="font-medium">{t}</div><div className="text-slate-500">{["Arun K. (Electrician)","AC Servicing - T. Nagar","Meena S. (Plumber)","Electrical Repair - Adyar","₹1,200 to Ravi K."][i]}</div></div><div className="text-slate-400">{["2 hours ago","4 hours ago","6 hours ago","8 hours ago","1 day ago"][i]}</div></div>)}
                </div>
              </div>
              <div className="rounded-[28px] border bg-white p-5 xl:col-span-1">
                <div className="flex justify-between items-center"><div className="text-xl font-semibold">Cooperative Revenue</div><button className="text-blue-600 text-sm">View Details</button></div>
                <div className="mt-3 text-4xl font-semibold">₹84,500</div>
                <div className="text-emerald-600 text-sm mt-1">↑ 21% from last month</div>
                <div className="mt-4 flex gap-2"><select value={revPeriod} onChange={(e) => setRevPeriod(e.target.value)} className="ml-auto rounded-xl border px-3 py-2 text-sm"><option>This Month</option><option>Last Quarter</option></select></div>
                <div className="mt-4 h-28 flex items-end gap-2">{bars.map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-blue-300" style={{ height: `${h}px` }}><div className="h-full rounded-t-lg bg-blue-500/70" style={{ height: `${revenue[i]}px` }} /></div>)}</div>
                <div className="mt-4 space-y-2 text-sm">{[["Platform Commission","₹12,300","14.6%"],["Cooperative Share","₹56,800","67.3%"],["Welfare & Training Fund","₹10,200","12.1%"],["Other","₹5,200","6.0%"]].map(([a,b,c]) => <div key={a} className="flex justify-between border-b last:border-0 pb-2"><span>{a}</span><span className="font-medium">{b} <span className="text-slate-400">{c}</span></span></div>)}</div>
              </div>
              <div className="space-y-4 xl:col-span-1">
                <div className="rounded-[28px] border bg-white p-5">
                  <div className="flex justify-between"><div className="text-xl font-semibold">Member Growth</div><button className="text-blue-600 text-sm">View Report</button></div>
                  <div className="mt-2 text-4xl font-semibold">+24</div><div className="text-sm text-slate-500">New members this month</div>
                  <div className="mt-4 h-24 flex items-end gap-2">{[18,20,25,25,31,34].map((h, i) => <div key={i} className="flex-1 rounded-t-lg bg-blue-400" style={{ height: `${h}px` }} />)}</div>
                </div>
                <div className="rounded-[28px] border bg-white p-5">
                  <div className="flex justify-between"><div className="text-xl font-semibold">Top Performing Services</div><select className="rounded-xl border px-2 py-1 text-sm"><option>This Month</option></select></div>
                  <div className="mt-4 space-y-3 text-sm">{["Electrical Services","Plumbing Services","AC Servicing","House Cleaning","Carpentry"].map((s, i) => <div key={s} className="flex justify-between"><span>{i + 1}. {s}</span><span className="text-slate-500">{[38,27,22,18,15][i]} jobs</span></div>)}</div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-sm">
              {["Verified Workforce","AI-Powered Planning","Sustainable Earnings","Worker Welfare","Skills & Training","Stronger Communities"].map((x) => <div key={x} className="rounded-2xl border bg-white p-4">{x}</div>)}
            </section>
          </main>
        </div>
      </div>

      {memberModal && <Modal title="Add New Member" onClose={() => setMemberModal(false)}><div className="space-y-3"><input className="w-full rounded-xl border px-3 py-2" placeholder="Full name" /><input className="w-full rounded-xl border px-3 py-2" placeholder="Phone" /><button onClick={() => setMemberModal(false)} className="w-full rounded-xl bg-blue-600 text-white py-3">Create member</button></div></Modal>}
      {allocModal && <Modal title="Optimize Workforce" onClose={() => setAllocModal(false)}><p className="text-sm text-slate-600">AI recommendation: shift 4 electricians, 2 plumbers, and 1 carpenter to the next week demand pool.</p><div className="mt-4 flex gap-3"><button className="flex-1 rounded-xl bg-blue-600 text-white py-2" onClick={() => setAllocModal(false)}>Apply</button><button className="flex-1 rounded-xl border py-2" onClick={() => setAllocModal(false)}>Cancel</button></div></Modal>}

      {profile && <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setProfile(false)}><div className="absolute right-6 top-20 w-52 rounded-2xl border bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}><button className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50">Profile</button><button className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50">Settings</button><button onClick={logout} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-red-600">Logout</button></div></div>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4" onClick={onClose}><div className="w-full max-w-lg rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}><div className="flex justify-between items-center"><div className="text-xl font-semibold">{title}</div><button onClick={onClose}>✕</button></div><div className="mt-4">{children}</div></div></div>;
}
