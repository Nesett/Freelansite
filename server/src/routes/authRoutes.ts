import { Router } from "express";
import { signUp , login, logout , mySession } from "../controllers/authController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

router.post("/signup", signUp)
router.post("/login", login)
router.post("/logout", logout)

router.get('/me', requireAuth, mySession)

export default router