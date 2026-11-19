import { X, Users, Folder, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"

export type LimitCode = 'PLAN_LIMIT_CLIENTS' | 'PLAN_LIMIT_PROJECTS'

type UpgradeModalProps = {
    code?: LimitCode
    onClose: () => void
}

type Copy = {
    eyebrow: string
    title: string
    text: string
}

const COPY: Record<LimitCode | 'default', Copy> = {
    PLAN_LIMIT_CLIENTS: {
        eyebrow: "Client limit reached",
        title: "Unlock more customers",
        text: "You're using all the active client slots on the Free plan. Delete a client or upgrade to Pro to add more."
    },
    PLAN_LIMIT_PROJECTS: {
        eyebrow: "Project limit reached",
        title: "Unlock unlimited projects",
        text: "You're using all the active project slots on the Free plan. Put a project on hold or upgrade to Pro to keep going."
    },
    default: {
        eyebrow: "Pro plan",
        title: "Unlock Freelansite Pro",
        text: "Unlock more clients, unlimited projects and your own branding."
    }
}

type FeatureId = 'clients' | 'projects' | 'branding'

type Feature = {
    id: FeatureId
    icon: LucideIcon
    title: string
    text: string
}

const FEATURES: Feature[] = [
    {
        id: 'clients',
        icon: Users,
        title: "Up to 15 active clients",
        text: "Room to grow your client list"
    },
    {
        id: 'projects',
        icon: Folder,
        title: "Unlimited projects",
        text: "Never put work on hold again"
    },
    {
        id: 'branding',
        icon: Sparkles,
        title: "White-label branding",
        text: "Your logo and colors on projects and magic links"
    }
]

// the feature that solves the limit the user just hit gets highlighted
const HIGHLIGHTED: Record<LimitCode, FeatureId> = {
    PLAN_LIMIT_CLIENTS: 'clients',
    PLAN_LIMIT_PROJECTS: 'projects'
}

export default function UpgradeModal({ code, onClose }: UpgradeModalProps) {
    const copy = COPY[code ?? 'default']
    const highlighted = code ? HIGHLIGHTED[code] : undefined
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
            <div
                className="upgradeModal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgradeModalTitle"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="upgradeIntro">
                    <button type="button" className="upgradeClose" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>

                    <div className="upgradeHeading">
                        <span className="upgradeEyebrow">{copy.eyebrow}</span>
                        <h2 id="upgradeModalTitle">{copy.title}</h2>
                        <p className="upgradeText">{copy.text}</p>
                        {error && <p className="settingsMessage settingsMessage--error">{error}</p>}
                    </div>
                </div>

                <aside className="upgradeFeatures">
                    <h3>Included with the Pro plan</h3>

                    <ul className="upgradeFeatureList">
                        {FEATURES.map(({ id, icon: Icon, title, text }) => (
                            <li
                                key={id}
                                className={`upgradeFeature${id === highlighted ? ' upgradeFeature--highlight' : ''}`}
                            >
                                <span className="upgradeFeatureIcon"><Icon size={20} /></span>
                                <div className="upgradeFeatureText">
                                    <strong>{title}</strong>
                                    <span>{text}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="upgradeActions">
                    <button type="button" className="upgradeButton upgradeButton--secondary" onClick={onClose}>
                        Maybe later
                    </button>
                    <button type="button" className="upgradeButton upgradeButton--primary" onClick={handleUpgrade} disabled={loading}>
                        {loading ? 'Redirecting...' : 'Upgrade to Pro'}
                    </button>
                </div>
            </div>
        </div>
    )
}