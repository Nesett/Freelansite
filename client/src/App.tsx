import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import Invoices from './pages/Invoices'
import Team from './pages/Team'
import Settings from './pages/Settings'
import ClientsDetails from './pages/ClientsDetails'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ProjectDetails from './pages/ProjectDetails'
import Layout from './components/Layout'
import ClientSetPassword from './pages/ClientSetPassword'
import InvoiceDetails from './pages/InvoiceDetails'
import MagicLinkPage from './pages/MagicLinkPage'

export function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path='/set-password' element={<ClientSetPassword />}/>
					<Route path='/share/:token' element={<MagicLinkPage/>} />

					<Route element={<ProtectedRoute />}>
						<Route element={<Layout />}>
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/projects" element={<Projects />} />
							<Route path="/projects/:id" element={<ProjectDetails />} />
							<Route path="/invoices" element={<Invoices />} />
							<Route path="/settings" element={<Settings />} />
							<Route path="/invoices/:id" element={<InvoiceDetails />} />

							<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
								<Route path="/clients" element={<Clients />} />
								<Route path="/clients/:id" element={<ClientsDetails />} />
								<Route path="/team" element={<Team />} />
							</Route>
						</Route>
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	)
}
export default App
