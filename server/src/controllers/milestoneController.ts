import { Request, Response } from 'express'
import db from '../db/db.js'
import { MilestoneStatus, ProjectStatus } from '@prisma/client'

export async function createMilestone(req: Request, res: Response) {

    const id = String(req.params.id)

    const { projectId, clientId, title, description, budget, deadline, MilestoneStatus, orderIndex } = req.body

    const adminId = req.user.id

    if (!projectId || !title || !orderIndex) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingProject = await db.project.findFirst({
            where: {
                id: id,
                adminId: adminId,
                clientId: clientId,
                isActive: true
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        } 

        const milestoneBudget = budget !== undefined && budget !== null ? Number(budget) : null

        const newMilestone = await db.milestone.create({
                data: {
                    projectId,
                    title,
                    description,
                    budget: milestoneBudget,
                    status: MilestoneStatus,
                    deadline,
                    orderIndex
                }
            })


        return res.status(201).json({newMilestone})


    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not create the milestone."})
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