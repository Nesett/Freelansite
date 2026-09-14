import { Router } from "express";
import { createClient, getAllClients, getClient, updateClient, deactivateClient } from "../controllers/clientController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post("/", createClient)
router.get("/", getAllClients)
router.get("/:id", getClient)
router.put("/:id", updateClient)
router.delete("./:id", deactivateClient)


export default router