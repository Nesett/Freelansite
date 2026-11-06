import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Plus, Trash2, X } from "lucide-react"

interface MilestoneOption {
    id: string
    title: string
    budget: number | null
    orderIndex: number
}

export interface InvoiceFormInvoice {
    id: string
    deadline: string
    adminName: string
    adminAddress: string
    clientName: string
    clientAddress: string
    items: {
        id: string
        title: string
        description: string | null
        amount: number
        quantity: number
        milestoneId?: string | null
    }[]
}

interface InvoiceFormDefaults {
    adminName: string
    adminAddress: string
    clientName: string
    clientAddress: string
}

interface Props {
    projectId: string
    projectTitle: string
    invoice?: InvoiceFormInvoice
    defaults?: InvoiceFormDefaults
    onClose: () => void
    onSaved: (data: unknown) => void
}

interface Row {
    key: string
    milestoneId: string | null
    title: string
    description: string
    showDescription: boolean
    amount: string
    quantity: string
}

function formatMoney(value: number) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function defaultDeadline() {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export default function InvoiceFormModal({ projectId, projectTitle, invoice, defaults, onClose, onSaved }: Props) {
    const rowCounter = useRef(0)

    function newRow(patch: Partial<Row> = {}): Row {
        rowCounter.current += 1
        return {
            key: `row-${rowCounter.current}`,
            milestoneId: null,
            title: "",
            description: "",
            showDescription: false,
            amount: "",
            quantity: "1",
            ...patch
        }
    }

    const [adminName, setAdminName] = useState(invoice?.adminName ?? defaults?.adminName ?? "")
    const [adminAddress, setAdminAddress] = useState(invoice?.adminAddress ?? defaults?.adminAddress ?? "")
    const [clientName, setClientName] = useState(invoice?.clientName ?? defaults?.clientName ?? "")
    const [clientAddress, setClientAddress] = useState(invoice?.clientAddress ?? defaults?.clientAddress ?? "")
    const [deadline, setDeadline] = useState(invoice ? invoice.deadline.slice(0, 10) : defaultDeadline())
    const [rows, setRows] = useState<Row[]>(() =>
        invoice
            ? invoice.items.map(item => newRow({
                milestoneId: item.milestoneId ?? null,
                title: item.title,
                description: item.description ?? "",
                showDescription: !!item.description,
                amount: String(item.amount),
                quantity: String(item.quantity)
            }))
            : [newRow()]
    )

    const [milestones, setMilestones] = useState<MilestoneOption[]>([])
    const [invoicedMilestoneIds, setInvoicedMilestoneIds] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false

        async function loadOptions() {
            try {
                const [milestonesRes, invoicesRes] = await Promise.all([
                    fetch(`/api/milestones?projectId=${projectId}`, { credentials: "include" }),
                    fetch(`/api/projects/${projectId}/invoices`, { credentials: "include" })
                ])

                if (!milestonesRes.ok || !invoicesRes.ok) {
                    throw new Error("Could not load milestones.")
                }

                const milestonesJson: MilestoneOption[] = await milestonesRes.json()
                const invoicesJson: { id: string, items: { milestoneId: string | null }[] }[] = await invoicesRes.json()

                if (cancelled) return

                // milestones already on another invoice are hidden from the picker
                const ids = invoicesJson
                    .filter(inv => inv.id !== invoice?.id)
                    .flatMap(inv => inv.items.map(item => item.milestoneId))
                    .filter((id): id is string => !!id)

                setMilestones([...milestonesJson].sort((a, b) => a.orderIndex - b.orderIndex))
                setInvoicedMilestoneIds(new Set(ids))
            } catch {
                if (!cancelled) setError("Could not load milestones. You can still add custom items.")
            }
        }

        loadOptions()

        return () => {
            cancelled = true
        }
    }, [projectId, invoice?.id])

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onClose])

    const usedInRows = new Set(rows.map(r => r.milestoneId).filter((id): id is string => !!id))
    const availableMilestones = milestones.filter(m => !invoicedMilestoneIds.has(m.id) && !usedInRows.has(m.id))

    const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0) * (Number(r.quantity) || 0), 0)

    function updateRow(key: string, patch: Partial<Row>) {
        setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r))
    }

    function removeRow(key: string) {
        setRows(prev => prev.filter(r => r.key !== key))
    }

    function addCustomRow() {
        setRows(prev => [...prev, newRow()])
    }

    function addMilestoneRow(milestoneId: string) {
        const milestone = milestones.find(m => m.id === milestoneId)
        if (!milestone) return

        setRows(prev => [
            // drop untouched blank rows so the picked milestone doesn't sit under an empty one
            ...prev.filter(r => r.milestoneId || r.title || r.amount),
            newRow({
                milestoneId: milestone.id,
                title: milestone.title,
                amount: milestone.budget !== null ? String(milestone.budget) : ""
            })
        ])
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError("")

        if (!adminName.trim() || !adminAddress.trim() || !clientName.trim() || !clientAddress.trim()) {
            setError("Fill in the name and address for both sides.")
            return
        }

        if (!deadline) {
            setError("Choose a due date.")
            return
        }

        if (rows.length === 0) {
            setError("Add at least one item.")
            return
        }

        for (const row of rows) {
            const amount = Number(row.amount)
            const quantity = Number(row.quantity)

            if (!row.title.trim()) {
                setError("Every item needs a title.")
                return
            }
            if (row.amount === "" || !Number.isFinite(amount) || amount < 0) {
                setError(`Enter a valid rate for "${row.title.trim()}".`)
                return
            }
            if (!Number.isFinite(quantity) || quantity <= 0) {
                setError(`Quantity for "${row.title.trim()}" must be greater than 0.`)
                return
            }
        }

        const body = {
            deadline,
            adminName: adminName.trim(),
            adminAddress: adminAddress.trim(),
            clientName: clientName.trim(),
            clientAddress: clientAddress.trim(),
            items: rows.map(r => ({
                title: r.title.trim(),
                description: r.description.trim() || null,
                amount: Number(r.amount),
                quantity: Number(r.quantity),
                milestoneId: r.milestoneId
            }))
        }

        setSaving(true)

        try {
            const res = await fetch(
                invoice ? `/api/invoices/${invoice.id}` : `/api/projects/${projectId}/invoices`,
                {
                    method: invoice ? "PUT" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                }
            )
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || data.message || "Could not save the invoice.")
            }

            onSaved(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save the invoice.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="modalOverlay"
            onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="newClientModal invoiceFormModal">
                <div className="newClientModalTop">
                    <button type="button" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                    <h2>{invoice ? "Edit invoice" : "New invoice"}</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="invoiceFormParties">
                        <div className="invoiceFormSection">
                            <p className="invoiceFormSectionTitle">From</p>
                            <div className="invoiceFormField">
                                <label htmlFor="invoiceAdminName">Name</label>
                                <input id="invoiceAdminName" type="text" value={adminName} onChange={e => setAdminName(e.target.value)} />
                            </div>
                            <div className="invoiceFormField">
                                <label htmlFor="invoiceAdminAddress">Address</label>
                                <input id="invoiceAdminAddress" type="text" value={adminAddress} onChange={e => setAdminAddress(e.target.value)} />
                            </div>
                        </div>

                        <div className="invoiceFormSection">
                            <p className="invoiceFormSectionTitle">Bill to</p>
                            <div className="invoiceFormField">
                                <label htmlFor="invoiceClientName">Name</label>
                                <input id="invoiceClientName" type="text" value={clientName} onChange={e => setClientName(e.target.value)} />
                            </div>
                            <div className="invoiceFormField">
                                <label htmlFor="invoiceClientAddress">Address</label>
                                <input id="invoiceClientAddress" type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="invoiceFormMeta">
                        <div className="invoiceFormField">
                            <label htmlFor="invoiceProject">Project</label>
                            <input id="invoiceProject" type="text" value={projectTitle} readOnly disabled />
                        </div>
                        <div className="invoiceFormField">
                            <label htmlFor="invoiceDeadline">Due date</label>
                            <input id="invoiceDeadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    <div className="invoiceFormItemsHeader">
                        <h3>Items</h3>
                        <div className="invoiceFormItemActions">
                            <select
                                value=""
                                onChange={e => addMilestoneRow(e.target.value)}
                                disabled={availableMilestones.length === 0}
                                aria-label="Add from milestone"
                            >
                                <option value="">
                                    {availableMilestones.length === 0 ? "No milestones to add" : "Add from milestone"}
                                </option>
                                {availableMilestones.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.title}{m.budget !== null ? ` (${formatMoney(m.budget)})` : ""}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="invoiceSecondaryButton" onClick={addCustomRow}>
                                <Plus size={16} />
                                Custom item
                            </button>
                        </div>
                    </div>

                    <div className="invoiceFormRows">
                        {rows.length > 0 && (
                            <div className="invoiceFormRow invoiceFormRowHead">
                                <span>Title</span>
                                <span>Qty</span>
                                <span>Rate</span>
                                <span className="invoiceFormLineAmount">Amount</span>
                                <span />
                            </div>
                        )}

                        {rows.map(row => (
                            <div key={row.key} className="invoiceFormRowGroup">
                                <div className="invoiceFormRow">
                                    <input
                                        type="text"
                                        value={row.title}
                                        onChange={e => updateRow(row.key, { title: e.target.value })}
                                        placeholder="Item title"
                                        aria-label="Item title"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={row.quantity}
                                        onChange={e => updateRow(row.key, { quantity: e.target.value })}
                                        aria-label="Quantity"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.amount}
                                        onChange={e => updateRow(row.key, { amount: e.target.value })}
                                        placeholder="0"
                                        aria-label="Rate"
                                    />
                                    <span className="invoiceFormLineAmount">
                                        {formatMoney((Number(row.amount) || 0) * (Number(row.quantity) || 0))}
                                    </span>
                                    <button
                                        type="button"
                                        className="invoiceFormIconButton"
                                        onClick={() => removeRow(row.key)}
                                        aria-label="Remove item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {row.showDescription ? (
                                    <input
                                        type="text"
                                        className="invoiceFormDescription"
                                        value={row.description}
                                        onChange={e => updateRow(row.key, { description: e.target.value })}
                                        placeholder="Description (optional)"
                                        aria-label="Item description"
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className="invoiceFormLinkButton"
                                        onClick={() => updateRow(row.key, { showDescription: true })}
                                    >
                                        + Add description
                                    </button>
                                )}
                            </div>
                        ))}

                        {rows.length === 0 && <p className="invoiceFormEmpty">No items yet. Pick a milestone or add a custom item.</p>}
                    </div>

                    <div className="invoiceFormTotal">
                        <span>Total</span>
                        <span>{formatMoney(total)}</span>
                    </div>

                    {error && <p className="errorMessage">{error}</p>}

                    <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : invoice ? "Save changes" : "Create invoice"}
                    </button>
                </form>
            </div>
        </div>
    )
}