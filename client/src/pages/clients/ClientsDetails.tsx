import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { User, Mail, Plus } from 'lucide-react'
import ProjectComponent from "./components/ProjectComponent"
import type { Client } from "./Clients"

export interface Project {
	id: string
	title: string
	description?: string | null
	budget?: number | null
	status: string
	deadline?: string | null
}


export default function ClientsDetails() {
    const [client, setClient] = useState<Client | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
		if (!id) return

		let isFinished = true

		const fetchData = async () => {
			try {
				const [clientRes, projectsRes] = await Promise.all([
					fetch(`/api/clients/${id}`, { credentials: 'include' }),
					fetch(`/api/clients/${id}/projects`, { credentials: 'include' })
				])

				if (!clientRes.ok || !projectsRes.ok) {
					throw new Error("Network request failed")
				}

				const clientJson = await clientRes.json()
				const projectsJson = await projectsRes.json()

				if (isFinished) {
					setClient(clientJson)
					setProjects(projectsJson)
				}
			} catch (error) {
				console.error("Failed to load client data or projects:", error)
			} finally {
				if (isFinished) {
					setLoading(false)
				}
			}
		}

		fetchData()

		return () => {
			isFinished = false
		}
	}, [id])

    if (loading) {
        return <div>Loading client details...</div>
    }

    if (!client) {
        return <div>Client not found.</div>
    }
    
    return(
        <div className="pageContent">
            {client.companyName ? (
                <header>
                    <div className="clientPageTitle">
                        <h2>{client.companyName}</h2>
                    </div>
                    <div className="smallClientInfoContainer">
                        <div className="smallClientInfo">
                            <User />
                            <p>{client.name}</p>
                        </div>
                        <div className="smallClientInfo">
                            <Mail />
                            <p>{client.email}</p>
                        </div>
                    </div>

                </header>
            ) : (
                <header>
                    <div className="clientPageTitle">
                        <h2>{client.name}</h2>
                    </div>
                    <div className="smallClientInfoContainer">
                        <div className="smallClientInfo">
                            <Mail />
                            <p>{client.email}</p>
                        </div>
                    </div>
                </header>
            )}
            <hr/>
            <main>
				<div className="projectsSectionHeader">
					<h3>Projects</h3>
					<button className="newClientButton">
						<Plus />
						New Project
					</button>
				</div>
				<div className="projectsHolder">
					{projects.length > 0 ? (
						projects.map(project => (
							<ProjectComponent key={project.id} project={project} />
						))
					) : (
						<p>No projects found for this client.</p>
					)}
				</div>
			</main>
        </div>
    )
}