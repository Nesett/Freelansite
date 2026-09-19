import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { User, Mail, Plus, EllipsisVertical, X } from 'lucide-react'
import ProjectComponent from "../../components/ProjectEntry"
import AreYouSureModal from "../../components/AreYouSureModal"
import useClickOutside from "../../utils/clicksOutside"
import type { Client } from "./Clients"
import type { Project } from "../Projects"

export default function ClientsDetails() {
    const [client, setClient] = useState<Client | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
    const [showNewProjectForm, setShowNewProjectForm] = useState<boolean>(false)
    const { id } = useParams<{ id: string }>()
    const clientOptionsRef = useRef<HTMLDivElement | null>(null)
    const [ errorMessage, setErrorMessage] = useState<string>("")
    const [ projectTitle, setProjectTitle ] = useState<string>("")
    const [ projectDescription, setProjectDescription] = useState<string>("")
    const [ projectBudget, setProjectBudget ] = useState<number | "">("")
    const [ projectDeadline, setProjectDeadline ] = useState<string>("")
    const [ hasDeadline, setHasDeadline ] = useState<boolean>(false)

    const navigate = useNavigate()

    useClickOutside(editOptions, () => setEditOptions(false), clientOptionsRef)



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
					throw new Error("Request failed.")
				}

				const clientJson = await clientRes.json()
				const projectsJson = await projectsRes.json()

				if (isFinished) {
					setClient(clientJson)
					setProjects(projectsJson)
				}
			} catch (err) {
                if (err instanceof Error) {
                    setErrorMessage(err.message)
                } else {
                    setErrorMessage("An unexpected error occured.")
                    console.error("error:", err)
                }
				
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


    async function deleteClient() {
        try{ 
            const res = await fetch(`/api/clients/${id}`, {
                method:'DELETE',
                credentials: 'include'
            })

            if (!res.ok) {
                throw new Error("Request failed")
            }

            setAreYouSure(false)
            navigate("/clients")

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occured while deleting client.")
                console.error("error:", err)
            }
        }
    }

    async function handleAddNewProject(e: React.FormEvent) {
        e.preventDefault()
        try{ 
            const res = await fetch(`/api/projects/`, {
                method:'POST',
                headers: {"Content-Type": "application/json"},
                credentials: 'include',
                body: JSON.stringify({
                    clientId: id,
					title: projectTitle,
					description: projectDescription,
					budget: projectBudget,
					deadline: projectDeadline
				})
            })

            if (!res.ok) {
                throw new Error("Request failed")
            }

            const data = await res.json()


            navigate(`/projects/${data.newProject.id}`)

        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(err.message)
            } else {
                setErrorMessage("An unexpected error occured while deleting client.")
                console.error("error:", err)
            }
        }
    }

    if (loading) {
        return <div>Loading client details...</div>
    }

    if (!client) {
        return <div>Client not found.</div>
    }


    
    function showClientOptions() {
        setEditOptions(prev => !prev)
    }

	function showProjectModal() {
		setShowNewProjectForm(prevShown => !prevShown)
	}

    return(
        <div className="pageContent">
            {areYouSure && (
                <AreYouSureModal 
                    itemType="client"
                    itemName={client.companyName ? client.companyName : client.name}
                    warningMessage="Deleting client will result in projects related with them to be deleted as well."
                    setAreYouSure={setAreYouSure} 
                    onConfirm={deleteClient}
                />
            )}
            {showNewProjectForm && (
				<div className="modalOverlay" onClick={showProjectModal}>
					<div className="newClientModal" onClick={(e) => e.stopPropagation()}>
						<div className='newClientModalTop'>
							<button onClick={showProjectModal}><X size={16}/></button>
							<h2>Add new project </h2>
						</div>
						<form onSubmit={handleAddNewProject}>
							<label htmlFor='title'>Title</label>
							<input 
								id='title' 
								name='title' 
								type='textarea'
                                placeholder="E-commerce platform"
								onChange={(e) => setProjectTitle(e.target.value)}
                                required
							/>
							<label htmlFor='description'>Description</label>
							<textarea 
								id='description' 
								name='description' 
								onChange={(e) => setProjectDescription(e.target.value)}
							></textarea>
                            <label htmlFor='budget'>Budget</label>
                                <input 
                                    id='budget' 
                                    name='budget' 
                                    type='number' 
                                    value={projectBudget}
                                    onChange={(e) => setProjectBudget(e.target.value ? Number(e.target.value) : "")}
                                />
							<label htmlFor='deadline'>Deadline</label>
                            <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
                                    <input 
                                        type="checkbox" 
                                        checked={hasDeadline} 
                                        onChange={(e) => {
                                            setHasDeadline(e.target.checked)
                                            if (!e.target.checked) {
                                                setProjectDeadline("")
                                            }
                                        }} 
                                    />
                                    Set a deadline?
                                </label>
                                {hasDeadline && (
                                    <>
                                        <input 
                                            id='deadline' 
                                            name='deadline' 
                                            type='date' 
                                            value={projectDeadline}
                                            onChange={(e) => setProjectDeadline(e.target.value)}
                                        />
                                    </>
                                )}
							<button> Add new project </button>
						</form>
					</div>
				</div>
			)}
            <header>
            {client.companyName ? (
                <>
                    <div className="clientPageTitle">
                        <h2>{client.companyName}</h2>
                        <div className="clientOptionsWrapper" ref={clientOptionsRef}>
                            <button onClick={showClientOptions}><EllipsisVertical /></button>
                            {editOptions && (
                                <div className="clientOptionsMenu">
                                    <button onClick={()=>setAreYouSure(prev=>!prev)} className="clientOptionsMenuItem">Delete client</button>
                                </div>
                            )}
                        </div>
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
                </>
            ) : (
                <>
                    <div className="clientPageTitle">
                        <h2>{client.name}</h2>
                        <div className="clientOptionsWrapper" ref={clientOptionsRef}>
                            <button onClick={showClientOptions}><EllipsisVertical /></button>
                            {editOptions && (
                                <div className="clientOptionsMenu">
                                    <button onClick={()=>setAreYouSure(prev=>!prev)} className="clientOptionsMenuItem">Delete client</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="smallClientInfoContainer">
                        <div className="smallClientInfo">
                            <Mail />
                            <p>{client.email}</p>
                        </div>
                    </div>
                </>
            )}
            </header>
            <hr/>
            <main>
				<div className="projectsSectionHeader">
					<h3>Projects</h3>
					<button onClick={()=>setShowNewProjectForm(prev=>!prev)} className="newButton">
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