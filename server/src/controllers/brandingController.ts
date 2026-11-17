import { Request, Response } from "express"
import type { Admin } from "@prisma/client"
import db from "../db/db.js"
import { LogoError, processLogo, saveLogo, deleteLogoFile } from "../utils/logoStorage.js"


export async function updateBranding(req: Request, res: Response) {

    const { brandPrimary, logoStyle } = req.body

    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        await db.admin.update({
            where: { id: req.user.id },
            data: { brandPrimary, logoStyle }
        })

        return res.status(200).json({ message: "Branding updated." })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error." })
    }
}

export async function uploadBrandLogo(req: Request, res: Response) {

    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!req.file) {
            return res.status(400).json({ error: "No logo file uploaded." })
        }

        const admin = req.user as Admin
        const image = await processLogo(req.file.buffer)
        const logoUrl = await saveLogo(admin.id, image)

        await db.admin.update({
            where: { id: admin.id },
            data: { logoUrl }
        })

        return res.status(200).json({ logoUrl })

    } catch (err) {
        if (err instanceof LogoError) {
            return res.status(400).json({ error: err.message })
        }

        console.log(err)
        return res.status(500).json({ error: "Internal server error." })
    }
}

export async function deleteBrandLogo(req: Request, res: Response) {

    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        await deleteLogoFile(req.user.id)

        await db.admin.update({
            where: { id: req.user.id },
            data: { logoUrl: null }
        })

        return res.status(200).json({ message: "Logo removed." })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error." })
    }
}
