import { Router } from "express";
import { createClient, getAllClients, getClient, updateClient, deactivateClient, getProjectsByClient, setClientPassword, loginClient } from "../controllers/clientController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.put("/set-password", setClientPassword)
router.post("/login", loginClient)

router.post("/", requireAuth,  createClient)
router.get("/", requireAuth, getAllClients)
router.get("/:id", requireAuth, getClient)
router.put("/:id", requireAuth, updateClient)
router.delete("/:id", requireAuth, deactivateClient)
router.get("/:id/projects", requireAuth, getProjectsByClient)



export default router