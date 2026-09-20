import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type Props = {
	allowedRoles?: ('admin' | 'client')[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
	const { user, isLoading } = useAuth()

	if (isLoading) {
		return (
			<div className="loading">
				<h1>Checking Auth</h1>
			</div>
		)
	}

	if (!user) return <Navigate to="/login" replace />

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		return <Navigate to="/dashboard" replace />
	}

	return <Outlet />
}