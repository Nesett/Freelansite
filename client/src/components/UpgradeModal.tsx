import { useEffect } from "react"
import { X, Sparkles, Check } from "lucide-react"

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    function handleUpgrade() {
        // TODO: idk yet
    }

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="newClientModal" onClick={(e) => e.stopPropagation()}>
                <div className="newClientModalTop">
                    <button type="button" onClick={onClose}><X size={16} /></button>
                    <h2>{copy.title}</h2>
                </div>

                <div className="upgradeModalBody">
                    <div className="upgradeModalIcon">
                        <Sparkles size={22} />
                    </div>
                    <p className="upgradeModalText">{copy.text}</p>

                    <ul className="upgradeBenefits">
                        <li><Check size={16} /> Up to 15 active clients</li>
                        <li><Check size={16} /> Unlimited active projects</li>
                        <li><Check size={16} /> White-label branding on projects and magic links</li>
                    </ul>

                    <button type="button" className="upgradeButton" onClick={handleUpgrade}>
                        Upgrade to Pro
                    </button>
                    <button type="button" className="upgradeLaterButton" onClick={onClose}>
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    )
}