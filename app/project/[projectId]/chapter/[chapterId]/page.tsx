import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ChapterClient from "./ChapterClient";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ projectId: string; chapterId: string }>;
}) {
  const { projectId, chapterId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER";

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, projectId, isActive: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: { orderBy: { order: "asc" } },
        },
      },
      project: {
        include: { assignments: { select: { userId: true } } },
      },
    },
  });

  if (!chapter) notFound();

  // If the project has assignments, the agent must have a project or chapter assignment
  if (!isAdmin && chapter.project.assignments.length > 0) {
    const hasProjectAccess = chapter.project.assignments.some((a) => a.userId === session.user.id);
    if (!hasProjectAccess) {
      const chapterAccess = await prisma.chapterAssignment.findUnique({
        where: { userId_chapterId: { userId: session.user.id, chapterId } },
      });
      if (!chapterAccess) redirect("/dashboard");
    }
  }

  const existingResult = await prisma.chapterResult.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  const videoProgress = await prisma.videoProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  // Find the next chapter in order so admins can navigate through the whole training
  const nextChapter = await prisma.chapter.findFirst({
    where: { projectId, isActive: true, order: { gt: chapter.order } },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  return (
    <ChapterClient
      chapter={chapter as any}
      userId={session.user.id}
      projectId={projectId}
      alreadyCompleted={!!existingResult}
      existingScore={existingResult?.score ?? null}
      existingPassed={existingResult?.passed ?? false}
      savedMaxPosition={videoProgress?.maxPosition ?? 0}
      videoCompleted={videoProgress?.completed ?? false}
      isAdmin={isAdmin}
      nextChapterId={nextChapter?.id ?? null}
    />
  );
}
