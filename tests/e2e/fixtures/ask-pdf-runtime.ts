/** Deterministic browser-only RAG double. Injected by the test server, never the app. */
import { AI_MODELS } from "../../../src/utils/ai-models.ts";
import type { IndexingProgress, RagSession } from "../../../src/rag/index.ts";

export const sampleAnswer = `### A little more room to think

The document describes a **local workspace** for reading, collecting ideas, and making progress at your own pace.

- Keep the source close while you explore.
- Make one clear decision at a time.
- Leave room for a little curiosity.

| Section | What to look for |
| --- | --- |
| Introduction | The purpose of the project |
| Next steps | A small, practical starting point |

> A calm workspace helps the content take the lead.

You can check the original pages below.`;

type IndexJob = {
  file: string;
  progress: (progress: IndexingProgress) => void;
  finish: () => void;
  fail: (message: string) => void;
};
type AnswerJob = {
  question: string;
  token: (text: string) => void;
  finish: (answer?: string, intent?: "question" | "chitchat" | "off-topic") => void;
  fail: () => void;
};
declare global {
  interface Window {
    airChatTest: { indexes: IndexJob[]; answers: AnswerJob[]; interrupted: number };
  }
}
window.airChatTest = { indexes: [], answers: [], interrupted: 0 };
const noop = () => {};
const ensureReady = async () => ({ chat: {}, embed: {}, rerank: {} });
const model = (id: keyof typeof AI_MODELS) => ({
  info: AI_MODELS[id],
  status: "ready",
  progress: null,
});
const models = { chat: model("chat:lfm2.5-1.2b"), embed: model("embed"), rerank: model("rerank") };
export function useRagModels() {
  return {
    ...models,
    status: "ready",
    cached: true,
    chatVariant: "lfm2.5-1.2b",
    ensureReady,
    setChatVariant: noop,
    confirm: noop,
    cancel: noop,
    retry: noop,
    error: null,
    dispose: async () => {},
    evict: async () => ({}),
    canFreeMemory: false,
    canDelete: false,
  };
}
export async function createRagSession({
  file,
  onIndexProgress,
}: {
  file: File;
  onIndexProgress: (progress: IndexingProgress) => void;
}): Promise<RagSession> {
  const demo = new URLSearchParams(location.search).has("air-chat-demo");
  if (!demo)
    await new Promise<void>((resolve, reject) =>
      window.airChatTest.indexes.push({
        file: file.name,
        progress: onIndexProgress,
        finish: resolve,
        fail: (message) => reject(new Error(message)),
      }),
    );
  return {
    documentId: file.name,
    chunkCount: 3,
    interrupt: () => {
      window.airChatTest.interrupted++;
    },
    ask: async ({ question, onToken }) => {
      if (demo) return { answer: sampleAnswer, citedPages: [1, 2], intent: "question" };
      return new Promise((resolve, reject) =>
        window.airChatTest.answers.push({
          question,
          token: (text) => onToken?.(text),
          finish: (answer = sampleAnswer, intent = "question") =>
            resolve({ answer, citedPages: [1, 2, 2, -1], intent }),
          fail: () => reject(new Error("The answer was interrupted. Please try again.")),
        }),
      );
    },
  };
}
