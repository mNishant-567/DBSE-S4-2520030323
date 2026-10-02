import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { bodySchema, createResourceHandlers, resources } from "../controllers/resourceController.js";

const router = Router();

for (const [name, resource] of Object.entries(resources)) {
  const handlers = createResourceHandlers(name);
  const base = `/${name}`;
  router.get(base, authenticate, asyncHandler(handlers.list));
  router.post(base, authenticate, authorize(...resource.createRoles), validate(bodySchema(resource)), asyncHandler(handlers.create));

  if (Array.isArray(resource.key)) {
    router.get(`${base}/:planId/:medicationId`, authenticate, asyncHandler(handlers.get));
    router.put(`${base}/:planId/:medicationId`, authenticate, authorize(...resource.updateRoles), validate(bodySchema(resource, true)), asyncHandler(handlers.update));
    router.delete(`${base}/:planId/:medicationId`, authenticate, authorize(...resource.deleteRoles), asyncHandler(handlers.remove));
  } else {
    router.get(`${base}/:id`, authenticate, asyncHandler(handlers.get));
    router.put(`${base}/:id`, authenticate, authorize(...resource.updateRoles), validate(bodySchema(resource, true)), asyncHandler(handlers.update));
    router.delete(`${base}/:id`, authenticate, authorize(...resource.deleteRoles), asyncHandler(handlers.remove));
  }
}

export default router;