import { Admin, Client } from '@prisma/client'
import { Prisma } from '@prisma/client'
import countProgressPercent from './milestoneProgress.js'

export type SafeAdmin = Omit<Admin, 'password'> & { role: 'admin' }
export type SafeClient = Omit<Client, 'password' | 'inviteToken' | 'inviteTokenExpires'> & { role: 'client' }
export type SafeUser = SafeAdmin | SafeClient

function isAdmin(user: Admin | Client): user is Admin {
	return 'role' in user ? user.role === 'admin' : !('clientId' in user)
}

export const toClientSafe = (user: Admin | Client): SafeUser => {
    if ('companyName' in user) {
        const { password, inviteToken, inviteTokenExpires, deletedByAdmin, deletedByClient, ...safeData } = user
        return { ...safeData, role: 'client' } as SafeClient
    }

    const { password, ...safeData } = user
    return { ...safeData, role: 'admin' } as SafeAdmin
}

type ProjectWithMilestones = Prisma.ProjectGetPayload<{
	include: { milestones: true }
}>

type ProjectForPublic = Prisma.ProjectGetPayload<{
	include: {
		milestones: true
		client: { select: { name: true, companyName: true } }
		admin: { select: { name: true, businessName: true, email: true, phone: true } }
	}
}>

export const toPublicSafe = (project: ProjectForPublic) => ({
	title: project.title,
	description: project.description,
	progress: countProgressPercent(project.milestones),
	client: {
		name: project.client.name,
		companyName: project.client.companyName
	},
	admin: {
		name: project.admin.name,
		businessName: project.admin.businessName,
		email: project.admin.email,
		phone: project.admin.phone
	},
	milestones: project.milestones.map((m) => ({
		id: m.id,
		title: m.title,
		description: m.description,
		status: m.status,
		deadline: m.deadline,
		orderIndex: m.orderIndex
	}))
})