import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, projectId } = await req.json();

  await prisma.chapterResult.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    create: { userId: session.user.id, chapterId, projectId, score: 100, totalQ: 0, correctQ: 0, passed: true },
    update: { passed: true, score: 100 },
  });

  return NextResponse.json({ ok: true });
}
