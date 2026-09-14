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
                adminId: adminId
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
                budget, 
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
                client: {
                    adminId
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
				client: {
					adminId: adminId
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
    const clientId = String(req.params.id || req.query.id)

    const {name, email, phone, companyName} = req.body

    try {

        const existingClient = await db.client.findFirst({
            where: {
                id: clientId,
                adminId: adminId
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        } 

        const updatedClient = await db.client.update({
            where: {
                id: clientId
            },
            data: {
                name: name,
                email: email,
                phone: phone,
                companyName: companyName
            }
        })

        return res.status(200).json({updatedClient})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update client with id ${clientId}.`})
    }

}


export async function deleteProject(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id || req.query.id)

    try {
        const existingClient = await db.client.findFirst({
            where: {
                id: clientId,
                adminId: adminId
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        } 

        const deactivatedClient = await db.client.update({
            where: {
                id: clientId
            },
            data: {
                isActive: false
            }
        })

        return res.status(200).json({deactivatedClient})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not deactivate client with id ${clientId}.`})
    }

}