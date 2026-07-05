import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MCP_DIVISIONS } from "../data";

export default defineTool({
  name: "get_division",
  title: "Get UIG division details",
  description:
    "Get full details for a single UIG division by its slug, including all of its modules and each module's status (live or soon).",
  inputSchema: {
    slug: z
      .string()
      .min(1)
      .describe(
        "The division slug, e.g. technology, agritech, real-estate, logistics, intelligence, innovation-lab.",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const division = MCP_DIVISIONS.find((d) => d.slug === slug.trim().toLowerCase());
    if (!division) {
      const known = MCP_DIVISIONS.map((d) => d.slug).join(", ");
      return {
        content: [
          { type: "text", text: `No division found for slug "${slug}". Known slugs: ${known}.` },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(division, null, 2) }],
      structuredContent: { division },
    };
  },
});
