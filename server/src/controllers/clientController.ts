import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createClient(req: Request, res: Response) {

    const { name, email, phone, companyName } = req.body
    const adminId = req.user.id

    if (!name || !email) {
        return res.status(400).json({message:"Enter all necessary information."})
    } 

    try{

        const newClient = await db.client.create({
            data: {
                name: name,
                email: email,
                phone: phone || null,
                companyName: companyName || null,
                adminId: adminId
            }
        })

        return res.status(201).json({newClient})


    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not create the client."})
    }
}


export async function getAllClients(req: Request, res: Response) {
    
    const adminId = req.user.id
    
    try {

        const clients = await db.client.findMany({
            where: {
                adminId: adminId,
				isActive: true
            }
        })

        return res.status(200).json(clients)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: "Could not fetch all clients."})
    }

    
}


export async function getClient(req: Request, res: Response) {
    
    const adminId = req.user.id
    const clientId = String(req.params.id)

    try {

        const client = await db.client.findFirst({
            where: {
                id: clientId,
                adminId: adminId,
				isActive: true
                
            }
        })

        if (!client) {
            return res.status(404).json({error: "Client not found."})
        }

        return res.status(200).json(client)

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not fetch client with id ${clientId}.`})
    }

    
    
}


export async function updateClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    const {name, email, phone, companyName} = req.body

    try {

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

        const updatedClient = await db.client.update({
            where: {
                id: clientId,
				isActive: true
            },
            data: {
                name: name !== undefined ? name : existingClient.name,
				email: email !== undefined ? email : existingClient.email,
				phone: phone !== undefined ? phone : existingClient.phone,
				companyName: companyName !== undefined ? companyName : existingClient.companyName
            }
        })

        return res.status(200).json({updatedClient})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not update client with id ${clientId}.`})
    }

}


export async function deactivateClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    try {
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

        const [deactivatedClient] = await db.$transaction([
			db.client.update({
				where: {
                    id: clientId 
                },
				data: { 
                    isActive: false
                }
			}),
			db.project.updateMany({
				where: { 
                    clientId: clientId 
                },
				data: { 
                    isActive: false 
                }
			})
		])

        return res.status(200).json({message: "Client and their projects have been deactivated.", deletedUser: deactivatedClient})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not deactivate client with id ${clientId}.`})
    }

}