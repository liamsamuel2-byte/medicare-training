"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteProjectButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${projectTitle}" and all its chapters, quizzes, and results? This cannot be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/projects");
      router.refresh();
    } else {
      alert("Failed to delete project. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      title="Delete project"
    >
      <Trash2 size={16} />
    </button>
  );
}
