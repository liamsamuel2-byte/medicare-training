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

  const sops = await prisma.sop.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(sops);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, videoUrl, videoPublicId, videoDuration } = await req.json();

  if (!title?.trim() || !description?.trim() || !videoUrl)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const sop = await prisma.sop.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      videoUrl,
      videoPublicId,
      videoDuration,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(sop);
}
