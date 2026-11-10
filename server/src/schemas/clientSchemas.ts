import { z } from "zod"
import { emailField } from "./authSchemas.js"

const text = (max: number) => z.string().trim().max(max).optional()

export const createClientSchema = z.object({
    name: text(100),
    companyName: text(100),
    email: emailField,
    phone: text(30)
}).refine(d => d.name || d.companyName, {
    message: "Enter at least a name or a company name",
    path: ["name"]
})

export const updateClientSchema = z.object({
    name: text(100),
    companyName: text(100),
    email: emailField.optional(),
    phone: text(30)
})