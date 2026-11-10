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

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(72),
    newPassword: newPassword
})

export const deleteAccountSchema = z.object({
    password: z.string().min(1).max(72)
})

const optionalText = (max: number) =>
    z.string().trim().max(max).transform(v => v === '' ? null : v).nullable().optional()

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    businessName: optionalText(100),
    phone: optionalText(30),
    address: optionalText(200)
})