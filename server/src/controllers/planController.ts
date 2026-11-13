import { Request, Response } from 'express'
import { getUsage } from '../services/planLimits.js'

export async function getPlanUsage(req: Request, res: Response) {
    try {
        const usage = await getUsage(req.user.id)
        return res.status(200).json(usage)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Could not fetch plan usage." })
    }
}