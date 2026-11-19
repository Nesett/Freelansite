import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBreadcrumbContext } from '../context/BreadcrumbContext'

const APP_NAME = 'Freelansite'

const SECTION_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    clients: 'Clients',
    projects: 'Projects',
    invoices: 'Invoices',
    team: 'Team',
    settings: 'Settings'
}

type Crumb = { label: string, to?: string }

export default function Breadcrumbs() {
    const { pathname } = useLocation()
    const { user } = useAuth()
    const { label } = useBreadcrumbContext()

    const [section, id] = pathname.split('/').filter(Boolean)
    const homePath = user?.role === 'admin' ? '/dashboard' : '/projects'

    const crumbs: Crumb[] = [{ label: APP_NAME, to: homePath }]

    if (section && SECTION_LABELS[section]) {
        crumbs.push({
            label: SECTION_LABELS[section],
            to: id ? `/${section}` : undefined
        })
    }

    if (id) {
        const detailLabel = label && label.path === pathname ? label.text : '…'
        crumbs.push({ label: detailLabel })
    }

    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1

                    return (
                        <li key={`${index}-${crumb.label}`}>
                            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
                            {crumb.to && !isLast ? (
                                <Link to={crumb.to}>{crumb.label}</Link>
                            ) : (
                                <span className="breadcrumbCurrent" aria-current={isLast ? 'page' : undefined}>
                                    {crumb.label}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}