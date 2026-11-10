import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, EllipsisVertical, Printer } from 'lucide-react'
import { formatInvoiceNumber, STATUS_LABELS } from '../components/InvoiceEntry'
import type { InvoiceStatus } from './Invoices'
import InvoiceFormModal from '../components/InvoiceFormModal'
import AreYouSureModal from '../components/AreYouSureModal'
import { useAuth } from '../context/AuthContext'

interface InvoiceItem {
	id: string
	title: string
	description: string | null
	amount: number
	quantity: number
	milestoneId: string | null
}

interface InvoiceDetail {
	id: string
	number: number
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
	const { user } = useAuth()
	const navigate = useNavigate()
	const isAdmin = user?.role === 'admin'
	const location = useLocation()
	const canGoBack = location.key !== 'default'


	const [ invoice, setInvoice ] = useState<InvoiceDetail | null>(null)
	const [ loading, setLoading ] = useState(true)
	const [ saving, setSaving ] = useState(false)
	const [ error, setError ] = useState('')
	const [ showEdit, setShowEdit ] = useState(false)
	const [ showOptions, setShowOptions ] = useState(false)
	const [ showDelete, setShowDelete ] = useState(false)
	const optionsRef = useRef<HTMLDivElement | null>(null)

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
        document.title = `Invoice ${formatInvoiceNumber(invoice.number)}`

        return () => {
            document.title = previousTitle
        }
    }, [invoice])

	useEffect(() => {
		if (!showOptions) return

		function onMouseDown(e: MouseEvent) {
			if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
				setShowOptions(false)
			}
		}

		document.addEventListener('mousedown', onMouseDown)
		return () => document.removeEventListener('mousedown', onMouseDown)
	}, [showOptions])

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

	async function handleDelete() {
		if (!invoice) return

		try {
			const res = await fetch(`/api/invoices/${invoice.id}`, {
				method: 'DELETE',
				credentials: 'include'
			})

			if (!res.ok) {
				const data = await res.json().catch(() => null)
				throw new Error(data?.error || 'Could not delete the invoice.')
			}

			setShowDelete(false)
			navigate('/invoices')
		} catch (err) {
			setShowDelete(false)
			setError(err instanceof Error ? err.message : 'Could not delete the invoice.')
		}
	}

	function handleSaved(data: unknown) {
		const { updatedInvoice } = data as { updatedInvoice: Partial<InvoiceDetail> }
		setInvoice(prev => prev ? { ...prev, ...updatedInvoice } : prev)
		setShowEdit(false)
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

	function goBack() {
		if (canGoBack) {
			navigate(-1)
		} else {
			navigate('/invoices')
		}
	}

	return (
		<div className="pageContent">
			{showEdit && (
				<InvoiceFormModal
					projectId={invoice.project.id}
					projectTitle={invoice.project.title}
					invoice={invoice}
					onClose={() => setShowEdit(false)}
					onSaved={handleSaved}
				/>
			)}
			{showDelete && (
				<AreYouSureModal
					itemType="invoice"
					itemName={formatInvoiceNumber(invoice.number)}
					warningMessage="This invoice will be removed from the project."
					setAreYouSure={setShowDelete}
					onConfirm={handleDelete}
				/>
			)}
			<div className="invoiceSheet">
				<div className="invoiceSheetTop">
					<button type="button" className="invoiceBackLink invoiceNoPrint" onClick={goBack}>
						<ArrowLeft size={16} />
						Back
					</button>
					<span className={`statusPill statusPill--${invoice.status.toLowerCase()}`}>
						{STATUS_LABELS[invoice.status]}
					</span>
				</div>

				<div className="invoiceTitleRow">
					<div>
						<p className="invoiceNumber">{formatInvoiceNumber(invoice.number)}</p>
						<h1>Invoice</h1>
					</div>

					<div className="invoiceActions invoiceNoPrint">
						{isAdmin ? (
							<div className="projectOptionsWrapper" ref={optionsRef}>
								<button
									type="button"
									className="projectOptionsButton"
									onClick={() => setShowOptions(prev => !prev)}
									aria-label="Invoice options"
								>
									<EllipsisVertical />
								</button>
								{showOptions && (
									<div className="clientOptionsMenu">
										{invoice.status !== 'PAID' && (
											<button
												type="button"
												className="clientOptionsMenuItem"
												onClick={() => { setShowOptions(false); handleMarkAsPaid() }}
												disabled={saving}
											>
												Mark as paid
											</button>
										)}
										<button
											type="button"
											className="clientOptionsMenuItem"
											onClick={() => { setShowOptions(false); window.print() }}
										>
											Print
										</button>
										{invoice.status !== 'PAID' && (
											<button
												type="button"
												className="clientOptionsMenuItem"
												onClick={() => { setShowOptions(false); setShowEdit(true) }}
											>
												Edit
											</button>
										)}
										<button
											type="button"
											className="clientOptionsMenuItem"
											onClick={() => { setShowOptions(false); setShowDelete(true) }}
										>
											Delete
										</button>
									</div>
								)}
							</div>
						) : (
							<button
								className="invoiceSecondaryButton"
								type="button"
								onClick={() => window.print()}
							>
								<Printer size={16} />
								Print / Download PDF
							</button>
						)}
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