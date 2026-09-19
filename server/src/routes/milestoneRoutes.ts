import { Router } from "express";
import { createMilestone, getAllMilestones, updateMilestone, deactivateMilestone, approveMilestone } from "../controllers/milestoneController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post("/", createMilestone)
router.get("/", getAllMilestones)
router.put("/:id", updateMilestone)
router.delete("/:id", deactivateMilestone)
router.put("/:id/approve", approveMilestone)


export default router