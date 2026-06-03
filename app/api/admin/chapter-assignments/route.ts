import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

// GET /api/admin/chapter-assignments?chapterId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });

  const assignments = await prisma.chapterAssignment.findMany({
    where: { chapterId },
    select: { userId: true },
  });

  return NextResponse.json(assignments);
}

// POST /api/admin/chapter-assignments  { chapterId, projectId, userId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, projectId, userId } = await req.json();

  await prisma.chapterAssignment.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, projectId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/chapter-assignments  { chapterId, userId }
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, userId } = await req.json();

  await prisma.chapterAssignment.deleteMany({ where: { chapterId, userId } });

  return NextResponse.json({ ok: true });
}
