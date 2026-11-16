import { useEffect, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import ClientEntry from '../components/ClientEntry'
import NewClientModal from '../components/NewClientModal'
import { useSortableClients } from '../utils/useSortableClients'
import { useUpgrade } from '../context/UpgradeContext'
import { useToast } from '../context/ToastContext'

export interface Client {
    id: string
    name: string | null
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
    const [showNewClientModal, setShowNewClientModal] = useState(false)
    const { showError } = useToast()
    const { checkLimit } = useUpgrade()

    const { sortedClients, sortField, sortDirection, handleSort } = useSortableClients(clients)

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch('/api/clients', {
                    credentials: 'include'
                })
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || 'Could not load clients.')
                }

                setClients(data)
            } catch (err: unknown) {
                showError(err instanceof Error ? err.message : 'An unexpected error occured.')
            }
        }

        fetchClients()
    }, [])

    async function handleNewClientClick() {
        if (await checkLimit('clients')) {
            setShowNewClientModal(true)
        }
    }

    return (
        <div className="pageContent">
            {showNewClientModal && (
                <NewClientModal onClose={() => setShowNewClientModal(false)} />
            )}
            <div className="clientsHeader">
                <div>
                    <h1>Clients</h1>
                    <p className="clientsSubtitle">
                        {clients.length} client{clients.length === 1 ? '' : 's'} across your studio.
                    </p>
                </div>
                <button onClick={handleNewClientClick} className="newButton" type="button" disabled={showNewClientModal}>
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