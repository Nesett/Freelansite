import { Request, Response } from 'express'
import db from '../db/db.js'
import validator from 'validator'
import countProgressPercent from '../utils/milestoneProgress.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendInviteEmail, sendAdminAddedYouEmail } from '../services/emailService.js'
import { toClientSafe, toAdminClientView } from '../utils/sanitizer.js'
import { MilestoneStatus } from '@prisma/client'

// const dashboardLink = `http://localhost:5173/login`
// await sendAdminAddedYouEmail(email, dashboardLink, name)


export async function createClient(req: Request, res: Response) {

    const { name, email: rawEmail, phone, companyName } = req.body
    const adminId = req.user.id

    if (!name && !companyName) {
        return res.status(400).json({ error: "Enter at least name or company name of your client." })
    }

    if (!rawEmail) {
        return res.status(400).json({ error: "Enter email." })
    }

    const email = String(rawEmail).trim().toLowerCase()

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "The email is invalid." })
    }

    try {
        const admin = await db.admin.findUnique({ where: { id: adminId } })

        if (!admin) {
            return res.status(404).json({ error: "Admin not found." })
        }

        const adminName = admin.businessName ?? admin.name

        let client = await db.client.findUnique({ where: { email } })
        const hasAccount = client !== null && client.password !== null

        const inviteToken = crypto.randomBytes(32).toString('hex')
        const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const inviteLink = `${process.env.CLIENT_URL}/set-password?token=${inviteToken}`

        if (!client) {
            client = await db.client.create({
                data: { email, inviteToken, inviteTokenExpires }
            })
        } else if (!hasAccount) {
            client = await db.client.update({
                where: { id: client.id },
                data: { inviteToken, inviteTokenExpires }
            })
        }

        const adminClient = await db.adminClient.upsert({
            where: { adminId_clientId: { adminId, clientId: client.id } },
            update: {
                name: name || null,
                companyName: companyName || null,
                phone: phone || null,
                deletedByAdmin: false
            },
            create: {
                adminId,
                clientId: client.id,
                name: name || null,
                companyName: companyName || null,
                phone: phone || null
            }
        })

        if (hasAccount) {
            await sendAdminAddedYouEmail(email, adminName)
        } else {
            await sendInviteEmail(email, inviteLink, adminName)
        }

        return res.status(201).json({
            message: "Successfully added client.",
            user: toAdminClientView(adminClient, client)
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not create the client." })
    }
}


export async function getAllClients(req: Request, res: Response) {

    const adminId = req.user.id

    try {

        const adminClients = await db.adminClient.findMany({
            where: {
                adminId,
                deletedByAdmin: false
            },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true,
                        lastActive: true,
                        password: true,
                        projects: {
                            where: { adminId, deletedByAdmin: false },
                            select: {
                                milestones: {
                                    where: {
                                        deletedByAdmin: false,
                                        deadline: { not: null },
                                        status: { not: MilestoneStatus.APPROVED }
                                    },
                                    orderBy: { deadline: 'asc' },
                                    take: 1,
                                    select: { deadline: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        const result = adminClients.map(({ client, ...adminClient }) => {
            const { projects, ...clientData } = client

            const deadlines = projects.flatMap(project =>
                project.milestones.map(milestone => milestone.deadline!.getTime())
            )

            const nextDeadline = deadlines.length > 0
                ? new Date(Math.min(...deadlines)).toISOString()
                : null

            return { ...toAdminClientView(adminClient, clientData), nextDeadline }
        })

        return res.status(200).json(result)

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not fetch all clients." })
    }
}


export async function getClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    try {

        const adminClient = await db.adminClient.findFirst({
            where: { adminId, clientId, deletedByAdmin: false },
            include: {
                client: {
                    select: { id: true, email: true, lastActive: true, password: true }
                }
            }
        })

        if (!adminClient) {
            return res.status(404).json({ error: "Client not found." })
        }

        return res.status(200).json(toAdminClientView(adminClient, adminClient.client))

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not fetch client with id ${clientId}.` })
    }
}


export async function updateClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    const { name, phone, companyName, address } = req.body

    try {

        const existing = await db.adminClient.findFirst({
            where: { adminId, clientId, deletedByAdmin: false }
        })

        if (!existing) {
            return res.status(404).json({ error: "Client does not exist." })
        }

        const updated = await db.adminClient.update({
            where: { id: existing.id },
            data: { name, phone, companyName, address },
            include: {
                client: {
                    select: { id: true, email: true, lastActive: true, password: true }
                }
            }
        })

        return res.status(200).json({ updatedClient: toAdminClientView(updated, updated.client) })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not update client with id ${clientId}.` })
    }
}


export async function deactivateClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    try {

        const existing = await db.adminClient.findFirst({
            where: { adminId, clientId, deletedByAdmin: false }
        })

        if (!existing) {
            return res.status(404).json({ error: "Client does not exist." })
        }

        await db.$transaction([
            db.adminClient.update({
                where: { id: existing.id },
                data: { deletedByAdmin: true }
            }),
            db.project.updateMany({
                where: { clientId, adminId },
                data: { deletedByAdmin: true }
            })
        ])

        return res.status(200).json({ message: "Client and their projects have been removed from your view." })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: `Could not delete client with id ${clientId}.` })
    }
}



export async function getProjectsByClient(req: Request, res: Response) {

    const adminId = req.user.id
    const clientId = String(req.params.id)

    try {

        const adminClient = await db.adminClient.findFirst({
            where: { adminId, clientId, deletedByAdmin: false }
        })

        if (!adminClient) {
            return res.status(404).json({ error: "Client not found." })
        }

        const clientProjects = await db.project.findMany({
            where: {
                clientId,
                adminId,
                deletedByAdmin: false
            },
            orderBy: { createdAt: 'desc' },
            include: {
                milestones: {
                    orderBy: { orderIndex: 'asc' },
                    select: { id: true, status: true, deadline: true, orderIndex: true, budget: true }
                },
                admin: {
                    select: { name: true, businessName: true }
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

        return res.status(200).json({ id: client.id, email: client.email })
        
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