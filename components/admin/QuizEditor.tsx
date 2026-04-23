"use client";
import { useState } from "react";
import { X, Plus, Trash2, CheckCircle } from "lucide-react";

interface Answer { id?: string; text: string; isCorrect: boolean; order: number }
interface Question { id?: string; text: string; order: number; answers: Answer[] }
interface Chapter { id: string; title: string; questions: Question[] }

interface Props {
  chapter: Chapter;
  onSave: (questions: any[]) => void;
  onClose: () => void;
}

function emptyQuestion(order: number): Question {
  return {
    text: "",
    order,
    answers: [
      { text: "", isCorrect: true, order: 1 },
      { text: "", isCorrect: false, order: 2 },
      { text: "", isCorrect: false, order: 3 },
      { text: "", isCorrect: false, order: 4 },
    ],
  };
}

export default function QuizEditor({ chapter, onSave, onClose }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    chapter.questions.length > 0 ? chapter.questions : [emptyQuestion(1)]
  );
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  }

  function removeQuestion(qi: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qi).map((q, i) => ({ ...q, order: i + 1 })));
  }

  function updateQuestionText(qi: number, text: string) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, text } : q)));
  }

  function updateAnswer(qi: number, ai: number, field: "text" | "isCorrect", value: string | boolean) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const answers: Answer[] = q.answers.map((a, j) => {
          if (field === "isCorrect") {
            return { ...a, isCorrect: j === ai };
          }
          return j === ai ? { ...a, text: value as string } : a;
        });
        return { ...q, answers };
      })
    );
  }

  function addAnswer(qi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        return {
          ...q,
          answers: [...q.answers, { text: "", isCorrect: false, order: q.answers.length + 1 }],
        };
      })
    );
  }

  function removeAnswer(qi: number, ai: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const answers = q.answers
          .filter((_, j) => j !== ai)
          .map((a, j) => ({ ...a, order: j + 1 }));
        return { ...q, answers };
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/chapters/${chapter.id}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    onSave(questions);
    setSaving(false);
  }

  const isValid = questions.every(
    (q) =>
      q.text.trim() &&
      q.answers.length >= 2 &&
      q.answers.some((a) => a.isCorrect) &&
      q.answers.every((a) => a.text.trim())
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Quiz Editor</h2>
            <p className="text-sm text-gray-400">{chapter.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={qi} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold text-gray-400 pt-2 shrink-0">Q{qi + 1}</span>
                <input
                  value={q.text}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question text…"
                />
                <button
                  onClick={() => removeQuestion(qi)}
                  disabled={questions.length === 1}
                  className="text-gray-300 hover:text-red-500 transition disabled:opacity-30 pt-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 ml-7">
                <p className="text-xs text-gray-400 font-medium">
                  Answers — click the circle to mark correct
                </p>
                {q.answers.map((a, ai) => (
                  <div key={ai} className="flex items-center gap-2">
                    <button
                      onClick={() => updateAnswer(qi, ai, "isCorrect", true)}
                      className={`shrink-0 transition ${
                        a.isCorrect ? "text-green-600" : "text-gray-200 hover:text-gray-400"
                      }`}
                    >
                      <CheckCircle size={18} />
                    </button>
                    <input
                      value={a.text}
                      onChange={(e) => updateAnswer(qi, ai, "text", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Answer ${ai + 1}`}
                    />
                    <button
                      onClick={() => removeAnswer(qi, ai)}
                      disabled={q.answers.length <= 2}
                      className="text-gray-300 hover:text-red-500 transition disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addAnswer(qi)}
                  className="text-xs text-blue-600 hover:text-blue-800 transition flex items-center gap-1 mt-1"
                >
                  <Plus size={12} /> Add answer option
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Question
          </button>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
