"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const MAX_QUESTION_LENGTH = 200;

/**
 * Chatbot vero (chiamata AI reale) per l'atto 1: il paziente può chiedere
 * con cosa sostituire un ingrediente mancante, e l'AI risponde restando
 * dentro le equivalenze già definite dal nutrizionista — vedi
 * app/api/pro-demo-chat/route.ts. A differenza del resto della demo, questa
 * parte NON è statica: costa una vera chiamata Anthropic per domanda,
 * limitata da rateLimit() come le altre rotte AI.
 */
export function ProPlanChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/pro-demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Errore sconosciuto.");

      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Non sono riuscito a rispondere. Riprova." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Hai un ingrediente mancante? Chiedi qui.
      </p>

      {messages.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "px-3 py-2 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-6 rounded-2xl rounded-br-sm bg-muted text-foreground"
                  : "mr-6 rounded-2xl rounded-bl-sm bg-primary text-primary-foreground"
              )}
            >
              {message.text}
            </div>
          ))}
          {loading && (
            <div className="mr-6 flex items-center gap-2 rounded-2xl rounded-bl-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Sto pensando...
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Es. non ho i fagiolini, cosa uso?"
          maxLength={MAX_QUESTION_LENGTH}
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading || draft.trim().length === 0}>
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
