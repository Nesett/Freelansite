import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { TokenPayload } from '../types/auth.js'
import db from '../db/db.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    try {
        // verify signature, if verification doesnt work, throw an error, if correct attach to decoded.
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload

        //only admin allowed
        if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admins only.' })
        }

        
        const admin = await db.admin.findUnique({ where: { id: decoded.id } })

        if (!admin) {
        return res.status(401).json({ error: 'User no longer exists' })
        }

        // attach admin to request
        req.user = admin
		req.userRole = decoded.role

        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' })
    }
}

export async function requireClientAuth(req: Request, res: Response, next: NextFunction) {
	const token = req.cookies?.auth_token

	if (!token) {
		return res.status(401).json({ error: 'Access denied. No token provided.' })
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload

		if (decoded.role !== 'client') {
			return res.status(403).json({ error: 'Forbidden: Clients only.' })
		}
		
		const client = await db.client.findUnique({ where: { id: decoded.id } })

		if (!client) {
			return res.status(401).json({ error: 'User no longer exists' })
		}

		req.user = client
		req.userRole = decoded.role

		next()
	} catch (error) {
		return res.status(401).json({ error: 'Invalid or expired token.' })
	}
}


export async function requireAnyAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload
        const user = decoded.role === 'admin'
            ? await db.admin.findUnique({ where: { id: decoded.id } })
            : await db.client.findFirst({
                where: {
                    id: decoded.id,
                    deletedByClient: false
                }
            })
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' })
        }

        req.user = user
        req.userRole = decoded.role

        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ error: 'Invalid or expired token.' })
    }
}