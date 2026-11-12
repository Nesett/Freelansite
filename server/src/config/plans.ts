import { Plan } from '@prisma/client'

export const PLAN_LIMITS: Record<Plan, { clients: number, projects: number, whiteLabel: boolean }> = {
    FREE: { clients: 2, projects: 3, whiteLabel: false },
    PRO: { clients: 15, projects: Infinity, whiteLabel: true }
}