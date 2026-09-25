"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { ChannelBadge, SentimentBadge } from "@/components/feedback/Badges";

type Source = { id: string; content: string; channel: string; sentiment: string | null; score: number };
type Turn = { question: string; answer: string; sources: Source[] };

const SUGGESTIONS = [
  "What are users saying about onboarding?",
  "What's the biggest complaint about billing?",
  "What do customers like most about the mobile app?",
  "Are there any recurring requests for SSO?",
];

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/insights/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ask LOOP couldn't answer that. Try again.");
      return;
    }

    const data = await res.json();
    setHistory((h) => [...h, { question: q, answer: data.answer, sources: data.sources }]);
    setQuestion("");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-500" /> Ask LOOP
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask a plain-English question — answers are grounded in your real feedback, with sources cited.
        </p>
      </div>

      {history.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="btn-secondary text-xs">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-5">
        {history.map((turn, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-brand-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm">
                {turn.question}
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{turn.answer}</p>
              {turn.sources.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Sources</p>
                  {turn.sources.map((s) => (
                    <div key={s.id} className="border border-gray-100 rounded-lg p-2.5 text-xs">
                      <p className="text-gray-700">{s.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <ChannelBadge channel={s.channel} />
                        <SentimentBadge sentiment={s.sentiment} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="card p-4 text-sm text-gray-400">Retrieving relevant feedback and thinking…</div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="sticky bottom-4 flex gap-2"
      >
        <input
          className="input flex-1 shadow-md"
          placeholder="Ask a question about your feedback…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary shadow-md">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
