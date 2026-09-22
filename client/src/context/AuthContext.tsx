import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type User = {
	id: string
	name: string
	email: string
	businessName: string | null
	role: 'admin' | 'client'
}


type AuthContextType = {
	user: User | null
	isLoading: boolean
	setUser: (user: User | null) => void
	refreshUser: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)


	async function refreshUser() {
		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
				credentials: 'include'
			})
			const data = await res.json()
			setUser(res.ok ? data.user : null)
		} catch {
			setUser(null)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		refreshUser()
	}, [])


	return (
		<AuthContext.Provider value={{ user, isLoading, setUser, refreshUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}