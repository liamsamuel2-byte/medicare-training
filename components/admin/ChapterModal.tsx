"use client";
import { useState } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";

interface Chapter {
  id: string; title: string; description: string | null; isActive: boolean;
  imageUrl?: string | null;
}

interface Props {
  projectId: string;
  chapter: Chapter | null;
  onSave: (chapter: any) => void;
  onClose: () => void;
}

export default function ChapterModal({ projectId, chapter, onSave, onClose }: Props) {
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [description, setDescription] = useState(chapter?.description ?? "");
  const [isActive, setIsActive] = useState(chapter?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(chapter?.imageUrl ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setImageUrl(data.url);
    }
    setUploadingImage(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);

    if (chapter) {
      const res = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isActive, imageUrl }),
      });
      const updated = await res.json();
      onSave({ ...chapter, ...updated });
    } else {
      const res = await fetch(`/api/admin/projects/${projectId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const created = await res.json();
      onSave({ ...created, questions: [], _count: { results: 0 } });
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{chapter ? "Edit Chapter" : "New Chapter"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. What is Medicare Advantage?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Chapter image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter Image <span className="text-gray-400 font-normal">(shown instead of video if no video uploaded)</span>
            </label>
            {imageUrl ? (
              <div className="relative inline-block">
                <Image
                  src={imageUrl}
                  alt="Chapter image"
                  width={400}
                  height={250}
                  className="rounded-lg max-h-40 object-contain border border-gray-200 w-full"
                />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition">
                {uploadingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImagePlus size={16} />
                )}
                {uploadingImage ? "Uploading…" : "Upload chapter image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {chapter && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-blue-600"
              />
              Active (visible to agents)
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || loading || uploadingImage}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
