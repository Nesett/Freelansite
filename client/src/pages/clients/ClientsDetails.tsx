import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { User, Mail, Plus, EllipsisVertical } from 'lucide-react'
import ProjectComponent from "../../components/ProjectComponent"
import AreYouSureModal from "../../components/AreYouSureModal"
import useClickOutside from "../../components/clicksOutside"
import type { Client } from "./Clients"
import type { Project } from "../Projects"


export default function ClientsDetails() {
    const [client, setClient] = useState<Client | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [editOptions, setEditOptions] = useState<boolean>(false)
    const [areYouSure, setAreYouSure] = useState<boolean>(false)
    const { id } = useParams<{ id: string }>()
    const clientOptionsRef = useRef<HTMLDivElement | null>(null)
    const [ errorMessage, setErrorMessage] = useState<string>("")
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


    if (loading) {
        return <div>Loading client details...</div>
    }

    if (!client) {
        return <div>Client not found.</div>
    }


    
    function showClientOptions() {
        setEditOptions(prev => !prev)
    }

    return(
        <div className="pageContent">
            {areYouSure && (
                <AreYouSureModal 
                    client={client} 
                    setAreYouSure={setAreYouSure} 
                    deleteClient={deleteClient}
                />
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