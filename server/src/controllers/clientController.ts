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
