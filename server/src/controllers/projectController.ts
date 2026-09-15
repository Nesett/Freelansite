import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createProject(req: Request, res: Response) {

    const { clientId, title, description, budget, deadline, notes } = req.body

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

        const newProject = await db.project.create({
            data: {
                clientId,
                title,
                description, 
                budget: budget !== undefined && budget !== null ? Number(budget) : null,
                deadline: deadline ? new Date(deadline) : null,
                notes
            }
        })

        return res.status(201).json({newProject})


    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not create the project."})
    }
}


export async function getAllProjects(req: Request, res: Response) {
    
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
                }
            } // and their id, name and companyName
        }) 

        return res.status(200).json(allProjects)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all projects."})
    }

}


export async function getProject(req: Request, res: Response) {
	const adminId = req.user.id
	const projectId = String(req.params.id)

	try {
		const project = await db.project.findFirst({
			where: {
				id: projectId,
                isActive: true,
				client: {
					adminId: adminId,
                    isActive: true
				}
			},
			include: {
				client: {
					select: {
						id: true,
						name: true,
						companyName: true
					}
				}
			}
		})

		if (!project) {
			return res.status(404).json({ error: "Project not found." })
		}

		return res.status(200).json(project)

	} catch(err) {
		console.log(err)
		return res.status(500).json({ error: `Could not fetch project with id ${projectId}.` })
	}
}


export async function updateProject(req: Request, res: Response) {

	const adminId = req.user.id
	const projectId = String(req.params.id)

    const {title, description, budget, status, deadline, notes} = req.body

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
				deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingProject.deadline,
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