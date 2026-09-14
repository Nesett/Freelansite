import { Navigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"

export default function ProtectedRoute() {
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(()=> {
        async function verifyAuth(){
            try {
                const apiUrl = import.meta.env.VITE_API_URL
                const res = await fetch(`${apiUrl}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include'
                }) 

                if (res.ok) {
                    setIsAuthenticated(true)
                } else {
                    setIsAuthenticated(false)
                }
            } catch(err) {
                setIsAuthenticated(false)
            } finally {
                setIsLoading(false)
            }
        }
        verifyAuth()
    }, [])

    if (isLoading) {
        return (
        <div>
            <h1>Checking Auth</h1>
        </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}