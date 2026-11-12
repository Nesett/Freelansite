import { Request, Response } from 'express'
import db from '../db/db.js'
import { InvoiceStatus } from '@prisma/client'
import { deletedFilter, projectAccessFilter } from '../utils/accessByUser.js'

interface InvoiceItemInput {
    title: string
    description: string | null
    amount: number
    quantity: number
    milestoneId: string | null
}

// Validates and cleans the items array sent by the client. Returns null if anything is invalid.
function parseItems(raw: unknown): InvoiceItemInput[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null

    const items: InvoiceItemInput[] = []

    for (const item of raw) {
        const title = typeof item?.title === 'string' ? item.title.trim() : ''
        const amount = Number(item?.amount)
        const quantity = item?.quantity === undefined || item?.quantity === '' ? 1 : Number(item.quantity)

        if (!title || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(quantity) || quantity <= 0) {
            return null
        }

        const description = typeof item.description === 'string' ? item.description.trim() : ''

        items.push({
            title,
            description: description || null,
            amount,
            quantity,
            milestoneId: typeof item.milestoneId === 'string' && item.milestoneId ? item.milestoneId : null
        })
    }

    return items
}

function calculateTotal(items: InvoiceItemInput[]) {
    const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0)
    return Math.round(total * 100) / 100
}

// Every milestoneId on the items must belong to this project.
async function milestonesBelongToProject(projectId: string, items: InvoiceItemInput[]) {
    const ids = [...new Set(items.map(item => item.milestoneId).filter((id): id is string => !!id))]

    if (ids.length === 0) return true

    const count = await db.milestone.count({
        where: {
            id: { in: ids },
            projectId,
            deletedByAdmin: false
        }
    })

    return count === ids.length
}


export async function createInvoice(req: Request, res: Response) {

    const projectId = String(req.params.id)

    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    const { deadline, adminName, adminAddress, clientName, clientAddress } = req.body
    const items = parseItems(req.body.items)

    if (!deadline || !adminName || !adminAddress || !clientName || !clientAddress || !items) {
        return res.status(400).json({ message: "Enter all necessary information." })
    }

    const parsedDeadline = new Date(deadline)

    if (Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ message: "Due date is not valid." })
    }

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                ...deletedFilter(req),
                adminId: req.user.id,
                deletedByAdmin: false
            }
        })

        if (!existingProject) {
            return res.status(404).json({ error: "Project does not exist." })
        }

        if (!(await milestonesBelongToProject(projectId, items))) {
            return res.status(400).json({ error: "One of the milestones does not belong to this project." })
        }

        // the counter increment locks the admin row, so two invoices can never get the same number
        const invoice = await db.$transaction(async tx => {
            const admin = await tx.admin.update({
                where: { id: req.user.id },
                data: { lastInvoiceNumber: { increment: 1 } },
                select: { lastInvoiceNumber: true }
            })

            return tx.invoice.create({
                data: {
                    projectId,
                    number: admin.lastInvoiceNumber,
                    deadline: parsedDeadline,
                    total: calculateTotal(items),
                    adminName,
                    adminAddress,
                    clientName,
                    clientAddress,
                    items: {
                        create: items
                    }
                },
                include: {
                    items: true
                }
            })
        })

        return res.status(201).json({ invoice })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not create the invoice." })
    }
}


export async function getAllInvoices(req: Request, res: Response) {

    const projectId = String(req.params.id)

    try {
        const invoices = await db.invoice.findMany({
            where: {
                projectId,
                ...deletedFilter(req),
                project: projectAccessFilter(req)
            },
            orderBy: { issueDate: 'desc' },
            include: {
                items: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        amount: true,
                        quantity: true,
                        milestoneId: true
                    }
                }
            }
        })

        return res.status(200).json(invoices)

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not fetch all invoices." })
    }
}


export async function getInvoice(req: Request, res: Response) {

    const invoiceId = String(req.params.id)

    try {
        const invoice = await db.invoice.findFirst({
            where: {
                id: invoiceId,
                ...deletedFilter(req),
                project: projectAccessFilter(req)
            },
            include: {
                items: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        amount: true,
                        quantity: true,
                        milestoneId: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        admin: {
                            select: {
                                email: true
                            }
                        },
                        client: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found." })
        }

        return res.status(200).json({ invoice })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not fetch invoice with id ${invoiceId}.` })
    }
}


export async function updateInvoice(req: Request, res: Response) {

    const adminId = req.user.id
    const id = String(req.params.id)

    const { status, deadline, adminName, adminAddress, clientName, clientAddress } = req.body

    // items are optional: a status-only update (Mark as paid) still works
    let items: InvoiceItemInput[] | null = null

    if (req.body.items !== undefined) {
        items = parseItems(req.body.items)

        if (!items) {
            return res.status(400).json({ error: "Items are not valid." })
        }
    }

    if (status !== undefined && !Object.values(InvoiceStatus).includes(status)) {
        return res.status(400).json({ error: "Status is not valid." })
    }

    let parsedDeadline: Date | undefined

    if (deadline !== undefined) {
        parsedDeadline = new Date(deadline)

        if (Number.isNaN(parsedDeadline.getTime())) {
            return res.status(400).json({ error: "Due date is not valid." })
        }
    }

    try {

        const existingInvoice = await db.invoice.findFirst({
            where: {
                id,
                deletedByAdmin: false,
                project: { adminId, deletedByAdmin: false }
            }
        })

        if (!existingInvoice) {
            return res.status(404).json({ error: "Invoice does not exist." })
        }

        if (existingInvoice.status === InvoiceStatus.PAID) {
            return res.status(400).json({ error: "This invoice cannot be edited anymore, since it has been paid for." })
        }

        if (items && !(await milestonesBelongToProject(existingInvoice.projectId, items))) {
            return res.status(400).json({ error: "One of the milestones does not belong to this project." })
        }

        const updatedInvoice = await db.$transaction(async tx => {
            if (items) {
                await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
                await tx.invoiceItem.createMany({
                    data: items.map(item => ({ ...item, invoiceId: id }))
                })
            }

            return tx.invoice.update({
                where: { id },
                data: {
                    status: status !== undefined ? status : existingInvoice.status,
                    deadline: parsedDeadline ?? existingInvoice.deadline,
                    // total is always recomputed from the items, never taken from the client
                    total: items ? calculateTotal(items) : existingInvoice.total,
                    adminName: adminName !== undefined ? adminName : existingInvoice.adminName,
                    adminAddress: adminAddress !== undefined ? adminAddress : existingInvoice.adminAddress,
                    clientName: clientName !== undefined ? clientName : existingInvoice.clientName,
                    clientAddress: clientAddress !== undefined ? clientAddress : existingInvoice.clientAddress
                },
                include: {
                    items: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            amount: true,
                            quantity: true,
                            milestoneId: true
                        }
                    }
                }
            })
        })

        return res.status(200).json({ updatedInvoice })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not update invoice with id ${id}.` })
    }

}


export async function deactivateInvoice(req: Request, res: Response) {

    const invoiceId = String(req.params.id)

    const userRole = req.userRole

    const updateDeleteData = userRole === 'admin'
        ? { deletedByAdmin: true }
        : { deletedByClient: true }

    try {

        const existingInvoice = await db.invoice.findFirst({
            where: {
                id: invoiceId,
                ...deletedFilter(req),
                project: projectAccessFilter(req)
            }
        })

        if (!existingInvoice) {
            return res.status(404).json({ error: "Invoice does not exist." })
        }

        const deactivatedInvoice = await db.invoice.update({
            where: {
                id: invoiceId
            },
            data: updateDeleteData
        })

        return res.status(200).json({ deactivatedInvoice })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not deactivate invoice with id ${invoiceId}.` })
    }

}

export async function getUserInvoices(req: Request, res: Response) {

    try {
        const invoices = await db.invoice.findMany({
            where: {
                ...deletedFilter(req),
                project: projectAccessFilter(req)
            },
            orderBy: { issueDate: 'desc' },
            select: {
                id: true,
                number: true,
                status: true,
                deadline: true,
                issueDate: true,
                total: true,
                clientName: true,
                adminName: true,
                project: {
                    select: {
                        id: true,
                        title: true,
                        admin: {
                            select: {
                                email: true
                            }
                        },
                        client: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        return res.status(200).json(invoices)

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not fetch invoices." })
    }
}