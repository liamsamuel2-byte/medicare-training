import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const { questions } = await req.json() as {
    questions: {
      id?: string;
      text: string;
      imageUrl?: string | null;
      order: number;
      answers: { id?: string; text: string; isCorrect: boolean; order: number }[];
    }[];
  };

  await prisma.question.deleteMany({ where: { chapterId } });

  for (const q of questions) {
    await prisma.question.create({
      data: {
        chapterId,
        text: q.text,
        imageUrl: q.imageUrl ?? null,
        order: q.order,
        answers: {
          create: q.answers.map((a) => ({
            text: a.text,
            isCorrect: a.isCorrect,
            order: a.order,
          })),
        },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
