import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sopId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sopId } = await params;
  const { title, description } = await req.json();

  const sop = await prisma.sop.update({
    where: { id: sopId },
    data: { title, description },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(sop);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ sopId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sopId } = await params;
  const sop = await prisma.sop.findUnique({ where: { id: sopId } });
  if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sop.videoPublicId) {
    await cloudinary.uploader.destroy(sop.videoPublicId, { resource_type: "video" });
  }

  await prisma.sop.delete({ where: { id: sopId } });
  return NextResponse.json({ ok: true });
}
