import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { Project, Milestone } from "./Projects"
import { Plus, EllipsisVertical } from "lucide-react"
import AreYouSureModal from "../components/AreYouSureModal"
import StatusBar from "../components/StatusBar"
import StatusTag from "../components/StatusTag"
import { useNavigate } from "react-router-dom"
import { getProjectTag } from "../utils/ProjectStatus"
import MilestoneEntry from "../components/MilestoneEntry"



export default function ProjectDetails() {
	const { id } = useParams<{ id: string }>()
	const [project, setProject] = useState<Project | null>(null)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const projectOptionsRef = useRef<HTMLDivElement | null>(null)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(true)
	const [errorMessage, setErrorMessage] = useState<string>("")
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [showAddMilestones, setShowAddMilestone] = useState<boolean>(false)
    const [ milestoneTitle, setMilestoneTitle ] = useState<string>("")
    const [ milestoneDescription, setMilestoneDescription] = useState<string>("")
    const [ milestoneBudget, setMilestoneBudget ] = useState<number | "">("")
    const [ milestoneDeadline, setMilestoneDeadline ] = useState<string>("")
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

    async function handleAddNewMilestone(e: React.FormEvent) {
        e.preventDefault()

        try {
            const res = await fetch(`/api/milestones`, {
                method: "POST",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    projectId: id,
					title: milestoneTitle,
					description: milestoneDescription,
					budget: milestoneBudget,
					deadline: milestoneDeadline,
                    orderIndex: milestones.length + 1
                })
            })

            if (!res.ok) {
                throw new Error("Failed to create milestone.")
            }

            const successData = await res.json()

			setMilestones(prev => [...prev, successData.newMilestone])

            setShowAddMilestone(prev => !prev)

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occurred while deleting project.")
            }
        }
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

	return (
		<div className="pageContent">
            {showAddMilestones && (
            <div className="addMilestonesForm">
                <form onSubmit={handleAddNewMilestone}>
                    <label htmlFor='title'>Title</label>
                    <input 
                        id='title' 
                        name='title' 
                        type='textarea'
                        placeholder="Dashboard"
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        required
                    />
                    <label htmlFor='description'>Description</label>
                    <textarea 
                        id='description' 
                        name='description' 
                        onChange={(e) => setMilestoneDescription(e.target.value)}
                    ></textarea>
                    <label htmlFor='budget'>Budget</label>
                        <input 
                            id='budget' 
                            name='budget' 
                            type='number' 
                            onChange={(e) => setMilestoneBudget(e.target.value ? Number(e.target.value) : "")}
                        />
                    <label htmlFor='deadline'>Deadline</label>
                    <input 
                        id='deadline' 
                        name='deadline' 
                        type='date' 
                        onChange={(e) => setMilestoneDeadline(e.target.value)}
                    />
                    <button> Add new milestone </button>
                </form>
            </div>)}
            {areYouSure && (
                <AreYouSureModal 
                    itemType="project"
                    itemName={project.title}
                    warningMessage="Deleting this project will permanently remove all associated milestones, invoices etc."
                    setAreYouSure={setAreYouSure} 
                    onConfirm={deleteProject}
                />
            )}
			<header>
                <div>
                    <p>{project.client.companyName ? project.client.companyName : project.client.name}</p>
                    <h1>{project.title}</h1>
                    <StatusBar percent={project.progress}/>
                </div>
                <div>
                    <div className="projectOptionsWrapper" ref={projectOptionsRef}>
                        <button onClick={showProjectOptions}><EllipsisVertical /></button>
                        {editOptions && (
                            <div className="clientOptionsMenu">
                                <button onClick={()=>setAreYouSure(prev=>!prev)} className="clientOptionsMenuItem">Delete project</button>
                                <button className="clientOptionsMenuItem">Edit project</button>
                            </div>
                        )}
                    </div>
                    <StatusTag label={label} variant={variant} />
                </div>

			</header>
            <hr />
			<main>
                <div className="projectMilestonesDiv">
                    <div className="milestoneHeader">
                        <h2>Milestones</h2>
                        <button onClick={()=>setShowAddMilestone(prev=>!prev)} className="newButton">
                            <Plus />
                            Add Milestone
                        </button>
                    </div>
                    <div className="projectMilestones">
                        {milestones.length > 0 ? (
                        milestones.map(milestone => (
                                <MilestoneEntry key={milestone.id} milestone={milestone} />
                            ))
                        ) : (<p>No milestones found for this project.</p>)}
                    </div>
                    
                </div>
                <div className="projectInfo">
                    <div className="summaryAndInfo"></div>
                    <div className="activityLog"></div>
                </div>

			</main>
		</div>
	)
}