import { useNavigate } from "react-router-dom"
import { ArrowLeft, SearchX } from "lucide-react"

interface NotFoundStateProps {
    title: string
    text: string
    backTo: string
    backLabel: string
}

export default function NotFoundState({ title, text, backTo, backLabel }: NotFoundStateProps) {
    const navigate = useNavigate()

    return (
        <div className="pageContent">
            <div className="emptyState">
                <div className="emptyStateIcon">
                    <SearchX size={22} />
                </div>
                <h4>{title}</h4>
                <p>{text}</p>
                <button type="button" className="newButton" onClick={() => navigate(backTo)}>
                    <ArrowLeft size={16} />
                    {backLabel}
                </button>
            </div>
        </div>
    )
}