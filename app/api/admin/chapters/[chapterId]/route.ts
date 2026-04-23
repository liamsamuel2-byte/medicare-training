import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const data = await req.json();
  const chapter = await prisma.chapter.update({ where: { id: chapterId }, data });
  return NextResponse.json(chapter);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });

  if (chapter?.videoPublicId) {
    await cloudinary.uploader.destroy(chapter.videoPublicId, { resource_type: "video" });
  }

  await prisma.chapter.delete({ where: { id: chapterId } });
  return NextResponse.json({ ok: true });
}
