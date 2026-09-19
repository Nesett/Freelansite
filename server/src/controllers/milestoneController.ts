import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createMilestone(req: Request, res: Response) {

    const { clientId, title, description, budget, notes } = req.body

    const adminId = req.user.id

    if (!clientId || !title) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingProject = await db.client.findFirst({
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


export async function getAllMilestones(req: Request, res: Response) {
    
    const adminId = req.user.id
    
    try {

        const allProjects = await db.project.findMany({
            where: {
                isActive: true,
                client: {
                    adminId,
                    isActive: true
                }
            }, // all projects belonging to clients of an admin.
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true
                    }
                }, // and their id, name and companyName
                _count: {
                    select: { milestones: true }
                }, // total milestone count, for the progress-bar math
                milestones: {
                    where: {
                        status: { not: MilestoneStatus.APPROVED }
                    },
                    orderBy: { orderIndex: 'asc' },
                    take: 1,
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
        

        return res.status(200).json(allProjects)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all projects."})
    }

}


export async function updateMilestone(req: Request, res: Response) {

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


export async function deactivateMilestone(req: Request, res: Response) {

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

export async function approveMilestone() {

}