import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useClickOutside from '../utils/clicksOutside'

export default function StudioMenu() {
    const { user, setUser } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState<boolean>(false)
    const menuRef = useRef<HTMLDivElement | null>(null)

    useClickOutside(open, () => setOpen(false), menuRef)

    if (!user) return null

    const studioOwner = user.businessName?.trim() || user.name
    const studioLabel = `${studioOwner}'s Studio`
    const isPro = user.role === 'admin' && user.plan === 'PRO'

    async function handleLogout() {
        setOpen(false)

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } finally {
            navigate('/login', { replace: true })
            setUser(null)
        }
    }

    return (
        <div className="studioMenu" ref={menuRef}>
            <button
                type="button"
                className={isPro ? 'studioButton' : 'studioButton studioButton--plain'}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(prev => !prev)}
            >
                {isPro && <span className="studioProBadge">PRO</span>}
                <span className="studioName" title={studioLabel}>{studioLabel}</span>
                <ChevronsUpDown size={14} aria-hidden="true" />
            </button>

            {open && (
                <div className="studioMenuPanel" role="menu">
                    <div className="studioMenuHeader">
                        <p className="studioMenuHeaderName">{user.name}</p>
                        <p className="studioMenuHeaderEmail">{user.email}</p>
                    </div>
                    <button type="button" role="menuitem" className="studioMenuItem" onClick={handleLogout}>
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            )}
        </div>
    )
}