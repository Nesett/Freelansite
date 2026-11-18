import { X, Check } from "lucide-react"
import { useEffect, useState } from "react"

export type LimitCode = 'PLAN_LIMIT_CLIENTS' | 'PLAN_LIMIT_PROJECTS'

type UpgradeModalProps = {
    code?: LimitCode
    onClose: () => void
}

const COPY: Record<LimitCode | 'default', { title: string, text: string }> = {
    PLAN_LIMIT_CLIENTS: {
        title: "Client limit reached",
        text: "You're using all the active client slots on the Free plan. Delete a client or upgrade to Pro to add more."
    },
    PLAN_LIMIT_PROJECTS: {
        title: "Project limit reached",
        text: "You're using all the active project slots on the Free plan. Put a project on hold or upgrade to Pro to keep going."
    },
    default: {
        title: "Upgrade to Pro",
        text: "Unlock more clients, unlimited projects and your own branding."
    }
}

export default function UpgradeModal({ code, onClose }: UpgradeModalProps) {
    const copy = COPY[code ?? 'default']
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    async function handleUpgrade() {
        setError(null)
        setLoading(true)

        try {
            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Something went wrong')
            }

            window.location.href = data.url
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
            setLoading(false)
        }
    }

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="newClientModal" onClick={(e) => e.stopPropagation()}>
                <div className="newClientModalTop">
                    <button type="button" onClick={onClose}><X size={16} /></button>
                    <h2>{copy.title}</h2>
                </div>

                <div className="upgradeModalBody">
                    <p className="upgradeModalText">{copy.text}</p>

                    <ul className="upgradeBenefits">
                        <li><Check size={16} /> Up to 15 active clients</li>
                        <li><Check size={16} /> Unlimited active projects</li>
                        <li><Check size={16} /> White-label branding on projects and magic links</li>
                    </ul>

                    {error && <p className="settingsMessage settingsMessage--error">{error}</p>}
                    <button type="button" className="upgradeButton" onClick={handleUpgrade} disabled={loading}>
                        {loading ? 'Redirecting...' : 'Upgrade to Pro'}
                    </button>
                    <button type="button" className="upgradeLaterButton" onClick={onClose}>
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    )
}