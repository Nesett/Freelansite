import { Router } from "express";
import { createMilestone, getAllMilestones, updateMilestone, deactivateMilestone, approveMilestone } from "../controllers/milestoneController.js"
import { requireAnyAuth, requireAuth, requireClientAuth } from '../middleware/authMiddleware.js'
import { validate } from "../middleware/validate.js"
import { createMilestoneSchema, updateMilestoneSchema } from "../schemas/milestoneSchemas.js";

const router = Router()

router.post("/", requireAuth, validate(createMilestoneSchema), createMilestone)
router.get("/", requireAnyAuth, getAllMilestones)
router.put("/:id", requireAuth, validate(updateMilestoneSchema), updateMilestone)
router.delete("/:id", requireAuth, deactivateMilestone)
router.put("/:id/approve", requireClientAuth, approveMilestone)


export default router