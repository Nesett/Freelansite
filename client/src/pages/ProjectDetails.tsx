import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import type { Project } from "./Projects"
import { Plus, EllipsisVertical } from "lucide-react"
import AreYouSureModal from "../components/AreYouSureModal"
import StatusBar from "../components/StatusBar"
import StatusTag from "../components/StatusTag"
import { useNavigate } from "react-router-dom"

export default function ProjectDetails() {
	const { id } = useParams<{ id: string }>()
	const [project, setProject] = useState<Project | null>(null)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const projectOptionsRef = useRef<HTMLDivElement | null>(null)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
	const [loading, setLoading] = useState<boolean>(true)
	const [errorMessage, setErrorMessage] = useState<string>("")
    const navigate = useNavigate()

	useEffect(() => {
		async function fetchProjectDetails() {
			try {
				const res = await fetch(`/api/projects/${id}`, {
					credentials: "include"
				})

				if (!res.ok) {
					throw new Error("Failed to fetch project")
				}

				const data = await res.json()
				setProject(data)

			} catch (err) {
				if (err instanceof Error) {
					setErrorMessage(err.message)
				} else {
					setErrorMessage("An unexpected error occurred")
				}
			} finally {
				setLoading(false)
			}
		}

		fetchProjectDetails()
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

    function showProjectOptions() {
        setEditOptions(prev => !prev)
    }

	if (loading) {
		return <p>Loading project details...</p>
	}

	if (errorMessage || !project) {
		return <p>{errorMessage || "Project not found."}</p>
	}

	return (
		<div className="pageContent">
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
                    <StatusBar percent={20}/>
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
                    <StatusTag label="hardcoded"/>
                </div>

			</header>
            <hr />
			<main>
                <div className="projectMilestonesDiv">
                    <div className="milestoneHeader">
                        <h2>Milestones</h2>
                        <button className="newButton">
                            <Plus />
                            Add Milestone
                        </button>
                    </div>
                    <div className="projectMilestones">
                        

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