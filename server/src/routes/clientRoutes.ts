import { Router } from "express";
import { createClient, getAllClients, getClient, updateClient, deactivateClient, getProjectsByClient, setClientPassword, loginClient } from "../controllers/clientController.js"
import { requireAuth } from '../middleware/authMiddleware.js'
import { authLimiter } from "../middleware/rateLimiter.js"
import { validate } from "../middleware/validate.js"
import { setPasswordSchema, loginSchema } from "../schemas/authSchemas.js"
import { createClientSchema, updateClientSchema } from "../schemas/clientSchemas.js";

const router = Router()

router.put("/set-password", authLimiter, validate(setPasswordSchema), setClientPassword)
router.post("/login", authLimiter, validate(loginSchema), loginClient)

router.post("/", requireAuth, validate(createClientSchema),  createClient)
router.get("/", requireAuth, getAllClients)
router.get("/:id", requireAuth, getClient)
router.put("/:id", requireAuth, validate(updateClientSchema), updateClient)
router.delete("/:id", requireAuth, deactivateClient)
router.get("/:id/projects", requireAuth, getProjectsByClient)



export default router