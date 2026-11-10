import { Router } from "express";
import { signUp , login, logout , mySession } from "../controllers/authController.js"
import { requireAnyAuth } from "../middleware/authMiddleware.js"
import { authLimiter } from "../middleware/rateLimiter.js"
import { validate } from "../middleware/validate.js"
import { signUpSchema, loginSchema } from "../schemas/authSchemas.js";

const router = Router()

router.post("/signup", authLimiter, validate(signUpSchema), signUp)
router.post("/login", authLimiter, validate(loginSchema), login)
router.post("/logout", logout)

router.get('/me', requireAnyAuth, mySession)

export default router