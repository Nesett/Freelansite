import { Request, Response } from 'express'
import db from '../db/db.js'
import { MilestoneStatus, ProjectStatus } from '@prisma/client'
import countProgressPercent from '../utils/milestoneProgress.js'
import { projectAccessFilter } from '../utils/accessByUser.js'
import crypto from "crypto"


export async function createProject(req: Request, res: Response) {

    const { clientId, title, description, budget, notes } = req.body

    const adminId = req.user.id

    if (!clientId || !title) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingClient = await db.client.findFirst({
            where: {
                id: clientId,
                adminId: adminId,
                isActive: true
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        } 

        const projectBudget = budget !== undefined && budget !== null ? Number(budget) : null

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
                        name: true,
                        companyName: true
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

        const projectsWithProgress = allProjects.map(project => ({
            ...project,
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
						name: true,
						companyName: true
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
					orderBy: { orderIndex: 'asc' }
				}
			}
		})

        if (!project) {
            return res.status(404).json({ error: "Project not found." })
        }

        return res.status(200).json({
            ...project,
            progress: countProgressPercent(project.milestones)
        })

	} catch(err) {
		console.log(err)
		return res.status(500).json({ error: `Could not fetch project with id ${projectId}.` })
	}
}

export async function updateProject(req: Request, res: Response) {

	const adminId = req.user.id
	const projectId = String(req.params.id)

    const {title, description, budget, status, notes} = req.body

    if (status !== undefined && [ProjectStatus.COMPLETED, ProjectStatus.AWAITING_APPROVAL].includes(status)) {
        return res.status(400).json({error: "This status can only be set automatically through milestone actions."})
    }

    try {

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId, ...projectAccessFilter(req)
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

    const {expiresAt} = req.body

    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
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

        const exsistingMagicLink = await db.magicLink.findUnique({ 
            where: {
                projectId
            }
        })

        if (exsistingMagicLink && exsistingMagicLink.expiresAt > new Date()) {
            return res.status(404).json({error: "Magic Link for this project already exists."})
        }
        if (exsistingMagicLink) {
            await db.magicLink.delete({ 
                where: { 
                    id: exsistingMagicLink.id 
                } 
            })
        }

        const token = crypto.randomBytes(32).toString("base64url")

        const link = await db.magicLink.create({
            data: { 
                token, 
                projectId, 
                expiresAt 
            }
        })

        return res.status(200).json({ url:`${process.env.CLIENT_URL}/project/${token}`, expiresAt: link.expiresAt, message:"created Magic Link."})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not create Magic Link.`})
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

        return res.status(204).json({message: "Successfully deleted Magic Link"})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not delete Magic Link.`})
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

        return res.status(200).json({ url: `${process.env.CLIENT_URL}/p/${link.token}`, expiresAt: link.expiresAt })

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not get Magic Link.`})
    }
}
//createMagicLink, getMagicLink, deleteMagicLink