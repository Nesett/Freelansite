import { Router } from "express";
import { createProject, getAllProjects, getProject, updateProject, deleteProject } from "../controllers/projectController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post("/", createProject)
router.get("/", getAllProjects)
router.get("/:id", getProject)
router.put("/:id", updateProject)
router.delete("./:id", deleteProject)


export default router