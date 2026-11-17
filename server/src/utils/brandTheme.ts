//this page was done with AI, as i had no clue how to approach colors. I leave all the comments so that i can understand it later.
export type LogoStyle = 'WORDMARK' | 'SYMBOL'

export type BrandTheme = {
    primary: string
    accent: string
    bg: string
    border: string
    input: string
}

type Rgb = { r: number, g: number, b: number }
type Hsv = { h: number, s: number, v: number }

// Text in the brand color must stay readable on the tinted page background (WCAG AA for normal text).
export const MIN_CONTRAST = 4.5

// Below this HSV saturation the brand color is treated as a grey: its hue is meaningless,
// so we skip the hue-based tints and fall back to neutral ones.
const GREY_SATURATION = 0.12

const HEX_PATTERN = /^#?([0-9a-f]{6})$/i

// '0f7734' / '#0F7734' -> '#0F7734', anything else -> null
export function normalizeHex(input: string): string | null {
    const match = HEX_PATTERN.exec(input.trim())
    return match ? `#${match[1].toUpperCase()}` : null
}

function hexToRgb(hex: string): Rgb {
    const n = parseInt(hex.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex({ r, g, b }: Rgb): string {
    const part = (c: number) => Math.round(c).toString(16).padStart(2, '0')
    return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
    const rn = r / 255
    const gn = g / 255
    const bn = b / 255
    const max = Math.max(rn, gn, bn)
    const min = Math.min(rn, gn, bn)
    const delta = max - min

    let h = 0
    if (delta !== 0) {
        if (max === rn) h = ((gn - bn) / delta) % 6
        else if (max === gn) h = (bn - rn) / delta + 2
        else h = (rn - gn) / delta + 4
        h *= 60
        if (h < 0) h += 360
    }

    return { h, s: max === 0 ? 0 : delta / max, v: max }
}

function hsvToHex({ h, s, v }: Hsv): string {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    const sectors = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]]
    const [r, g, b] = sectors[Math.floor(h / 60) % 6]

    return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 })
}

function channelLuminance(value: number): number {
    const s = value / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex)
    return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
    const a = relativeLuminance(hexA)
    const b = relativeLuminance(hexB)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// Everything on the page is derived from one brand color.
// The accent is the brand's hue at 20% saturation / 100% brightness (HSV, like a color picker),
// e.g. 0F7734 -> CCFFDE. Background, borders and inputs are the same hue, barely tinted:
// 2% saturation at ~97% brightness, so every background channel stays F2-F7 (like the default F7F4F2).
export function buildBrandTheme(primaryHex: string): BrandTheme {
    const primary = normalizeHex(primaryHex) ?? '#1D3557'
    const { h, s } = rgbToHsv(hexToRgb(primary))

    if (s < GREY_SATURATION) {
        return { primary, accent: '#EBEBEB', bg: '#F7F4F2', border: '#E7E5E5', input: '#F2F1F1' }
    }

    return {
        primary,
        accent: hsvToHex({ h, s: 0.20, v: 1 }),
        bg: hsvToHex({ h, s: 0.02, v: 0.97 }),
        border: hsvToHex({ h, s: 0.03, v: 0.925 }),
        input: hsvToHex({ h, s: 0.02, v: 0.96 })
    }
}

// CSS variables that override the defaults in index.css
export function themeToCssVars(theme: BrandTheme): Record<string, string> {
    return {
        '--primary-color': theme.primary,
        '--text-color': theme.primary,
        '--accent-color': theme.accent,
        //'--bg-color': theme.bg,
        '--border-color': theme.border,
        '--input-color': theme.input,
        '--progress-color': theme.primary
    }
}

export function checkBrandColor(input: string): { ok: boolean, reason: string | null } {
    const hex = normalizeHex(input)

    if (!hex) {
        return { ok: false, reason: 'Enter a valid hex color, like #0F7734.' }
    }

    if (contrastRatio(hex, buildBrandTheme(hex).bg) < MIN_CONTRAST) {
        return { ok: false, reason: 'This color is too light, text in it would be hard to read. Pick a darker shade.' }
    }

    return { ok: true, reason: null }
}

// Darkens the color (same hue and saturation) until it passes checkBrandColor
export function makeReadable(input: string): string {
    const hex = normalizeHex(input)
    if (!hex) return input

    const { h, s, v } = rgbToHsv(hexToRgb(hex))

    for (let value = v; value > 0; value -= 0.01) {
        const candidate = hsvToHex({ h, s, v: value })
        if (checkBrandColor(candidate).ok) return candidate
    }

    return '#000000'
}