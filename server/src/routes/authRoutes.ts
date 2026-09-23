import { Router } from "express";
import { signUp , login, logout , mySession } from "../controllers/authController.js"
import { requireAnyAuth } from "../middleware/authMiddleware.js"

const router = Router()

router.post("/signup", signUp)
router.post("/login", login)
router.post("/logout", logout)

router.get('/me', requireAnyAuth, mySession)

export default router