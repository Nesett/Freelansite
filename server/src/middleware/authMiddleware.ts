import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { TokenPayload } from '../types/express.d.js'

export function requireAuth(req: Request, res: Response, next: NextFunction) {

  // did browser send auth_token cookie?
  const token = req.cookies?.auth_token

  if (!token) {

    return res.status(401).json({ error: 'Access denied. No token provided.' })

  }

  try {
    // verify signature, if verification doesnt work, throw an error, if correct attach to decoded.
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload


    req.user = decoded

    next()

    
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}