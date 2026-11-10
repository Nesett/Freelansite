import { z } from "zod"
import { MilestoneStatus } from "@prisma/client"


const adminStatus = z.enum(MilestoneStatus).exclude(["APPROVED"])

export const createMilestoneSchema = z.object({
    projectId: z.string().min(1),
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().max(5000).nullable().optional(),
    budget: z.coerce.number().nonnegative().nullable().optional(),
    deadline: z.coerce.date().nullable().optional(),
    status: adminStatus.optional(),
    orderIndex: z.coerce.number().int().nonnegative()
})

export const updateMilestoneSchema = z.object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    budget: z.coerce.number().nonnegative().nullable().optional(),
    deadline: z.coerce.date().nullable().optional(),
    status: adminStatus.optional(),
    orderIndex: z.coerce.number().int().nonnegative().optional()
})