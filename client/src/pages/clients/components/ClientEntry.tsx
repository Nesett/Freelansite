interface Client {
	id: string
	name: string
	companyName: string | null
	email: string
	phone: string | null
	lastActive: string
}

interface ClientEntryProps {
	client: Client
}

export default function ClientEntry({ client }: ClientEntryProps) {
	return (
		<div className="clientComponent">
			<div>
				<p>{client.companyName}</p>
				<p>{client.name}</p>
			</div>
			<div>
				<p>{client.email}</p>
				<p>{client.phone}</p>
			</div>
			<div>
				<p>deadline, cannot implement yet (need milestones)</p>
			</div>
			<div>
				<p>{client.lastActive}</p>
			</div>
		</div>
	)
}