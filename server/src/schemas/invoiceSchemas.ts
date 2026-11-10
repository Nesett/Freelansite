import { z } from "zod"
import { InvoiceStatus } from "@prisma/client"


const itemSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    amount: z.coerce.number().nonnegative(),
    quantity: z.coerce.number().positive().default(1),
    milestoneId: z.string().nullable().optional()
})

const line = z.string().trim().min(1).max(300)

export const createInvoiceSchema = z.object({
    deadline: z.coerce.date(),
    adminName: line,
    adminAddress: line,
    clientName: line,
    clientAddress: line,
    items: z.array(itemSchema).min(1).max(100)
})

export const updateInvoiceSchema = z.object({
    status: z.enum(InvoiceStatus).optional(),
    deadline: z.coerce.date().optional(),
    adminName: line.optional(),
    adminAddress: line.optional(),
    clientName: line.optional(),
    clientAddress: line.optional(),
    items: z.array(itemSchema).min(1).max(100).optional()
})