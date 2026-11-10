import { Router } from "express";
import { signUp, login, logout, mySession, changePassword, deleteAccount, updateProfile } from "../controllers/authController.js"
import { requireAuth, requireAnyAuth } from "../middleware/authMiddleware.js"
import { authLimiter } from "../middleware/rateLimiter.js"
import { validate } from "../middleware/validate.js"
import { signUpSchema, loginSchema, changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "../schemas/authSchemas.js"

const router = Router()

router.post("/signup", authLimiter, validate(signUpSchema), signUp)
router.post("/login", authLimiter, validate(loginSchema), login)
router.post("/logout", logout)
router.patch('/password', requireAuth, authLimiter, validate(changePasswordSchema), changePassword)
router.delete('/account', requireAuth, authLimiter, validate(deleteAccountSchema), deleteAccount)
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile)

router.get('/me', requireAnyAuth, mySession)

export default router