import type {Client} from "../pages/clients/Clients"
import type { Dispatch, SetStateAction } from "react"
import { X } from 'lucide-react'

interface areYouSureProps {
    client: Client
    setAreYouSure: Dispatch<SetStateAction<boolean>>
    deleteClient: () => void
}

export default function AreYouSureModal({ client, setAreYouSure, deleteClient }: areYouSureProps) {
    return (
        <div className="modalOverlay">
            <div className="areYouSureModal">
                <div className="areYouSureModalTop">
                    <button onClick={()=>setAreYouSure(false)}><X /></button>
                    <h2>Do you want to delete client?</h2>
                </div>
                <h1>{client.companyName ? client.companyName : client.name}</h1>
                <p>Deleting client will result in projects related with them to be deleted as well.</p>
                <div className="areYouSureModalButtons">
                    <button className="areYouSureCancelButton" onClick={()=>setAreYouSure(false)}>Cancel</button>
                    <button className="areYouSureProceedButton" onClick={deleteClient}>Proceed</button>
                </div>
            </div>
        </div>
    )
}