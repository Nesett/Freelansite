import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatInvoiceNumber, STATUS_LABELS } from '../components/InvoiceEntry'
import type { InvoiceStatus } from './Invoices'

interface InvoiceItem {
	id: string
	title: string
	description: string | null
	amount: number
	quantity: number
}

interface InvoiceDetail {
	id: string
	status: InvoiceStatus
	deadline: string
	issueDate: string
	total: number
	adminName: string
	adminAddress: string
	clientName: string
	clientAddress: string
	items: InvoiceItem[]
	project: {
		id: string
		title: string
		admin: { email: string }
		client: { email: string }
	}
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})


function formatMoney(value: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(value)
}

export default function InvoiceDetails() {
	const { id } = useParams()

	const [ invoice, setInvoice ] = useState<InvoiceDetail | null>(null)
	const [ loading, setLoading ] = useState(true)
	const [ saving, setSaving ] = useState(false)
	const [ error, setError ] = useState('')

	useEffect(() => {
		let cancelled = false

		const fetchInvoice = async () => {
			try {
				const res = await fetch(`/api/invoices/${id}`, {
					credentials: 'include'
				})
				const data = await res.json()

				if (cancelled) return

				if (res.ok) {
					setInvoice(data.invoice)
				} else {
					setError(data.error || 'Could not load the invoice.')
				}
			} catch {
				if (!cancelled) setError('Could not load the invoice.')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		fetchInvoice()

		return () => {
			cancelled = true
		}
	}, [id])

    useEffect(() => {
        if (!invoice) return

        const previousTitle = document.title
        document.title = `Invoice ${formatInvoiceNumber(invoice.id)}`

        return () => {
            document.title = previousTitle
        }
    }, [invoice])

	const handleMarkAsPaid = async () => {
		if (!invoice) return

		setSaving(true)
		setError('')

		try {
			const res = await fetch(`/api/invoices/${invoice.id}`, {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'PAID' })
			})
			const data = await res.json()

			if (!res.ok) {
				setError(data.error || 'Could not update the invoice.')
				return
			}

			setInvoice({ ...invoice, status: data.updatedInvoice.status })
		} catch {
			setError('Could not update the invoice.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="pageContent">
				<p className="tableEmptyState">Loading invoice...</p>
			</div>
		)
	}

	if (!invoice) {
		return (
			<div className="pageContent">
				<p className="tableEmptyState">{error || 'Invoice not found.'}</p>
			</div>
		)
	}


	return (
		<div className="pageContent">
			<div className="invoiceSheet">
				<div className="invoiceSheetTop">
					<Link to="/invoices" className="invoiceBackLink invoiceNoPrint">
						<ArrowLeft size={16} />
						Back to invoices
					</Link>
					<span className={`statusPill statusPill--${invoice.status.toLowerCase()}`}>
						{STATUS_LABELS[invoice.status]}
					</span>
				</div>

				<div className="invoiceTitleRow">
					<div>
						<p className="invoiceNumber">{formatInvoiceNumber(invoice.id)}</p>
						<h1>Invoice</h1>
					</div>

					<div className="invoiceActions invoiceNoPrint">
						{invoice.status !== 'PAID' && (
							<button
								className="newButton"
								type="button"
								onClick={handleMarkAsPaid}
								disabled={saving}
							>
								{saving ? 'Saving...' : 'Mark as Paid'}
							</button>
						)}
						<button
							className="invoiceSecondaryButton"
							type="button"
							onClick={() => window.print()}
						>
							<Printer size={16} />
							Print / Download PDF
						</button>
					</div>
				</div>

				{error && <p className="errorMessage invoiceError invoiceNoPrint">{error}</p>}

				<div className="invoiceParties">
					<div>
						<p className="invoiceLabel">From</p>
						<p className="invoicePartyName">{invoice.adminName}</p>
						<p className="invoicePartyLine">{invoice.project.admin.email}</p>
						<p className="invoicePartyLine">{invoice.adminAddress}</p>
					</div>

					<div>
						<p className="invoiceLabel">Bill to</p>
						<p className="invoicePartyName">{invoice.clientName}</p>
						<p className="invoicePartyLine">{invoice.project.client.email}</p>
						<p className="invoicePartyLine">{invoice.clientAddress}</p>
						<p className="invoicePartyLine">{invoice.project.title}</p>
					</div>

					<div>
						<p className="invoiceLabel">Issue date</p>
						<p className="invoiceDateValue">{dateFormatter.format(new Date(invoice.issueDate))}</p>
					</div>

					<div>
						<p className="invoiceLabel">Due date</p>
						<p className="invoiceDateValue">{dateFormatter.format(new Date(invoice.deadline))}</p>
					</div>
				</div>

				<div className="invoiceItemsWrapper">
					<table className="invoiceItemsTable">
						<thead>
							<tr>
								<th>Description</th>
								<th>Qty</th>
								<th>Rate</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
							{invoice.items.map(item => (
								<tr key={item.id}>
									<td>
										<div>{item.title}</div>
										{item.description && (
											<div className="invoiceItemDescription">{item.description}</div>
										)}
									</td>
									<td>{item.quantity}</td>
									<td>{formatMoney(item.amount)}</td>
									<td>{formatMoney(item.amount * item.quantity)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="invoiceTotals">
					<div className="invoiceTotalRow">
						<span>Total</span>
						<span>{formatMoney(invoice.total)}</span>
					</div>
				</div>
			</div>
		</div>
	)
}