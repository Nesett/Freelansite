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


export async function getAllClients(req: Request, res: Response) {
    
    const adminId = req.user.id
    
    try {

        const clients = await db.client.findMany({
            where: {
                adminId: adminId
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
    const clientId = String(req.params.id || req.query.id)

    try {

        const client = await db.client.findFirst({
            where: {
                id: clientId,
                adminId: adminId
                
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


export async function deactivateClient(req: Request, res: Response) {

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