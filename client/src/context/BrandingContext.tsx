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
    setPageBranding: (branding: Branding | null) => void
    setOwnBranding: (branding: Branding | null) => void
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [pageBranding, setPageBranding] = useState<Branding | null>(null)
    const [ownBranding, setOwnBranding] = useState<Branding | null>(null)

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
        <BrandingContext.Provider value={{ branding, setPageBranding, setOwnBranding }}>
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

function useRegisterBranding(branding: Branding | null | undefined, setter: (branding: Branding | null) => void) {
    const hasBranding = !!branding
    const name = branding?.name ?? ''
    const primary = branding?.primary ?? null
    const logoUrl = branding?.logoUrl ?? null
    const logoStyle = branding?.logoStyle ?? 'WORDMARK'

    useEffect(() => {
        if (!hasBranding) return

        setter({ name, primary, logoUrl, logoStyle })

        return () => setter(null)
    }, [hasBranding, name, primary, logoUrl, logoStyle, setter])
}

export function useBranding(branding: Branding | null | undefined) {
    const { setPageBranding } = useBrandingContext()
    useRegisterBranding(branding, setPageBranding)
}

export function useOwnBranding() {
    const { user } = useAuth()
    const { setOwnBranding } = useBrandingContext()

    const isProAdmin = user?.role === 'admin' && user.plan === 'PRO'
    const name = user?.businessName || user?.name || ''
    const primary = user?.brandPrimary ?? null
    const logoUrl = user?.logoUrl ?? null
    const logoStyle = user?.logoStyle ?? 'WORDMARK'

    const ownBranding = useMemo<Branding | null>(() => {
        if (!isProAdmin) return null

        return { name, primary, logoUrl, logoStyle }
    }, [isProAdmin, name, primary, logoUrl, logoStyle])

    useRegisterBranding(ownBranding, setOwnBranding)
}