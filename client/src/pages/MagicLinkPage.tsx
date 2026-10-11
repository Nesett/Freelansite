import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { User, Mail, Phone } from "lucide-react"
import type { Milestone } from "./Projects"
import StatusBar from "../components/StatusBar"
import PublicMilestoneEntry from "../components/PublicMilestoneEntry"
import { getActiveMilestone } from "../utils/ProjectStatus"

interface PublicProjectData {
    title: string
    description: string | null
    progress: number
    client: {
        name: string | null
        companyName: string | null
    }
    admin: {
        name: string
        businessName: string | null
        email: string
        phone: string | null
    }
    milestones: Milestone[]
}

export default function PublicProject() {
    const { token } = useParams<{ token: string }>()
    const [project, setProject] = useState<PublicProjectData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMessage, setErrorMessage] = useState<string>("")

    useEffect(() => {
        let isActive = true

        async function fetchPublicProject() {
            try {
                const res = await fetch(`/api/public/${token}`)

                if (res.status === 404) {
                    throw new Error("This link is invalid or has expired.")
                }

                if (!res.ok) {
                    throw new Error("Failed to load project.")
                }

                const data = await res.json()

                if (isActive) {
                    setProject(data)
                }
            } catch (err) {
                if (!isActive) return

                if (err instanceof Error) {
                    setErrorMessage(err.message)
                } else {
                    setErrorMessage("An unexpected error occurred")
                }
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        fetchPublicProject()

        return () => {
            isActive = false
        }
    }, [token])

    if (loading) {
        return <p>Loading project...</p>
    }

    if (errorMessage || !project) {
        return <p>{errorMessage || "Project not found."}</p>
    }

    const sortedMilestones = [...project.milestones].sort((a, b) => a.orderIndex - b.orderIndex)
    const activeMilestone = getActiveMilestone(sortedMilestones)
    const clientLabel = project.client.companyName || project.client.name

    return (
        <div className="pageContent publicPage">
            <header className="projectHeader">
                <div className="projectHeaderInfo">
                    {project.admin.businessName && (
                        <p className="projectHeaderClient">{project.admin.businessName}</p>
                    )}
                    {clientLabel && (
                        <p className="projectHeaderClient">{clientLabel}</p>
                    )}
                    <h1>{project.title}</h1>
                    {project.description && (
                        <p className="projectDescription">{project.description}</p>
                    )}
                    <StatusBar percent={project.progress} />
                </div>
            </header>
            <hr />
            <main className="publicBody">
                <div className="projectMilestonesDiv">
                    <div className="milestoneHeader">
                        <h2>Milestones</h2>
                    </div>
                    <div className="projectMilestones">
                        {sortedMilestones.length > 0 ? (
                            sortedMilestones.map(milestone => (
                                <PublicMilestoneEntry
                                    key={milestone.id}
                                    milestone={milestone}
                                    isActive={milestone.id === activeMilestone?.id}
                                />
                            ))
                        ) : (<p>No milestones found for this project.</p>)}
                    </div>
                </div>
                <section className="projectSummaryCard publicManagedBy">
                    <div className="projectSummaryContact">
                        <p className="projectSummaryContactLabel">Managed by</p>
                        <p className="projectSummaryContactItem">
                            <User />
                            {project.admin.name}
                        </p>
                        <p className="projectSummaryContactItem">
                            <Mail />
                            {project.admin.email}
                        </p>
                        {project.admin.phone && (
                            <p className="projectSummaryContactItem">
                                <Phone />
                                {project.admin.phone}
                            </p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}