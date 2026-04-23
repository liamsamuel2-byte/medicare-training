import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await prisma.chapterResult.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      chapter: { select: { id: true, title: true, projectId: true, project: { select: { title: true } } } },
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(results);
}
