import DashboardPage from "./Dashboard"
import ClientDashboardPage from "./ClientDashboard"
import { useAuth } from "../context/AuthContext"

export default function DashboardRoute() {
    const { user } = useAuth()

    return user?.role === "client" ? <ClientDashboardPage /> : <DashboardPage />
}