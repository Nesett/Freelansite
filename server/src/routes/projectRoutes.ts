import { Router } from "express";
import { createProject, getAllProjects, getProject, updateProject, deactivateProject, createMagicLink, getMagicLink, deleteMagicLink } from "../controllers/projectController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'
import { createInvoice, getAllInvoices } from "../controllers/invoiceController.js";

const router = Router()

router.post("/", requireAuth, createProject)
router.get("/", requireAnyAuth, getAllProjects)
router.get("/:id", requireAnyAuth, getProject)
router.put("/:id", requireAuth, updateProject)
router.delete("/:id", requireAuth, deactivateProject)
router.post("/:id/invoices", requireAuth, createInvoice)
router.get("/:id/invoices", requireAnyAuth, getAllInvoices)
router.post("/:id/magic-links", requireAuth, createMagicLink)
router.get("/:id/magic-links", requireAuth, getMagicLink)
router.delete("/:id/magic-links/:id", requireAuth, deleteMagicLink)



export default router