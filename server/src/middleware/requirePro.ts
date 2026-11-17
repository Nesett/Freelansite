import { Request, Response, NextFunction } from "express"
import type { Admin } from "@prisma/client"
import { isProActive } from "../utils/branding.js"

export function requireProPlan(req: Request, res: Response, next: NextFunction) {
    if (!req.user || !isProActive(req.user as Admin)) {
        return res.status(403).json({ error: "This feature is available on the Pro plan." })
    }

    next()
}
