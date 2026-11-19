import { Request, Response } from 'express'
import db from '../db/db.js'
import bcrypt from 'bcrypt'
import validator from 'validator'
import jwt from 'jsonwebtoken'
import { toClientSafe } from '../utils/sanitizer.js'
import { Admin, Client } from '@prisma/client'
import { stripe } from '../services/stripe.js'


export async function signUp(req: Request, res: Response) {

    let {password, email, businessName, name } = req.body

    if (!password || !email || !name) {

        return res.status(400).json({error: "Please fill all required fields."})

    } else if (!validator.isEmail(email)){

        return res.status(400).json({error: "The email is invalid."})

    } else {

    email = email.trim().toLowerCase()
    name = name.trim()
    businessName = businessName?.trim() || null

    }
    
    const salt = 10

    try {
        
        const isExistingUser = await db.admin.findUnique({where: {email}})

        if (isExistingUser) {
            return res.status(400).json({error: 'This email is already used.'})
        }

        const hashedPassword = await bcrypt.hash(password, salt)

        const admin = await db.admin.create({
            data: {
            email,
            password: hashedPassword,
            name,
            businessName,
            },
        })
    
        return res.status(201).json({message: 'Successfully created account.', id:admin.id, name:admin.name})

    } catch(err){

        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})

    }

}

export async function login(req: Request, res: Response) {

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
        const admin = await db.admin.findUnique({where: { email }})
        
        if (!admin) {
            return res.status(401).json({error: "Invalid credentials."})
        } else {
            const passwordMatch = await bcrypt.compare(password, admin.password)
            if (!passwordMatch) {
                return res.status(401).json({error: "Invalid credentials."})
            } else {

                const token = jwt.sign(
                { id: admin.id, role: 'admin' }, 
                process.env.JWT_SECRET as string, 
                { expiresIn: '1d' }
                )

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                })

                return res.status(200).json({ admin: toClientSafe(admin) })
            }
        }
        


    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }

}

export async function logout(req: Request, res: Response) {

    try {
        res.clearCookie('auth_token')
        return res.status(200).json({ message: "Successfully logged out!" })

    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }
}

export async function mySession(req: Request, res: Response) {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'Unauthorized' })
		}

        // run user through sanitizer
		const safeUser = { ...toClientSafe(req.user), role: req.userRole }

		return res.status(200).json({
			message: 'Session verified',
			user: safeUser
		})
	} catch (err) {
		console.log(err)
		return res.status(500).json({ error: 'Internal server error.' })
	}
}

export async function changePassword(req: Request, res: Response) {

    const { currentPassword, newPassword } = req.body

    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const isClient = req.userRole === 'client'

        const account = isClient
            ? await db.client.findUnique({ where: { id: req.user.id } })
            : await db.admin.findUnique({ where: { id: req.user.id } })

        // a client who deleted their account has no password anymore
        if (!account || !account.password) {
            return res.status(401).json({ error: 'User no longer exists' })
        }

        const passwordMatch = await bcrypt.compare(currentPassword, account.password)

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' })
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from the current one.' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        if (isClient) {
            await db.client.update({
                where: { id: account.id },
                data: { password: hashedPassword }
            })
        } else {
            await db.admin.update({
                where: { id: account.id },
                data: { password: hashedPassword }
            })
        }

        return res.status(200).json({ message: 'Password updated.' })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

async function cancelStripeSubscriptions(customerId: string) {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all'
        })

        for (const subscription of subscriptions.data) {
            if (subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired') {
                await stripe.subscriptions.cancel(subscription.id)
            }
        }
    } catch (err) {
        if ((err as { code?: string }).code === 'resource_missing') return
        throw err
    }
}

export async function deleteAccount(req: Request, res: Response) {

    const { password } = req.body

    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const isClient = req.userRole === 'client'

        const account = isClient
            ? await db.client.findUnique({ where: { id: req.user.id } })
            : await db.admin.findUnique({ where: { id: req.user.id } })

        if (!account || !account.password) {
            return res.status(401).json({ error: 'User no longer exists' })
        }

        const passwordMatch = await bcrypt.compare(password, account.password)

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Password is incorrect.' })
        }

        if (isClient) {
            const client = account as Client

            await db.$transaction([
                db.project.updateMany({
                    where: { clientId: client.id },
                    data: {
                        clientName: client.name,
                        clientCompanyName: client.companyName,
                        clientEmail: client.email
                    }
                }),
                db.client.delete({ where: { id: client.id } })
            ])
        } else {
            const admin = account as Admin

            if (admin.stripeCustomerId) {
                try {
                    await cancelStripeSubscriptions(admin.stripeCustomerId)
                } catch (err) {
                    console.log(err)
                    return res.status(502).json({
                        error: 'Could not cancel your subscription, so your account was not deleted. Please try again.'
                    })
                }
            }

            await db.admin.delete({ where: { id: admin.id } })
        }

        res.clearCookie('auth_token')
        return res.status(200).json({ message: 'Account deleted.' })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}

export async function updateProfile(req: Request, res: Response) {

    const { name, businessName, phone, address } = req.body

    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const admin = await db.admin.update({
            where: { id: req.user.id },
            data: { name, businessName, phone, address }
        })

        return res.status(200).json({ user: toClientSafe(admin) })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal server error.' })
    }
}