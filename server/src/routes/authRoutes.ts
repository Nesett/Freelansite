import { Router } from "express";
import { signUp , login, logout } from "../controllers/authController.js"

const router = Router()

router.post("/signup", signUp)
router.post("/login", login)
router.post("/logout", logout)