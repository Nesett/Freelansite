import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FolderKanban, Receipt, UsersRound, Settings } from 'lucide-react'

export default function Navbar() {
    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/projects', label: 'Projects', icon: FolderKanban },
        { to: '/invoices', label: 'Invoices', icon: Receipt },
        { to: '/team', label: 'Team', icon: UsersRound },
        { to: '/settings', label: 'Settings', icon: Settings }
    ]

    return (
        <nav className="sidebar">
        {links.map(({ to, label, icon: Icon }) => (
            <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
            <Icon size={18} />
            <span>{label}</span>
            </NavLink>
        ))}
        </nav>
    )
}
