"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Upload, Video, Clock, Trash2, X, FlaskConical } from "lucide-react";

interface Sop {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoPublicId: string;
  videoDuration: number | null;
  createdAt: string;
  createdBy: { name: string };
}

const CHUNK_SIZE = 10 * 1024 * 1024;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SopsClient({ initialSops }: { initialSops: Sop[] }) {
  const [sops, setSops] = useState<Sop[]>(initialSops);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Filter by title + description as user types
  const filtered = useMemo(() => {
    if (!search.trim()) return sops;
    const q = search.toLowerCase();
    return sops.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [sops, search]);

  function handleCreated(sop: Sop) {
    setSops((prev) => [sop, ...prev]);
    setShowUpload(false);
  }

  async function handleDelete(sop: Sop) {
    if (!confirm(`Delete "${sop.title}"? This cannot be undone.`)) return;
    await fetch(`/api/sops/${sop.id}`, { method: "DELETE" });
    setSops((prev) => prev.filter((s) => s.id !== sop.id));
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video SOPs</h1>
          <p className="text-gray-400 text-sm mt-1">Standard operating procedure tutorials for managers</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition shadow-sm"
        >
          <Upload size={16} /> Upload an SOP
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or description…"
          className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-gray-400 mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* SOP list */}
      {filtered.length === 0 && !search && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <Video size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No SOPs yet</p>
          <p className="text-gray-400 text-sm mt-1">Click &ldquo;Upload an SOP&rdquo; to add your first tutorial</p>
        </div>
      )}

      {filtered.length === 0 && search && (
        <div className="text-center py-16 text-gray-400">
          <p>No SOPs match &ldquo;{search}&rdquo;</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((sop) => (
          <div key={sop.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition group">
            <div className="bg-blue-100 rounded-lg p-3 shrink-0">
              <Video size={22} className="text-blue-700" />
            </div>
            <Link href={`/admin/sops/${sop.id}`} className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition">{sop.title}</h2>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{sop.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                {sop.videoDuration && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {formatDuration(sop.videoDuration)}
                  </span>
                )}
                <span>Uploaded by {sop.createdBy.name}</span>
                <span>{new Date(sop.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(sop)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadModal onCreated={handleCreated} onClose={() => setShowUpload(false)} />
      )}
    </main>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onCreated, onClose }: { onCreated: (sop: Sop) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !file) return;
    setUploading(true);
    setError("");
    setProgress(0);

    try {
      // 1. Get Cloudinary signature
      const sigRes = await fetch("/api/admin/cloudinary-signature");
      if (!sigRes.ok) throw new Error("Failed to get upload credentials");
      const { timestamp, signature, folder, apiKey, cloudName } = await sigRes.json();

      // 2. Chunked upload directly to Cloudinary
      const uploadId = crypto.randomUUID();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let finalResult: any = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
        formData.append("folder", folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
          {
            method: "POST",
            headers: {
              "X-Unique-Upload-Id": uploadId,
              "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
            },
            body: formData,
          }
        );

        if (res.status === 200) {
          finalResult = await res.json();
        } else if (res.status === 206) {
          // chunk accepted
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Upload failed on chunk ${i + 1}`);
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      if (!finalResult) throw new Error("Upload incomplete — please try again.");

      // 3. Save to database
      const createRes = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          videoUrl: finalResult.secure_url,
          videoPublicId: finalResult.public_id,
          videoDuration: finalResult.duration,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to save SOP");
      const sop = await createRes.json();
      onCreated(sop);

    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  const canSubmit = title.trim() && description.trim() && file && !uploading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Upload an SOP</h2>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. How to process a Medicare application"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Please use good detail, using keywords you think people would use to find your video…"
              disabled={uploading}
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Use keywords people would search for — this description is searched when looking for videos.
            </p>
          </div>

          {/* File picker */}
          {!file ? (
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${uploading ? "opacity-50 cursor-not-allowed" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"}`}>
              <Upload size={28} className="text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-500">Click to select a video file</p>
              <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, WebM — any size</p>
              <input type="file" accept="video/*" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} />
            </label>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <Video size={22} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 text-center">Don&apos;t close this window.</p>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload SOP"}
          </button>
        </div>
      </div>
    </div>
  );
}
