import { createContext, useContext, useState, type ReactNode } from "react"
import UpgradeModal, { type LimitCode } from "../components/UpgradeModal"

type PlanUsage = {
    plan: 'FREE' | 'PRO'
    clients: { used: number, limit: number | null }
    projects: { used: number, limit: number | null }
}

type UpgradeContextType = {
    openUpgrade: (code?: LimitCode) => void
    checkLimit: (kind: 'clients' | 'projects') => Promise<boolean>
}

const UpgradeContext = createContext<UpgradeContextType | null>(null)

export function UpgradeProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [code, setCode] = useState<LimitCode | undefined>(undefined)

    function openUpgrade(limitCode?: LimitCode) {
        setCode(limitCode)
        setIsOpen(true)
    }

    // returns true if the user may add one more, false (and opens the modal) if not
    async function checkLimit(kind: 'clients' | 'projects'): Promise<boolean> {
        try {
            const res = await fetch('/api/plan', { credentials: 'include' })

            // if the check itself fails, let them through, the backend still enforces the limit
            if (!res.ok) return true

            const usage = await res.json() as PlanUsage
            const { used, limit } = usage[kind]

            if (limit !== null && used >= limit) {
                openUpgrade(kind === 'clients' ? 'PLAN_LIMIT_CLIENTS' : 'PLAN_LIMIT_PROJECTS')
                return false
            }

            return true
        } catch {
            return true
        }
    }

    return (
        <UpgradeContext.Provider value={{ openUpgrade, checkLimit }}>
            {children}
            {isOpen && <UpgradeModal code={code} onClose={() => setIsOpen(false)} />}
        </UpgradeContext.Provider>
    )
}

export function useUpgrade() {
    const context = useContext(UpgradeContext)
    if (!context) {
        throw new Error("useUpgrade must be used inside UpgradeProvider")
    }
    return context
}