import { Router } from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { getPlanUsage } from "../controllers/planController.js"

const router = Router()

router.get("/", requireAuth, getPlanUsage)

export default router