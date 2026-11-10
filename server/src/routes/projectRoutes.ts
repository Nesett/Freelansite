import { Router } from "express";
import { createProject, getAllProjects, getProject, updateProject, deactivateProject, createMagicLink, getMagicLink, deleteMagicLink } from "../controllers/projectController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'
import { createInvoice, getAllInvoices } from "../controllers/invoiceController.js";
import { validate } from "../middleware/validate.js"
import { createProjectSchema, updateProjectSchema, createMagicLinkSchema } from "../schemas/projectSchemas.js"
import { createInvoiceSchema } from "../schemas/invoiceSchemas.js"

const router = Router()

router.post("/", requireAuth, validate(createProjectSchema), createProject)
router.get("/", requireAnyAuth, getAllProjects)
router.get("/:id", requireAnyAuth, getProject)
router.put("/:id", requireAuth, validate(updateProjectSchema), updateProject)
router.delete("/:id", requireAuth, deactivateProject)
router.post("/:id/invoices", requireAuth, validate(createInvoiceSchema), createInvoice)
router.get("/:id/invoices", requireAnyAuth, getAllInvoices)
router.post("/:id/magic-links", requireAuth, validate(createMagicLinkSchema), createMagicLink)
router.get("/:id/magic-links", requireAuth, getMagicLink)
router.delete("/:id/magic-links", requireAuth, deleteMagicLink)



export default router