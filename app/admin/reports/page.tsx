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
        const uniqueAgentIds = new Set(allResults.map((r) => r.userId));

        return (
          <div key={project.id} className="mb-10 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">{project.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {project.chapters.length} chapters · {uniqueAgentIds.size} agents started
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
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
                  {agents.map((agent) => {
                    const agentResults = project.chapters.map((c) =>
                      c.results.find((r) => r.userId === agent.id)
                    );
                    const completed = agentResults.filter(Boolean);
                    const avg =
                      completed.length > 0
                        ? Math.round(completed.reduce((s, r) => s + (r?.score ?? 0), 0) / completed.length)
                        : null;

                    if (completed.length === 0) return null;

                    return (
                      <tr key={agent.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-800">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </td>
                        {agentResults.map((result, idx) => (
                          <td key={idx} className="px-3 py-3 text-center">
                            {result ? (
                              <span
                                className={`inline-block text-xs font-bold px-2 py-1 rounded ${
                                  result.score >= 70
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {Math.round(result.score)}%
                              </span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-3 text-center">
                          {avg !== null && (
                            <span
                              className={`text-sm font-bold ${avg >= 70 ? "text-green-600" : "text-red-600"}`}
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

              {allResults.length === 0 && (
                <p className="px-6 py-6 text-center text-gray-400 text-sm">
                  No completions yet for this project.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </main>
  );
}
