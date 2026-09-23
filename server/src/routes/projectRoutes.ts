import { Router } from "express";
import { createProject, getAllProjects, getProject, updateProject, deactivateProject } from "../controllers/projectController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post("/", requireAuth, createProject)
router.get("/", requireAnyAuth, getAllProjects)
router.get("/:id", requireAnyAuth, getProject)
router.put("/:id", requireAuth, updateProject)
router.delete("/:id", requireAuth, deactivateProject)


export default router