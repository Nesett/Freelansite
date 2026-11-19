import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUpgrade } from '../context/UpgradeContext'
import { useToast } from '../context/ToastContext'

type Stage = 'email' | 'confirm' | 'details'

interface LookupResult {
    exists: boolean
    alreadyAdded?: boolean
    displayName?: string | null
}

interface NewClientModalProps {
    onClose: () => void
}

export default function NewClientModal({ onClose }: NewClientModalProps) {
    const [stage, setStage] = useState<Stage>('email')
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [phone, setPhone] = useState('')
    const [existing, setExisting] = useState<LookupResult | null>(null)

    const { showError } = useToast()
    const { openUpgrade } = useUpgrade()
    const navigate = useNavigate()

    function reportError(err: unknown) {
        showError(err instanceof Error ? err.message : 'An unexpected error occured.')
    }

    // stage 1 -> does this email already belong to a client?
    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/clients/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            setExisting(data)

            if (data.exists) {
                setStage('confirm')
            } else {
                setStage('details')
            }

        } catch (err: unknown) {
            reportError(err)
        } finally {
            setLoading(false)
        }
    }

    // stage 2 -> create the client (existing: link only, new: with details)
    async function createClient(body: Record<string, string>) {
        setLoading(true)

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            })

            const data = await response.json()

            if (response.status === 402) {
                onClose()
                openUpgrade(data.code)
                return
            }

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            navigate(`/clients/${data.user.id}`)

        } catch (err: unknown) {
            reportError(err)
        } finally {
            setLoading(false)
        }
    }

    function handleConfirmExisting() {
        createClient({ email })
    }

    function handleDetailsSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!name.trim() && !companyName.trim()) {
            showError('Enter at least a name or a company name.')
            return
        }

        createClient({ email, name, companyName, phone })
    }

    function goBackToEmail() {
        setExisting(null)
        setStage('email')
    }

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="newClientModal" onClick={(e) => e.stopPropagation()}>
                <div className="newClientModalTop">
                    <button type="button" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                    <h2>Add new client</h2>
                </div>

                {stage === 'email' && (
                    <form onSubmit={handleEmailSubmit}>
                        <label htmlFor="email">Client email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Checking...' : 'Continue'}
                        </button>
                    </form>
                )}

                {stage === 'confirm' && existing && (
                    <div>
                        {existing.alreadyAdded ? (
                            <p>
                                <strong>{existing.displayName || email}</strong> is already in your clients.
                            </p>
                        ) : (
                            <p>
                                Add <strong>{existing.displayName || email}</strong> ({email}) as your client?
                            </p>
                        )}
                        <button type="button" onClick={goBackToEmail} disabled={loading}>
                            Back
                        </button>
                        {!existing.alreadyAdded && (
                            <button type="button" onClick={handleConfirmExisting} disabled={loading}>
                                {loading ? 'Adding...' : 'Add client'}
                            </button>
                        )}
                    </div>
                )}

                {stage === 'details' && (
                    <form onSubmit={handleDetailsSubmit}>
                        <p>{email} isn't on Freelansite yet. Add their details and we'll invite them.</p>

                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                        <label htmlFor="companyName">Company Name</label>
                        <input
                            id="companyName"
                            name="companyName"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                        <label htmlFor="phoneNr">Phone Number</label>
                        <input
                            id="phoneNr"
                            name="phoneNr"
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <button type="button" onClick={goBackToEmail} disabled={loading}>
                            Back
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add and invite new client'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}