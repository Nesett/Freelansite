import { useEffect, useState } from "react"
import ProjectsTable from "../components/ProjectsTable"
import { useToast } from "../context/ToastContext"
import type { LogoStyle } from "../utils/brandTheme"

export type MilestoneStatusValue = "NOT_STARTED" | "CURRENTLY_WORKED_ON" | "AWAITING_APPROVAL" | "APPROVED"

export interface ProjectClient {
    id: string | null
    name: string | null
    companyName: string | null
    email: string
    phone: string | null
    address: string | null
    accountDeleted: boolean
}

export interface Milestone {
	id: string
	status: MilestoneStatusValue
	deadline?: string | null
	orderIndex: number
	budget?: number | null
	title?: string
	description?: string | null
}

export interface ProjectBranding {
	name: string
	primary: string | null
	logoUrl: string | null
	logoStyle: LogoStyle
}

export interface ProjectAdmin {
	name: string
	businessName: string | null
	email: string
	phone: string | null
	address: string
	branding?: ProjectBranding | null
}

export interface ProjectInvoice {
	id: string
	number: number
	total: number
	status: "UNPAID" | "PAID" | "OVERDUE"
	issueDate: string
}

export interface Project {
	id: string
	title: string
	description?: string | null
	budget?: number | null
	isOnHold: boolean
	client: ProjectClient
	admin: ProjectAdmin
	progress: number
	milestones: Milestone[]
	invoices: ProjectInvoice[]
}

export interface MagicLink {
	id: string
	url: string,
	expiresAt: string
}



export default function Projects() {
	const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { showError } = useToast()

	useEffect(()=> {
		async function fetchAllProjects() {
			try {
				const res = await fetch('/api/projects', 
					{credentials: 'include'}
				)

				if (!res.ok) {
					return
				}

				const data = await res.json()
				
				setProjects(data)

			} catch(err) {
				if (err instanceof Error) {
					showError(err.message)
					console.log(err.message)
				} else {
					showError("An unexpected error occured")
				}
			} finally {
				setLoading(false)
			}

		}

		fetchAllProjects()
	}, [showError])

	if (loading) {
		return <div>Loading projects...</div>
	}

	    return (
        <div className="pageContent">
            <div className="clientsHeader">
                <div>
                    <h1>Projects</h1>
                    <p className="clientsSubtitle">
                        Track progress, budgets, and delivery across your client work.
                    </p>
                </div>
            </div>
            <ProjectsTable projects={projects} showClient />
        </div>
    )
}