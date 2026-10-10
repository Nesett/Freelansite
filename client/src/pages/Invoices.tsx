import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import InvoiceEntry from '../components/InvoiceEntry'

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE'
type InvoiceFilter = 'ALL' | InvoiceStatus

export interface Invoice {
	id: string
	status: InvoiceStatus
	deadline: string
	issueDate: string
	total: number
	clientName: string
	project: {
		id: string
		title: string
		client: {
			id: string
			email: string
		}
	}
}

const FILTERS: { label: string, value: InvoiceFilter }[] = [
	{ label: 'All invoices', value: 'ALL' },
	{ label: 'Paid', value: 'PAID' },
	{ label: 'Unpaid', value: 'UNPAID' },
	{ label: 'Overdue', value: 'OVERDUE' }
]

export default function Invoices() {
	const [ invoices, setInvoices ] = useState<Invoice[]>([])
	const [ activeFilter, setActiveFilter ] = useState<InvoiceFilter>('ALL')

	useEffect(() => {
		const fetchInvoices = async () => {
			const res = await fetch('/api/invoices', {
				credentials: 'include'
			})
			const data = await res.json()

			if (res.ok) {
				setInvoices(data)
			}
		}

		fetchInvoices()
	}, [])

	const visibleInvoices = activeFilter === 'ALL'
		? invoices
		: invoices.filter(invoice => invoice.status === activeFilter)

	return (
		<div className="pageContent">
			<div className="clientsHeader">
				<div>
					<h1>Invoices</h1>
					<p className="clientsSubtitle">
						Track billing across all your clients and projects.
					</p>
				</div>
				<button className="newButton" type="button">
					<Plus size={16} />
					New Invoice
				</button>
			</div>

			<div className="invoiceTabs">
				{FILTERS.map(filter => (
					<button
						key={filter.value}
						type="button"
						className={`invoiceTab ${activeFilter === filter.value ? 'invoiceTab--active' : ''}`}
						onClick={() => setActiveFilter(filter.value)}
					>
						{filter.label}
					</button>
				))}
			</div>

			<div className="clientsTableWrapper">
				<table className="clientsTable">
					<thead>
						<tr>
							<th>Client</th>
							<th>Project</th>
							<th>Invoice</th>
							<th>Amount</th>
							<th>Due date</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{visibleInvoices.map(invoice => (
							<InvoiceEntry key={invoice.id} invoice={invoice} />
						))}
					</tbody>
				</table>

				{visibleInvoices.length === 0 && (
					<p className="tableEmptyState">No invoices to show.</p>
				)}
			</div>
		</div>
	)
}