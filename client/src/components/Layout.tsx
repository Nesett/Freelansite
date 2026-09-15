import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
	return (
		<div style={{ display: 'flex' }}>
			<Navbar />
			<main style={{ flex: 1 }}>
				<Outlet />
			</main>
		</div>
	)
}
