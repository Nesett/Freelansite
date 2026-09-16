import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { User, Mail, Plus } from 'lucide-react'
import ProjectComponent from "./components/ProjectComponent"

interface Client {
	id: string
	name: string
	companyName: string | null
	email: string
	phone: string | null
	nextDeadline: string | null
	lastActive: string
}

interface ClientEntryProps {
	client?: Client
}


export default function ClientsDetails({ client }: ClientEntryProps) {
    const [clientData, setClientData] = useState<Client | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
		const fetchClient = async () => {
			if (!id) return
			try {
				const res = await fetch(`/api/clients/${id}`, {
					credentials: 'include'
				})
				const data = await res.json()
				setClientData(data)
			} catch (error) {
				console.error("Failed to load client:", error)
			} finally {
				setLoading(false)
			}
		}

		fetchClient()
	}, [id])

    if (loading) {
		return <div>Loading client details...</div>
	}

    if (!clientData) {
		return <div>Client not found.</div>
	}


    console.log(clientData)
    return(<>
            {clientData.companyName ? (
                <header>
                    <div className="clientPageTitle">
                        <h2>{clientData.companyName}</h2>
                    </div>
                    <div className="smallClientInfoContainer">
                        <div className="smallClientInfo">
                            <User />
                            <p>{clientData.name}</p>
                        </div>
                        <div className="smallClientInfo">
                            <Mail />
                            <p>{clientData.email}</p>
                        </div>
                    </div>

                </header>
            ) : (
                <header>
                    <div className="clientPageTitle">
                        <h2>{clientData.name}</h2>
                    </div>
                    <div className="smallClientInfoContainer">
                        <div className="smallClientInfo">
                            <Mail />
                            <p>{clientData.email}</p>
                        </div>
                    </div>
                </header>
            )}
            <hr/>
            <main>
                <div>
                    <h3>Projects</h3>
                    <button>
                        <Plus />
                        New Project
                    </button>
                </div>
                <div className="projectsHolder">
                    <ProjectComponent />
                </div>
            </main>
        </>
    )
}