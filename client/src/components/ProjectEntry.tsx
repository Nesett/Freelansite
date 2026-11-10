import StatusTag from "./StatusTag"
import { getProjectDisplayState, getProjectTotalBudget } from "../utils/ProjectStatus"
import type { Project } from "../pages/Projects"
import { useNavigate } from "react-router-dom"

interface ProjectEntryProps {
    project: Project
    showClient?: boolean
}

export default function ProjectEntry({ project, showClient = false }: ProjectEntryProps) {
    const navigate = useNavigate()
    const { tag, tagVariant, progressPercent } = getProjectDisplayState(project)
	const totalBudget = getProjectTotalBudget(project.milestones)

    function handleRowClick() {
        navigate(`/projects/${project.id}`)
    }

    return (
        <tr onClick={handleRowClick} className="clickableEntry">
            <td>
                <div className="clientPrimary">{project.title}</div>
            </td>
            {showClient && (
                <td>{project.client.companyName || project.client.name}</td>
            )}
            <td>{Math.round(progressPercent)}%</td>
            <td>
                {totalBudget > 0
                    ? `$${totalBudget.toLocaleString("en-US")}`
                    : "No budget set"}
            </td>
            <td>
                <StatusTag
                    label={tag ?? "In progress"}
                    variant={tag ? tagVariant : "progress"}
                />
            </td>
        </tr>
    )
}