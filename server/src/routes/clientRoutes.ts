import { Router } from "express";
import { createClient, getAllClients, getClient} from "../controllers/clientController.js"
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.post("/", createClient)
router.get("/", getAllClients)
router.get("/:id", getClient)


export default router