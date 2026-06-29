"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { fetchMembers, searchMembers, type Member } from "../lib/attendance";

export default function MemberInquiryView() {
  const [code, setCode] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const sharedMembers = await fetchMembers();
        setMembers(sharedMembers);
      } catch {
        setMessage("Unable to load member records. Please try again later.");
      } finally {
        setIsLoaded(true);
      }
    };

    void loadMembers();
  }, []);

  const handleLookup = (event: FormEvent) => {
    event.preventDefault();

    if (!isLoaded) {
      setMessage("Still loading member records. Please wait.");
      return;
    }

    const normalizedCode = code.trim().toLowerCase();
    if (!normalizedCode) {
      setMessage("Please enter your member code.");
      setMember(null);
      return;
    }

    const matched = searchMembers(members, normalizedCode);
    const exactMatch = matched.find((entry) => entry.code.trim().toLowerCase() === normalizedCode);

    if (!exactMatch) {
      setMessage("No member found for this code.");
      setMember(null);
      return;
    }

    setMember(exactMatch);
    setMessage("");
  };

  const totalAttendanceCount = member?.attendance.length ?? 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#0f172a_70%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-amber-400/30 bg-slate-950/80 p-8 shadow-2xl shadow-amber-500/10 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Member Inquiry</p>
            <h1 className="mt-2 text-3xl font-bold text-amber-400">Your Attendance Record</h1>
            <p className="mt-3 text-sm text-slate-400">Enter your member code to view your personal record.</p>
          </div>
          <Link href="/" className="rounded-xl border border-amber-400/30 bg-slate-900 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-slate-800">
            Admin Login
          </Link>
        </div>

        <form className="space-y-3" onSubmit={handleLookup}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Member Code"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            View My Record
          </button>
        </form>

        {message ? <p className="text-sm text-amber-200">{message}</p> : null}

        {member ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-xl font-semibold text-white">{member.name}</h2>
            <p className="mt-2 text-sm text-slate-400">Member Code: {member.code}</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
                <p className="text-sm text-slate-400">Stage</p>
                <p className="mt-1 font-semibold text-amber-200">{member.stage}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
                <p className="text-sm text-slate-400">Total Attendance Count</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">{totalAttendanceCount}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">This page is read-only. Members can view their own record only.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
