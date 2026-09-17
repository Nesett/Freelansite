import { useEffect, useState } from "react"
import ProjectComponent from "../components/ProjectComponent"

export interface Project {
	id: string
	title: string
	description?: string | null
	budget?: number | null
	status: string
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
						<ProjectComponent key={project.id} project={project} showClientLabel />
					))
				) : (
					<p>No projects found.</p>
				)}
			</div>
		</div>
	)
}