import { useEffect, useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import ClientEntry from '../../components/ClientEntry'
import { useSortableClients } from '../../utils/useSortableClients'
import { useNavigate } from 'react-router-dom'


export interface Client {
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
	const [ clients, setClients ] = useState<Client[]>([])
	const [ showNewClientModal, setShowNewClientModal ] = useState(false)
	const [ clientEmail, setClientEmail ] = useState('')
	const [ clientName, setClientName ] = useState('')
	const [ clientCname, setClientCname ] = useState('')
	const [ clientPhone, setClientPhone ] = useState('')
	const [ errorMessage, setErrorMessage ]= useState('')
	const navigate = useNavigate()

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

	function showClientModal() {
		setShowNewClientModal(prevShown => !prevShown)
	}

	async function handleAddNewClient(e: React.FormEvent) {
		e.preventDefault()

		try {

			const response = await fetch(`/api/clients`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				credentials: "include",
				body: JSON.stringify({
					name: clientName,
					companyName: clientCname,
					email: clientEmail,
					phone: clientPhone
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Something went wrong")
			}

			console.log("Added new client.")
			navigate(`/clients/${data.newClient.id}`)

		} catch(err: unknown) {
			if (err instanceof Error) {
				setErrorMessage(err.message)
				console.log(errorMessage)
			} else {
				setErrorMessage("An unexpected error occured.")
			}
		}

	}

	return (
		<div className="pageContent">
			{showNewClientModal && (
				<div className="modalOverlay" onClick={showClientModal}>
					<div className="newClientModal" onClick={(e) => e.stopPropagation()}>
						<div className='newClientModalTop'>
							<button onClick={showClientModal}><X size={16}/></button>
							<h2>Add new client</h2>
						</div>
						<form onSubmit={handleAddNewClient}>
							<label htmlFor='name'>Name</label>
							<input 
								id='name' 
								name='name' 
								type='text' 
								onChange={(e) => setClientName(e.target.value)}
							/>
							<label htmlFor='companyName'>Company Name</label>
							<input 
								id='companyName' 
								name='companyName' 
								type='text' 
								onChange={(e) => setClientCname(e.target.value)}
							/>
							<label htmlFor='email'>Email</label>
							<input 
								id='email' 
								name='email' 
								type='text' 
								onChange={(e) => setClientEmail(e.target.value)}
								required
							/>
							<label htmlFor='phoneNr'>Phone Number</label>
							<input 
								id='phoneNr' 
								name='phoneNr' 
								type='text' 
								onChange={(e) => setClientPhone(e.target.value)}
							/>
							<button> Add and invite new client</button>
						</form>
					</div>
				</div>
			)}
			<div className="clientsHeader">
				<div>
					<h1>Clients</h1>
					<p className="clientsSubtitle">
						{clients.length} client{clients.length === 1 ? '' : 's'} across your studio.
					</p>
				</div>
				<button onClick= {showClientModal} className="newButton" type="button" disabled={showNewClientModal}>
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

interface SortableHeaderProps {
	label: string
	field: SortField
	activeField: SortField
	direction: SortDirection
	onSort: (field: SortField) => void
}


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