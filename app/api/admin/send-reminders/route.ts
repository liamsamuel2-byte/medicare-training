import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/mailer";

function isManager(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Optional: scope to a specific projectId
  const { projectId } = await req.json().catch(() => ({ projectId: null }));

  const projects = await prisma.project.findMany({
    where: projectId ? { id: projectId } : undefined,
    include: {
      chapters: { select: { id: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  // Build a map of userId → { user, missing projects }
  const incompleteMap = new Map<string, { name: string; email: string; missing: string[] }>();

  for (const project of projects) {
    if (project.assignments.length === 0) continue;
    for (const assignment of project.assignments) {
      const passedCount = await prisma.chapterResult.count({
        where: {
          userId: assignment.user.id,
          chapterId: { in: project.chapters.map((c) => c.id) },
          passed: true,
        },
      });
      if (passedCount < project.chapters.length) {
        const existing = incompleteMap.get(assignment.user.id);
        if (existing) {
          existing.missing.push(project.title);
        } else {
          incompleteMap.set(assignment.user.id, {
            name: assignment.user.name,
            email: assignment.user.email,
            missing: [project.title],
          });
        }
      }
    }
  }

  const targets = Array.from(incompleteMap.values());
  if (targets.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const target of targets) {
    try {
      await sendReminderEmail({
        to: target.email,
        name: target.name,
        projects: target.missing,
      });
      sent++;
    } catch (err) {
      errors.push(target.email);
    }
  }

  return NextResponse.json({ sent, errors });
}
