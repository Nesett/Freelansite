import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, LogOut, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../context/UpgradeContext'
import StatusBar from '../components/StatusBar'
import { buildBrandTheme, checkBrandColor, makeReadable, normalizeHex, themeToCssVars, type LogoStyle } from '../utils/brandTheme'
import { LOGO_RULES, checkLogoFile } from '../utils/logoRules'

type Status = { type: 'success' | 'error', message: string } | null
type SettingsTab = 'profile' | 'subscription' | 'security'

async function request(url: string, method: string, body?: object) {
    const isForm = body instanceof FormData

    const response = await fetch(url, {
        method,
        headers: isForm ? undefined : { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: !body ? undefined : isForm ? body : JSON.stringify(body)
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
    const { openUpgrade } = useUpgrade()

    const isClient = user?.role === 'client'

    // tabs (clients have no plan or branding, so they only get Profile and Security)
    const tabs: { id: SettingsTab, label: string }[] = [
        { id: 'profile', label: 'Profile' },
        ...(isClient ? [] : [{ id: 'subscription' as const, label: 'Subscription' }]),
        { id: 'security', label: 'Security' }
    ]
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

    // profile (admins have a business name, clients have a company name)
    const [name, setName] = useState(user?.name ?? '')
    const [company, setCompany] = useState((isClient ? user?.companyName : user?.businessName) ?? '')
    const [phone, setPhone] = useState(user?.phone ?? '')
    const [address, setAddress] = useState(user?.address ?? '')
    const [profileStatus, setProfileStatus] = useState<Status>(null)

    // branding (pro plan)
    const isPro = user?.plan === 'PRO'
    const [brandColor, setBrandColor] = useState(user?.brandPrimary ?? '')
    const [logoStyle, setLogoStyle] = useState<LogoStyle>(user?.logoStyle ?? 'WORDMARK')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null)
    const [logoRemoved, setLogoRemoved] = useState(false)
    const [brandingSaving, setBrandingSaving] = useState(false)
    const [brandingStatus, setBrandingStatus] = useState<Status>(null)
    const logoInputRef = useRef<HTMLInputElement | null>(null)
    const blobUrlRef = useRef<string | null>(null)

    // password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordStatus, setPasswordStatus] = useState<Status>(null)

    // delete account
    const [showDelete, setShowDelete] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteStatus, setDeleteStatus] = useState<Status>(null)

    // plan
    const [showCancel, setShowCancel] = useState(false)
    const [planSaving, setPlanSaving] = useState(false)
    const [planStatus, setPlanStatus] = useState<Status>(null)

    const periodEnd = user?.currentPeriodEnd
        ? new Date(user.currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : null

    async function handlePlanChange(action: 'cancel' | 'resume') {
        setPlanStatus(null)
        setPlanSaving(true)

        try {
            await request(`/api/billing/${action}`, 'POST')
            await refreshUser()
            setShowCancel(false)
            setPlanStatus({
                type: 'success',
                message: action === 'cancel'
                    ? `Subscription cancelled. You keep Pro until ${periodEnd ?? 'the end of your billing period'}.`
                    : 'Subscription resumed. Welcome back!'
            })
        } catch (err) {
            setPlanStatus({ type: 'error', message: getErrorMessage(err) })
        } finally {
            setPlanSaving(false)
        }
    }

    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
        }
    }, [])

    // derived branding values
    const normalizedColor = normalizeHex(brandColor)
    const colorProblem = brandColor.trim() === '' ? null : checkBrandColor(brandColor).reason
    const displayLogo = logoBlobUrl ?? (logoRemoved ? null : user?.logoUrl ?? null)
    const previewVars = normalizedColor
        ? themeToCssVars(buildBrandTheme(normalizedColor)) as CSSProperties
        : undefined

    async function handleProfileSubmit(e: FormEvent) {
        e.preventDefault()
        setProfileStatus(null)

        try {
            if (isClient) {
                await request('/api/clients/me', 'PATCH', { name, companyName: company, phone, address })
            } else {
                await request('/api/auth/profile', 'PATCH', { name, businessName: company, phone, address })
            }

            await refreshUser()
            setProfileStatus({ type: 'success', message: 'Profile updated.' })
        } catch (err) {
            setProfileStatus({ type: 'error', message: getErrorMessage(err) })
        }
    }

    function selectLogoFile(file: File | null) {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)

        blobUrlRef.current = file ? URL.createObjectURL(file) : null
        setLogoFile(file)
        setLogoBlobUrl(blobUrlRef.current)
    }

    async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ''

        if (!file) return

        const problem = await checkLogoFile(file)

        if (problem) {
            setBrandingStatus({ type: 'error', message: problem })
            return
        }

        setBrandingStatus(null)
        setLogoRemoved(false)
        selectLogoFile(file)
    }

    function handleLogoRemove() {
        selectLogoFile(null)
        setLogoRemoved(true)
    }

    async function handleBrandingSubmit(e: FormEvent) {
        e.preventDefault()
        setBrandingStatus(null)

        if (!isPro || colorProblem) return

        setBrandingSaving(true)

        try {
            await request('/api/branding', 'PATCH', { brandPrimary: normalizedColor, logoStyle })

            if (logoFile) {
                const body = new FormData()
                body.append('logo', logoFile)
                await request('/api/branding/logo', 'PUT', body)
            } else if (logoRemoved) {
                await request('/api/branding/logo', 'DELETE')
            }

            await refreshUser()
            selectLogoFile(null)
            setLogoRemoved(false)
            setBrandColor(normalizedColor ?? '')
            setBrandingStatus({ type: 'success', message: 'Branding updated.' })
        } catch (err) {
            setBrandingStatus({ type: 'error', message: getErrorMessage(err) })
        } finally {
            setBrandingSaving(false)
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
                    <p className="clientsSubtitle">
                        {isClient
                            ? 'Manage your account details.'
                            : 'Manage your account and business details.'}
                    </p>
                </div>
                <button type="button" className="settingsButton settingsButton--secondary" onClick={handleLogout}>
                    <LogOut size={16} />
                    Log out
                </button>
            </div>

            <div className="settingsTabs" role="tablist" aria-label="Settings sections">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`settings-tab-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`settings-panel-${tab.id}`}
                        className={`settingsTab${activeTab === tab.id ? ' settingsTab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                className="settingsSections"
                role="tabpanel"
                id={`settings-panel-${activeTab}`}
                aria-labelledby={`settings-tab-${activeTab}`}
            >

                {activeTab === 'profile' && (
                    <section className="settingsCard">
                        <h2>Profile details</h2>
                        <p className="settingsCardDescription">
                            {isClient
                                ? 'This information is shown to the freelancers you work with.'
                                : 'This information appears on your invoices and client portal.'}
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
                                    required={!isClient}
                                />
                            </label>
                            <label className="settingsField">
                                {isClient ? 'Company name' : 'Business name'}
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
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
                )}

                {activeTab === 'subscription' && !isClient && (
                    <>
                        {isPro && (
                            <section className="settingsCard">
                                <h2>Branding</h2>
                                <p className="settingsCardDescription">
                                    Your logo and brand color replace Freelansite when you and your clients view your projects and shared links.
                                </p>

                                <form className="settingsForm" onSubmit={handleBrandingSubmit}>
                                    <fieldset className="brandingFieldset" disabled={!isPro}>

                                        <div className="brandingField">
                                            <span className="brandingFieldLabel">Brand color</span>
                                            <div className="brandColorRow">
                                                <input
                                                    type="color"
                                                    className="brandColorPicker"
                                                    aria-label="Pick brand color"
                                                    value={normalizedColor ?? '#1D3557'}
                                                    onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
                                                />
                                                <input
                                                    type="text"
                                                    className="brandColorText"
                                                    aria-label="Brand color hex code"
                                                    placeholder="#0F7734"
                                                    maxLength={7}
                                                    value={brandColor}
                                                    onChange={(e) => setBrandColor(e.target.value)}
                                                />
                                                {brandColor && (
                                                    <button
                                                        type="button"
                                                        className="settingsButton settingsButton--secondary"
                                                        onClick={() => setBrandColor('')}
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                            {colorProblem && (
                                                <div className="brandingProblem">
                                                    <p className="settingsMessage settingsMessage--error">{colorProblem}</p>
                                                    {normalizedColor && (
                                                        <button
                                                            type="button"
                                                            className="settingsButton settingsButton--secondary"
                                                            onClick={() => setBrandColor(makeReadable(brandColor))}
                                                        >
                                                            Use closest readable shade
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <p className="brandingHint">
                                                Used for headings, buttons and progress. The pale accent, background and borders are generated from it.
                                            </p>
                                        </div>

                                        <div className="brandingField">
                                            <span className="brandingFieldLabel">Logo</span>

                                            <div className="logoStyleOptions" role="radiogroup" aria-label="Logo style">
                                                <label className={`logoStyleOption${logoStyle === 'WORDMARK' ? ' logoStyleOption--active' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="logoStyle"
                                                        checked={logoStyle === 'WORDMARK'}
                                                        onChange={() => setLogoStyle('WORDMARK')}
                                                    />
                                                    <span className="logoStyleTitle">Wordmark</span>
                                                    <span className="logoStyleHint">
                                                        Wide, text-style logo. Shown on the left, same size as the Freelansite logo.
                                                    </span>
                                                </label>
                                                <label className={`logoStyleOption${logoStyle === 'SYMBOL' ? ' logoStyleOption--active' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="logoStyle"
                                                        checked={logoStyle === 'SYMBOL'}
                                                        onChange={() => setLogoStyle('SYMBOL')}
                                                    />
                                                    <span className="logoStyleTitle">Symbol</span>
                                                    <span className="logoStyleHint">
                                                        Round or square emblem. Shown centered, up to twice as large.
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="logoUploadRow">
                                                <input
                                                    ref={logoInputRef}
                                                    type="file"
                                                    accept={LOGO_RULES.types.join(',')}
                                                    hidden
                                                    onChange={handleLogoChange}
                                                />
                                                <button
                                                    type="button"
                                                    className="settingsButton settingsButton--secondary"
                                                    onClick={() => logoInputRef.current?.click()}
                                                >
                                                    <Upload size={16} />
                                                    {displayLogo ? 'Replace logo' : 'Upload logo'}
                                                </button>
                                                {displayLogo && (
                                                    <button
                                                        type="button"
                                                        className="settingsButton settingsButton--secondary"
                                                        onClick={handleLogoRemove}
                                                    >
                                                        <Trash2 size={16} />
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <p className="brandingHint">
                                                PNG, JPG or WebP, up to 2 MB, at least {LOGO_RULES.minPx} px on each side. A transparent PNG works best.
                                            </p>
                                        </div>

                                        <div className="brandingField">
                                            <span className="brandingFieldLabel">Preview</span>
                                            <div className="brandingPreview" style={previewVars}>
                                                <div className="brandingPreviewSidebar">
                                                    <div className={displayLogo ? `sidebar-logo sidebar-logo--${logoStyle.toLowerCase()}` : 'sidebar-logo'}>
                                                        {displayLogo
                                                            ? <img className="sidebarLogoImg" src={displayLogo} alt="" />
                                                            : <span className="logo-text">Freelansate</span>}
                                                    </div>
                                                    <span className="nav-link active">
                                                        <FolderKanban size={18} />
                                                        Projects
                                                    </span>
                                                </div>
                                                <div className="brandingPreviewMain">
                                                    <h3>Website redesign</h3>
                                                    <StatusBar percent={60} />
                                                    <span className="newButton brandingPreviewButton">Approve milestone</span>
                                                </div>
                                            </div>
                                        </div>

                                    </fieldset>

                                    <StatusMessage status={brandingStatus} />

                                
                                    <div className="settingsActions">
                                        <button
                                            type="submit"
                                            className="settingsButton"
                                            disabled={brandingSaving || !!colorProblem}
                                        >
                                            {brandingSaving ? 'Saving...' : 'Save branding'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        <section className="settingsCard">
                            <h2>
                                Plan
                                {isPro && <span className="proBadge">Pro</span>}
                            </h2>

                            {!isPro ? (
                                <>
                                    <p className="settingsCardDescription">
                                        You're on the Free plan. Go Pro to unlock custom branding, higher limits and more.
                                    </p>
                                    <div className="settingsActions">
                                        <button type="button" className="settingsButton" onClick={() => openUpgrade()}>
                                            Upgrade to Pro
                                        </button>
                                    </div>
                                </>
                            ) : user?.cancelAtPeriodEnd ? (
                                <>
                                    <p className="settingsCardDescription">
                                        Your subscription is cancelled. You keep Pro until {periodEnd}, then your account moves to the Free plan.
                                    </p>
                                    <StatusMessage status={planStatus} />
                                    <div className="settingsActions">
                                        <button
                                            type="button"
                                            className="settingsButton"
                                            disabled={planSaving}
                                            onClick={() => handlePlanChange('resume')}
                                        >
                                            {planSaving ? 'Resuming...' : 'Resume subscription'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="settingsCardDescription">
                                        You're on the Pro plan.{periodEnd && ` Renews on ${periodEnd}.`}
                                    </p>
                                    <StatusMessage status={planStatus} />

                                    {!showCancel ? (
                                        <div className="settingsActions">
                                            <button
                                                type="button"
                                                className="settingsButton settingsButton--secondary"
                                                onClick={() => setShowCancel(true)}
                                            >
                                                Cancel subscription
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="settingsCardDescription">
                                                You'll keep Pro features until {periodEnd ?? 'the end of your billing period'}. After that, branding is turned off and Free plan limits apply.
                                            </p>
                                            <div className="settingsActions">
                                                <button
                                                    type="button"
                                                    className="settingsButton settingsButton--danger"
                                                    disabled={planSaving}
                                                    onClick={() => handlePlanChange('cancel')}
                                                >
                                                    {planSaving ? 'Cancelling...' : 'Yes, cancel'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="settingsButton settingsButton--secondary"
                                                    onClick={() => setShowCancel(false)}
                                                >
                                                    Keep Pro
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'security' && (
                    <>
                        <section className="settingsCard">
                            <h2>Change password</h2>
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
                                {isClient
                                    ? 'This closes your account and you will lose access to all your projects and invoices. The freelancers you worked with keep their own records of that work. This cannot be undone.'
                                    : 'This permanently deletes your account along with all your clients, projects, milestones, invoices, and shared links. Your clients will lose access immediately. This cannot be undone.'}
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
                    </>
                )}

            </div>
        </div>
    )
}