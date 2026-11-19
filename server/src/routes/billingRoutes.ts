import { Router } from 'express'
import { createCheckout, createPortal, cancelSubscription, resumeSubscription } from '../controllers/billingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/checkout', requireAuth, createCheckout)
router.post('/portal', requireAuth, createPortal)
router.post('/cancel', requireAuth, cancelSubscription)
router.post('/resume', requireAuth, resumeSubscription)

export default router