import { Request, Response } from 'express'
import db from '../db/db.js'

interface invoiceItems {
    title: string
    description?: string
    amount: number
    quantity: number
}

function projectAccessFilter(req: Request) {
	if (req.userRole === 'admin') {
		return {
			isActive: true,
			client: { adminId: req.user.id, isActive: true }
		}
	}

	return {
		isActive: true,
		clientId: req.user.id,
		client: { isActive: true }
	}
}


export async function createInvoice(req: Request, res: Response) {

    const projectId = String(req.params.id)

    const adminId = req.user.id
    

    const { deadline, adminName, adminAddress, clientName, clientAddress } = req.body
    const {items} = req.body as {items: invoiceItems[]}


    if (!deadline || !adminName || !adminAddress || !clientName || !clientAddress || !items) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                adminId: adminId,
                isActive: true
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        } 

        const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.amount, 0)

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
                        amount: item.amount,
                        quantity: item.quantity
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
                projectId
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
                id: invoiceId
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
	const projectId = String(req.params.id)

    const {title, description, budget, status, notes} = req.body

    if (status !== undefined && [ProjectStatus.COMPLETED, ProjectStatus.AWAITING_APPROVAL].includes(status)) {
        return res.status(400).json({error: "This status can only be set automatically through milestone actions."})
    }

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                isActive: true,
                client: {
                    adminId: adminId,
                    isActive: true
                }
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        } 

        const updatedProject = await db.project.update({
            where: {
                id: projectId,
                isActive: true
            },
            data: {
                title: title !== undefined ? title : existingProject.title,
				description: description !== undefined ? description : existingProject.description,
				budget: budget !== undefined ? Number(budget) : existingProject.budget,
				status: status !== undefined ? status : existingProject.status,
				notes: notes !== undefined ? notes : existingProject.notes
            }
        })

        return res.status(200).json({updatedProject})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update project with id ${projectId}.`})
    }

}


export async function deactivateInvoice(req: Request, res: Response) {

    const adminId = req.user.id
    const projectId = String(req.params.id)

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                isActive: true,
                client: {
                    adminId: adminId,
                    isActive: true
                }
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        } 

        const deactivateProject = await db.project.update({
            where: {
                id: projectId,
				isActive: true
            },
            data: {
                isActive: false
            }
        })

        return res.status(200).json({deactivateProject})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not deactivate project with id ${projectId}.`})
    }

}