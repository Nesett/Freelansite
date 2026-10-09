import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Users, FolderKanban, Receipt, UsersRound, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
	const [collapsed, setCollapsed] = useState(false)
	const { user } = useAuth()

	const adminLinks = [
		{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ to: '/clients', label: 'Clients', icon: Users },
		{ to: '/projects', label: 'Projects', icon: FolderKanban },
		{ to: '/invoices', label: 'Invoices', icon: Receipt },
		//{ to: '/team', label: 'Team', icon: UsersRound },
		//{ to: '/settings', label: 'Settings', icon: Settings }
	]

	const clientLinks = [
		{ to: '/projects', label: 'Projects', icon: FolderKanban },
		{ to: '/invoices', label: 'Invoices', icon: Receipt }
	]

	const links = user?.role === 'admin' ? adminLinks : clientLinks


	return (
		<nav className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
        <Link to="/dashboard" className="sidebar-logo">
            <span className="logo-text">{collapsed ? 'F' : 'Freelansate'}</span>
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

			<button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
				{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
				<span className="nav-label">Collapse</span>
			</button>
		</nav>
	)
}