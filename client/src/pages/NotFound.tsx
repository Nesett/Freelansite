import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Home } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function NotFound() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const homePath = user ? "/dashboard" : "/"
    const homeLabel = user ? "Go to dashboard" : "Go to homepage"

    return (
        <div className="notFoundPage">

            <div className="notFoundCard">
                <p className="notFoundCode">404</p>
                <h1>Page not found</h1>
                <p className="notFoundText">
                    This page doesn't exist, was moved, or you don't have access to it.
                </p>

                <div className="notFoundActions">
                    <button onClick={() => navigate(-1)} className="invoiceSecondaryButton">
                        <ArrowLeft size={16} />
                        Go back
                    </button>
                    <Link to={homePath} className="newButton">
                        <Home size={16} />
                        {homeLabel}
                    </Link>
                </div>
            </div>
        </div>
    )
}