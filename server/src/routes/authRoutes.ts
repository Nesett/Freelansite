import { Router } from "express";
import { signUp , login, logout , mySession } from "../controllers/authController.js"
import { requireAnyAuth } from "../middleware/authMiddleware.js"
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router()

router.post("/signup", authLimiter, signUp)
router.post("/login", authLimiter, login)
router.post("/logout", logout)

router.get('/me', requireAnyAuth, mySession)

export default router