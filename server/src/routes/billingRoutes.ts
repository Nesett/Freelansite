import { Router } from 'express'
import { createCheckout, createPortal } from '../controllers/billingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/checkout', requireAuth, createCheckout)
router.post('/portal', requireAuth, createPortal)

export default router