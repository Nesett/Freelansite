import { Admin } from '@prisma/client'

// type that represents Admin without password
export type SafeAdmin = Omit<Admin, 'password'>

export const toClientSafe = (admin: Admin): SafeAdmin => {
    const { password, ...safeAdmin } = admin
    return safeAdmin
}