import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/Landing'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/dashboard" element={<DashboardPage />} />
			</Routes>
		</BrowserRouter>
	)
}
export default App
