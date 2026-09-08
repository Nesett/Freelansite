import { Admin } from '@prisma/client'

export type UserRole = 'admin' | 'client'

export interface TokenPayload {
    id: string
    role: UserRole
}