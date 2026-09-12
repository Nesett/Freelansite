import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/Landing'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route element={<ProtectedRoute />}>
					<Route path="/dashboard" element={<DashboardPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}
export default App
