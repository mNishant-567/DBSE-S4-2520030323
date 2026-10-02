import { Router } from "express";
import authRoutes from "./authRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import documentRoutes from "./documentRoutes.js";
import workflowRoutes from "./workflowRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "CareSync API v1", timestamp: new Date().toISOString() });
});
router.use("/auth", authRoutes);
router.use(resourceRoutes);
router.use(documentRoutes);
router.use("/workflows", workflowRoutes);
router.use((req, res) => res.status(404).json({ error: "API route not found" }));

export default router;