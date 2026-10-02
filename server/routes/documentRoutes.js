import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createDocumentHandlers, documentResources, documentSchema } from "../controllers/documentController.js";

const router = Router();

for (const [name, resource] of Object.entries(documentResources)) {
  const handlers = createDocumentHandlers(name);
  const base = `/${name}`;
  router.get(base, authenticate, asyncHandler(handlers.list));
  router.post(base, authenticate, authorize(...resource.createRoles), validate(documentSchema(resource)), asyncHandler(handlers.create));
  router.get(`${base}/:id`, authenticate, asyncHandler(handlers.get));
  router.patch(`${base}/:id`, authenticate, authorize(...resource.updateRoles), validate(documentSchema(resource, true)), asyncHandler(handlers.update));
  router.delete(`${base}/:id`, authenticate, authorize(...resource.deleteRoles), asyncHandler(handlers.remove));
}

export default router;