import { Admin } from '@prisma/client'
import { UserRole } from './auth.js'

declare global {
    namespace Express {
        interface Request {
            user?: Admin
            userRole?: UserRole
        }
    }
}