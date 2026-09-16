import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import Clients from './pages/clients/Clients'
import Projects from './pages/Projects'
import Invoices from './pages/Invoices'
import Team from './pages/Team'
import Settings from './pages/Settings'
import ClientsDetails from './pages/clients/ClientsDetails'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/Layout'

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route element={<ProtectedRoute />}>
					<Route element={<Layout/>}>
						<Route path="/dashboard" element={<DashboardPage />} />
						<Route path="/clients" element={<Clients />} />
						<Route path="/projects" element={<Projects />} />
						<Route path="/invoices" element={<Invoices />} />
						<Route path="/team" element={<Team />} />
						<Route path="/settings" element={<Settings />} />
						<Route path="/clients/:id" element={<ClientsDetails />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	)
}
export default App
