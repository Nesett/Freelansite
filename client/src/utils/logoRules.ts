// Keep these in sync with the server-side limits.
export const LOGO_RULES = {
    maxBytes: 2 * 1024 * 1024,
    minPx: 64,
    maxPx: 4000,
    types: ['image/png', 'image/jpeg', 'image/webp']
}

function readImageSize(file: File): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()

        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Could not read this image.'))
        }

        img.src = url
    })
}

// Returns an error message, or null if the file looks fine.
// The server checks again, this is only for fast feedback.
export async function checkLogoFile(file: File): Promise<string | null> {
    if (!LOGO_RULES.types.includes(file.type)) {
        return 'Logo must be a PNG, JPG or WebP image.'
    }

    if (file.size > LOGO_RULES.maxBytes) {
        return 'Logo must be 2 MB or smaller.'
    }

    try {
        const { width, height } = await readImageSize(file)

        if (width < LOGO_RULES.minPx || height < LOGO_RULES.minPx) {
            return `Logo must be at least ${LOGO_RULES.minPx} px on each side.`
        }

        if (width > LOGO_RULES.maxPx || height > LOGO_RULES.maxPx) {
            return `Logo must be at most ${LOGO_RULES.maxPx} px on each side.`
        }
    } catch (err) {
        return err instanceof Error ? err.message : 'Could not read this image.'
    }

    return null
}
