"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

type Role = "customer" | "worker" | "cooperative";
type Message = { id: number; job_id: number; sender_id: number; sender_name: string | null; content: string; created_at: string };

export default function MessagesWorkspace({ role }: { role: Role }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { let active = true; const load = role === "customer" || role === "cooperative" ? api.getMyJobs() : api.getActiveTasksAsLabor(); load.then((result) => { if (!active) return; setJobs(result.jobs); setSelected(result.jobs[0] || null); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load conversations."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [role]);
  useEffect(() => { if (!selected) { setMessages([]); return; } let active = true; setMessageLoading(true); api.getJobMessages(selected.id).then((result) => { if (active) setMessages(result); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load messages."); }).finally(() => { if (active) setMessageLoading(false); }); return () => { active = false; }; }, [selected]);
  const send = async (event: FormEvent) => { event.preventDefault(); if (!selected || !text.trim()) return; setSending(true); setError(""); try { const message = await api.sendMessage(selected.id, text.trim()); setMessages((current) => [...current, message]); setText(""); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to send message."); } finally { setSending(false); } };
  if (loading) return <section className="rounded-2xl border bg-white p-8 text-slate-500">Loading conversations...</section>;
  if (error && !jobs.length) return <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><b>Messages unavailable</b><p className="mt-1 text-sm">{error}</p></section>;
  return <section className="grid gap-4 lg:grid-cols-[280px_1fr]"><aside className="rounded-2xl border bg-white p-4"><h2 className="font-bold">Conversations</h2>{jobs.length ? <div className="mt-3 space-y-2">{jobs.map((job) => <button key={job.id} onClick={() => setSelected(job)} className={`w-full rounded-xl p-3 text-left text-sm ${selected?.id === job.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}><b className="block">{job.title}</b><span className="text-xs text-slate-500">{job.city} · {job.status}</span></button>)}</div> : <p className="mt-3 text-sm text-slate-500">No job conversations yet.</p>}</aside><div className="rounded-2xl border bg-white p-4"><h2 className="font-bold">{selected ? selected.title : "Select a conversation"}</h2>{selected && <><div className="mt-4 min-h-56 space-y-3 rounded-xl bg-slate-50 p-4">{messageLoading && <p className="text-sm text-slate-500">Loading messages...</p>}{!messageLoading && !messages.length && <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>}{messages.map((message) => <div key={message.id} className="rounded-xl bg-white p-3 text-sm shadow-sm"><b>{message.sender_name || "BridgePoint member"}</b><p className="mt-1 text-slate-700">{message.content}</p><time className="mt-1 block text-xs text-slate-400">{new Date(message.created_at).toLocaleString("en-IN")}</time></div>)}</div><form onSubmit={send} className="mt-4 flex gap-2"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message" className="input-field flex-1" /><button disabled={sending || !text.trim()} className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white disabled:bg-slate-300">{sending ? "Sending..." : "Send"}</button></form></>}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</div></section>;
}
