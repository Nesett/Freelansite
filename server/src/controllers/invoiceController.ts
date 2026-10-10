import { Request, Response } from 'express'
import db from '../db/db.js'
import { InvoiceStatus } from '@prisma/client'
import { deletedFilter, projectAccessFilter } from '../utils/accessByUser.js'

interface invoiceItems {
    title: string
    description?: string
    amount: number
    quantity: number
}



export async function createInvoice(req: Request, res: Response) {

    const projectId = String(req.params.id)

    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
    }


    const { deadline, adminName, adminAddress, clientName, clientAddress } = req.body
    const {items} = req.body as {items: invoiceItems[]}


    if (!deadline || !adminName || !adminAddress || !clientName || !clientAddress || !items || !items.length) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                ...deletedFilter(req),
                adminId: req.user.id,
                deletedByAdmin: false
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }
        
        const totalAmount = items.reduce((acc, item) => {
                    const qty = Number(item.quantity) || 1
                    const amt = Number(item.amount) || 0
                    return acc + qty * amt
                }, 0)

        // every project starts with exactly one milestone, same as project.
        const invoice = await db.invoice.create({
            data: {
                projectId,
                deadline: new Date(deadline),
                total: totalAmount,
                adminName,
                adminAddress,
                clientName,
                clientAddress,
                items: {
                    create: items.map(item=> ({
                        title: item.title,
                        description: item.description,
                        amount: Number(item.amount),
                        quantity: Number(item.quantity) || 1
                    }))
                }
                
            },
            include: {
                items: true
            }
        })


        return res.status(201).json({invoice})


    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not create the invoice."})
    }
}


export async function getAllInvoices(req: Request, res: Response) {

    const projectId = String(req.params.id)

    try {
        const invoices = await db.invoice.findMany({
            where: {
                projectId,
                deletedFilter
            },
            orderBy: { issueDate: 'desc' },
            include: {
                items: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        amount: true,
                        quantity: true
                    }
                }
            }
        })

        return res.status(200).json(invoices)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all invoices."})
    }
}


export async function getInvoice(req: Request, res: Response) {

    const invoiceId = String(req.params.id)

	try {
		const invoice = await db.invoice.findFirst({
            where: {
                invoiceId,
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
                        quantity: true
                    }
                }
            }
        })

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found." })
        }

        return res.status(200).json({invoice})

	} catch(err) {
		console.log(err)
		return res.status(500).json({ error: `Could not fetch project with id ${invoiceId}.` })
	}
}

export async function updateInvoice(req: Request, res: Response) {

	const adminId = req.user.id
	const id = String(req.params.id)

    const {status, deadline, total, adminName, adminAddress, clientName, clientAddress} = req.body

    if (status !== undefined && [InvoiceStatus.PAID].includes(status)) {
        return res.status(400).json({error: "This invoice cannot be edited anymore, since it has been paid for."})
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
            return res.status(404).json({error: "Invoice does not exist."})
        } 

        const updatedInvoice = await db.invoice.update({
            where: {
                id
            },
            data: {
                status: status !== undefined ? status : existingInvoice.status,
				deadline: deadline !== undefined ? deadline : existingInvoice.deadline,
				total: total !== undefined ? Number(total) : existingInvoice.total,
				adminName: adminName !== undefined ? adminName : existingInvoice.adminName,
				adminAddress: adminAddress !== undefined ? adminAddress : existingInvoice.adminAddress,
				clientName: clientName !== undefined ? clientName : existingInvoice.clientName,
				clientAddress: clientAddress !== undefined ? clientAddress : existingInvoice.clientAddress,

            }
        })

        return res.status(200).json({updatedInvoice})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update invoice with id ${id}.`})
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
            return res.status(404).json({error: "Invoice does not exist."})
        } 

        const deactivatedInvoice = await db.project.update({
            where: {
                id: invoiceId
            },
            data: {
                updateDeleteData
            }
        })

        return res.status(200).json({deactivatedInvoice})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not deactivate invoice with id ${invoiceId}.`})
    }

}

export async function getAdminInvoices(req: Request, res: Response) {

    const adminId = req.user.id

    try {
        const invoices = await db.invoice.findMany({
            where: {
                deletedByAdmin: false,
                project: {
                    adminId,
                    deletedByAdmin: false
                }
            },
            orderBy: { issueDate: 'desc' },
            select: {
                id: true,
                status: true,
                deadline: true,
                issueDate: true,
                total: true,
                clientName: true,
                project: {
                    select: {
                        id: true,
                        title: true,
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

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch invoices."})
    }
}