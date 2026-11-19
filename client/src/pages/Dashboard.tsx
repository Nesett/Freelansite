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

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
})

function plural(count: number, singular: string, pluralForm = singular + "s") {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

function getClientName(project: Project) {
    const { companyName, name, email } = project.client
    return companyName || name || email
}

function clientKey(project: Project) {
    return project.client.id ?? project.client.email
}

function getProjectStatus(project: Project): { label: string, className: string } {
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
        return { label: "Awaiting approval", className: "statusTag--warning" }
    }
    if (open.some(m => m.status === "CURRENTLY_WORKED_ON")) {
        return { label: "In progress", className: "statusTag--progress" }
    }
    return { label: "Not started", className: "statusTag--neutral" }
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<Project[]>([])
    const [invoices, setInvoices] = useState<DashboardInvoice[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { showError } = useToast()

    useEffect(() => {
        async function fetchProjects() {
            try {
                const [projectsRes, invoicesRes] = await Promise.all([
                    fetch("/api/projects", { credentials: "include" }),
                    fetch("/api/invoices", { credentials: "include" }),
                ])

                if (!projectsRes.ok || !invoicesRes.ok) {
                    showError("Could not load your dashboard")
                    return
                }

                const projectsData: Project[] = await projectsRes.json()
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

        fetchProjects()
    }, [showError])

    if (loading) {
        return <div>Loading dashboard...</div>
    }

    const activeProjects = projects.filter(p => !p.isOnHold && p.progress < 100)
    const activeClientCount = new Set(activeProjects.map(clientKey)).size

    const pendingApprovals = projects
        .flatMap(p => p.milestones)
        .filter(m => m.status === "AWAITING_APPROVAL").length

    const unpaidInvoices = invoices.filter(i => i.status !== "PAID")
    // nothing on the backend flips UNPAID to OVERDUE, so also check the due date here
    const overdueInvoices = unpaidInvoices.filter(i =>
        i.status === "OVERDUE" || new Date(i.deadline).getTime() < Date.now()
    )
    const outstandingTotal = unpaidInvoices.reduce((sum, i) => sum + Number(i.total), 0)

    const totalClients = new Set(
        projects.filter(p => !p.client.accountDeleted).map(clientKey)
    ).size

    const recentProjects = projects.slice(0, RECENT_PROJECTS_LIMIT)

    return (
        <div className="pageContent dashboardPage">
            <div className="clientsHeader">
                <div>
                    <h1>Dashboard</h1>
                    <p className="clientsSubtitle">Here's what's happening across your clients today.</p>
                </div>
            </div>
            <div className="dashboardStats">
                <div className="statCard">
                    <p className="statLabel">Active Projects</p>
                    <p className="statValue">{activeProjects.length}</p>
                    <p className="statHint">across {plural(activeClientCount, "client")}</p>
                </div>

                <div className="statCard">
                    <p className="statLabel">Pending Approvals</p>
                    <p className="statValue">{pendingApprovals}</p>
                    <p className="statHint">awaiting client sign-off</p>
                </div>

                <div className="statCard">
                    <p className="statLabel">Awaiting Payment</p>
                    <p className="statValue">{unpaidInvoices.length}</p>
                    <p className="statHint">
                        {currency.format(outstandingTotal)} outstanding
                        {overdueInvoices.length > 0 && (
                            <span className="statHintDanger"> · {overdueInvoices.length} overdue</span>
                        )}
                    </p>
                </div>

                <div className="statCard">
                    <p className="statLabel">Total Clients</p>
                    <p className="statValue">{totalClients}</p>
                    <p className="statHint">with at least one project</p>
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
                                <th>Client</th>
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
                                        <td className="clientPrimary">
                                            {getClientName(project)}
                                            {project.client.accountDeleted && (
                                                <span className="statusTag statusTag--neutral" style={{ marginLeft: 8 }}>Account deleted</span>
                                            )}
                                        </td>
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