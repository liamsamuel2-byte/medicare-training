"use client";
import { useState } from "react";
import { Bell, Check } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  email: string;
  missing: string[];
}

export default function IncompleteAgentsList({ agents }: { agents: Agent[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  async function handleSend(agent: Agent) {
    setSending(agent.id);
    await fetch("/api/admin/send-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: agent.id }),
    });
    setSent((prev) => new Set([...prev, agent.id]));
    setSending(null);
  }

  if (agents.length === 0) {
    return <p className="px-6 py-4 text-gray-400 text-sm">All assigned agents are up to date.</p>;
  }

  return (
    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
      {agents.map((agent) => {
        const isSent = sent.has(agent.id);
        const isSending = sending === agent.id;
        return (
          <div key={agent.email} className="px-6 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{agent.name}</p>
              <p className="text-xs text-gray-400">{agent.email}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.missing.map((t) => (
                  <span key={t} className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleSend(agent)}
              disabled={isSent || isSending}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isSent
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              } disabled:opacity-70`}
            >
              {isSent ? (
                <><Check size={13} /> Sent</>
              ) : isSending ? (
                "Sending…"
              ) : (
                <><Bell size={13} /> Send Reminder</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
