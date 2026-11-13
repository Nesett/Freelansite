import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

type Label = { path: string, text: string } | null

type BreadcrumbContextType = {
    label: Label
    setLabel: (label: Label) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [label, setLabel] = useState<Label>(null)

    return (
        <BreadcrumbContext.Provider value={{ label, setLabel }}>
            {children}
        </BreadcrumbContext.Provider>
    )
}

export function useBreadcrumbContext() {
    const context = useContext(BreadcrumbContext)
    if (context === undefined) {
        throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider')
    }
    return context
}

// Call this in a detail page with the name to show as the last crumb.
// Pass null/undefined while the data is still loading.
export function useBreadcrumbLabel(text: string | null | undefined) {
    const { setLabel } = useBreadcrumbContext()
    const { pathname } = useLocation()

    useEffect(() => {
        if (!text) return

        setLabel({ path: pathname, text })

        return () => setLabel(null)
    }, [text, pathname, setLabel])
}