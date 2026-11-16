import { z } from "zod"
import { emailField } from "./authSchemas.js"

const text = (max: number) => z.string().trim().max(max).optional()

const optionalText = (max: number) =>
    z.string().trim().max(max).transform(v => v === '' ? null : v).nullable().optional()

export const lookupClientSchema = z.object({
    email: emailField
})

export const createClientSchema = z.object({
    email: emailField,
    name: text(100),
    companyName: text(100),
    phone: text(30)
})

export const updateClientProfileSchema = z.object({
    name: optionalText(100),
    companyName: optionalText(100),
    phone: optionalText(30),
    address: optionalText(200)
}).refine(d => d.name || d.companyName, {
    message: "Enter at least a name or a company name",
    path: ["name"]
})