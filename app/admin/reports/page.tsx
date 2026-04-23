import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const projects = await prisma.project.findMany({
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          results: {
            include: { user: { select: { name: true, email: true } } },
            orderBy: { completedAt: "desc" },
          },
        },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Training Reports</h1>

      {projects.map((project) => {
        const allResults = project.chapters.flatMap((c) => c.results);
        const uniqueStartedIds = new Set(allResults.map((r) => r.userId));
        const assignedIds = new Set(project.assignments.map((a) => a.user.id));

        // Agents assigned but haven't completed all chapters
        const notCompleted = project.assignments
          .map((a) => a.user)
          .filter((u) => {
            const completedChapters = project.chapters.filter((c) =>
              c.results.some((r) => r.userId === u.id && r.passed)
            ).length;
            return completedChapters < project.chapters.length;
          });

        // Only show agents in the scoreboard who have started OR are assigned
        const scoreboard = agents.filter(
          (a) => uniqueStartedIds.has(a.id) || assignedIds.has(a.id)
        );

        return (
          <div key={project.id} className="mb-12 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{project.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {project.chapters.length} chapters · {assignedIds.size} assigned · {uniqueStartedIds.size} started
                </p>
              </div>
            </div>

            {/* Not completed alert */}
            {notCompleted.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  {notCompleted.length} agent{notCompleted.length !== 1 ? "s" : ""} assigned but not fully complete
                </p>
                <div className="flex flex-wrap gap-2">
                  {notCompleted.map((u) => (
                    <span key={u.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {u.name} ({u.email})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scoreboard */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                        Agent
                      </th>
                      {project.chapters.map((c) => (
                        <th
                          key={c.id}
                          className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap max-w-[120px]"
                        >
                          <span className="block truncate" title={c.title}>
                            {c.title}
                          </span>
                        </th>
                      ))}
                      <th className="text-center px-6 py-3 font-medium text-gray-500">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {scoreboard.map((agent) => {
                      const agentResults = project.chapters.map((c) =>
                        c.results.find((r) => r.userId === agent.id)
                      );
                      const completed = agentResults.filter(Boolean);
                      const avg =
                        completed.length > 0
                          ? Math.round(completed.reduce((s, r) => s + (r?.score ?? 0), 0) / completed.length)
                          : null;

                      return (
                        <tr key={agent.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3">
                            <p className="font-medium text-gray-800">{agent.name}</p>
                            <p className="text-xs text-gray-400">{agent.email}</p>
                            {assignedIds.has(agent.id) && (
                              <span className="text-xs text-blue-500">assigned</span>
                            )}
                          </td>
                          {agentResults.map((result, idx) => (
                            <td key={idx} className="px-3 py-3 text-center">
                              {result ? (
                                <span
                                  className={`inline-block text-xs font-bold px-2 py-1 rounded ${
                                    result.passed
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {Math.round(result.score)}%
                                  {result.passed ? " ✓" : ""}
                                </span>
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-3 text-center">
                            {avg !== null && (
                              <span
                                className={`text-sm font-bold ${avg >= 80 ? "text-green-600" : "text-red-600"}`}
                              >
                                {avg}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {scoreboard.length === 0 && (
                  <p className="px-6 py-6 text-center text-gray-400 text-sm">
                    No agents assigned or started yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
