/** Serve the real application with only its expensive RAG boundary replaced. */
import { resolve } from "node:path";
import { createServer } from "vite";
export async function startAskPdfServer() {
  const fixture = resolve("tests/e2e/fixtures/ask-pdf-runtime.ts");
  const server = await createServer({
    server: { port: 8142, strictPort: true, host: "127.0.0.1" },
    plugins: [
      {
        name: "air-chat-test-only",
        enforce: "pre",
        load(id) {
          if (id === resolve("src/hooks/useRagModels.ts"))
            return `export { useRagModels } from ${JSON.stringify(fixture)}`;
          if (id === resolve("src/rag/index.ts"))
            return `export { createRagSession } from ${JSON.stringify(fixture)}`;
        },
      },
    ],
  });
  await server.listen();
  return server;
}
if (process.argv.includes("--serve")) await startAskPdfServer();
