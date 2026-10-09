import { Router } from "express";
import { getInvoice, updateInvoice, deactivateInvoice, getAdminInvoices } from "../controllers/invoiceController.js"
import { requireAuth, requireAnyAuth } from '../middleware/authMiddleware.js'

const router = Router()


router.get("/:id", requireAnyAuth, getInvoice)
router.put("/:id", requireAuth, updateInvoice)
router.delete("/:id", requireAuth, deactivateInvoice)
router.get("/", requireAuth, getAdminInvoices)


export default router