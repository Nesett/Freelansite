import { useEffect, type FormEvent, type ReactNode } from "react"
import { X } from "lucide-react"

type ModalProps = {
    title: string
    onClose: () => void
    onSubmit: (e: FormEvent) => void
    submitLabel: string
    saving?: boolean
    error?: string
    children: ReactNode
}

export default function Modal({title, onClose, onSubmit, submitLabel, saving = false, error, children}: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="newClientModal" onClick={(e) => e.stopPropagation()}>
                <div className="newClientModalTop">
                    <button type="button" onClick={onClose}><X size={16} /></button>
                    <h2>{title}</h2>
                </div>
                <form onSubmit={onSubmit}>
                    {children}
                    {error && <p className="formError">{error}</p>}
                    <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : submitLabel}
                    </button>
                </form>
            </div>
        </div>
    )
}