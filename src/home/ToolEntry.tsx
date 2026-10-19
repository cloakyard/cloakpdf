import { ArrowRight } from "lucide-react";
import { memo } from "react";
import type { ToolId } from "../config/tool-registry.ts";
import type { Tool } from "../types.ts";

export const ToolEntry = memo(function ToolEntry({
  tool,
  onSelect,
}: {
  tool: Tool;
  onSelect: (id: ToolId) => void;
}) {
  const Icon = tool.icon;
  return (
    <button type="button" className="pdf-tool-entry" onClick={() => onSelect(tool.id as ToolId)}>
      <Icon className="size-5" aria-hidden="true" />
      <span className="pdf-tool-entry-copy">
        <h3 className="pdf-tool-entry-title">{tool.title}</h3>
        {tool.beta && <span className="pdf-tool-entry-meta">Beta</span>}
        <span className="pdf-tool-entry-description">{tool.description}</span>
        {tool.requirements && <span className="pdf-tool-entry-meta">{tool.requirements}</span>}
      </span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
});
