import { z } from "zod"

export const createProjectSchema = z.object({
    clientId: z.string().min(1),
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().max(5000).optional(),
    budget: z.coerce.number().nonnegative().nullable().optional(),
    notes: z.string().trim().max(5000).optional()
})

export const updateProjectSchema = z.object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(5000).optional(),
    isOnHold: z.boolean().optional()
})

export const createMagicLinkSchema = z.object({
    expiresAt: z.coerce.date().refine(d => d > new Date(), "Expiry must be in the future")
})