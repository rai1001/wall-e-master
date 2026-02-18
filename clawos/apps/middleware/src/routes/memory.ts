import { Router } from "express";

import { MemoryStore } from "../services/memory-store";

const memoryRouter = Router();
const memoryStore = new MemoryStore();

memoryRouter.get("/search", (req, res) => {
  const query = String(req.query.q ?? "");
  const results = memoryStore.search(query);

  res.status(200).json({
    query,
    results
  });
});

export { memoryRouter };
