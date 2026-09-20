import { Admin, Client } from '@prisma/client'

export type SafeAdmin = Omit<Admin, 'password'> & { role: 'admin' }
export type SafeClient = Omit<Client, 'password'> & { role: 'client' }
export type SafeUser = SafeAdmin | SafeClient

function isAdmin(user: Admin | Client): user is Admin {
	return 'role' in user ? user.role === 'admin' : !('clientId' in user)
}

export const toClientSafe = (user: Admin | Client): SafeUser => {
	const { password, ...safeData } = user

	if ('companyName' in user || 'adminId' in user) {
		return { ...safeData, role: 'client' } as SafeClient
	}

	return { ...safeData, role: 'admin' } as SafeAdmin
}