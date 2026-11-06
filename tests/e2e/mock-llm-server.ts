/**
 * mock-llm-server.ts — a minimal OpenAI-compatible `/chat/completions` HTTP
 * server for E2E tests.
 *
 * The real `atoma` binary's OpenAI client (`OPENAI_BASE_URL` env var) is
 * pointed at this server, so the *actual* agent inference loop runs
 * unmodified -- only the LLM's decisions are canned/scripted, via a queue of
 * responses returned in order, one per HTTP request received.
 *
 * It answers with Server-Sent Events, not a single JSON body.
 *
 * That is not a detail of style. Every OpenAI-compatible provider atoma calls goes
 * through its *streaming* path (`chat_completion_streaming`): the body carries
 * `stream: true`, the repetition circuit breaker watches the deltas as they arrive,
 * and the reply is rebuilt from `choices[0].delta` chunks by `StreamAccumulator`. A
 * plain JSON body is not read as a reply at all -- `read_sse` looks for `data:` lines,
 * finds none, and the accumulator ends up empty. The run then reports "LLM returned
 * empty response" and re-asks, which spends the whole queue on the first intended
 * step and ends in a 500.
 *
 * That is what this file used to do, and it made five of the eight e2e tests fail the
 * first time the suite ever ran in CI (`atomaton-tools`, PR #100). The failure read as
 * the mock running out of canned responses; it was the mock answering in a dialect
 * nothing was reading.
 */

export interface QueuedToolCall {
  id: string;
  /**
   * The name the model calls the tool by. Write `advertised:<suffix>` to defer to
   * the binary: the server substitutes the function the request's own tools list
   * advertises whose name ends with `<suffix>`, which is what a model that read
   * the list would call. A spelled-out name is left alone, for tests that mean a
   * specific name to be exact.
   */
  name: string;
  arguments: Record<string, unknown>;
}

export interface QueuedResponse {
  /** Assistant text content. Omit when returning tool_calls. */
  content?: string;
  toolCalls?: QueuedToolCall[];
}

export interface MockLlmServer {
  url: string;
  /** Raw JSON bodies of every request received so far, in order. */
  requests: {
    messages: { role: string; content?: unknown }[];
    tools?: { function?: { name?: string } }[];
  }[];
  stop(): void;
}

export function startMockLlmServer(responses: QueuedResponse[]): MockLlmServer {
  const queue = [...responses];
  const requests: MockLlmServer["requests"] = [];

  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      if (req.method !== "POST" || !req.url.endsWith("/chat/completions")) {
        return new Response("not found", { status: 404 });
      }
      const request = (await req.json()) as MockLlmServer["requests"][number];
      requests.push(request);

      const next = queue.shift();
      if (!next) {
        return Response.json({ error: { message: "mock-llm-server: no more queued responses" } }, { status: 500 });
      }

      // Resolve `advertised:<suffix>` names against the request that produced them.
      // A call named this way is scripted before the request exists, so the
      // substitution happens here, where the tools list is in hand.
      const toolCalls = next.toolCalls?.map((tc) => {
        const [verb, suffix] = tc.name.split(":");
        if (verb !== "advertised") return tc;
        const found = request.tools
          ?.map((tool) => tool.function?.name ?? "")
          .find((name) => name.endsWith(suffix));
        return found ? { ...tc, name: found } : tc;
      });

      // One chunk carrying the whole step, because that is what the tests script: what
      // is being exercised is the inference loop and the tool boundary, not chunk
      // reassembly, which has its own unit tests in the core. The fields are the same
      // ones the non-streaming message would carry, inside the `delta` object the
      // accumulator folds in.
      const delta = toolCalls
        ? {
            role: "assistant",
            content: null,
            tool_calls: toolCalls.map((tc, index) => ({
              index,
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          }
        : { role: "assistant", content: next.content ?? "" };

      const chunks = [
        // The step itself. `finish_reason: null` because the chunk carrying the reason
        // is a separate one, which is how providers read here send it.
        JSON.stringify({ choices: [{ index: 0, delta, finish_reason: null }] }),
        // The terminating chunk: the reason, and no content. `include_usage` is asked
        // for on this path, so usage rides the chunk that carries the reason.
        JSON.stringify({
          choices: [{ index: 0, delta: {}, finish_reason: next.toolCalls ? "tool_calls" : "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      ];

      // `[DONE]` is OpenAI's end-of-stream marker: `sse_data` reports it as no payload,
      // which is what stops the reader.
      const body = `${chunks.map((chunk) => `data: ${chunk}\n\n`).join("")}data: [DONE]\n\n`;

      return new Response(body, {
        headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
      });
    },
  });

  return {
    url: `http://localhost:${server.port}/v1`,
    requests,
    stop: () => server.stop(true),
  };
}
