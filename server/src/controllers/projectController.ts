import { Request, Response } from 'express'
import db from '../db/db.js'
import { MilestoneStatus } from '@prisma/client'
import countProgressPercent from '../utils/milestoneProgress.js'
import { projectAccessFilter } from '../utils/accessByUser.js'
import crypto from "crypto"


type ClientDetails = {
    clientId: string
    name: string | null
    companyName: string | null
    phone: string | null
    address: string | null
}

async function getClientDetails(req: Request, clientIds: string[]) {
    const detailsByClientId = new Map<string, ClientDetails>()

    if (req.userRole !== 'admin' || clientIds.length === 0) {
        return detailsByClientId
    }

    const rows = await db.adminClient.findMany({
        where: {
            adminId: req.user.id,
            clientId: { in: clientIds }
        },
        select: {
            clientId: true,
            name: true,
            companyName: true,
            phone: true,
            address: true
        }
    })

    for (const row of rows) {
        detailsByClientId.set(row.clientId, row)
    }

    return detailsByClientId
}

function buildClient(client: { id: string, email: string }, details?: ClientDetails) {
    return {
        id: client.id,
        email: client.email,
        name: details?.name ?? null,
        companyName: details?.companyName ?? null,
        phone: details?.phone ?? null,
        address: details?.address ?? null
    }
}


export async function createProject(req: Request, res: Response) {

    const { clientId, title, description, budget, notes } = req.body

    const adminId = req.user.id

    if (!clientId || !title) {
        return res.status(400).json({message: "Enter all necessary information."})
    }

    let projectBudget: number | null = null

    if (budget !== undefined && budget !== null && budget !== "") {
        projectBudget = Math.round(Number(budget))

        if (Number.isNaN(projectBudget)) {
            return res.status(400).json({error: "Budget must be a number."})
        }
    }

    try {

        const existingClient = await db.adminClient.findFirst({
            where: {
                adminId,
                clientId,
                deletedByAdmin: false
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        }

        // every project starts with exactly one milestone, same as project.
        const newProject = await db.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    clientId,
                    adminId,
                    title,
                    description,
                    budget: projectBudget,
                    notes
                }
            })

            await tx.milestone.create({
                data: {
                    projectId: project.id,
                    title: project.title,
                    budget: projectBudget,
                    orderIndex: 0,
                    status: MilestoneStatus.NOT_STARTED
                }
            })

            return project
        })

        return res.status(201).json({newProject})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not create the project."})
    }
}


export async function getAllProjects(req: Request, res: Response) {
    try {
        const allProjects = await db.project.findMany({
            where: projectAccessFilter(req),
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                admin: {
                    select: {
                        name: true,
                        businessName: true
                    }
                },
                milestones: {
                    where: { deletedByAdmin: false },
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        status: true,
                        deadline: true,
                        orderIndex: true,
                        budget: true
                    }
                }
            }
        })

        const clientIds = [...new Set(allProjects.map(project => project.clientId))]
        const clientDetails = await getClientDetails(req, clientIds)

        const projectsWithProgress = allProjects.map(project => ({
            ...project,
            client: buildClient(project.client, clientDetails.get(project.clientId)),
            progress: countProgressPercent(project.milestones)
        }))

        return res.status(200).json(projectsWithProgress)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all projects."})
    }
}


export async function getProject(req: Request, res: Response) {
    const projectId = String(req.params.id)

    const invoiceVisibility = req.userRole === 'admin'
        ? { deletedByAdmin: false }
        : { deletedByClient: false }

    try {
        const project = await db.project.findFirst({
            where: {
                id: projectId,
                ...projectAccessFilter(req)
            },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                admin: {
                    select: {
                        name: true,
                        businessName: true,
                        email: true,
                        phone: true,
                        address: true
                    }
                },
                milestones: {
                    where: { deletedByAdmin: false },
                    orderBy: { orderIndex: 'asc' }
                },
                invoices: {
                    where: invoiceVisibility,
                    orderBy: { issueDate: 'desc' },
                    select: {
                        number: true,
                        id: true,
                        total: true,
                        status: true,
                        issueDate: true
                    }
                }
            }
        })

        if (!project) {
            return res.status(404).json({ error: "Project not found." })
        }

        const clientDetails = await getClientDetails(req, [project.clientId])

        return res.status(200).json({
            ...project,
            client: buildClient(project.client, clientDetails.get(project.clientId)),
            progress: countProgressPercent(project.milestones)
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({ error: `Could not fetch project with id ${projectId}.` })
    }
}


export async function updateProject(req: Request, res: Response) {

    const projectId = String(req.params.id)

    const { title, description, isOnHold } = req.body

    if (isOnHold !== undefined && typeof isOnHold !== "boolean") {
        return res.status(400).json({error: "isOnHold must be true or false."})
    }

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                ...projectAccessFilter(req)
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }

        const updatedProject = await db.project.update({
            where: {
                id: projectId
            },
            data: {
                title: title !== undefined ? title : existingProject.title,
                description: description !== undefined ? description : existingProject.description,
                isOnHold: isOnHold !== undefined ? isOnHold : existingProject.isOnHold
            }
        })

        return res.status(200).json({updatedProject})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update project with id ${projectId}.`})
    }
}


export async function deactivateProject(req: Request, res: Response) {

    const projectId = String(req.params.id)
    const userDelete = req.userRole === 'admin'
        ? { deletedByAdmin: true }
        : { deletedByClient: true }

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                ...projectAccessFilter(req)
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }

        const deactivatedProject = await db.project.update({
            where: {
                id: projectId
            },
            data: userDelete
        })

        return res.status(200).json({deactivatedProject})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not delete project with id ${projectId}.`})
    }
}


export async function createMagicLink(req: Request, res: Response) {

    const projectId = String(req.params.id)

    const { expiresAt } = req.body

    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    if (!expiresAt) {
        return res.status(400).json({error: "Expiry date not specified."})
    }

    const parsedExpiry = new Date(expiresAt)

    if (Number.isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return res.status(400).json({ error: 'Expiry date must be a valid date in the future.' })
    }

    try {
        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                adminId: req.user.id
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }

        const existingMagicLink = await db.magicLink.findUnique({
            where: {
                projectId
            }
        })

        if (existingMagicLink && existingMagicLink.expiresAt > new Date()) {
            return res.status(409).json({error: "Magic Link for this project already exists."})
        }

        if (existingMagicLink) {
            await db.magicLink.delete({
                where: {
                    id: existingMagicLink.id
                }
            })
        }

        const token = crypto.randomBytes(32).toString("base64url")

        const link = await db.magicLink.create({
            data: {
                token,
                projectId,
                expiresAt: parsedExpiry
            }
        })

        return res.status(200).json({
            url: `${process.env.CLIENT_URL}/share/${token}`,
            expiresAt: link.expiresAt,
            message: "Created Magic Link."
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not create Magic Link.`})
    }
}


export async function getMagicLink(req: Request, res: Response) {

    const projectId = String(req.params.id)

    try {
        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                adminId: req.user.id
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }

        const link = await db.magicLink.findUnique({
            where: {
                projectId
            }
        })

        if (!link) {
            return res.status(404).json({ error: "Not found" })
        }

        if (link.expiresAt <= new Date()) {
            await db.magicLink.delete({
                where: {
                    id: link.id
                }
            })
            return res.status(404).json({ error: "Not found" })
        }

        return res.status(200).json({
            url: `${process.env.CLIENT_URL}/share/${link.token}`,
            expiresAt: link.expiresAt
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not get Magic Link.`})
    }
}


export async function deleteMagicLink(req: Request, res: Response) {

    const projectId = String(req.params.id)

    try {
        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                adminId: req.user.id
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        }

        const link = await db.magicLink.findUnique({
            where: {
                projectId
            }
        })

        if (!link) {
            return res.status(404).json({ error: "Not found" })
        }

        await db.magicLink.delete({
            where: {
                projectId
            }
        })

        return res.status(204).send()

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not delete Magic Link.`})
    }
}