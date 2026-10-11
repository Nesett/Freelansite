import { useState, type FormEvent } from "react"
import Modal from "./Modal"

type MagicLinkFormModalProps = {
    projectId: string
    onClose: () => void
    onSaved: (data: unknown) => void
}

export default function MagicLinkFormModal({ projectId, onClose, onSaved}: MagicLinkFormModalProps) {

    const [expiresAt, setExpiresAt] = useState<string>("")
    const [saving, setSaving] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const res = await fetch(`/api/projects/${projectId}/magic-links`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ expiresAt })
            })

            if (!res.ok) {
                throw new Error("Failed to create magic link")
            }

            onSaved(await res.json())
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An unexpected error occured.")
                console.error("error:", err)
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            title="Create magic link"
            submitLabel="Create"
            onClose={onClose}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
        >
            <label htmlFor="expiresAt">Expiration date</label>
            <input
                id="expiresAt"
                name="expiresAt"
                type="date"
                min={tomorrow}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
            />
        </Modal>
    )
}