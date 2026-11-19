import sharp from "sharp"
import { getSupabase, LOGO_BUCKET } from "../db/supabase.js"

export const LOGO_RULES = {
    maxBytes: 2 * 1024 * 1024,
    minPx: 64,
    maxPx: 4000
}

const STORED_MAX_WIDTH = 1000
const STORED_MAX_HEIGHT = 400

export class LogoError extends Error {}

export async function processLogo(input: Buffer): Promise<Buffer> {
    const metadata = await sharp(input).metadata().catch(() => null)

    if (!metadata) {
        throw new LogoError("This file is not a valid image.")
    }

    if (!metadata.format || !["png", "jpeg", "webp"].includes(metadata.format)) {
        throw new LogoError("Logo must be a PNG, JPG or WebP image.")
    }

    const width = metadata.width ?? 0
    const height = metadata.height ?? 0

    if (width < LOGO_RULES.minPx || height < LOGO_RULES.minPx) {
        throw new LogoError(`Logo must be at least ${LOGO_RULES.minPx} px on each side.`)
    }

    if (width > LOGO_RULES.maxPx || height > LOGO_RULES.maxPx) {
        throw new LogoError(`Logo must be at most ${LOGO_RULES.maxPx} px on each side.`)
    }

    try {
        return await sharp(input)
            .rotate()
            .resize({ width: STORED_MAX_WIDTH, height: STORED_MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer()
    } catch {
        throw new LogoError("This file is not a valid image.")
    }
}

function logoPath(adminId: string) {
    return `${adminId}/logo.webp`
}

export async function saveLogo(adminId: string, image: Buffer): Promise<string> {
    const storage = getSupabase().storage.from(LOGO_BUCKET)

    const { error } = await storage.upload(logoPath(adminId), image, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600"
    })

    if (error) throw error

    const { data } = storage.getPublicUrl(logoPath(adminId))

    return `${data.publicUrl}?v=${Date.now()}`
}

export async function deleteLogoFile(adminId: string): Promise<void> {
    const { error } = await getSupabase().storage.from(LOGO_BUCKET).remove([logoPath(adminId)])

    if (error) throw error
}
