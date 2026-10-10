import { useNavigate } from 'react-router-dom'
import type { Invoice, InvoiceStatus } from '../pages/Invoices'

interface InvoiceEntryProps {
	invoice: Invoice
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})

const amountFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 2,
})

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
	PAID: 'Paid',
	UNPAID: 'Unpaid',
	OVERDUE: 'Overdue',
}

// placeholder, i dont know yet how i want to solve the invoice numbers
export function formatInvoiceNumber(id: string) {
	return `#${id.slice(0, 6)}`
}

export default function InvoiceEntry({ invoice }: InvoiceEntryProps) {
	const navigate = useNavigate()

	return (
		<tr
			className="clickableEntry"
			onClick={() => navigate(`/invoices/${invoice.id}`)}
		>
			<td>
				<div className="clientPrimary">{invoice.clientName}</div>
				<div className="clientSecondary">{invoice.project.client.email}</div>
			</td>
			<td>{invoice.project.title}</td>
			<td className="invoiceNumber">{formatInvoiceNumber(invoice.id)}</td>
			<td className="invoiceAmount">{amountFormatter.format(invoice.total)}</td>
			<td>{dateFormatter.format(new Date(invoice.deadline))}</td>
			<td>
				<span className={`statusPill statusPill--${invoice.status.toLowerCase()}`}>
					{STATUS_LABELS[invoice.status]}
				</span>
			</td>
		</tr>
	)
}