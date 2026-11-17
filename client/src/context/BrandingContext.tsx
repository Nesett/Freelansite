import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { buildBrandTheme, themeToCssVars, type LogoStyle } from '../utils/brandTheme'

export type Branding = {
    name: string
    primary: string | null
    logoUrl: string | null
    logoStyle: LogoStyle
}

type BrandingContextType = {
    branding: Branding | null
    setBranding: (branding: Branding | null) => void
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<Branding | null>(null)
    const primary = branding?.primary ?? null

    // Override the color variables from index.css on <html> so everything
    // (sidebar, topbar, modals, the public page) picks them up. Removed again when branding clears.
    useEffect(() => {
        if (!primary) return

        const vars = themeToCssVars(buildBrandTheme(primary))
        const root = document.documentElement

        Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value))

        return () => {
            Object.keys(vars).forEach(name => root.style.removeProperty(name))
        }
    }, [primary])

    return (
        <BrandingContext.Provider value={{ branding, setBranding }}>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBrandingContext() {
    const context = useContext(BrandingContext)
    if (context === undefined) {
        throw new Error('useBrandingContext must be used within a BrandingProvider')
    }
    return context
}

// Call this in a page that shows another admin's branding (project details, magic link page).
// Pass null/undefined while loading or when the admin has no active branding.
export function useBranding(branding: Branding | null | undefined) {
    const { setBranding } = useBrandingContext()

    const hasBranding = !!branding
    const name = branding?.name ?? ''
    const primary = branding?.primary ?? null
    const logoUrl = branding?.logoUrl ?? null
    const logoStyle = branding?.logoStyle ?? 'WORDMARK'

    useEffect(() => {
        if (!hasBranding) return

        setBranding({ name, primary, logoUrl, logoStyle })

        return () => setBranding(null)
    }, [hasBranding, name, primary, logoUrl, logoStyle, setBranding])
}
