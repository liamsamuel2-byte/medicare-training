"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle, Video, Trash2 } from "lucide-react";

interface Chapter {
  id: string; title: string; videoUrl: string | null;
}

interface Props {
  chapter: Chapter;
  onUploaded: (url: string, publicId: string, duration: number) => void;
  onDeleted?: () => void;
  onClose: () => void;
}

export default function VideoUploader({ chapter, onUploaded, onDeleted, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        await fetch(`/api/admin/chapters/${chapter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: data.url,
            videoPublicId: data.publicId,
            videoDuration: data.duration,
          }),
        });
        onUploaded(data.url, data.publicId, data.duration);
      } else {
        setError("Upload failed. Please try again.");
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError("Upload failed. Please try again.");
      setUploading(false);
    };

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Upload Video</h2>
            <p className="text-sm text-gray-400">{chapter.title}</p>
          </div>
          <button onClick={onClose} disabled={uploading} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {chapter.videoUrl && !file && (
          <div className="mb-4 flex items-center justify-between text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="flex items-center gap-2">
              <CheckCircle size={16} />
              A video is already uploaded. Uploading a new one will replace it.
            </span>
            <button
              onClick={async () => {
                if (!confirm("Delete the current video?")) return;
                setDeleting(true);
                await fetch(`/api/admin/chapters/${chapter.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ videoUrl: null, videoPublicId: null, videoDuration: null }),
                });
                setDeleting(false);
                onDeleted?.();
                onClose();
              }}
              disabled={deleting}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium transition disabled:opacity-50"
            >
              <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete video"}
            </button>
          </div>
        )}

        {!file && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Drop a video here, or click to browse</p>
            <p className="text-gray-400 text-xs mt-1">MP4, MOV, AVI, WebM</p>
          </div>
        )}

        {file && !uploading && (
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <Video size={24} className="text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition">
              <X size={16} />
            </button>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Large files may take a few minutes. Don&apos;t close this window.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          {file && !uploading && (
            <button
              onClick={handleUpload}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
            >
              Upload Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
