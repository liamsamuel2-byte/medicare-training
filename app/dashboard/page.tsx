import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, BookOpen, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "MANAGER" || session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      chapters: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          results: { where: { userId: session.user.id } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Medicare Training Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">{session.user.name}</span>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition"
          >
            <LogOut size={16} /> Sign out
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Training Courses</h2>

        {projects.length === 0 && (
          <p className="text-gray-500">No training courses are available yet.</p>
        )}

        <div className="space-y-6">
          {projects.map((project) => {
            const total = project.chapters.length;
            const completed = project.chapters.filter((c) => c.results.length > 0).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                    {project.description && (
                      <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {pct}% complete
                  </span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {project.chapters.map((chapter, idx) => {
                    const done = chapter.results.length > 0;
                    const prevDone = idx === 0 || project.chapters[idx - 1].results.length > 0;
                    const accessible = done || prevDone;
                    const score = done ? chapter.results[0].score : null;

                    return (
                      <div
                        key={chapter.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                          done
                            ? "border-green-200 bg-green-50"
                            : accessible
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-100 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {done ? (
                            <CheckCircle size={18} className="text-green-600 shrink-0" />
                          ) : accessible ? (
                            <BookOpen size={18} className="text-blue-600 shrink-0" />
                          ) : (
                            <Clock size={18} className="text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-800">
                            {idx + 1}. {chapter.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {done && score !== null && (
                            <span className="text-xs text-green-700 font-semibold">
                              {Math.round(score)}%
                            </span>
                          )}
                          {accessible && (
                            <Link
                              href={`/project/${project.id}/chapter/${chapter.id}`}
                              className="text-xs font-medium text-blue-700 hover:text-blue-900 transition"
                            >
                              {done ? "Review" : "Start →"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
