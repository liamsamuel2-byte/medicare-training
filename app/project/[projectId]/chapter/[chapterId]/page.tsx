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

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, projectId, isActive: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: { orderBy: { order: "asc" } },
        },
      },
      project: true,
    },
  });

  if (!chapter) notFound();

  const existingResult = await prisma.chapterResult.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  const videoProgress = await prisma.videoProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  return (
    <ChapterClient
      chapter={chapter as any}
      userId={session.user.id}
      projectId={projectId}
      alreadyCompleted={!!existingResult}
      existingScore={existingResult?.score ?? null}
      savedMaxPosition={videoProgress?.maxPosition ?? 0}
      videoCompleted={videoProgress?.completed ?? false}
    />
  );
}
