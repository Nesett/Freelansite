import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { Project, Milestone } from "./Projects"
import { Plus, EllipsisVertical, Link as LinkIcon } from "lucide-react"
import AreYouSureModal from "../components/AreYouSureModal"
import StatusBar from "../components/StatusBar"
import StatusTag from "../components/StatusTag"
import { useNavigate } from "react-router-dom"
import { getProjectTag, getActiveMilestone, countProgressPercent } from "../utils/ProjectStatus"
import MilestoneEntry from "../components/MilestoneEntry"
import ProjectFormModal from "../components/ProjectFormModal"
import MilestoneFormModal from "../components/MilestoneFormModal"



export default function ProjectDetails() {
	const { id } = useParams<{ id: string }>()
	const [project, setProject] = useState<Project | null>(null)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const projectOptionsRef = useRef<HTMLDivElement | null>(null)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(true)
	const [errorMessage, setErrorMessage] = useState<string>("")
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false)
    const [ editProjectForm, setEditProjectForm] = useState<boolean>(false)
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
    const navigate = useNavigate()

	useEffect(() => {
        let isFinished = true

		async function fetchProjectDetails() {
            
			try {
				const [projectsRes, milestonesRes] = await Promise.all([
					fetch(`/api/projects/${id}`, { credentials: 'include' }),
					fetch(`/api/milestones?projectId=${id}`, { credentials: 'include' })
				])
				if (!milestonesRes.ok || !projectsRes.ok) {
					throw new Error("Request failed.")
				}

				const milestonesJson = await milestonesRes.json()
				const projectsJson = await projectsRes.json()

				if (isFinished) {
					setMilestones(milestonesJson)
					setProject(projectsJson)
				}

			} catch (err) {
				if (err instanceof Error) {
					setErrorMessage(err.message)
				} else {
					setErrorMessage("An unexpected error occurred")
				}
			} finally {
				if (isFinished) {
					setLoading(false)
				}
			}
		}

		fetchProjectDetails()

		return () => {
			isFinished = false
		}

	}, [id])


    async function deleteProject() {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE",
                credentials: "include"
            })

            if (!res.ok) {
                throw new Error("Failed to delete project")
            }

            setAreYouSure(false)
            navigate("/projects")
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting project.")
            }
        }
    }


    async function approveMilestone( milestoneId: string) {

        try {
            const res = await fetch(`/api/milestones/${milestoneId}/approve`, {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
            })

            if (!res.ok) {
                throw new Error("Failed to create milestone.")
            }

            const data = await res.json()

        setMilestones(prev =>
            prev.map(m => m.id === milestoneId ? data.approvedMilestone : m)
        )

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting project.")
            }
        }
    }


    function handleProjectUpdated(data: unknown) {
        const { updatedProject } = data as { updatedProject: Project }
        setProject(prev => prev ? { ...prev, ...updatedProject } : prev)
        setEditProjectForm(false)
    }

    function closeMilestoneModal() {
        setShowAddMilestone(false)
        setEditingMilestone(null)
    }

    function handleMilestoneSaved(data: unknown) {
        if (editingMilestone) {
            const { updatedMilestone } = data as { updatedMilestone: Milestone }
            setMilestones(prev =>
                prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m)
            )
        } else {
            const { newMilestone } = data as { newMilestone: Milestone }
            setMilestones(prev => [...prev, newMilestone])
        }

        closeMilestoneModal()
    }

    function showProjectOptions() {
        setEditOptions(prev => !prev)
    }

	if (loading) {
		return <p>Loading project details...</p>
	}

	if (errorMessage || !project) {
		return <p>{errorMessage || "Project not found."}</p>
	}


    const { label, variant } = getProjectTag(project.status)
    const sortedMilestones = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex)
    const activeMilestone = getActiveMilestone(sortedMilestones)
    const currentProgress = countProgressPercent(milestones)

	return (
		<div className="pageContent">
            {editProjectForm && (
                <ProjectFormModal
                    project={project}
                    onClose={() => setEditProjectForm(false)}
                    onSaved={handleProjectUpdated}
                />
            )}
            {areYouSure && (
                <AreYouSureModal 
                    itemType="project"
                    itemName={project.title}
                    warningMessage="Deleting this project will permanently remove all associated milestones, invoices etc."
                    setAreYouSure={setAreYouSure} 
                    onConfirm={deleteProject}
                />
            )}
            {(showAddMilestone || editingMilestone) && (
                <MilestoneFormModal
                    milestone={editingMilestone ?? undefined}
                    projectId={id}
                    orderIndex={milestones.length}
                    onClose={closeMilestoneModal}
                    onSaved={handleMilestoneSaved}
                />
            )}
			<header className="projectHeader">
                <div className="projectHeaderInfo">
                    <p className="projectHeaderClient">{project.client.companyName ? project.client.companyName : project.client.name}</p>
                    <h1>{project.title}</h1>
                    {project.description && (
                        <p className="projectDescription">{project.description}</p>
                    )}
                    <StatusBar percent={currentProgress}/>
                </div>
                <div className="projectHeaderActions">
                    <StatusTag label={label} variant={variant} />
                    <div className="projectOptionsWrapper" ref={projectOptionsRef}>
                        <button onClick={showProjectOptions} className="projectOptionsButton"><EllipsisVertical /></button>
                        {editOptions && (
                            <div className="clientOptionsMenu">
                                <button onClick={()=>setAreYouSure(prev=>!prev)} className="clientOptionsMenuItem">Delete project</button>
                                <button onClick={()=>setEditProjectForm(prev=>!prev)} className="clientOptionsMenuItem">Edit project</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <hr />
			<main className="projectBody">
                <div className="projectMilestonesDiv">
                    <div className="milestoneHeader">
                        <h2>Milestones</h2>
                        <button onClick={()=>setShowAddMilestone(prev=>!prev)} className="newButton">
                            <Plus />
                            Add Milestone
                        </button>
                    </div>
                    <div className="projectMilestones">
                        {sortedMilestones.length > 0 ? (
                            sortedMilestones.map(milestone => (
                                <MilestoneEntry
                                    key={milestone.id}
                                    milestone={milestone}
                                    isActive={milestone.id === activeMilestone?.id}
                                    onApprove={approveMilestone}
                                    onEdit={setEditingMilestone}
                                />
                            ))
                        ) : (<p>No milestones found for this project.</p>)}
                    </div>
                </div>
                <section className="magicLinksCard">
                    <div className="magicLinksHeader">
                        <LinkIcon />
                        <h3>Magic Links</h3>
                        <span>Read-only access for stakeholders</span>
                    </div>
                    <div className="magicLinksBody">
                        <p>No active magic links for this project.</p>
                    </div>
                </section>
			</main>
		</div>
	)
}