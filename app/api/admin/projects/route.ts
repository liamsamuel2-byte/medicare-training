import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    include: {
      chapters: { orderBy: { order: "asc" }, include: { results: true } },
      _count: { select: { chapters: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  const project = await prisma.project.create({ data: { title, description } });
  return NextResponse.json(project);
}
