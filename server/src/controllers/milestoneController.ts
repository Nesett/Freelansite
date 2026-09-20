import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createMilestone(req: Request, res: Response) {

    const { projectId, clientId, title, description, budget, deadline, status, orderIndex } = req.body

    const adminId = req.user.id

    if (!projectId || !title || orderIndex===undefined) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const existingProject = await db.project.findFirst({
            where: {
                id: projectId,
                adminId: adminId,
                clientId: clientId,
                isActive: true
            }
        })

        if (!existingProject) {
            return res.status(404).json({error: "Project does not exist."})
        } 


        const newMilestone = await db.milestone.create({
                data: {
                    projectId,
                    title,
                    description,
                    budget,
                    status: status,
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

    const projectId = String(req.query.projectId)

    if (!req.query.projectId) {
        return res.status(400).json({error: "projectId is required."})
    }

    const typeOfUser = "adminId" in req.user
        ? { clientId: req.user.id }
        : { adminId: req.user.id }

    try {
        const allMilestones = await db.milestone.findMany({
            where: {
                projectId,
                isActive: true,
                project: {
                    ...typeOfUser,
                    isActive: true
                }
            }
        })

        return res.status(200).json(allMilestones)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all milestones."})
    }
}

export async function updateMilestone(req: Request, res: Response) {

    const id = String(req.params.id)
    const adminId = req.user.id
    
    const { title, description, budget, deadline, status, orderIndex } = req.body


    try {

        const existingMilestone = await db.milestone.findFirst({
            where: {
                id,
                isActive: true,
                project: {
                    adminId,
                    isActive: true
                }
            }
        })

        if (!existingMilestone) {
            return res.status(404).json({error: "Milestone does not exist."})
        } 

        if (existingMilestone.status === "APPROVED" || existingMilestone.status === "AWAITING_APPROVAL") {
            return res.status(400).json({error: "Milestones that are awaiting approval or are approved cannot be modified"})
        }

        const updatedMilestone = await db.milestone.update({
            where: {
                id,
                isActive: true
            },
            data: {
                title: title !== undefined ? title : existingMilestone.title,
				description: description !== undefined ? description : existingMilestone.description,
				budget: budget !== undefined ? Number(budget) : existingMilestone.budget,
                deadline: deadline !== undefined ? deadline : existingMilestone.deadline,
				status: status !== undefined ? status : existingMilestone.status,
                orderIndex: orderIndex !== undefined ? Number(orderIndex) : existingMilestone.orderIndex
            }
        })

        return res.status(200).json({updatedMilestone})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update milestone with id ${id}.`})
    }

}


export async function deactivateMilestone(req: Request, res: Response) {

    const id = String(req.params.id)
    const adminId = req.user.id

    try {

        const existingMilestone = await db.milestone.findFirst({
            where: {
                id,
                isActive: true,
                project: {
                    adminId,
                    isActive: true
                }
            }
        })

        if (!existingMilestone) {
            return res.status(404).json({error: "Milestone does not exist."})
        } 

        const deactivateMilestone = await db.milestone.update({
            where: {
                id,
				isActive: true
            },
            data: {
                isActive: false
            }
        })

        return res.status(200).json({deactivateMilestone})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not deactivate milestone with id ${id}.`})
    }

}

export async function approveMilestone(req: Request, res: Response) {

    const id = String(req.params.id)
    const clientId = req.user.id
    
    const { status } = req.body


    try {

        const existingMilestone = await db.milestone.findFirst({
            where: {
                id,
                isActive: true,
                project: {
                    clientId,
                    isActive: true
                }
            }
        })

        if (!existingMilestone) {
            return res.status(404).json({error: "Milestone does not exist."})
        } 

        if (existingMilestone.status !== "AWAITING_APPROVAL") {
            return res.status(400).json({error: "Cannot approve milestones, which are not ready to be approved."})
        }

        const approvedMilestone = await db.milestone.update({
            where: {
                id,
                isActive: true
            },
            data: {
				status: "APPROVED"
            }
        })

        return res.status(200).json({approvedMilestone})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update milestone with id ${id}.`})
    }

}