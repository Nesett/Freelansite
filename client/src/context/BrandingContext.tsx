import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildBrandTheme, themeToCssVars, type LogoStyle } from '../utils/brandTheme'
import { useAuth } from './AuthContext'

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
    const { user } = useAuth()

    const [pageBranding, setPageBranding] = useState<Branding | null>(null)

    const isProAdmin = user?.role === 'admin' && user.plan === 'PRO'
    const ownName = user?.businessName || user?.name || ''
    const ownPrimary = user?.brandPrimary ?? null
    const ownLogoUrl = user?.logoUrl ?? null
    const ownLogoStyle = user?.logoStyle ?? 'WORDMARK'

    const ownBranding = useMemo<Branding | null>(() => {
        if (!isProAdmin) return null

        return { name: ownName, primary: ownPrimary, logoUrl: ownLogoUrl, logoStyle: ownLogoStyle }
    }, [isProAdmin, ownName, ownPrimary, ownLogoUrl, ownLogoStyle])

    const branding = pageBranding ?? ownBranding
    const primary = branding?.primary ?? null


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
        <BrandingContext.Provider value={{ branding, setBranding: setPageBranding }}>
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