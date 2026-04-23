import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const { title, description } = await req.json();

  const last = await prisma.chapter.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
  });

  const chapter = await prisma.chapter.create({
    data: { projectId, title, description, order: (last?.order ?? 0) + 1 },
  });

  return NextResponse.json(chapter);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const { order } = await req.json() as { order: string[] };

  await Promise.all(
    order.map((id, idx) =>
      prisma.chapter.update({ where: { id, projectId }, data: { order: idx + 1 } })
    )
  );

  return NextResponse.json({ ok: true });
}
