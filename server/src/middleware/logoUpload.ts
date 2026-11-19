import { Request, Response, NextFunction } from "express"
import multer from "multer"
import { LOGO_RULES } from "../utils/logoStorage.js"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LOGO_RULES.maxBytes, files: 1 }
})

export function receiveLogo(req: Request, res: Response, next: NextFunction) {
    upload.single("logo")(req, res, (err: unknown) => {
        if (!err) return next()

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "Logo must be 2 MB or smaller." })
        }

        return res.status(400).json({ error: "Could not read the uploaded file." })
    })
}
