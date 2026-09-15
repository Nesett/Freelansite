import { useEffect, useState } from 'react'
import ClientEntry from './components/ClientEntry'


interface Client {
	id: string
	name: string
	companyName: string | null
	email: string
	phone: string | null
	lastActive: string
}

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([])
	

	useEffect(() => {
		const fetchClients = async () => {
			const res = await fetch('/api/clients',
				{credentials: 'include'}
			)
			const data = await res.json()
			setClients(data)
		}

		fetchClients()
	}, [])

	const allClients = clients.map(client => (
		<ClientEntry key={client.id} client={client} />
	))

    return (
        <>
            <h1>Clients</h1>
            <div>
                {allClients}
            </div>
        </>
    )
}