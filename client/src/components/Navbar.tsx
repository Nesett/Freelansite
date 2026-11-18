import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Users, FolderKanban, Receipt, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUpgrade } from '../context/UpgradeContext'
import { useAuth } from '../context/AuthContext'
import { useBrandingContext } from '../context/BrandingContext'

export default function Navbar() {
	const [collapsed, setCollapsed] = useState(false)
	const { user } = useAuth()
	const { branding } = useBrandingContext()
	const { openUpgrade } = useUpgrade()
	const showUpgrade = user?.role === 'admin' && user?.plan !== 'PRO'

	const adminLinks = [
		{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/clients', label: 'Clients', icon: Users },
		{ to: '/projects', label: 'Projects', icon: FolderKanban },
		{ to: '/invoices', label: 'Invoices', icon: Receipt },
		//{ to: '/team', label: 'Team', icon: UsersRound },
		{ to: '/settings', label: 'Settings', icon: Settings }
	]

	const clientLinks = [
		{ to: '/projects', label: 'Projects', icon: FolderKanban },
		{ to: '/invoices', label: 'Invoices', icon: Receipt },
		{ to: '/settings', label: 'Settings', icon: Settings }
	]

	const links = user?.role === 'admin' ? adminLinks : clientLinks

	const logoUrl = branding?.logoUrl ?? null
	const logoStyle = branding?.logoStyle ?? 'WORDMARK'

	function renderLogo() {
		if (!logoUrl) {
			return <span className="logo-text">{collapsed ? 'F' : 'Freelansite'}</span>
		}

		// if its collapsed and a wordmark, since it would look ugly collapsed, i show the brand's initial instead
		if (collapsed && logoStyle === 'WORDMARK') {
			return <span className="logo-text">{(branding?.name ?? '').charAt(0).toUpperCase()}</span>
		}

		return <img className="sidebarLogoImg" src={logoUrl} alt={branding?.name ?? ''} />
	}

	return (
		<nav className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
        <Link
            to="/dashboard"
            className={logoUrl ? `sidebar-logo sidebar-logo--${logoStyle.toLowerCase()}` : 'sidebar-logo'}
            aria-label="Home"
        >
            {renderLogo()}
        </Link>

			<div className="sidebar-links">
				{links.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						end={to === '/'}
						className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
					>
						<Icon size={18} />
						<span className="nav-label">{label}</span>
					</NavLink>
				))}
			</div>

			{showUpgrade && (
                <button type="button" className="sidebar-upgrade" onClick={() => openUpgrade()}>
					<span className="sidebar-upgrade-short">PRO</span>
					<span className="nav-label">Upgrade to Pro</span>
				</button>
            )}

            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                <span className="nav-label">Collapse</span>
            </button>
        </nav>
	)
}
