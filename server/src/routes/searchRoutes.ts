import { Router } from "express"
import { search } from "../controllers/searchController.js"
import { requireAnyAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get("/", requireAnyAuth, search)

export default router