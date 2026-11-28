/** A minimal OpenAI Responses-API v2(/responses, SSE) mock, iterated against the binary. */
export function startMockResponses(steps: Record<string, unknown>[]) {
  const queue = steps.slice();
  const requests: any[] = [];
  let failing = true;
  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      if (!req.url.endsWith("/responses")) return new Response("nope", { status: 404 });
      const body = await req.json();
      requests.push(body);
      const step = queue.shift() as any;
      if (!step) return Response.json({ error: { message: "mock out of steps" } }, { status: 500 });
      const output: any[] = [];
      const events: any[] = [{ type: "response.created", response: { id: "r1", object: "response", status: "in_progress", model: "test-model", output: [], tools: [], usage: null } }];
      let oi = 0;
      for (const call of step.calls ?? []) {
        const item = { type: "function_call", id: "fc_" + call.callId, call_id: call.callId, name: call.name, arguments: call.args, status: "completed" };
        output.push(item);
        events.push({ type: "response.output_item.added", output_index: oi, item });
        events.push({ type: "response.function_call_arguments.delta", item_id: item.id, output_index: oi, delta: call.args });
        events.push({ type: "response.function_call_arguments.done", item_id: item.id, output_index: oi, arguments: call.args });
        events.push({ type: "response.output_item.done", output_index: oi, item });
        oi++;
      }
      if (step.text) {
        const item = { type: "message", id: "msg_1", role: "assistant", status: "completed", content: [{ type: "output_text", text: step.text, annotations: [] }] };
        output.unshift(item);
        events.unshift({ type: "response.output_item.added", output_index: 0, item });
        events.push({ type: "response.output_item.done", output_index: 0, item });
      }
      const response = {
        id: "r1", object: "response", model: "test-model", status: "completed", output, output_text: step.text ?? "",
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
      };
      events.push({ type: "response.completed", response });
      const stream = `${events.map((e) => `data: ${JSON.stringify(e)}`).join("\n\n")}\n\ndata: [DONE]\n\n`;
      return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
    },
  });
  return { url: `http://localhost:${server.port}/v1`, requests, stop: () => server.stop(true), setMockFlags: (f: boolean) => { failing = f; } };
}
