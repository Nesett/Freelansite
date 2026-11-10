import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Status = { type: 'success' | 'error', message: string } | null

async function request(url: string, method: string, body?: object) {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.details?.[0]?.message || data.error || 'Something went wrong')
    }

    return data
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'An unexpected error occurred.'
}

function StatusMessage({ status }: { status: Status }) {
    if (!status) return null

    return (
        <p className={`settingsMessage settingsMessage--${status.type}`}>
            {status.message}
        </p>
    )
}

export default function Settings() {
    const { user, setUser, refreshUser } = useAuth()
    const navigate = useNavigate()

    // profile
    const [name, setName] = useState(user?.name ?? '')
    const [businessName, setBusinessName] = useState(user?.businessName ?? '')
    const [phone, setPhone] = useState(user?.phone ?? '')
    const [address, setAddress] = useState(user?.address ?? '')
    const [profileStatus, setProfileStatus] = useState<Status>(null)

    // password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordStatus, setPasswordStatus] = useState<Status>(null)

    // delete account
    const [showDelete, setShowDelete] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteStatus, setDeleteStatus] = useState<Status>(null)

    async function handleProfileSubmit(e: FormEvent) {
        e.preventDefault()
        setProfileStatus(null)

        try {
            await request('/api/auth/profile', 'PATCH', { name, businessName, phone, address })
            await refreshUser()
            setProfileStatus({ type: 'success', message: 'Profile updated.' })
        } catch (err) {
            setProfileStatus({ type: 'error', message: getErrorMessage(err) })
        }
    }

    async function handlePasswordSubmit(e: FormEvent) {
        e.preventDefault()
        setPasswordStatus(null)

        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', message: 'New passwords do not match.' })
            return
        }

        try {
            await request('/api/auth/password', 'PATCH', { currentPassword, newPassword })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordStatus({ type: 'success', message: 'Password updated.' })
        } catch (err) {
            setPasswordStatus({ type: 'error', message: getErrorMessage(err) })
        }
    }

    async function handleDeleteSubmit(e: FormEvent) {
        e.preventDefault()
        setDeleteStatus(null)

        try {
            await request('/api/auth/account', 'DELETE', { password: deletePassword })
            navigate('/', { replace: true })
            setUser(null)
        } catch (err) {
            setDeleteStatus({ type: 'error', message: getErrorMessage(err) })
        }
    }

    async function handleLogout() {
        try {
            await request('/api/auth/logout', 'POST')
        } finally {
            navigate('/login', { replace: true })
            setUser(null)
        }
    }

    return (
        <div className="pageContent">
            <div className="clientsHeader">
                <div>
                    <h1>Settings</h1>
                    <p className="clientsSubtitle">Manage your account and business details.</p>
                </div>
                <button type="button" className="settingsButton settingsButton--secondary" onClick={handleLogout}>
                    <LogOut size={16} />
                    Log out
                </button>
            </div>

            <div className="settingsSections">

                <section className="settingsCard">
                    <h2>Profile</h2>
                    <p className="settingsCardDescription">
                        This information appears on your invoices and client portal.
                    </p>

                    <form className="settingsForm" onSubmit={handleProfileSubmit}>
                        <label className="settingsField">
                            Email
                            <input type="email" value={user?.email ?? ''} disabled />
                        </label>
                        <label className="settingsField">
                            Name
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>
                        <label className="settingsField">
                            Business name
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                            />
                        </label>
                        <label className="settingsField">
                            Phone
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </label>
                        <label className="settingsField">
                            Address
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </label>

                        <StatusMessage status={profileStatus} />

                        <div className="settingsActions">
                            <button type="submit" className="settingsButton">Save changes</button>
                        </div>
                    </form>
                </section>

                <section className="settingsCard">
                    <h2>Password</h2>
                    <p className="settingsCardDescription">Use at least 8 characters.</p>

                    <form className="settingsForm" onSubmit={handlePasswordSubmit}>
                        <label className="settingsField">
                            Current password
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </label>
                        <label className="settingsField">
                            New password
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </label>
                        <label className="settingsField">
                            Confirm new password
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </label>

                        <StatusMessage status={passwordStatus} />

                        <div className="settingsActions">
                            <button type="submit" className="settingsButton">Update password</button>
                        </div>
                    </form>
                </section>

                <section className="settingsCard settingsCard--danger">
                    <h2>Delete account</h2>
                    <p className="settingsCardDescription">
                        This permanently deletes your account along with all your clients, projects,
                        milestones, invoices, and shared links. Your clients will lose access
                        immediately. This cannot be undone.
                    </p>

                    {!showDelete ? (
                        <div className="settingsActions">
                            <button
                                type="button"
                                className="settingsButton settingsButton--danger"
                                onClick={() => setShowDelete(true)}
                            >
                                Delete my account
                            </button>
                        </div>
                    ) : (
                        <form className="settingsForm" onSubmit={handleDeleteSubmit}>
                            <label className="settingsField">
                                Enter your password to confirm
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                />
                            </label>

                            <StatusMessage status={deleteStatus} />

                            <div className="settingsActions">
                                <button type="submit" className="settingsButton settingsButton--danger">
                                    Permanently delete
                                </button>
                                <button
                                    type="button"
                                    className="settingsButton settingsButton--secondary"
                                    onClick={() => {
                                        setShowDelete(false)
                                        setDeletePassword('')
                                        setDeleteStatus(null)
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </section>

            </div>
        </div>
    )
}