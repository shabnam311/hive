// SubjectWorkspace.tsx
// NotebookLM-style AI tutor workspace.
// Layout: Sources panel (left 28%) + AI Chat panel (right 72%)
// Features: document upload, persistent chat memory, flashcards, quiz, notes
// AI: Ollama (local) — no API keys, no cloud, no internet required

import { useCallback, useEffect, useRef, useState } from "react";
import { playSoftClick, playFlip, playSuccess } from "@/lib/sounds";
import { motion } from "framer-motion";
import { chatWithOllama, checkOllamaHealth, getBestModel } from "@/lib/ollama";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudyDoc {
  id: string;
  name: string;
  content: string;
  sizeKB: number;
  uploadedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: "hard" | "okay" | "easy" | null;
  createdAt: string;
}

export interface WorkspaceSubject {
  id: string;
  name: string;
  color: string;
  hoursStudied: number;
  confidence: number;
  notes: string;
  documents: StudyDoc[];
  chatHistory: Message[];
  flashcards: Flashcard[];
  lastStudied: string | null;
}

interface Props {
  subject: WorkspaceSubject;
  onUpdate: (patch: Partial<WorkspaceSubject>) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function confidenceLabel(v: number) {
  if (v <= 20) return "barely";
  if (v <= 40) return "familiar";
  if (v <= 60) return "decent";
  if (v <= 80) return "solid";
  return "mastered";
}

function confidenceColor(v: number) {
  if (v <= 20) return "#c0392b";
  if (v <= 40) return "#e67e22";
  if (v <= 60) return "#c9a84c";
  if (v <= 80) return "#8b6914";
  return "#27ae60";
}

function buildSystemPrompt(subject: WorkspaceSubject): string {
  const docs = subject.documents
    .map((d) => `=== ${d.name} ===\n${d.content.slice(0, 2200)}`)
    .join("\n\n");

  return `You are a brilliant, warm tutor for: "${subject.name}".
Speak conversationally like a knowledgeable mentor — never dry or textbook-like.

STUDENT: ${subject.hoursStudied.toFixed(1)}h studied · confidence ${subject.confidence}/100 (${confidenceLabel(subject.confidence)}) · last studied ${subject.lastStudied ?? "just starting"}

${docs ? `STUDY MATERIAL (primary source):\n${docs}` : "No documents uploaded yet — use your general knowledge of the subject."}

RULES:
- Explain: simple concept → example → check understanding
- For flashcards: respond ONLY with valid JSON array: [{"front":"...","back":"..."}]
- For quiz: 5 questions, 4 options each, mark correct with *
- For summary: structured bullet points by topic
- Reference previous conversations naturally
- End with a follow-up question or next step
- Use "we" — you're learning together`;
}

// ─── AI call ──────────────────────────────────────────────────────────────────

async function callAI(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  onChunk: (token: string) => void,
  _useOllama: boolean = true,
  modelName?: string,
): Promise<string> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-38).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const result = await chatWithOllama(messages, onChunk, modelName);
  if (!result) {
    const fallback = "Ollama isn't running. Start it with `ollama serve` in your terminal, then try again.";
    for (const char of fallback) onChunk(char);
    return fallback;
  }
  return result;
}

// ─── Sources Panel ────────────────────────────────────────────────────────────

function SourcesPanel({
  subject,
  onUpdate,
  onQuickAction,
}: {
  subject: WorkspaceSubject;
  onUpdate: (patch: Partial<WorkspaceSubject>) => void;
  onQuickAction: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const newDocs: StudyDoc[] = [];
      for (const file of Array.from(files)) {
        let content = "";
        if (file.type === "application/pdf") {
          content = `[PDF: ${file.name} — install pdfjs-dist to extract text]`;
        } else {
          content = await file.text();
        }
        newDocs.push({
          id: uid(),
          name: file.name,
          content: content.slice(0, 8000),
          sizeKB: Math.round(file.size / 1024),
          uploadedAt: new Date().toISOString(),
        });
      }
      onUpdate({ documents: [...subject.documents, ...newDocs] });
    },
    [subject.documents, onUpdate],
  );

  const removeDoc = (id: string) =>
    onUpdate({ documents: subject.documents.filter((d) => d.id !== id) });

  const QUICK = [
    {
      color: "#8b1c1c",
      icon: "📋",
      label: "Summarize all docs",
      msg: "Create a structured summary of all my uploaded study material.",
    },
    {
      color: "#1c3d5a",
      icon: "🃏",
      label: "Generate flashcards",
      msg: "Generate 12 flashcards from my material as a JSON array.",
    },
    {
      color: "#1a4028",
      icon: "🧪",
      label: "Quiz me",
      msg: "Quiz me with 5 multiple-choice questions from my study material.",
    },
    {
      color: "#c9a84c",
      icon: "💡",
      label: "What to study next",
      msg: "Based on what we've covered, what should I focus on next?",
    },
  ];

  return (
    <div className="sources-panel">
      <div className="panel-section-label">SOURCES</div>
      <div
        className="upload-zone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        style={{ borderRadius: "12px" }}
      >
        <span className="upload-icon text-[#c9a84c]/60" style={{ fontSize: "1.4rem" }}>✒️</span>
        <span className="upload-text">drop notes or texts</span>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.text"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <div className="doc-list">
        {subject.documents.length === 0 ? (
          <p className="empty-hint">
            upload your notes and textbook pages — your tutor will learn from them.
          </p>
        ) : (
          subject.documents.map((d) => (
            <div key={d.id} className="doc-item">
              <span className="doc-icon">📄</span>
              <span className="doc-name" title={d.name}>
                {d.name}
              </span>
              <span className="doc-size">{d.sizeKB}kb</span>
              <button className="doc-remove" onClick={() => removeDoc(d.id)}>
                ✕
              </button>
            </div>
          ))
        )}
      </div>
      <div className="section-divider" />
      <div className="panel-section-label">QUICK ACTIONS</div>
      <div className="quick-actions">
        {QUICK.map((q) => (
          <button key={q.label} className="quick-btn group" onClick={() => onQuickAction(q.msg)}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" style={{ background: q.color }} />
            <span className="truncate">{q.label}</span>
          </button>
        ))}
      </div>
      <div className="section-divider" />
      <div className="stats-row">
        <div className="stat-item bg-[#0a0604] border border-[#1a1005] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] px-3 py-2 rounded-lg flex-1">
          <div className="stat-label">HOURS</div>
          <div className="stat-value">{subject.hoursStudied.toFixed(1)}</div>
        </div>
        <div className="stat-item bg-[#0a0604] border border-[#1a1005] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] px-3 py-2 rounded-lg flex-1">
          <div className="stat-label">DOCS</div>
          <div className="stat-value">{subject.documents.length}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel(props: {
  subject: WorkspaceSubject;
  onUpdate: (patch: Partial<WorkspaceSubject>) => void;
  activeTab: "chat" | "flashcards" | "quiz" | "notes";
  setActiveTab: (t: "chat" | "flashcards" | "quiz" | "notes") => void;
  sendRef: React.MutableRefObject<((msg: string) => void) | null>;
  ollamaEnabled: boolean;
  ollamaModel: string;
}) {
  const { subject, onUpdate, activeTab, setActiveTab, sendRef, ollamaEnabled, ollamaModel } = props;

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [subject.chatHistory, streamBuffer]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      setInput("");
      setActiveTab("chat");
      playSoftClick();

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [...subject.chatHistory, userMsg];
      onUpdate({ chatHistory: updatedHistory });

      setStreaming(true);
      setStreamBuffer("");

      let full = "";
      try {
        full = await callAI(
          buildSystemPrompt(subject),
          subject.chatHistory,
          text,
          (token) => {
            full += token;
            setStreamBuffer((prev) => prev + token);
          },
          ollamaEnabled,
          ollamaModel,
        );
      } catch {
        full = "Sorry, I couldn't connect to the tutor right now.";
        setStreamBuffer(full);
      }

      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: full,
        timestamp: new Date().toISOString(),
      };
      const finalHistory = [...updatedHistory, assistantMsg].slice(-80);
      onUpdate({ chatHistory: finalHistory, lastStudied: new Date().toISOString() });

      if (full.includes('"front"') && full.includes('"back"')) {
        try {
          const match = full.match(/\[\s*\{[\s\S]*?\}\s*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]) as { front: string; back: string }[];
            const cards: Flashcard[] = parsed.map((c) => ({
              id: uid(),
              front: c.front,
              back: c.back,
              difficulty: null,
              createdAt: new Date().toISOString(),
            }));
            onUpdate({ flashcards: [...subject.flashcards, ...cards] });
          }
        } catch {}
      }

      setStreaming(false);
      setStreamBuffer("");
    },
    [streaming, subject, onUpdate, setActiveTab, ollamaEnabled, ollamaModel],
  );

  // expose sendMessage to parent for quick actions
  sendRef.current = sendMessage;

  const CHIPS = [
    {
      label: "📋 Summarize",
      msg: "Summarize my uploaded study material in structured bullet points.",
    },
    { label: "🃏 Flashcards", msg: "Generate 12 flashcards from my material as a JSON array." },
    {
      label: "🧪 Quiz me",
      msg: "Quiz me with 5 multiple-choice questions based on my study material.",
    },
    { label: "💡 Explain next", msg: "What should I understand next in this subject?" },
  ];

  return (
    <div className="chat-panel">
      <div className="tab-bar relative flex gap-1 px-4 pt-3 bg-[#0a0604] border-b border-[rgba(201,168,76,0.25)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {(["chat", "flashcards", "quiz", "notes"] as const).map((t) => (
          <button
            key={t}
            className={`relative px-5 py-2.5 font-display text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 rounded-t-md z-10 border-t border-l border-r ${
              activeTab === t
                ? "bg-[#0d0905] text-[#c9a84c] border-[rgba(201,168,76,0.4)] shadow-[0_-4px_12px_rgba(201,168,76,0.08)]"
                : "bg-[#140c07] text-[#f4e4c1]/40 border-transparent hover:bg-[#1a100a] hover:text-[#f4e4c1]/70"
            }`}
            style={{ marginBottom: "-1px", paddingBottom: activeTab === t ? "calc(0.625rem + 1px)" : "0.625rem" }}
            onClick={() => setActiveTab(t)}
          >
            {t === "chat"
              ? "🦉 Chat"
              : t === "flashcards"
                ? "🃏 Cards"
                : t === "quiz"
                  ? "🧪 Quiz"
                  : "📝 Notes"}
            {t === "flashcards" && subject.flashcards.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#8b1c1c] text-[8px] text-[#f4e4c1] shadow-md border border-[#5a0c0c]">{subject.flashcards.length}</span>
            )}
            {activeTab === t && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" 
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === "chat" && (
        <>
          <div className="messages-list relative z-10">
            {subject.chatHistory.length === 0 && !streaming && (
              <div className="chat-empty">
                <motion.div 
                  className="owl-avatar text-5xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  🦉
                </motion.div>
                <p className="welcome-text">
                  Welcome to <strong>{subject.name}</strong>. Upload your notes or ask me anything —
                  I remember every conversation.
                </p>
                <div className="chip-row">
                  {CHIPS.map((c) => (
                    <button key={c.label} className="chip" onClick={() => sendMessage(c.msg)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {subject.chatHistory.map((m) => (
              <div key={m.id} className={`message ${m.role}`}>
                {m.role === "assistant" && (
                  <motion.span 
                    className="msg-icon text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    🦉
                  </motion.span>
                )}
                <div className="msg-bubble">
                  <pre className="msg-text">{m.content}</pre>
                  <span className="msg-time">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {streaming && (
              <div className="message assistant">
                <motion.span 
                  className="msg-icon text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  😳
                </motion.span>
                <div className="msg-bubble streaming">
                  <pre className="msg-text">
                    {streamBuffer}
                    <span className="cursor-blink">▋</span>
                  </pre>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="input-area">
            {subject.chatHistory.length > 0 && (
              <div className="chip-row chip-row-bottom">
                {CHIPS.map((c) => (
                  <button
                    key={c.label}
                    className="chip"
                    onClick={() => sendMessage(c.msg)}
                    disabled={streaming}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            <div className="input-row relative">
              <textarea
                className="chat-input shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
                placeholder={`ask anything about ${subject.name}...`}
                value={input}
                disabled={streaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                style={{
                  cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='font-size:20px'><text y='20'>✒️</text></svg>") 0 20, text`
                }}
              />
              <button
                className="send-btn group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                disabled={streaming || !input.trim()}
                onClick={() => sendMessage(input)}
              >
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-125">{streaming ? "···" : "🖋️"}</span>
                <div className="absolute inset-0 bg-[rgba(201,168,76,0.3)] opacity-0 group-hover:opacity-100 rounded-full scale-0 group-hover:scale-150 transition-all duration-500 origin-center" />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "flashcards" && (
        <FlashcardsTab
          flashcards={subject.flashcards}
          onUpdate={(cards) => onUpdate({ flashcards: cards })}
          onGenerate={() => sendMessage("Generate 12 flashcards from my material as a JSON array.")}
        />
      )}

      {activeTab === "quiz" && (
        <QuizTab
          onStart={() =>
            sendMessage(
              "Quiz me with 5 multiple-choice questions from my study material. Format each question clearly.",
            )
          }
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "notes" && (
        <NotesTab notes={subject.notes} onChange={(notes) => onUpdate({ notes })} />
      )}
    </div>
  );
}

// ─── Flashcards Tab ───────────────────────────────────────────────────────────

function FlashcardsTab({
  flashcards,
  onUpdate,
  onGenerate,
}: {
  flashcards: Flashcard[];
  onUpdate: (cards: Flashcard[]) => void;
  onGenerate: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="tab-empty">
        <p>no flashcards yet.</p>
        <button className="lib-action-btn" onClick={onGenerate}>
          🃏 generate from my material
        </button>
      </div>
    );
  }

  const fc = flashcards[idx];
  const setDiff = (d: Flashcard["difficulty"]) => {
    onUpdate(flashcards.map((c) => (c.id === fc.id ? { ...c, difficulty: d } : c)));
    setFlipped(false);
    setIdx((i) => (i + 1) % flashcards.length);
    playFlip();
  };

  return (
    <div className="flashcards-tab">
      <div className="fc-progress">
        <span>
          {idx + 1} / {flashcards.length}
        </span>
        <div className="fc-progress-bar">
          <div
            className="fc-progress-fill"
            style={{ width: `${((idx + 1) / flashcards.length) * 100}%` }}
          />
        </div>
        <button className="fc-clear" onClick={() => onUpdate([])}>
          clear all
        </button>
      </div>
      <div
        className={`fc-card ${flipped ? "flipped" : ""}`}
        onClick={() => {
          setFlipped(!flipped);
          playFlip();
        }}
      >
        <div className="fc-inner">
          <div className="fc-front">
            <span className="fc-side-label">QUESTION</span>
            <p>{fc.front}</p>
            <span className="fc-hint">tap to reveal</span>
          </div>
          <div className="fc-back">
            <span className="fc-side-label">ANSWER</span>
            <p>{fc.back}</p>
          </div>
        </div>
      </div>
      {flipped && (
        <div className="fc-difficulty">
          <button className="diff-btn hard" onClick={() => setDiff("hard")}>
            😓 Hard
          </button>
          <button className="diff-btn okay" onClick={() => setDiff("okay")}>
            😐 Okay
          </button>
          <button className="diff-btn easy" onClick={() => setDiff("easy")}>
            😊 Easy
          </button>
        </div>
      )}
      <div className="fc-nav">
        <button
          onClick={() => {
            setIdx((i) => (i - 1 + flashcards.length) % flashcards.length);
            setFlipped(false);
          }}
        >
          ←
        </button>
        <button
          onClick={() => {
            setIdx((i) => (i + 1) % flashcards.length);
            setFlipped(false);
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────

function QuizTab({
  onStart,
  setActiveTab,
}: {
  onStart: () => void;
  setActiveTab: (t: "chat" | "flashcards" | "quiz" | "notes") => void;
}) {
  return (
    <div className="tab-empty">
      <p style={{ marginBottom: "0.5rem" }}>quiz is powered by your tutor.</p>
      <p style={{ fontSize: "0.8rem", color: "rgba(244,228,193,0.5)", marginBottom: "1.5rem" }}>
        the questions will appear in chat so you can discuss answers together.
      </p>
      <button
        className="lib-action-btn"
        onClick={() => {
          onStart();
          setActiveTab("chat");
        }}
      >
        🧪 start a quiz
      </button>
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({ notes, onChange }: { notes: string; onChange: (n: string) => void }) {
  return (
    <div className="notes-tab">
      <textarea
        className="notes-area"
        placeholder="scribble what you learned..."
        value={notes}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="notes-footer">
        <span>{notes.length} chars</span>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function SubjectWorkspace({ subject, onUpdate, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "flashcards" | "quiz" | "notes">("chat");
  const sendRef = useRef<((msg: string) => void) | null>(null);
  const [ollamaEnabled] = useState(true); // always on — Ollama is the only AI
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [ollamaModel, setOllamaModel] = useState("");

  // Auto-detect Ollama on mount using unified service
  useEffect(() => {
    checkOllamaHealth().then((healthy) => {
      setOllamaAvailable(healthy);
      if (healthy) getBestModel().then((m) => setOllamaModel(m));
    });
  }, []);

  const handleQuickAction = useCallback((msg: string) => {
    setActiveTab("chat");
    setTimeout(() => sendRef.current?.(msg), 80);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="workspace-root">
        <div className="workspace-header">
          <div className="ws-title bg-[#0a0604] border border-[#1a1005] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)] px-3 py-1.5 rounded-lg flex items-center gap-3">
            <span className="ws-color-dot shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" style={{ background: subject.color }} />
            <span className="ws-name text-[#f4e4c1] tracking-widest">{subject.name}</span>
          </div>
          <div className="ws-header-right">
            <div className="ws-meta flex items-center gap-1.5 bg-[#0a0604] border border-[#1a1005] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] px-2.5 py-1 rounded-md">
              <span className="text-[#c9a84c]/60 text-[10px]">⏳</span>
              <span className="text-[#f4e4c1]/60 font-mono text-[10px] pt-px">{subject.hoursStudied.toFixed(1)}h</span>
            </div>
            {/* Ollama Toggle */}
            <button
              className="ollama-toggle"
              onClick={() => {}}
              title={
                ollamaAvailable === null
                  ? "Checking Ollama..."
                  : ollamaAvailable
                    ? `Ollama running — ${ollamaModel.split(":")[0] || "detecting model..."}`
                    : "Ollama not running — start with: ollama serve"
              }
            >
              <span
                className={`ollama-dot ${ollamaAvailable ? "active shadow-[0_0_12px_rgba(39,174,96,0.8)] animate-pulse" : ""}`}
              />
              <span className="ollama-label">
                {ollamaAvailable === null
                  ? "..."
                  : ollamaAvailable
                    ? ollamaModel.split(":")[0] || "Ollama"
                    : "AI offline"}
              </span>
            </button>
            <button className="ws-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="workspace-body">
          <SourcesPanel subject={subject} onUpdate={onUpdate} onQuickAction={handleQuickAction} />
          <div className="divider-v" />
          <ChatPanel
            subject={subject}
            onUpdate={onUpdate}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sendRef={sendRef}
            ollamaEnabled={ollamaEnabled}
            ollamaModel={ollamaModel}
          />
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
.workspace-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d0905;
  font-family: 'Crimson Text', serif;
  color: #f4e4c1;
  overflow: hidden;
}
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.4rem;
  border-bottom: 1px solid rgba(201,168,76,0.2);
  flex-shrink: 0;
  background: rgba(20,12,4,0.6);
}
.ws-title { display: flex; align-items: center; gap: 0.6rem; }
.ws-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ws-name { font-family: 'Cinzel', serif; font-size: 1rem; color: #c9a84c; letter-spacing: 0.04em; }
.ws-header-right { display: flex; align-items: center; gap: 1rem; }
.ws-meta { font-size: 0.78rem; color: rgba(244,228,193,0.5); font-style: italic; }
.ws-close { background: none; border: none; color: rgba(244,228,193,0.4); font-size: 1rem; cursor: pointer; padding: 0.2rem 0.4rem; transition: color 0.15s; }
.ws-close:hover { color: #f4e4c1; }
.workspace-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
.divider-v { width: 1px; background: rgba(201,168,76,0.15); flex-shrink: 0; }
.sources-panel { width: 260px; min-width: 220px; max-width: 280px; display: flex; flex-direction: column; gap: 0.6rem; padding: 1rem; overflow-y: auto; background: rgba(16,10,4,0.5); flex-shrink: 0; }
.panel-section-label { font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.22em; color: rgba(201,168,76,0.6); padding: 0.2rem 0; }
.upload-zone { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; border: 1px dashed rgba(201,168,76,0.35); border-radius: 4px; padding: 0.9rem 0.5rem; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.upload-zone:hover { border-color: rgba(201,168,76,0.7); background: rgba(201,168,76,0.04); }
.upload-icon { font-size: 1.2rem; color: rgba(201,168,76,0.5); }
.upload-text { font-size: 0.78rem; color: rgba(244,228,193,0.45); text-align: center; }
.doc-list { display: flex; flex-direction: column; gap: 0.3rem; }
.empty-hint { font-size: 0.78rem; font-style: italic; color: rgba(244,228,193,0.35); text-align: center; line-height: 1.5; padding: 0.4rem 0; }
.doc-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; border-radius: 3px; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.12); font-size: 0.8rem; }
.doc-icon { flex-shrink: 0; }
.doc-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(244,228,193,0.75); }
.doc-size { font-size: 0.7rem; color: rgba(244,228,193,0.35); flex-shrink: 0; }
.doc-remove { background: none; border: none; color: rgba(244,228,193,0.3); cursor: pointer; font-size: 0.7rem; padding: 0 0.2rem; transition: color 0.15s; }
.doc-remove:hover { color: #c0392b; }
.section-divider { height: 1px; background: rgba(201,168,76,0.12); margin: 0.2rem 0; }
.quick-actions { display: flex; flex-direction: column; gap: 0.3rem; }
.quick-btn { display: flex; align-items: center; gap: 0.5rem; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.18); border-radius: 3px; color: rgba(244,228,193,0.7); font-family: 'Crimson Text', serif; font-size: 0.82rem; padding: 0.4rem 0.6rem; cursor: pointer; text-align: left; transition: all 0.18s; }
.quick-btn:hover { background: rgba(201,168,76,0.12); border-color: rgba(201,168,76,0.4); color: #c9a84c; }
.stats-row { display: flex; gap: 1rem; }
.stat-item { display: flex; flex-direction: column; gap: 0.15rem; }
.stat-label { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.18em; color: rgba(201,168,76,0.5); }
.stat-value { font-size: 0.95rem; color: #c9a84c; }
.ollama-toggle { display: flex; align-items: center; gap: 0.4rem; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 0.25rem 0.65rem; cursor: pointer; transition: all 0.2s; }
.ollama-toggle:hover { border-color: rgba(201,168,76,0.5); background: rgba(201,168,76,0.1); }
.ollama-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(244,228,193,0.25); transition: all 0.3s; flex-shrink: 0; }
.ollama-dot.active { background: #27ae60; box-shadow: 0 0 8px rgba(39,174,96,0.5); }
.ollama-dot.available { background: #c9a84c; box-shadow: 0 0 6px rgba(201,168,76,0.3); }
.ollama-label { font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 0.12em; color: rgba(244,228,193,0.5); }
.chat-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.tab-bar { display: flex; border-bottom: 1px solid rgba(201,168,76,0.15); flex-shrink: 0; padding: 0 1rem; }
.tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: rgba(244,228,193,0.45); font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.18em; padding: 0.7rem 1rem; cursor: pointer; transition: all 0.18s; position: relative; }
.tab-btn:hover { color: rgba(244,228,193,0.7); }
.tab-btn.active { color: #c9a84c; border-bottom-color: #c9a84c; }
.tab-badge { position: absolute; top: 4px; right: 4px; background: #c9a84c; color: #0d0905; font-size: 0.55rem; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.messages-list { flex: 1; overflow-y: auto; padding: 1.2rem 1.4rem; display: flex; flex-direction: column; gap: 1rem; scroll-behavior: smooth; }
.messages-list::-webkit-scrollbar { width: 3px; }
.messages-list::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.25); border-radius: 2px; }
.chat-empty { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; padding: 2rem 1rem; text-align: center; }
.owl-avatar { font-size: 2.4rem; }
.welcome-text { font-size: 1rem; color: rgba(244,228,193,0.65); line-height: 1.6; max-width: 420px; }
.welcome-text strong { color: #c9a84c; font-weight: 600; }
.chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.4rem; }
.chip-row-bottom { justify-content: flex-start; padding: 0.4rem 1.4rem 0; }
.chip { background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.25); border-radius: 20px; color: rgba(244,228,193,0.65); font-family: 'Crimson Text', serif; font-size: 0.82rem; padding: 0.3rem 0.75rem; cursor: pointer; transition: all 0.18s; }
.chip:hover { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5); color: #c9a84c; }
.chip:disabled { opacity: 0.4; cursor: not-allowed; }
.message { display: flex; gap: 0.65rem; align-items: flex-start; }
.message.user { flex-direction: row-reverse; }
.msg-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 0.15rem; }
.msg-bubble { max-width: 78%; display: flex; flex-direction: column; gap: 0.25rem; }
.message.user .msg-bubble { align-items: flex-end; }
.msg-text { background: rgba(26,14,4,0.85); border: 1px solid rgba(201,168,76,0.18); border-radius: 12px 12px 12px 2px; padding: 0.65rem 0.9rem; font-family: 'Crimson Text', serif; font-size: 0.95rem; line-height: 1.6; color: #f4e4c1; white-space: pre-wrap; word-break: break-word; margin: 0; }
.message.user .msg-text { background: rgba(201,168,76,0.14); border-color: rgba(201,168,76,0.3); border-radius: 12px 12px 2px 12px; }
.msg-bubble.streaming .msg-text { border-color: rgba(201,168,76,0.35); }
.cursor-blink { animation: blink 0.8s steps(1) infinite; color: #c9a84c; }
@keyframes blink { 50% { opacity: 0; } }
.msg-time { font-size: 0.65rem; color: rgba(244,228,193,0.3); padding: 0 0.2rem; }
.input-area { border-top: 1px solid rgba(201,168,76,0.15); flex-shrink: 0; padding: 0.8rem 1.4rem; display: flex; flex-direction: column; gap: 0.5rem; background: rgba(12,8,3,0.4); }
.input-row { display: flex; gap: 0.6rem; align-items: flex-end; }
.chat-input { flex: 1; background: rgba(26,14,4,0.8); border: 1px solid rgba(201,168,76,0.25); border-radius: 4px; color: #f4e4c1; font-family: 'Crimson Text', serif; font-size: 0.95rem; padding: 0.55rem 0.8rem; resize: none; outline: none; line-height: 1.5; transition: border-color 0.18s; }
.chat-input:focus { border-color: rgba(201,168,76,0.6); }
.chat-input::placeholder { color: rgba(244,228,193,0.3); }
.chat-input:disabled { opacity: 0.5; }
.send-btn { background: rgba(201,168,76,0.18); border: 1px solid rgba(201,168,76,0.45); border-radius: 4px; color: #c9a84c; font-size: 1.1rem; width: 40px; height: 40px; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.send-btn:hover:not(:disabled) { background: rgba(201,168,76,0.3); border-color: #c9a84c; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.flashcards-tab { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 1.5rem 2rem; gap: 1rem; overflow-y: auto; }
.fc-progress { display: flex; align-items: center; gap: 0.8rem; width: 100%; max-width: 480px; font-size: 0.8rem; color: rgba(244,228,193,0.5); }
.fc-progress-bar { flex: 1; height: 3px; background: rgba(201,168,76,0.15); border-radius: 2px; overflow: hidden; }
.fc-progress-fill { height: 100%; background: #c9a84c; transition: width 0.3s; }
.fc-clear { background: none; border: none; color: rgba(244,228,193,0.3); font-size: 0.72rem; cursor: pointer; transition: color 0.15s; }
.fc-clear:hover { color: #c0392b; }
.fc-card { width: 100%; max-width: 480px; height: 240px; perspective: 1000px; cursor: pointer; }
.fc-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1); }
.fc-card.flipped .fc-inner { transform: rotateY(180deg); }
.fc-front, .fc-back { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 0.6rem; text-align: center; }
.fc-front { background: rgba(26,14,4,0.9); border: 1px solid rgba(201,168,76,0.3); }
.fc-back { background: rgba(20,18,8,0.95); border: 1px solid rgba(201,168,76,0.5); transform: rotateY(180deg); }
.fc-side-label { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.22em; color: rgba(201,168,76,0.5); }
.fc-front p, .fc-back p { font-size: 1rem; line-height: 1.6; color: #f4e4c1; margin: 0; }
.fc-hint { font-size: 0.72rem; color: rgba(244,228,193,0.3); font-style: italic; }
.fc-difficulty { display: flex; gap: 0.8rem; }
.diff-btn { padding: 0.45rem 1.2rem; border-radius: 4px; font-family: 'Crimson Text', serif; font-size: 0.88rem; cursor: pointer; transition: all 0.18s; border: 1px solid; }
.diff-btn.hard { background: rgba(139,32,32,0.2); border-color: #8b2020; color: #e87878; }
.diff-btn.hard:hover { background: rgba(139,32,32,0.4); }
.diff-btn.okay { background: rgba(139,105,20,0.2); border-color: #8b6914; color: #c9a84c; }
.diff-btn.okay:hover { background: rgba(139,105,20,0.4); }
.diff-btn.easy { background: rgba(26,74,40,0.2); border-color: #1a4a28; color: #5aaa70; }
.diff-btn.easy:hover { background: rgba(26,74,40,0.4); }
.fc-nav { display: flex; gap: 1.5rem; }
.fc-nav button { background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); border-radius: 4px; color: #c9a84c; width: 36px; height: 36px; cursor: pointer; font-size: 1rem; transition: all 0.15s; }
.fc-nav button:hover { background: rgba(201,168,76,0.22); }
.tab-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; color: rgba(244,228,193,0.45); font-style: italic; font-size: 0.95rem; text-align: center; padding: 2rem; }
.lib-action-btn { background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.35); border-radius: 4px; color: #c9a84c; font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.1em; padding: 0.5rem 1.1rem; cursor: pointer; transition: all 0.18s; }
.lib-action-btn:hover { background: rgba(201,168,76,0.2); border-color: #c9a84c; }
.notes-tab { flex: 1; display: flex; flex-direction: column; padding: 1rem 1.4rem; gap: 0.4rem; overflow: hidden; }
.notes-area { flex: 1; background: rgba(20,12,4,0.7); border: 1px solid rgba(201,168,76,0.18); border-radius: 4px; color: #f4e4c1; font-family: 'Crimson Text', serif; font-size: 0.95rem; line-height: 1.7; padding: 0.9rem; resize: none; outline: none; transition: border-color 0.18s; }
.notes-area:focus { border-color: rgba(201,168,76,0.4); }
.notes-area::placeholder { color: rgba(244,228,193,0.25); font-style: italic; }
.notes-footer { font-size: 0.68rem; color: rgba(244,228,193,0.25); text-align: right; }
`;