import { Router } from "express";
import { createMilestone, getAllMilestones, updateMilestone, deactivateMilestone, approveMilestone } from "../controllers/milestoneController.js"
import { requireAuth, requireClientAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post("/", requireAuth, createMilestone)
router.get("/", requireAuth, getAllMilestones)
router.put("/:id", requireAuth, updateMilestone)
router.delete("/:id", requireAuth, deactivateMilestone)
router.put("/:id/approve", requireClientAuth, approveMilestone)


export default router