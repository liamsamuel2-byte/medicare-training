import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, maxPosition, completed } = await req.json();

  const existing = await prisma.videoProgress.findUnique({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
  });

  await prisma.videoProgress.upsert({
    where: { userId_chapterId: { userId: session.user.id, chapterId } },
    create: { userId: session.user.id, chapterId, maxPosition, completed },
    update: {
      maxPosition: Math.max(existing?.maxPosition ?? 0, maxPosition),
      completed: existing?.completed || completed,
    },
  });

  return NextResponse.json({ ok: true });
}
