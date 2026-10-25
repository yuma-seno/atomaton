/**
 * A one-tool MCP server whose only tool ends the session, the way `create_pr` does:
 * `_meta.session_ends: true`. Used to measure what the real `atoma` binary records as
 * the run's ending when a tool call parks the turn.
 */
import { buildMcpTools, defineMcpTool, serveMcpServer, z } from "/home/runner/work/atomaton/atomaton/src/adapters/mcp/mcp-tool.ts";

const park = defineMcpTool({
  name: "park_it",
  description: "Ends this session immediately.",
  schema: z.object({}),
  handler: () => ({ text: "parked: the work runs under this node", meta: { session_ends: true } }),
});

const { tools, dispatch } = buildMcpTools([park]);
await serveMcpServer({
  name: "measure-park-mcp",
  version: "0.0.0",
  tools,
  dispatch,
  log: (message: string) => console.error(`[measure-park] ${message}`),
});
