import { useState, useMemo } from 'react'
import type { Client } from '../pages/Clients'


export type SortField = 'client' | 'deadline'
export type SortDirection = 'asc' | 'desc'

export function useSortableClients(clients: Client[]) {
	const [sortField, setSortField] = useState<SortField>('client')
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

	const handleSort = (field: SortField) => {
		if (field === sortField) {
			setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

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
	}, [clients, sortField, sortDirection])

	return { sortedClients, sortField, sortDirection, handleSort }
}