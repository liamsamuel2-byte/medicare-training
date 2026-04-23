import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectEditor from "@/components/admin/ProjectEditor";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { answers: { orderBy: { order: "asc" } } },
          },
          _count: { select: { results: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return <ProjectEditor project={project as any} />;
}
