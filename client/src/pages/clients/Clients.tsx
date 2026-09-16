import { useEffect, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import ClientEntry from './components/ClientEntry'
import { useSortableClients } from './useSortableClients'

interface Client {
	id: string
	name: string
	companyName: string | null
	email: string
	phone: string | null
	nextDeadline: string | null
	lastActive: string
}

type SortField = 'client' | 'deadline'
type SortDirection = 'asc' | 'desc'

export default function Clients() {
	const [clients, setClients] = useState<Client[]>([])

	const { sortedClients, sortField, sortDirection, handleSort } = useSortableClients(clients)

	useEffect(() => {
		const fetchClients = async () => {
			const res = await fetch('/api/clients', {
				credentials: 'include'
			})
			const data = await res.json()
			setClients(data)
		}

		fetchClients()
	}, [])

	return (
		<div className="pageContent">
			<div className="clientsHeader">
				<div>
					<h1>Clients</h1>
					<p className="clientsSubtitle">
						{clients.length} client{clients.length === 1 ? '' : 's'} across your studio.
					</p>
				</div>
				<button className="newClientButton" type="button">
					<Plus size={16} />
					New Client
				</button>
			</div>

			<div className="clientsTableWrapper">
				<table className="clientsTable">
					<thead>
						<tr>
							<th>
								<SortableHeader
									label="Client"
									field="client"
									activeField={sortField}
									direction={sortDirection}
									onSort={handleSort}
								/>
							</th>
							<th>Contact Info</th>
							<th>
								<SortableHeader
									label="Next Deadline"
									field="deadline"
									activeField={sortField}
									direction={sortDirection}
									onSort={handleSort}
								/>
							</th>
							<th>Last Active</th>
						</tr>
					</thead>
					<tbody> 
						{sortedClients.map(client => (
							<ClientEntry key={client.id} client={client} />
						))}
					</tbody>
				</table>

				{clients.length === 0 && (
					<p className="tableEmptyState">No clients yet.</p>
				)}
			</div>
		</div>
	)
}
// understand
interface SortableHeaderProps {
	label: string
	field: SortField
	activeField: SortField
	direction: SortDirection
	onSort: (field: SortField) => void
}

// understand
function SortableHeader({ label, field, activeField, direction, onSort }: SortableHeaderProps) {
	const isActive = field === activeField

	return (
		<button
			type="button"
			className="sortableHeader"
			onClick={() => onSort(field)}
		>
			{label}
			{isActive ? (
				direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
			) : (
				<ChevronsUpDown size={14} style={{ opacity: 0.35 }} />
			)}
		</button>
	)
}