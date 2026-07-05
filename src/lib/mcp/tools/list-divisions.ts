import { defineTool } from "@lovable.dev/mcp-js";
import { MCP_DIVISIONS } from "../data";

export default defineTool({
  name: "list_divisions",
  title: "List UIG divisions",
  description:
    "List all UIG business divisions with their tagline, short description and module count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const summary = MCP_DIVISIONS.map((d) => ({
      slug: d.slug,
      name: d.name,
      tagline: d.tagline,
      description: d.description,
      moduleCount: d.modules.length,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: { divisions: summary },
    };
  },
});
