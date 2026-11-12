import { Router } from "express";
import { getInvoice, updateInvoice, deactivateInvoice, getUserInvoices } from "../controllers/invoiceController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'
import { validate } from "../middleware/validate.js"
import { updateInvoiceSchema } from "../schemas/invoiceSchemas.js"

const router = Router()


router.get("/:id", requireAnyAuth, getInvoice)
router.put("/:id", requireAuth, validate(updateInvoiceSchema), updateInvoice)
router.delete("/:id", requireAuth, deactivateInvoice)
router.get("/", requireAnyAuth, getUserInvoices)


export default router