import { Router } from "express";

import { knowledgeStore } from "../services/knowledge-store";

const handoffRouter = Router();

handoffRouter.post("/handoff", (req, res) => {
  const { from_agent_id, to_agent_id, project_id, content } = req.body ?? {};

  if (
    typeof from_agent_id !== "string" ||
    typeof to_agent_id !== "string" ||
    typeof project_id !== "string" ||
    typeof content !== "string"
  ) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid handoff payload",
        details: {}
      }
    });
  }

  const event = knowledgeStore.addHandoff({
    from_agent_id,
    to_agent_id,
    project_id,
    content
  });

  return res.status(200).json({
    status: "transferred",
    handoff_id: event.id
  });
});

export { handoffRouter };
