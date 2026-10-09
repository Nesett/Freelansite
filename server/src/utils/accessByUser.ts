import { Request } from 'express'

export function projectAccessFilter(req: Request) {
    if (req.userRole === 'admin') {
        return { adminId: req.user.id, deletedByAdmin: false }
    }
    return { clientId: req.user.id, deletedByClient: false }
}

export function deletedFilter(req: Request) {
    return req.userRole === 'admin'
        ? { deletedByAdmin: false }
        : { deletedByClient: false }
}