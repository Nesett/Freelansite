import { Router } from "express";
import { createClient, getAllClients, getClient, updateClient, deactivateClient, getProjectsByClient, setClientPassword, loginClient } from "../controllers/clientController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post("/", createClient)
router.get("/", getAllClients)
router.get("/:id", getClient)
router.put("/:id", updateClient)
router.delete("/:id", deactivateClient)
router.get("/:id/projects", getProjectsByClient)
router.put("/:id/set-password", setClientPassword)
router.post("/login", loginClient)


export default router