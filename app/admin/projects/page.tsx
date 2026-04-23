import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, BookOpen, ExternalLink } from "lucide-react";
import NewProjectButton from "@/components/admin/NewProjectButton";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { chapters: true } },
      chapters: {
        include: { _count: { select: { results: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <NewProjectButton />
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No projects yet. Create your first one.</p>
        </div>
      )}

      <div className="grid gap-4">
        {projects.map((p) => {
          const totalCompletions = p.chapters.reduce((sum, c) => sum + c._count.results, 0);
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{p.title}</h2>
                  {!p.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                {p.description && <p className="text-gray-400 text-sm mt-0.5">{p.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{p._count.chapters} chapters</span>
                  <span>{totalCompletions} completions</span>
                  <span className="font-mono text-blue-400">Token: {p.token}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/train/${p.token}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                >
                  <ExternalLink size={13} /> Share link
                </Link>
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                >
                  Manage
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
