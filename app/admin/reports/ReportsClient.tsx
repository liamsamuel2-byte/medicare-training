"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Minus } from "lucide-react";

interface QuizAttempt {
  score: number;
  passed: boolean;
  attemptedAt: string;
}

interface ChapterReport {
  id: string;
  title: string;
  order: number;
  hasQuiz: boolean;
  result: { score: number; passed: boolean; completedAt: string } | null;
  attempts: QuizAttempt[];
}

interface AgentReport {
  id: string;
  name: string;
  email: string;
  isAssigned: boolean;
  chapters: ChapterReport[];
  completedCount: number;
  totalCount: number;
}

interface ProjectReport {
  id: string;
  title: string;
  totalChapters: number;
  assignedCount: number;
  agents: AgentReport[];
}

export default function ReportsClient({ projects }: { projects: ProjectReport[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Training Reports</h1>

      {projects.map((project) => (
        <div key={project.id} className="mb-10">
          {/* Project header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{project.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {project.totalChapters} chapters · {project.assignedCount} assigned · {project.agents.length} agents
              </p>
            </div>
          </div>

          {/* Agent rows */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_100px_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Agent</span>
              <span>Progress</span>
              <span className="text-center">Chapters</span>
              <span className="text-center">Status</span>
            </div>

            {project.agents.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                No agents assigned or started yet.
              </p>
            )}

            {project.agents.map((agent) => {
              const key = `${project.id}-${agent.id}`;
              const isOpen = expanded.has(key);
              const pct = agent.totalCount > 0
                ? Math.round((agent.completedCount / agent.totalCount) * 100)
                : 0;
              const allDone = agent.completedCount === agent.totalCount && agent.totalCount > 0;

              return (
                <div key={agent.id} className="border-b border-gray-50 last:border-0">
                  {/* Summary row — clickable */}
                  <button
                    onClick={() => toggle(key)}
                    className="w-full grid grid-cols-[1fr_140px_100px_100px] gap-4 px-5 py-4 text-left hover:bg-gray-50 transition items-center"
                  >
                    {/* Agent info */}
                    <div className="flex items-center gap-2 min-w-0">
                      {isOpen ? (
                        <ChevronDown size={15} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight size={15} className="text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{agent.name}</p>
                        <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${allDone ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right shrink-0">{pct}%</span>
                    </div>

                    {/* Chapters count */}
                    <div className="text-center">
                      <span className="text-sm text-gray-700">
                        {agent.completedCount}/{agent.totalCount}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="text-center">
                      {allDone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Complete
                        </span>
                      ) : agent.completedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Minus size={11} /> Not started
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded chapter detail */}
                  {isOpen && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 space-y-2">
                      {agent.chapters.map((ch) => {
                        const chPassed = ch.result && (ch.result.passed || ch.result.score >= 80);
                        return (
                          <div
                            key={ch.id}
                            className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                          >
                            {/* Status icon */}
                            <div className="mt-0.5 shrink-0">
                              {ch.result ? (
                                chPassed ? (
                                  <CheckCircle size={15} className="text-green-500" />
                                ) : (
                                  <XCircle size={15} className="text-red-400" />
                                )
                              ) : (
                                <Minus size={15} className="text-gray-300" />
                              )}
                            </div>

                            {/* Chapter info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 font-medium">
                                {ch.order}. {ch.title}
                              </p>

                              {/* No quiz chapter */}
                              {!ch.hasQuiz && ch.result && (
                                <p className="text-xs text-gray-400 mt-0.5">Completed (no quiz)</p>
                              )}

                              {/* Attempt history */}
                              {ch.hasQuiz && ch.attempts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {ch.attempts.map((att, idx) => (
                                    <span
                                      key={idx}
                                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                                        att.passed
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-600"
                                      }`}
                                    >
                                      Attempt {idx + 1}: {Math.round(att.score)}%
                                      {att.passed ? " ✓" : ""}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Never attempted */}
                              {ch.hasQuiz && ch.attempts.length === 0 && !ch.result && (
                                <p className="text-xs text-gray-400 mt-0.5">Not attempted</p>
                              )}
                            </div>

                            {/* Final score */}
                            {ch.result && ch.hasQuiz && (
                              <span
                                className={`text-sm font-bold shrink-0 ${
                                  chPassed ? "text-green-600" : "text-red-500"
                                }`}
                              >
                                {Math.round(ch.result.score)}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
