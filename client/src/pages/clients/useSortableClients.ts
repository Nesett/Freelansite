import { useState, useMemo } from 'react'

//why do we import client everywhere? cant we use some "global" client interface across files that need it?
export interface Client {
	id: string
	name: string
	companyName: string | null
	email: string
	phone: string | null
	nextDeadline: string | null
	lastActive: string
}

// understand
export type SortField = 'client' | 'deadline'
export type SortDirection = 'asc' | 'desc'

export function useSortableClients(clients: Client[]) {
	const [sortField, setSortField] = useState<SortField>('client')
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    //understand
	const handleSort = (field: SortField) => {
		if (field === sortField) {
			setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

    //understand this whole function
	const sortedClients = useMemo(() => {
		const sorted = [...clients]

		sorted.sort((a, b) => {
			if (sortField === 'client') {
				const aKey = (a.companyName ?? a.name).toLowerCase()
				const bKey = (b.companyName ?? b.name).toLowerCase()
				const comparison = aKey.localeCompare(bKey)
				return sortDirection === 'asc' ? comparison : -comparison
			}

			if (a.nextDeadline === null && b.nextDeadline === null) return 0
			if (a.nextDeadline === null) return 1
			if (b.nextDeadline === null) return -1

			const comparison = new Date(a.nextDeadline).getTime() - new Date(b.nextDeadline).getTime()
			return sortDirection === 'asc' ? comparison : -comparison
		})

		return sorted
	}, [clients, sortField, sortDirection]) // what is that that we pass after the function? is it for useMemo? how does it work?

	return { sortedClients, sortField, sortDirection, handleSort }
}