import { Request, Response } from 'express'
import db from '../db/db.js'
import validator from 'validator'
import countProgressPercent from '../utils/milestoneProgress.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendInviteEmail, sendAdminAddedYouEmail } from '../services/emailService.js'
import { toClientSafe } from '../utils/sanitizer.js'

// const dashboardLink = `http://localhost:5173/login`
// await sendAdminAddedYouEmail(email, dashboardLink, name)


export async function createClient(req: Request, res: Response) {

    const { name, email, phone, companyName } = req.body
    const adminId = req.user.id

    if (!name && !companyName) {
        return res.status(400).json({message:"Enter at least name or company name of your client."})
    } else {
        if (!email) {

            return res.status(400).json({message:"Enter email."})

        } else if (!validator.isEmail(email)){
        
                return res.status(400).json({error: "The email is invalid."})
        
        }
    }
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const inviteLink = `${process.env.CLIENT_URL}/set-password?token=${inviteToken}`


    try{
        let client = {}
        let adminName = ''
        const admin = await db.admin.findFirst({where: {id: adminId}})

        if (admin.businessName !== null && admin.businessName !== undefined){
            adminName = admin.businessName
        } else {
            adminName = admin.name
        }

        const isExistingUser = await db.client.findUnique({where: {email}})
        if (isExistingUser) {
            if (isExistingUser.password === null || isExistingUser.password === undefined) {
                const updated = await db.client.update({
                    where: { email },
                    data: {
                        name: name,
                        email: email,
                        phone: phone || null,
                        companyName: companyName || null,
                        adminId: adminId,
                        inviteToken,
                        inviteTokenExpires
                    }
                })
                await sendInviteEmail(email, inviteLink, adminName)
                return res.status(200).json({ message: "Successfully created client account.", user: toClientSafe(updated) })
            } else {
                client = isExistingUser
                await sendAdminAddedYouEmail(email, adminName)
                return res.status(200).json({ message: "This user already exists.", user: toClientSafe(isExistingUser) })
            }
        } 

        const newClient = await db.client.create({
            data: {
                name: name,
                email: email,
                phone: phone || null,
                companyName: companyName || null,
                adminId: adminId,
                inviteToken,
                inviteTokenExpires
            }
        })
        client = newClient
        await sendInviteEmail(email, inviteLink, adminName)
        return res.status(201).json({ message: "Successfully created client account.", user: toClientSafe(newClient) })


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
				deletedByAdmin: false
            }
        })

        return res.status(200).json(clients.map(c => toClientSafe(c)))

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
				deletedByAdmin: false
            }
        })

        if (!client) {
            return res.status(404).json({error: "Client not found."})
        }

        return res.status(200).json(toClientSafe(client))

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
				deletedByAdmin: false
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        } else if (existingClient.password != null || existingClient.password != undefined) {
            return res.status(404).json({error: "This is a logged in client. You cannot edit their data anymore."})
        }

        const updatedClient = await db.client.update({
            where: {
                id: clientId,
				deletedByAdmin: false
            },
            data: {
                name: name !== undefined ? name : existingClient.name,
				email: email !== undefined ? email : existingClient.email,
				phone: phone !== undefined ? phone : existingClient.phone,
				companyName: companyName !== undefined ? companyName : existingClient.companyName
            }
        })

        return res.status(200).json({ updatedClient: toClientSafe(updatedClient) })

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
				deletedByAdmin: false
            }
        })

        if (!existingClient) {
            return res.status(404).json({error: "Client does not exist."})
        } 

        await db.$transaction([
            db.client.update({
                where: { id: clientId },
                data: { deletedByAdmin: true }
            }),
            db.project.updateMany({
                where: { clientId, adminId },
                data: { deletedByAdmin: true }
            })
        ])

        return res.status(200).json({message: "Client and their projects have been removed from your view."})

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Could not delete client with id ${clientId}.`})
    }

}



export async function getProjectsByClient(req: Request, res: Response) {
	const adminId = req.user.id
	const clientId = String(req.params.id)

	try {
		const clientProjects = await db.project.findMany({
            where: {
                clientId,
                adminId,
                deletedByAdmin: false,
                client: { deletedByAdmin: false }
            },
			orderBy: {
				createdAt: 'desc'
			}, include: {
                milestones: {
                    orderBy: { orderIndex: 'asc' },
                    select: { id: true, status: true, deadline: true, orderIndex: true, budget: true }
                },
                admin: {
                    select: {
                        name: true, businessName: true
                    }
                }
            }
		})

        const clientProjectsWithProgress = clientProjects.map(project => ({
            ...project,
            progress: countProgressPercent(project.milestones)
        }))

        return res.status(200).json(clientProjectsWithProgress)
	} catch (err) {
		console.log(err)
		return res.status(500).json({ error: `Could not fetch projects for client ${clientId}.` })
	}
}



export async function setClientPassword(req: Request, res: Response) {
    
    const { token, password } = req.body

    if (!password) {
        return res.status(400).json({error: "Please enter your password."})
    }

	const client = await db.client.findUnique({
		where: { inviteToken: token }
	})


	if (!client || !client.inviteTokenExpires) {
		return res.status(400).json({ error: 'Invalid or missing invite link.' })
	}

	const rightNow = new Date()
	const isExpired = rightNow > client.inviteTokenExpires

	if (isExpired) {
		return res.status(400).json({ error: 'This invite link has expired. Please ask for a new one.' })
	}

    const salt = 10

    try {

        const hashedPassword = await bcrypt.hash(password, salt)

        const client = await db.client.update({
            where: {
                inviteToken: token
            },
            data: {
                password: hashedPassword,
                inviteToken: null,
                inviteTokenExpires: null
            }
        })

        return res.status(200).json({id:client.id, name:client.name, companyName:client.companyName})
        
    } catch(err) {
        console.log(err)
        return res.status(500).json({error: `Failed to set up a password.`})
    }
}

export async function loginClient(req: Request, res: Response) {

    let { password, email } = req.body

    if (!email) {
        return res.status(400).json({error: "Please enter email."})

    } else {

        email = email.trim().toLowerCase()

        if (!password) {

            return res.status(400).json({error: "Please enter password."})

        } else if (!validator.isEmail(email)) {

            return res.status(400).json({error: "The email is invalid."})

        }
    }
    
    try {
        const client = await db.client.findUnique({where: { email }})
        
        if (!client || !client.password) {
            return res.status(401).json({ error: "Invalid credentials." })
        } else {
            const passwordMatch = await bcrypt.compare(password, client.password)
            if (!passwordMatch) {
                return res.status(401).json({error: "Invalid credentials."})
            } else {

                const token = jwt.sign(
                { id: client.id, role: 'client' }, 
                process.env.JWT_SECRET as string, 
                { expiresIn: '1d' }
                )

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                })

                return res.status(200).json({ client: toClientSafe(client) })
            }
        }
        


    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }

}