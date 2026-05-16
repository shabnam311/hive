// src/hooks/useSubjectAI.ts
// Drop-in replacement for the inline AI logic in SubjectWorkspace.tsx
// Uses the unified Ollama service — no direct Anthropic API call, no exposed keys.

import { useState, useCallback } from "react";
import { streamChat, ChatMessage } from "../services/ollama";

export interface UseSubjectAIReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (userText: string, systemPrompt?: string) => Promise<void>;
  clearMessages: () => void;
}

export function useSubjectAI(defaultSystemPrompt?: string): UseSubjectAIReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userText: string, systemPrompt?: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = { role: "user", content: userText };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setError(null);

      // Add an empty assistant message that we'll stream into
      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMsg]);

      try {
        let fullContent = "";
        const stream = streamChat(
          updatedMessages,
          systemPrompt ?? defaultSystemPrompt
        );

        for await (const chunk of stream) {
          fullContent += chunk;
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: fullContent },
          ]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";

        // If Ollama isn't running, give a clear message
        const displayError = message.includes("fetch")
          ? "Ollama isn't running. Start Ollama on your machine and try again."
          : `AI error: ${message}`;

        setError(displayError);

        // Remove the empty assistant message on error
        setMessages(updatedMessages);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, defaultSystemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
