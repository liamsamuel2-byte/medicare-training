"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Settings, Trash2, Video, ArrowLeft, ExternalLink } from "lucide-react";
import ChapterModal from "./ChapterModal";
import QuizEditor from "./QuizEditor";
import VideoUploader from "./VideoUploader";

interface Answer { id: string; text: string; isCorrect: boolean; order: number }
interface Question { id: string; text: string; order: number; answers: Answer[] }
interface Chapter {
  id: string; title: string; description: string | null;
  order: number; videoUrl: string | null; videoPublicId: string | null;
  videoDuration: number | null; isActive: boolean;
  questions: Question[];
  _count: { results: number };
}
interface Project {
  id: string; title: string; description: string | null;
  token: string; isActive: boolean; chapters: Chapter[];
}

function SortableChapterRow({
  chapter, onEdit, onQuiz, onVideo, onDelete,
}: {
  chapter: Chapter;
  onEdit: () => void;
  onQuiz: () => void;
  onVideo: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab">
        <GripVertical size={20} />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{chapter.title}</h3>
          {!chapter.isActive && (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Inactive</span>
          )}
          {chapter.videoUrl && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
              <Video size={10} /> Video
            </span>
          )}
        </div>
        {chapter.description && (
          <p className="text-gray-400 text-sm mt-0.5">{chapter.description}</p>
        )}
        <div className="text-xs text-gray-300 mt-1">
          {chapter.questions.length} questions · {chapter._count.results} completions
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onVideo}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Upload video"
        >
          <Video size={16} />
        </button>
        <button
          onClick={onQuiz}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
          title="Edit quiz"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ProjectEditor({ project }: { project: Project }) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>(project.chapters);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [quizChapter, setQuizChapter] = useState<Chapter | null>(null);
  const [videoChapter, setVideoChapter] = useState<Chapter | null>(null);
  const [addingChapter, setAddingChapter] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);
    setChapters(reordered);

    await fetch(`/api/admin/projects/${project.id}/chapters`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((c) => c.id) }),
    });
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Delete this chapter and all its data?")) return;
    await fetch(`/api/admin/chapters/${chapterId}`, { method: "DELETE" });
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  }

  function handleVideoUploaded(chapterId: string, url: string, publicId: string, duration: number) {
    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapterId ? { ...c, videoUrl: url, videoPublicId: publicId, videoDuration: duration } : c
      )
    );
    setVideoChapter(null);
  }

  function handleQuizSaved(chapterId: string, questions: Question[]) {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, questions } : c))
    );
    setQuizChapter(null);
  }

  function handleChapterSaved(updated: Chapter) {
    setChapters((prev) =>
      prev.some((c) => c.id === updated.id)
        ? prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        : [...prev, updated]
    );
    setEditingChapter(null);
    setAddingChapter(false);
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.push("/admin/projects")}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
        {!project.isActive && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Inactive</span>
        )}
      </div>

      {project.description && (
        <p className="text-gray-400 text-sm mb-2 ml-8">{project.description}</p>
      )}

      <div className="ml-8 mb-8 flex items-center gap-4 text-xs text-gray-400">
        <span>
          Share link:{" "}
          <a
            href={`/train/${project.token}`}
            target="_blank"
            className="text-blue-500 hover:underline font-mono"
          >
            /train/{project.token} <ExternalLink size={10} className="inline" />
          </a>
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Chapters</h2>
        <button
          onClick={() => setAddingChapter(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          <Plus size={16} /> Add Chapter
        </button>
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          No chapters yet. Add your first chapter above.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <SortableChapterRow
                key={chapter.id}
                chapter={chapter}
                onEdit={() => setEditingChapter(chapter)}
                onQuiz={() => setQuizChapter(chapter)}
                onVideo={() => setVideoChapter(chapter)}
                onDelete={() => handleDeleteChapter(chapter.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {(addingChapter || editingChapter) && (
        <ChapterModal
          projectId={project.id}
          chapter={editingChapter}
          onSave={handleChapterSaved}
          onClose={() => { setAddingChapter(false); setEditingChapter(null); }}
        />
      )}

      {quizChapter && (
        <QuizEditor
          chapter={quizChapter}
          onSave={(questions) => handleQuizSaved(quizChapter.id, questions)}
          onClose={() => setQuizChapter(null)}
        />
      )}

      {videoChapter && (
        <VideoUploader
          chapter={videoChapter}
          onUploaded={(url, publicId, duration) =>
            handleVideoUploaded(videoChapter.id, url, publicId, duration)
          }
          onClose={() => setVideoChapter(null)}
        />
      )}
    </main>
  );
}
