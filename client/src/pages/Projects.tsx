import { useEffect, useState } from "react"
import ProjectEntry from "../components/ProjectEntry"

export type ProjectStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "COMPLETED" | "ON_HOLD"
export type MilestoneStatusValue = "NOT_STARTED" | "CURRENTLY_WORKED_ON" | "AWAITING_APPROVAL" | "APPROVED"

export interface ProjectClient {
	id: string
	name?: string | null
	companyName?: string | null
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

export interface Project {
	id: string
	title: string
	description?: string | null
	budget?: number | null
	status: ProjectStatusValue
	client: ProjectClient
	progress: number
	milestones: Milestone[]
}

export interface MagicLink {
	id: string
	url: string,
	expiresAt: string
}



export default function Projects() {
	const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [ errorMessage, setErrorMessage] = useState<string>("")

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
					setErrorMessage(err.message)
					console.log(err.message)
				} else {
					setErrorMessage("An unexpected error occured")
				}
			} finally {
				setLoading(false)
			}

		}

		fetchAllProjects()
	}, [])

	if (loading) {
		return <div>Loading projects...</div>
	}

	return (
		<div className="pageContent">
			<h1>Projects</h1>
			{errorMessage && <p>{errorMessage}</p>}
			<div className="projectsHolder">
				{projects.length > 0 ? (
					projects.map(project => (
						<ProjectEntry key={project.id} project={project} showClientLabel />
					))
				) : (
					<p>No projects found.</p>
				)}
			</div>
		</div>
	)
}