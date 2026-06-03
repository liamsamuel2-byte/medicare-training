import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const projects = await prisma.project.findMany({
    include: {
      chapters: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          results: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          quizAttempts: {
            orderBy: { attemptedAt: "asc" },
            select: { userId: true, score: true, passed: true, attemptedAt: true },
          },
          _count: { select: { questions: true } },
        },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build the structured data for the client component
  const projectReports = projects.map((project) => {
    const assignedUsers = project.assignments.map((a) => a.user);
    const assignedIds = new Set(assignedUsers.map((u) => u.id));

    // Collect all unique users who have started or are assigned
    const userMap = new Map<string, { id: string; name: string; email: string }>();
    for (const user of assignedUsers) userMap.set(user.id, user);
    for (const chapter of project.chapters) {
      for (const result of chapter.results) {
        if (!userMap.has(result.user.id)) userMap.set(result.user.id, result.user);
      }
    }

    const agents = Array.from(userMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => {
        const chapterReports = project.chapters.map((ch) => {
          const result = ch.results.find((r) => r.userId === user.id) ?? null;
          const attempts = ch.quizAttempts
            .filter((a) => a.userId === user.id)
            .map((a) => ({
              score: a.score,
              passed: a.passed,
              attemptedAt: a.attemptedAt.toISOString(),
            }));
          return {
            id: ch.id,
            title: ch.title,
            order: ch.order,
            hasQuiz: ch._count.questions > 0,
            result: result
              ? {
                  score: result.score,
                  passed: result.passed,
                  completedAt: result.completedAt.toISOString(),
                }
              : null,
            attempts,
          };
        });

        const completedCount = chapterReports.filter(
          (ch) => ch.result && (ch.result.passed || ch.result.score >= 80)
        ).length;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAssigned: assignedIds.has(user.id),
          chapters: chapterReports,
          completedCount,
          totalCount: project.chapters.length,
        };
      });

    return {
      id: project.id,
      title: project.title,
      totalChapters: project.chapters.length,
      assignedCount: assignedIds.size,
      agents,
    };
  });

  return <ReportsClient projects={projectReports} />;
}
