"use client";
import { useState } from "react";
import { UserPlus, X, Upload, ChevronDown } from "lucide-react";

interface User {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string;
}

const ROLES = ["AGENT", "MANAGER", "ADMIN"] as const;
const roleColors: Record<string, string> = {
  AGENT: "bg-gray-100 text-gray-600",
  MANAGER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "AGENT" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [user, ...prev]);
      setAdding(false);
      setForm({ name: "", email: "", password: "", role: "AGENT" });
    } else {
      setError("Failed to create user. Email may already be taken.");
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive } : u)));
    }
  }

  async function handleBulkImport() {
    setBulkLoading(true);
    setBulkResult(null);
    const emails = bulkEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    const res = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    const data = await res.json();
    setBulkResult(data);
    setBulkLoading(false);
    if (data.created > 0) {
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) setUsers(await usersRes.json());
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setImporting(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <Upload size={16} /> Bulk Import
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.isActive ? "opacity-50" : ""}`}>
                <td className="px-6 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3">
                  <div className="relative inline-block">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 pr-5 rounded font-medium border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${roleColors[u.role]}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                  </div>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleToggleActive(u.id, !u.isActive)}
                    className={`text-xs px-2 py-0.5 rounded font-medium transition ${
                      u.isActive
                        ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                        : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-3 text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-6 py-8 text-center text-gray-400">No users yet.</p>
        )}
      </div>

      {/* Add User Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add User</h2>
              <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Jane Smith" },
                { label: "Email", key: "email", type: "email", placeholder: "jane@company.com" },
                { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAdding(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name || !form.email || !form.password || loading}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {importing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Bulk Import Agents</h2>
                <p className="text-sm text-gray-400">Paste work email addresses (one per line or comma-separated)</p>
              </div>
              <button onClick={() => { setImporting(false); setBulkResult(null); setBulkEmails(""); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              rows={8}
              placeholder={"agent1@company.com\nagent2@company.com\nagent3@company.com"}
            />
            <p className="text-xs text-gray-400 mt-2">
              Accounts will be created with a temporary password. Users should sign in and change it.
            </p>
            {bulkResult && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-green-800">Import complete</p>
                <p className="text-green-700 mt-0.5">
                  {bulkResult.created} created · {bulkResult.skipped} skipped (already exist)
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setImporting(false); setBulkResult(null); setBulkEmails(""); }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                {bulkResult ? "Close" : "Cancel"}
              </button>
              {!bulkResult && (
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkEmails.trim() || bulkLoading}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {bulkLoading ? "Importing…" : "Import"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
