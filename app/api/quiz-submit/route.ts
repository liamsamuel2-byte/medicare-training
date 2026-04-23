import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, projectId, responses } = await req.json() as {
    chapterId: string;
    projectId?: string;
    responses: { questionId: string; answerId: string }[];
  };

  const questions = await prisma.question.findMany({
    where: { chapterId },
    include: { answers: true },
  });

  let correct = 0;
  for (const r of responses) {
    const question = questions.find((q) => q.id === r.questionId);
    const answer = question?.answers.find((a) => a.id === r.answerId);
    if (answer?.isCorrect) correct++;
  }

  const total = questions.length;
  const score = total > 0 ? (correct / total) * 100 : 100;

  const result = await prisma.chapterResult.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    create: { userId: session.user.id, chapterId, projectId, score, totalQ: total, correctQ: correct },
    update: { score, totalQ: total, correctQ: correct, projectId },
  });

  if (responses.length > 0) {
    await prisma.quizResponse.deleteMany({ where: { chapterResultId: result.id } });
    await prisma.quizResponse.createMany({
      data: responses.map((r) => ({
        chapterResultId: result.id,
        questionId: r.questionId,
        answerId: r.answerId,
      })),
    });
  }

  return NextResponse.json({ score, correct, total });
}
