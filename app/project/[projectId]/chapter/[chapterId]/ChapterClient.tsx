"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}
interface Question {
  id: string;
  text: string;
  answers: Answer[];
}
interface Chapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  questions: Question[];
  project: { id: string; title: string };
}

interface Props {
  chapter: Chapter;
  userId: string;
  projectId: string;
  alreadyCompleted: boolean;
  existingScore: number | null;
  savedMaxPosition: number;
  videoCompleted: boolean;
}

export default function ChapterClient({
  chapter,
  userId,
  projectId,
  alreadyCompleted,
  existingScore,
  savedMaxPosition,
  videoCompleted: initVideoCompleted,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [maxWatched, setMaxWatched] = useState(savedMaxPosition);
  const [videoCompleted, setVideoCompleted] = useState(initVideoCompleted);
  const [showQuiz, setShowQuiz] = useState(alreadyCompleted || initVideoCompleted);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(alreadyCompleted);
  const [score, setScore] = useState<number | null>(existingScore);
  const [submitting, setSubmitting] = useState(false);
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    async (pos: number, completed: boolean) => {
      await fetch("/api/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id, maxPosition: pos, completed }),
      });
    },
    [chapter.id]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      if (current > maxWatched + 1) {
        video.currentTime = maxWatched;
        return;
      }
      if (current > maxWatched) {
        const newMax = current;
        setMaxWatched(newMax);
        if (saveTimer) clearTimeout(saveTimer);
        const t = setTimeout(() => saveProgress(newMax, false), 3000);
        setSaveTimer(t);
      }
    };

    const handleSeeking = () => {
      if (video.currentTime > maxWatched + 0.5) {
        video.currentTime = maxWatched;
      }
    };

    const handleEnded = () => {
      setVideoCompleted(true);
      setShowQuiz(true);
      saveProgress(video.duration || maxWatched, true);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("ended", handleEnded);
    };
  }, [maxWatched, saveProgress, saveTimer]);

  async function handleSubmitQuiz() {
    if (chapter.questions.some((q) => !selected[q.id])) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/quiz-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId: chapter.id,
        projectId,
        responses: Object.entries(selected).map(([questionId, answerId]) => ({
          questionId,
          answerId,
        })),
      }),
    });
    const data = await res.json();
    setScore(data.score);
    setSubmitted(true);
    setSubmitting(false);
  }

  const allAnswered = chapter.questions.every((q) => selected[q.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-blue-200 hover:text-white transition text-sm"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <span className="text-blue-400">|</span>
        <span className="text-blue-200 text-sm">{chapter.project.title}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{chapter.title}</h1>
          {chapter.description && (
            <p className="text-gray-500 mt-1">{chapter.description}</p>
          )}
        </div>

        {chapter.videoUrl && (
          <div className="bg-black rounded-xl overflow-hidden shadow-lg">
            <video
              ref={videoRef}
              src={chapter.videoUrl}
              controls
              controlsList="nodownload"
              className="w-full aspect-video"
              onContextMenu={(e) => e.preventDefault()}
            />
            {!videoCompleted && (
              <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
                <Lock size={14} />
                Watch the full video to unlock the quiz. Fast-forwarding is disabled.
              </div>
            )}
          </div>
        )}

        {!chapter.videoUrl && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
            No video has been uploaded for this chapter yet.
          </div>
        )}

        {showQuiz && chapter.questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {submitted ? "Quiz Results" : "Chapter Quiz"}
            </h2>

            {chapter.questions.map((q, qi) => (
              <div key={q.id} className="space-y-3">
                <p className="font-medium text-gray-800">
                  {qi + 1}. {q.text}
                </p>
                <div className="space-y-2">
                  {q.answers.map((a) => {
                    const isSelected = selected[q.id] === a.id;
                    const showResult = submitted;
                    const isCorrect = a.isCorrect;

                    let classes =
                      "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition text-sm ";
                    if (showResult) {
                      if (isCorrect) classes += "border-green-400 bg-green-50 text-green-800";
                      else if (isSelected && !isCorrect)
                        classes += "border-red-400 bg-red-50 text-red-800";
                      else classes += "border-gray-200 bg-gray-50 text-gray-500";
                    } else {
                      classes += isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                    }

                    return (
                      <label key={a.id} className={classes}>
                        <input
                          type="radio"
                          name={q.id}
                          value={a.id}
                          disabled={submitted}
                          checked={isSelected}
                          onChange={() =>
                            setSelected((prev) => ({ ...prev, [q.id]: a.id }))
                          }
                          className="accent-blue-600"
                        />
                        {a.text}
                        {showResult && isCorrect && (
                          <CheckCircle size={16} className="ml-auto text-green-600" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {submitted && score !== null && (
              <div
                className={`rounded-lg p-4 text-center ${
                  score >= 70 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="text-2xl font-bold">
                  {Math.round(score)}%
                </p>
                <p className={`text-sm mt-1 ${score >= 70 ? "text-green-700" : "text-red-700"}`}>
                  {score >= 70 ? "Great job! Chapter complete." : "Keep studying — you can retake this."}
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            )}

            {!submitted && (
              <button
                onClick={handleSubmitQuiz}
                disabled={!allAnswered || submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Quiz"}
              </button>
            )}
          </div>
        )}

        {showQuiz && chapter.questions.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm text-center">
            No quiz for this chapter. Chapter marked complete!
          </div>
        )}
      </main>
    </div>
  );
}
