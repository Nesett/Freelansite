import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import TopBar from './TopBar'
import { BreadcrumbProvider } from '../context/BreadcrumbContext'

export default function Layout() {
    return (
        <BreadcrumbProvider>
            <div style={{ display: 'flex' }}>
                <Navbar />
                <div className="layoutMain">
                    <TopBar />
                    <main style={{ flex: 1 }}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </BreadcrumbProvider>
    )
}