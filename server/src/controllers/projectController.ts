import { Request, Response } from 'express'
import db from '../db/db.js'
import { MilestoneStatus, ProjectStatus } from '@prisma/client'
import countProgressPercent from '../utils/milestoneProgress.js'

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


export async function deactivateProject(req: Request, res: Response) {

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