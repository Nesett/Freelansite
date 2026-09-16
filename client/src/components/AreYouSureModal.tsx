import type {Client} from "../pages/clients/Clients"
import type { Dispatch, SetStateAction } from "react"

interface areYouSureProps {
    client: Client
    setAreYouSure: Dispatch<SetStateAction<boolean>>
    deleteClient: () => void
}

export default function AreYouSureModal({ client, setAreYouSure, deleteClient }: areYouSureProps) {
    return (
        <div className="areYouSureModal">
            <h2>Do you want to delete client?</h2>
            <h1>{client.companyName ? client.companyName : client.name}</h1>
            <p>This action is unreversable.</p>
            <div className="areYouSureModalButtons">
                <button onClick={()=>setAreYouSure(false)}>Cancel</button>
                <button onClick={deleteClient}>Proceed</button>
            </div>
        </div>
    )
}