import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Users, CheckCircle, BarChart2 } from "lucide-react";

export default async function AdminDashboard() {
  const [projects, users, results] = await Promise.all([
    prisma.project.count(),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.chapterResult.count(),
  ]);

  const recentResults = await prisma.chapterResult.findMany({
    take: 10,
    orderBy: { completedAt: "desc" },
    include: {
      user: { select: { name: true } },
      chapter: { select: { title: true, project: { select: { title: true } } } },
    },
  });

  const stats = [
    { label: "Projects", value: projects, icon: BookOpen, href: "/admin/projects", color: "blue" },
    { label: "Agents", value: users, icon: Users, href: "/admin/users", color: "indigo" },
    { label: "Completions", value: results, icon: CheckCircle, href: "/admin/reports", color: "green" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-6 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className={`p-3 rounded-lg bg-${s.color}-100`}>
              <s.icon size={24} className={`text-${s.color}-700`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Completions</h2>
          <Link href="/admin/reports" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentResults.length === 0 && (
            <p className="px-6 py-4 text-gray-400 text-sm">No completions yet.</p>
          )}
          {recentResults.map((r) => (
            <div key={r.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{r.user.name}</p>
                <p className="text-xs text-gray-400">
                  {r.chapter.project.title} — {r.chapter.title}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${r.score >= 70 ? "text-green-600" : "text-red-600"}`}
                >
                  {Math.round(r.score)}%
                </span>
                <p className="text-xs text-gray-400">
                  {new Date(r.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
