import { defineMcp } from "@lovable.dev/mcp-js";
import listDivisionsTool from "./tools/list-divisions";
import getDivisionTool from "./tools/get-division";

export default defineMcp({
  name: "uig-apex-mcp",
  title: "UIG Apex MCP",
  version: "0.1.0",
  instructions:
    "Tools for exploring United Intelligence Group (UIG). Use `list_divisions` to see all business divisions, then `get_division` for a single division's modules and details.",
  tools: [listDivisionsTool, getDivisionTool],
});
