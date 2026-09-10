"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setActiveWorkspaceRole, useAuth } from "@/lib/auth-context";
import Icon, { type IconName } from "@/components/Icon";

type Role = "customer" | "worker" | "cooperative";
const roles: [Role, string, string, IconName][] = [
  ["customer", "Customer", "Find services, book verified workers and manage requests.", "user"],
  ["worker", "Worker", "Find jobs, manage work and grow your skills.", "briefcase"],
  ["cooperative", "Cooperative", "Manage workers, jobs, demand and cooperative operations.", "users"],
];
const destination = (role: Role) => role === "worker" ? "/worker" : role === "cooperative" ? "/admin" : "/dashboard";

function Frame({ children, title, text }: { children: React.ReactNode; title: React.ReactNode; text: string }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" className="text-3xl font-bold tracking-tight text-slate-900">
            Bridge<span className="text-blue-600">Point</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600">
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1440px] gap-12 px-6 py-12 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <section className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
            <Icon name="shield" size={14} />
            A cooperative-powered platform
          </span>
          <h1 className="mt-7 text-5xl font-bold leading-[1.1] tracking-tight text-slate-900">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{text}</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Image src="/community-workers.svg" alt="BridgePoint workers" width={300} height={180} className="h-44 w-full rounded-2xl border border-slate-200/80 object-cover shadow-xs" />
            <Image src="/hero-worker.svg" alt="Verified worker" width={300} height={180} className="h-44 w-full rounded-2xl border border-slate-200/80 object-cover shadow-xs" />
          </div>
          <p className="mt-8 text-base italic text-slate-500">“Work is not just a livelihood, it&apos;s a stronger tomorrow.”</p>
        </section>
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-md md:p-10">{children}</section>
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-7 text-sm text-slate-500">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <b className="text-xl text-slate-900">Bridge<span className="text-blue-600">Point</span></b>
          <span className="text-xs text-slate-400">Work Today. Stronger Communities Tomorrow.</span>
        </div>
      </footer>
    </div>
  );
}

function RolePicker({ role, setRole }: { role: Role; setRole: (role: Role) => void }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-3">
      {roles.map(([value, label, desc, icon]) => {
        const active = role === value;
        return (
          <button
            type="button"
            key={value}
            onClick={() => setRole(value)}
            className={`flex flex-col justify-between rounded-xl p-3.5 text-left transition ${
              active ? "bg-blue-600 text-white shadow-xs" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div>
              <Icon name={icon} size={18} className={active ? "text-white" : "text-blue-600"} />
              <b className="mt-2 block text-sm font-bold">{label}</b>
            </div>
            <small className={`mt-1 block text-[11px] leading-tight ${active ? "text-blue-100" : "text-slate-500"}`}>{desc}</small>
          </button>
        );
      })}
    </div>
  );
}

export function SignInPage() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const initialRole: Role = requestedRole === "worker" || requestedRole === "cooperative" ? requestedRole : "customer";
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);
    try {
      const authenticatedUser = await login(email, password);
      const allowed = role === "cooperative"
        ? authenticatedUser.is_admin || authenticatedUser.roles?.includes("cooperative")
        : role === "worker"
        ? authenticatedUser.roles?.includes("labor") || authenticatedUser.role === "labor" || !!authenticatedUser.labor_category
        : authenticatedUser.is_admin || authenticatedUser.roles?.includes("employer") || (!authenticatedUser.roles?.length && authenticatedUser.role !== "labor");

      if (!allowed && role !== "cooperative") {
        logout();
        setError(`This account is not registered as a ${role}. Choose the correct role or create a matching account.`);
        return;
      }
      if (!allowed && role === "cooperative") {
        const message = "Demo access: This account is not registered as a cooperative. You can continue for demonstration purposes.";
        setWarning(message);
        if (typeof window !== "undefined") sessionStorage.setItem("bp_demo_role_warning", message);
      }
      setActiveWorkspaceRole(role);
      router.push(searchParams.get("next") || destination(role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Frame
      title={<>Welcome back.<br /><span className="text-blue-600">Build stronger communities.</span></>}
      text="Sign in to post jobs, find work, manage your cooperative, and access your benefits — all in one place."
    >
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign In</h2>
      <p className="mt-1 text-sm text-slate-500">Welcome back! Please enter your details to continue.</p>

      <div className="mt-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Role</label>
        <RolePicker role={role} setRole={setRole} />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-slate-700">
          Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field mt-1.5"
            placeholder="Enter your email"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <div className="relative mt-1.5">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field pr-16"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-4 top-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>

        {warning && (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
            {warning}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-full bg-blue-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setError("Google sign-in is not connected yet.")}
          className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => setError("Apple sign-in is not connected yet.")}
          className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Continue with Apple
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
          Create account
        </Link>
      </p>
    </Frame>
  );
}

export function SignUpPage() {
  const { register, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const initialRole: Role = requestedRole === "worker" || requestedRole === "cooperative" ? requestedRole : "customer";
  const [role, setRole] = useState<Role>(initialRole);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the terms to continue.");
    setLoading(true);
    try {
      const registeredUser = await register({
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      });

      if (role === "cooperative" && !registeredUser.is_admin && !registeredUser.roles?.includes("cooperative")) {
        logout();
        setError("Cooperative account creation was not approved.");
        return;
      }
      setActiveWorkspaceRole(role);
      router.push(searchParams.get("next") || destination(role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Account creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Frame
      title={<>Join the work that<br /><span className="text-blue-600">moves communities.</span></>}
      text="Create your BridgePoint account and find trusted work, workers, and cooperative opportunities."
    >
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Account</h2>
      <p className="mt-1 text-sm text-slate-500">Choose your role, then enter your details.</p>

      <div className="mt-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Role</label>
        <RolePicker role={role} setRole={setRole} />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Full Name
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="input-field mt-1.5"
            placeholder="Your full name"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="input-field mt-1.5"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
              className="input-field mt-1.5"
              placeholder="Your phone number"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type={show ? "text" : "password"}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            className="input-field mt-1.5"
            placeholder="Create a password"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Confirm Password
          <input
            type={show ? "text" : "password"}
            value={form.confirm}
            onChange={(e) => update("confirm", e.target.value)}
            required
            className="input-field mt-1.5"
            placeholder="Repeat your password"
          />
        </label>

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {show ? "Hide passwords" : "Show passwords"}
        </button>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
          />
          I agree to the BridgePoint terms and privacy policy.
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-full bg-blue-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign In
        </Link>
      </p>
    </Frame>
  );
}
