import { Router } from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { requireProPlan } from "../middleware/requirePro.js"
import { receiveLogo } from "../middleware/logoUpload.js"
import { validate } from "../middleware/validate.js"
import { updateBrandingSchema } from "../schemas/brandingSchemas.js"
import { updateBranding, uploadBrandLogo, deleteBrandLogo } from "../controllers/brandingController.js"

const router = Router()

router.patch("/", requireAuth, requireProPlan, validate(updateBrandingSchema), updateBranding)
router.put("/logo", requireAuth, requireProPlan, receiveLogo, uploadBrandLogo)
router.delete("/logo", requireAuth, requireProPlan, deleteBrandLogo)

export default router