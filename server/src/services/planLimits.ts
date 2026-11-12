import db from '../db/db.js'
import { PLAN_LIMITS } from '../config/plans.js'

export async function canAddClient(adminId: string) {
    const admin = await db.admin.findUnique({
        where: { id: adminId },
        select: { plan: true }
    })
    if (!admin) return false

    const count = await db.adminClient.count({
        where: { adminId, deletedByAdmin: false }
    })

    return count < PLAN_LIMITS[admin.plan].clients
}

export async function canAddProject(adminId: string) {
    const admin = await db.admin.findUnique({
        where: { id: adminId },
        select: { plan: true }
    })
    if (!admin) return false

    const count = await db.project.count({
        where: { adminId, deletedByAdmin: false, isOnHold: false }
    })

    return count < PLAN_LIMITS[admin.plan].projects
}