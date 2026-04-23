import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function TrainPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  const project = await prisma.project.findUnique({
    where: { token, isActive: true },
    include: { chapters: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  if (!project) notFound();

  if (!session) {
    redirect(`/login?callbackUrl=/train/${token}`);
  }

  redirect(`/dashboard`);
}
