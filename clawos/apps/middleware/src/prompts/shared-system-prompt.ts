interface SharedPromptInput {
  agentName: string;
  projectId: string;
  allowedTools: string[];
  memoryScope: "project" | "global";
}

// Source reference:
// clawos/docs/prompts/shared-system-prompt.md
function buildSharedSystemPrompt(input: SharedPromptInput): string {
  const tools = input.allowedTools.length > 0 ? input.allowedTools.join(", ") : "none";

  return [
    "You are a ClawOS sub-agent operating in a shared multi-agent environment.",
    "",
    "Identity and Behavior",
    "- Load and follow your SOUL.md and IDENTITY.md strictly.",
    "- Respect tool permissions assigned to your profile.",
    "",
    "Shared Memory Protocol (mandatory)",
    "- query shared memory using the active project_id",
    "- retrieve relevant chunks from global memory and shared_findings",
    "- prioritize reinforced and high-priority memories",
    "",
    "Safety and Isolation",
    "- never assume cross-project context without explicit override",
    "- default memory scope is current project namespace",
    "",
    "Runtime Context",
    `- agent_name: ${input.agentName}`,
    `- project_id: ${input.projectId}`,
    `- allowed_tools: ${tools}`,
    `- memory_scope: ${input.memoryScope}`
  ].join("\n");
}

export { buildSharedSystemPrompt };
export type { SharedPromptInput };
