import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User } from "lucide-react";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SopViewPage({
  params,
}: {
  params: Promise<{ sopId: string }>;
}) {
  const { sopId } = await params;

  const sop = await prisma.sop.findUnique({
    where: { id: sopId },
    include: { createdBy: { select: { name: true } } },
  });

  if (!sop) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/admin/sops"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-6"
      >
        <ArrowLeft size={15} /> Back to Video SOPs
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{sop.title}</h1>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
        <span className="flex items-center gap-1">
          <User size={12} /> {sop.createdBy.name}
        </span>
        {sop.videoDuration && (
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatDuration(sop.videoDuration)}
          </span>
        )}
        <span>{new Date(sop.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Video player */}
      <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-6">
        <video
          src={sop.videoUrl}
          controls
          controlsList="nodownload"
          className="w-full aspect-video"
          onContextMenu={() => false}
        />
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-2">About this SOP</h2>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{sop.description}</p>
      </div>
    </main>
  );
}
