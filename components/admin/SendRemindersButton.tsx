"use client";
import { useState } from "react";
import { Bell } from "lucide-react";

export default function SendRemindersButton({ incompleteCount }: { incompleteCount: number }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null);

  async function handleSend() {
    if (incompleteCount === 0) return;
    if (!confirm(`Send reminder emails to all ${incompleteCount} incomplete agent${incompleteCount !== 1 ? "s" : ""}?`)) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/admin/send-reminders", { method: "POST", body: "{}" });
    const data = await res.json();
    setResult(data);
    setSending(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <p className={`text-sm ${result.errors.length > 0 ? "text-amber-600" : "text-green-600"}`}>
          {result.sent} reminder{result.sent !== 1 ? "s" : ""} sent
          {result.errors.length > 0 ? ` (${result.errors.length} failed)` : ""}
        </p>
      )}
      <button
        onClick={handleSend}
        disabled={sending || incompleteCount === 0}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        <Bell size={15} />
        {sending ? "Sending…" : "Send Reminders"}
      </button>
    </div>
  );
}
