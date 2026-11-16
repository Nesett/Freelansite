import { Router } from "express";
import { lookupClient, createClient, getAllClients, getClient, updateMyProfile, deactivateClient, getProjectsByClient, setClientPassword, loginClient } from "../controllers/clientController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'
import { authLimiter } from "../middleware/rateLimiter.js"
import { validate } from "../middleware/validate.js"
import { setPasswordSchema, loginSchema } from "../schemas/authSchemas.js"
import { lookupClientSchema, createClientSchema, updateClientProfileSchema } from "../schemas/clientSchemas.js"

const router = Router()

router.put("/set-password", authLimiter, validate(setPasswordSchema), setClientPassword)
router.post("/login", authLimiter, validate(loginSchema), loginClient)

// client editing their own data (must stay above "/:id")
router.patch("/me", requireAnyAuth, validate(updateClientProfileSchema), updateMyProfile)

router.post("/lookup", requireAuth, validate(lookupClientSchema), lookupClient)
router.post("/", requireAuth, validate(createClientSchema), createClient)
router.get("/", requireAuth, getAllClients)
router.get("/:id", requireAuth, getClient)
router.delete("/:id", requireAuth, deactivateClient)
router.get("/:id/projects", requireAuth, getProjectsByClient)



export default router