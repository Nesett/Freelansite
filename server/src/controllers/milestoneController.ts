import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createMilestone(req: Request, res: Response) {

    const id = String(req.params.id)

    const { projectId, clientId, title, description, budget, deadline, status, orderIndex } = req.body

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
    
    const projectId = String(req.params.id)
    const userId = req.user.id
	const userRole = req.user.role
    
    try {

        const typeOfUser = userRole==="admin" ? {adminId: userId} : {clientId: userId} 

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

    const projectId = String(req.params.id)
    const userId = req.user.id
	const userRole = req.user.role
    
    const { id, title, description, budget, deadline, status, orderIndex } = req.body


    try {
        
        const typeOfUser = userRole==="admin" ? {adminId: userId} : {clientId: userId} 

        const existingMilestone = await db.milestone.findFirst({
            where: {
                id,
                isActive: true,
                project: {
                    ...typeOfUser,
                    isActive: true
                }
            }
        })

        if (!existingMilestone) {
            return res.status(404).json({error: "Milestone does not exist."})
        } 

        if (existingMilestone.status === "APPROVED") {
            return res.status(400).json({error: "Approved milestones cannot be modified"})
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