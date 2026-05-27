import { prisma } from "@/lib/prisma";
import SopsClient from "./SopsClient";

export default async function SopsPage() {
  const sops = await prisma.sop.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return <SopsClient initialSops={sops as any} />;
}
