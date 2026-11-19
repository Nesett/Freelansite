import { z } from "zod"
import { checkBrandColor, normalizeHex } from "../utils/brandTheme.js"

const brandColor = z.string().trim()
    .superRefine((value, ctx) => {
        const check = checkBrandColor(value)

        if (!check.ok) {
            ctx.addIssue({ code: "custom", message: check.reason ?? "Invalid color." })
        }
    })
    .transform(value => normalizeHex(value) as string)

export const updateBrandingSchema = z.object({
    // null clears the color (so it goes back to the default Freelansite look)
    brandPrimary: brandColor.nullable().optional(),
    logoStyle: z.enum(["WORDMARK", "SYMBOL"]).optional()
})
