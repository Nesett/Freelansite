import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { Project } from "./Projects"
import { useToast } from "../context/ToastContext"

const RECENT_PROJECTS_LIMIT = 5

interface DashboardInvoice {
    id: string
    status: "UNPAID" | "PAID" | "OVERDUE"
    total: number | string
    deadline: string
}

type ClientProject = Project & {
    admin?: {
        name: string | null
        businessName: string | null
    }
}

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
})

function plural(count: number, singular: string, pluralForm = singular + "s") {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

function getStudioName(project: ClientProject) {
    return project.admin?.businessName || project.admin?.name || "Unknown"
}

function getProjectStatus(project: ClientProject): { label: string, className: string } {
    const now = Date.now()
    const open = project.milestones.filter(m => m.status !== "APPROVED")

    if (project.isOnHold) {
        return { label: "On hold", className: "statusTag--hold" }
    }
    if (project.milestones.length > 0 && open.length === 0) {
        return { label: "Completed", className: "statusTag--success" }
    }
    if (open.some(m => m.deadline && new Date(m.deadline).getTime() < now)) {
        return { label: "Overdue", className: "statusTag--danger" }
    }
    if (open.some(m => m.status === "AWAITING_APPROVAL")) {
        return { label: "Needs your approval", className: "statusTag--warning" }
    }
    if (open.some(m => m.status === "CURRENTLY_WORKED_ON")) {
        return { label: "In progress", className: "statusTag--progress" }
    }
    return { label: "Not started", className: "statusTag--neutral" }
}

export default function ClientDashboardPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<ClientProject[]>([])
    const [invoices, setInvoices] = useState<DashboardInvoice[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { showError } = useToast()

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const [projectsRes, invoicesRes] = await Promise.all([
                    fetch("/api/projects", { credentials: "include" }),
                    fetch("/api/invoices", { credentials: "include" }),
                ])

                if (!projectsRes.ok || !invoicesRes.ok) {
                    showError("Could not load your dashboard")
                    return
                }

                const projectsData: ClientProject[] = await projectsRes.json()
                const invoicesData: DashboardInvoice[] = await invoicesRes.json()

                setProjects(projectsData.map(p => ({
                    ...p,
                    milestones: p.milestones ?? [],
                    invoices: p.invoices ?? [],
                })))
                setInvoices(invoicesData)
            } catch (err) {
                showError(err instanceof Error ? err.message : "An unexpected error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [showError])

    if (loading) {
        return <div>Loading dashboard...</div>
    }

    const activeProjects = projects.filter(p => !p.isOnHold && p.progress < 100)
    const activeStudioCount = new Set(activeProjects.map(getStudioName)).size

    const pendingApprovals = projects
        .flatMap(p => p.milestones)
        .filter(m => m.status === "AWAITING_APPROVAL").length

    const unpaidInvoices = invoices.filter(i => i.status !== "PAID")
    const overdueInvoices = unpaidInvoices.filter(i =>
        i.status === "OVERDUE" || new Date(i.deadline).getTime() < Date.now()
    )
    const outstandingTotal = unpaidInvoices.reduce((sum, i) => sum + Number(i.total), 0)

    const recentProjects = projects.slice(0, RECENT_PROJECTS_LIMIT)

    return (
        <div className="pageContent dashboardPage">
            <div className="clientsHeader">
                <div>
                    <h1>Dashboard</h1>
                    <p className="clientsSubtitle">Here's where your projects stand today.</p>
                </div>
            </div>
            <div className="dashboardStats dashboardStats--three">
                <div className="statCard">
                    <p className="statLabel">Active Projects</p>
                    <p className="statValue">{activeProjects.length}</p>
                    <p className="statHint">
                        {activeProjects.length === 0
                            ? "nothing in progress"
                            : `managed by ${plural(activeStudioCount, "studio")}`}
                    </p>
                </div>

                <div className="statCard">
                    <p className="statLabel">Pending Approvals</p>
                    <p className="statValue">{pendingApprovals}</p>
                    <p className="statHint">
                        {pendingApprovals === 1 ? "milestone is" : "milestones are"} waiting for your sign-off
                    </p>
                </div>

                <div className="statCard">
                    <p className="statLabel">Unpaid Invoices</p>
                    <p className="statValue">{unpaidInvoices.length}</p>
                    <p className="statHint">
                        {currency.format(outstandingTotal)} to pay
                        {overdueInvoices.length > 0 && (
                            <span className="statHintDanger"> · {overdueInvoices.length} overdue</span>
                        )}
                    </p>
                </div>
            </div>

            <div className="clientsTableWrapper dashboardRecent">
                <div className="dashboardCardHeader">
                    <h3>Recent projects</h3>
                    <Link to="/projects" className="viewAllLink">View all</Link>
                </div>

                {recentProjects.length === 0 ? (
                    <div className="tableEmptyState">No projects yet.</div>
                ) : (
                    <table className="clientsTable">
                        <thead>
                            <tr>
                                <th>Studio</th>
                                <th>Project</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentProjects.map(project => {
                                const status = getProjectStatus(project)
                                const progress = Math.max(0, Math.min(100, Math.round(project.progress)))

                                return (
                                    <tr
                                        key={project.id}
                                        className="clickableEntry"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                    >
                                        <td className="clientPrimary">{getStudioName(project)}</td>
                                        <td className="dashboardProjectTitle">{project.title}</td>
                                        <td>
                                            <div className="statusBarHolder dashboardProgress">
                                                <div className="statusBarTrack">
                                                    <div className="statusBarFill" style={{ width: `${progress}%` }} />
                                                </div>
                                                <p>{progress}%</p>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`statusTag ${status.className}`}>{status.label}</span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}