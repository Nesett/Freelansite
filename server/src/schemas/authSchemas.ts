import { z } from "zod"

export const emailField = z.string().trim().toLowerCase().pipe(z.email())

const newPassword = z.string().min(8, "Password must be at least 8 characters").max(72)

export const signUpSchema = z.object({
    email: emailField,
    password: newPassword,
    name: z.string().trim().min(1).max(100),
    businessName: z.string().trim().max(100).nullable().optional()
})

export const loginSchema = z.object({
    email: emailField,
    password: z.string().min(1).max(72)
})

export const setPasswordSchema = z.object({
    token: z.string().min(1),
    password: newPassword
})