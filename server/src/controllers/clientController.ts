import { Request, Response } from 'express'
import db from '../db/db.js'

export async function createClient(req: Request, res: Response) {

    const { name, email, phone, companyName } = req.body
    const adminId = req.user.id

    if (!name || !email) {
        res.status(400).json({message:"Enter all necessary information."})
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
        res.status(500).json({error: "Could not create the client."})
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

        if (!clients) {
            res.status(400).json({message: "No clients found."})
        }

        return res.status(200).json(clients)

    } catch(err) {
        console.log(err)
        res.status(500).json({error: "Could not fetch all clients."})
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

        return res.status(200).json(client)

    } catch(err) {
        console.log(err)
        res.status(500).json({error: `Could not fetch client with id ${clientId}.`})
    }

    
    
}